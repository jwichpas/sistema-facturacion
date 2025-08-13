-- Crear tabla de notificaciones para el sistema ERP
-- Esta tabla manejará notificaciones para diferentes operaciones del sistema

-- Tipos de notificaciones que el sistema puede generar
CREATE TYPE notification_type AS ENUM (
  'sale_created',           -- Venta creada
  'sale_approved',          -- Venta aprobada
  'sale_rejected',          -- Venta rechazada
  'sale_invoiced',          -- Venta facturada
  'purchase_created',       -- Compra creada
  'purchase_received',      -- Compra recibida
  'stock_low',              -- Stock bajo
  'stock_out',              -- Sin stock
  'stock_transfer',         -- Transferencia de stock
  'price_change',           -- Cambio de precio
  'user_assigned',          -- Usuario asignado a empresa
  'user_role_changed',      -- Rol de usuario cambiado
  'document_expiry',        -- Documento próximo a vencer
  'payment_due',            -- Pago vencido
  'system_maintenance',     -- Mantenimiento del sistema
  'data_export',            -- Exportación de datos
  'backup_completed',       -- Respaldo completado
  'security_alert'          -- Alerta de seguridad
);

-- Prioridades de notificación
CREATE TYPE notification_priority AS ENUM (
  'low',      -- Baja: informativa
  'normal',   -- Normal: operaciones rutinarias
  'high',     -- Alta: requiere atención
  'urgent'    -- Urgente: requiere acción inmediata
);

-- Canales de notificación
CREATE TYPE notification_channel AS ENUM (
  'in_app',   -- Notificación en la aplicación
  'email',    -- Correo electrónico
  'sms',      -- SMS
  'push',     -- Notificación push
  'webhook'   -- Webhook para integraciones
);

-- Tabla principal de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información básica
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'normal',
  
  -- Destinatario
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Metadatos
  data JSONB DEFAULT '{}', -- Datos adicionales específicos del tipo de notificación
  
  -- Referencias a entidades relacionadas
  related_entity_type VARCHAR(50), -- 'sales_doc', 'purchase_doc', 'product', etc.
  related_entity_id UUID,          -- ID de la entidad relacionada
  
  -- Estado de la notificación
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Configuración de canales
  channels notification_channel[] DEFAULT ARRAY['in_app'::notification_channel],
  
  -- Programación
  scheduled_for TIMESTAMPTZ, -- NULL = enviar inmediatamente
  sent_at TIMESTAMPTZ,
  
  -- Intentos de envío
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  
  -- Expiración
  expires_at TIMESTAMPTZ,
  
  -- Agrupación (para notificaciones similares)
  group_key VARCHAR(255), -- Para agrupar notificaciones similares
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla para configuración de notificaciones por usuario
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Configuración por tipo de notificación
  notification_type notification_type NOT NULL,
  
  -- Canales habilitados para este tipo
  enabled_channels notification_channel[] DEFAULT ARRAY['in_app'::notification_channel],
  
  -- Configuración específica
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Horarios de envío (para evitar spam)
  quiet_hours_start TIME, -- Ej: 22:00
  quiet_hours_end TIME,   -- Ej: 08:00
  
  -- Días de la semana (1=lunes, 7=domingo)
  enabled_weekdays INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un usuario puede tener una configuración por tipo de notificación por empresa
  UNIQUE(user_id, company_id, notification_type)
);

-- Tabla para plantillas de notificaciones
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  name VARCHAR(100) NOT NULL,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL,
  
  -- Contenido de la plantilla
  subject_template TEXT, -- Para email/SMS
  body_template TEXT NOT NULL,
  
  -- Variables disponibles en la plantilla
  available_variables TEXT[], -- ['user_name', 'company_name', 'amount', etc.]
  
  -- Configuración
  is_active BOOLEAN DEFAULT TRUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = plantilla global
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(type, channel, company_id)
);

-- Tabla para historial de notificaciones enviadas (para auditoría)
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  
  channel notification_channel NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'sent', 'failed', 'delivered', 'opened'
  
  -- Detalles del envío
  sent_to TEXT NOT NULL, -- email, phone, etc.
  external_id TEXT,      -- ID del proveedor externo (SendGrid, etc.)
  
  -- Respuesta/Error
  response_data JSONB,
  error_message TEXT,
  
  -- Métricas
  sent_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_group_key ON notifications(group_key);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_company ON notification_preferences(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type_channel ON notification_templates(type, channel);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_notification ON notification_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_status ON notification_delivery_log(status);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

CREATE TRIGGER trigger_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

-- Habilitar RLS en todas las tablas
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- Función para crear notificación automática
CREATE OR REPLACE FUNCTION create_notification(
  p_title TEXT,
  p_message TEXT,
  p_type notification_type,
  p_recipient_user_id UUID,
  p_company_id UUID,
  p_priority notification_priority DEFAULT 'normal',
  p_data JSONB DEFAULT '{}',
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_channels notification_channel[] DEFAULT ARRAY['in_app'::notification_channel],
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_group_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    title, message, type, priority,
    recipient_user_id, company_id,
    data, related_entity_type, related_entity_id,
    channels, scheduled_for, expires_at, group_key,
    created_by
  ) VALUES (
    p_title, p_message, p_type, p_priority,
    p_recipient_user_id, p_company_id,
    p_data, p_related_entity_type, p_related_entity_id,
    p_channels, p_scheduled_for, p_expires_at, p_group_key,
    auth.uid()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_id
    AND recipient_user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Función para obtener conteo de notificaciones no leídas
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_company_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM notifications
  WHERE recipient_user_id = auth.uid()
    AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (p_company_id IS NULL OR company_id = p_company_id);
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Función para limpiar notificaciones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON TABLE notifications IS 'Tabla principal para el sistema de notificaciones del ERP';
COMMENT ON TABLE notification_preferences IS 'Configuración de notificaciones por usuario y empresa';
COMMENT ON TABLE notification_templates IS 'Plantillas para diferentes tipos de notificaciones';
COMMENT ON TABLE notification_delivery_log IS 'Log de entregas de notificaciones para auditoría';
