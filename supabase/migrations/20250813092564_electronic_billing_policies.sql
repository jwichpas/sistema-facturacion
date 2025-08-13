-- Políticas RLS para campos de facturación electrónica
-- Estas políticas aseguran que solo usuarios autorizados puedan ver/modificar credenciales de facturación

-- Función para verificar si el usuario puede ver datos sensibles de facturación
CREATE OR REPLACE FUNCTION can_view_billing_credentials(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM user_companies uc
    JOIN roles r ON uc.role_id = r.id
    WHERE uc.user_id = auth.uid() 
      AND uc.company_id = target_company_id
      AND uc.is_active = true
      AND (
        r.permissions ? 'admin.companies' 
        OR r.permissions ? 'billing.electronic' 
        OR r.permissions ? '*'
      )
  );
$$;

-- Función para verificar si el usuario puede modificar configuración de facturación
CREATE OR REPLACE FUNCTION can_modify_billing_config(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM user_companies uc
    JOIN roles r ON uc.role_id = r.id
    WHERE uc.user_id = auth.uid() 
      AND uc.company_id = target_company_id
      AND uc.is_active = true
      AND (
        r.permissions ? 'admin.companies' 
        OR r.permissions ? 'billing.electronic.config' 
        OR r.permissions ? '*'
      )
  );
$$;

-- Vista segura de companies que oculta datos sensibles para usuarios no autorizados
CREATE OR REPLACE VIEW companies_safe AS
SELECT 
  id,
  ruc,
  legal_name,
  trade_name,
  email,
  phone,
  address,
  ubigeo_code,
  currency_code,
  valuation_method,
  production,
  -- Solo mostrar estado de configuración, no las credenciales
  CASE 
    WHEN can_view_billing_credentials(id) THEN sol_user
    ELSE CASE WHEN sol_user IS NOT NULL THEN '***configurado***' ELSE NULL END
  END as sol_user,
  CASE 
    WHEN can_view_billing_credentials(id) THEN cert_path
    ELSE CASE WHEN cert_path IS NOT NULL THEN '***configurado***' ELSE NULL END
  END as cert_path,
  CASE 
    WHEN can_view_billing_credentials(id) THEN client_id
    ELSE CASE WHEN client_id IS NOT NULL THEN '***configurado***' ELSE NULL END
  END as client_id,
  -- Nunca exponer client_secret ni sol_pass en vistas
  CASE 
    WHEN client_secret IS NOT NULL THEN true 
    ELSE false 
  END as has_client_secret,
  CASE 
    WHEN sol_pass IS NOT NULL THEN true 
    ELSE false 
  END as has_sol_pass,
  created_at,
  updated_at
FROM companies
WHERE auth_has_company_access(id) OR auth_role() = 'service_role';

-- Grants para la vista
GRANT SELECT ON companies_safe TO authenticated;

-- Política específica para campos de facturación electrónica
-- Solo usuarios con permisos específicos pueden ver/modificar estos campos

-- Actualizar política de companies para ser más restrictiva con campos sensibles
DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (
    auth_has_company_access(companies.id) 
    OR auth_role() = 'service_role'
  );

-- Política más estricta para UPDATE que incluye validación de campos sensibles
DROP POLICY IF EXISTS "companies_modify" ON companies;
CREATE POLICY "companies_modify" ON companies
  FOR ALL USING (
    -- Usuarios con permisos generales de administración
    auth_has_permission('admin.companies', companies.id) 
    OR auth_role() = 'service_role'
    -- Para modificaciones de facturación electrónica, requiere permisos específicos
    OR (
      auth_has_permission('billing.electronic.config', companies.id)
      AND can_modify_billing_config(companies.id)
    )
  )
  WITH CHECK (
    auth_has_permission('admin.companies', companies.id) 
    OR auth_role() = 'service_role'
    OR (
      auth_has_permission('billing.electronic.config', companies.id)
      AND can_modify_billing_config(companies.id)
    )
  );

-- Función para auditoría de cambios en configuración de facturación
CREATE OR REPLACE FUNCTION audit_billing_config_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Registrar cambios en configuración de facturación electrónica
  IF (OLD.sol_user IS DISTINCT FROM NEW.sol_user) 
     OR (OLD.cert_path IS DISTINCT FROM NEW.cert_path)
     OR (OLD.production IS DISTINCT FROM NEW.production)
     OR (OLD.client_id IS DISTINCT FROM NEW.client_id) THEN
    
    -- Crear notificación de cambio de configuración
    INSERT INTO notifications (
      title,
      message,
      type,
      priority,
      recipient_user_id,
      company_id,
      data,
      related_entity_type,
      related_entity_id,
      channels,
      created_by
    )
    SELECT 
      'Configuración de Facturación Electrónica Modificada',
      format('Se ha modificado la configuración de facturación electrónica para %s', NEW.legal_name),
      'security_alert'::notification_type,
      'high'::notification_priority,
      uc.user_id,
      NEW.id,
      jsonb_build_object(
        'company_name', NEW.legal_name,
        'change_type', 'billing_config',
        'production_mode', NEW.production,
        'modified_by', auth.uid()
      ),
      'companies',
      NEW.id,
      ARRAY['in_app'::notification_channel, 'email'::notification_channel],
      auth.uid()
    FROM user_companies uc
    JOIN roles r ON uc.role_id = r.id
    WHERE uc.company_id = NEW.id 
      AND uc.is_active = true
      AND (r.permissions ? 'admin.companies' OR r.permissions ? 'billing.electronic');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para auditoría
CREATE TRIGGER trigger_audit_billing_config_changes
  AFTER UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION audit_billing_config_changes();

-- Agregar permisos de facturación electrónica a roles existentes
UPDATE roles 
SET permissions = permissions || '["billing.electronic", "billing.electronic.config"]'::jsonb
WHERE name IN ('Super Admin', 'Admin')
  AND NOT (permissions ? 'billing.electronic');

UPDATE roles 
SET permissions = permissions || '["billing.electronic"]'::jsonb
WHERE name = 'Manager'
  AND NOT (permissions ? 'billing.electronic');

COMMENT ON FUNCTION can_view_billing_credentials(UUID) IS 'Verifica si el usuario puede ver credenciales de facturación electrónica';
COMMENT ON FUNCTION can_modify_billing_config(UUID) IS 'Verifica si el usuario puede modificar configuración de facturación electrónica';
COMMENT ON VIEW companies_safe IS 'Vista segura de companies que oculta datos sensibles de facturación';
COMMENT ON FUNCTION audit_billing_config_changes() IS 'Audita cambios en configuración de facturación electrónica';
