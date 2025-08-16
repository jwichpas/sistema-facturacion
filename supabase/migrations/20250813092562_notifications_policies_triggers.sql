-- Políticas RLS para el sistema de notificaciones

-- Políticas para la tabla notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    recipient_user_id = auth.uid()
    OR auth_has_company_access(company_id)
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    auth_has_company_access(company_id)
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (
    recipient_user_id = auth.uid() -- Solo el destinatario puede marcar como leído
    OR (auth_has_permission('admin.notifications', company_id) AND created_by = auth.uid())
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE USING (
    recipient_user_id = auth.uid()
    OR auth_has_permission('admin.notifications', company_id)
    OR auth_role() = 'service_role'
  );

-- Políticas para notification_preferences
DROP POLICY IF EXISTS "notification_preferences_select" ON notification_preferences;
CREATE POLICY "notification_preferences_select" ON notification_preferences
  FOR SELECT USING (
    user_id = auth.uid()
    OR auth_has_permission('admin.notifications', company_id)
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "notification_preferences_insert" ON notification_preferences;
CREATE POLICY "notification_preferences_insert" ON notification_preferences
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR auth_has_permission('admin.notifications', company_id)
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "notification_preferences_update" ON notification_preferences;
CREATE POLICY "notification_preferences_update" ON notification_preferences
  FOR UPDATE USING (
    user_id = auth.uid()
    OR auth_has_permission('admin.notifications', company_id)
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "notification_preferences_delete" ON notification_preferences;
CREATE POLICY "notification_preferences_delete" ON notification_preferences
  FOR DELETE USING (
    user_id = auth.uid()
    OR auth_has_permission('admin.notifications', company_id)
    OR auth_role() = 'service_role'
  );

-- Políticas para notification_templates
DROP POLICY IF EXISTS "notification_templates_select" ON notification_templates;
CREATE POLICY "notification_templates_select" ON notification_templates
  FOR SELECT USING (
    company_id IS NULL -- Plantillas globales visibles para todos
    OR auth_has_company_access(company_id)
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "notification_templates_modify" ON notification_templates;
CREATE POLICY "notification_templates_modify" ON notification_templates
  FOR ALL USING (
    auth_has_permission('admin.notifications', company_id)
    OR auth_role() = 'service_role'
  )
  WITH CHECK (
    auth_has_permission('admin.notifications', company_id)
    OR auth_role() = 'service_role'
  );

-- Políticas para notification_delivery_log
DROP POLICY IF EXISTS "notification_delivery_log_select" ON notification_delivery_log;
CREATE POLICY "notification_delivery_log_select" ON notification_delivery_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.id = notification_delivery_log.notification_id
        AND (n.recipient_user_id = auth.uid() OR auth_has_company_access(n.company_id))
    )
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "notification_delivery_log_insert" ON notification_delivery_log;
CREATE POLICY "notification_delivery_log_insert" ON notification_delivery_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.id = notification_delivery_log.notification_id
        AND auth_has_company_access(n.company_id)
    )
    OR auth_role() = 'service_role'
  );

-- No permitir UPDATE/DELETE en delivery_log para mantener integridad del audit trail
DROP POLICY IF EXISTS "notification_delivery_log_no_modify" ON notification_delivery_log;
CREATE POLICY "notification_delivery_log_no_modify" ON notification_delivery_log
  FOR UPDATE USING (auth_role() = 'service_role');

CREATE POLICY "notification_delivery_log_no_delete" ON notification_delivery_log
  FOR DELETE USING (auth_role() = 'service_role');

-- Función para crear preferencias por defecto cuando se asigna un usuario a una empresa
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_types notification_type[];
  ntype notification_type;
BEGIN
  -- Solo crear preferencias cuando se activa una relación user_company
  IF NEW.is_active = TRUE AND (OLD IS NULL OR OLD.is_active = FALSE) THEN
    -- Obtener todos los tipos de notificación
    SELECT ARRAY(SELECT enumvals FROM (
      SELECT unnest(enum_range(NULL::notification_type)) AS enumvals
    ) AS enum_values) INTO notification_types;
    
    -- Crear preferencias por defecto para cada tipo
    FOREACH ntype IN ARRAY notification_types
    LOOP
      INSERT INTO notification_preferences (
        user_id, 
        company_id, 
        notification_type, 
        enabled_channels,
        is_enabled
      ) VALUES (
        NEW.user_id,
        NEW.company_id,
        ntype,
        CASE 
          WHEN ntype IN ('sale_created', 'purchase_created', 'stock_low', 'stock_out') THEN 
            ARRAY['in_app'::notification_channel, 'email'::notification_channel]
          WHEN ntype IN ('security_alert', 'system_maintenance') THEN 
            ARRAY['in_app'::notification_channel, 'email'::notification_channel, 'push'::notification_channel]
          ELSE 
            ARRAY['in_app'::notification_channel]
        END,
        TRUE
      ) ON CONFLICT (user_id, company_id, notification_type) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para crear preferencias por defecto
CREATE TRIGGER trigger_create_default_notification_preferences
  AFTER INSERT OR UPDATE ON user_companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Función para enviar notificación cuando se crea una venta
CREATE OR REPLACE FUNCTION notify_sale_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
  admin_users UUID[];
  admin_user UUID;
BEGIN
  -- Obtener usuarios administradores de la empresa
  SELECT ARRAY(
    SELECT uc.user_id 
    FROM user_companies uc
    JOIN roles r ON uc.role_id = r.id
    WHERE uc.company_id = NEW.company_id 
      AND uc.is_active = TRUE
      AND r.permissions ? 'sales.read'
  ) INTO admin_users;
  
  -- Enviar notificación a cada administrador
  FOREACH admin_user IN ARRAY admin_users
  LOOP
    SELECT create_notification(
      'Nueva Venta Creada',
      format('Se ha creado una nueva venta %s por un monto de %s', NEW.doc_number, NEW.total_amount),
      'sale_created'::notification_type,
      admin_user,
      NEW.company_id,
      'normal'::notification_priority,
      jsonb_build_object(
        'sale_id', NEW.id,
        'doc_number', NEW.doc_number,
        'amount', NEW.total_amount,
        'currency', NEW.currency_code,
        'customer_id', NEW.party_id
      ),
      'sales_docs',
      NEW.id
    ) INTO notification_id;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar creación de ventas
CREATE TRIGGER trigger_notify_sale_created
  AFTER INSERT ON sales_docs
  FOR EACH ROW
  EXECUTE FUNCTION notify_sale_created();

-- Función para enviar notificación de stock bajo
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
  admin_users UUID[];
  admin_user UUID;
  product_info RECORD;
BEGIN
  -- Obtener información del producto (incluye min_stock)
  SELECT p.name, p.sku, p.min_stock, c.legal_name as company_name
  INTO product_info
  FROM products p
  JOIN warehouses w ON w.id = NEW.warehouse_id
  JOIN companies c ON c.id = w.company_id
  WHERE p.id = NEW.product_id;

  -- current/balance stock actual
  IF COALESCE(NEW.balance_qty, 0) <= COALESCE(product_info.min_stock, 0) THEN
    -- Obtener usuarios con permisos de inventario
    SELECT ARRAY(
      SELECT uc.user_id 
      FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      JOIN warehouses w ON w.company_id = uc.company_id
      WHERE w.id = NEW.warehouse_id
        AND uc.is_active = TRUE
        AND r.permissions ? 'inventory.warehouses'
    ) INTO admin_users;

    -- Enviar notificación a cada usuario autorizado
    FOREACH admin_user IN ARRAY admin_users
    LOOP
      SELECT create_notification(
        'Stock Bajo',
        format('El producto %s (%s) tiene stock bajo: %s unidades (mínimo: %s)', 
               product_info.name, product_info.sku, NEW.balance_qty, product_info.min_stock),
        'stock_low'::notification_type,
        admin_user,
        (SELECT company_id FROM warehouses WHERE id = NEW.warehouse_id),
        'high'::notification_priority,
        jsonb_build_object(
          'product_id', NEW.product_id,
          'warehouse_id', NEW.warehouse_id,
          'current_stock', NEW.balance_qty,
          'min_stock', product_info.min_stock,
          'product_name', product_info.name,
          'product_sku', product_info.sku
        ),
        'warehouse_stock',
        NEW.warehouse_id || ':' || NEW.product_id
      ) INTO notification_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar stock bajo
CREATE TRIGGER trigger_notify_low_stock
  AFTER INSERT OR UPDATE ON warehouse_stock
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_stock();

COMMENT ON FUNCTION create_default_notification_preferences() IS 'Crea preferencias de notificación por defecto cuando se asigna un usuario a una empresa';
COMMENT ON FUNCTION notify_sale_created() IS 'Envía notificación cuando se crea una nueva venta';
COMMENT ON FUNCTION notify_low_stock() IS 'Envía notificación cuando el stock está por debajo del mínimo';
