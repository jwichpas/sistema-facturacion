-- Agregar campos para facturación electrónica a la tabla companies
-- Esta migración agrega los campos necesarios para la integración con SUNAT

-- Agregar columnas para facturación electrónica
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS sol_user TEXT,
ADD COLUMN IF NOT EXISTS sol_pass TEXT,
ADD COLUMN IF NOT EXISTS cert_path TEXT,
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS client_secret TEXT,
ADD COLUMN IF NOT EXISTS production BOOLEAN NOT NULL DEFAULT false;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN companies.sol_user IS 'Usuario SOL (SUNAT Operaciones en Línea) para facturación electrónica';
COMMENT ON COLUMN companies.sol_pass IS 'Contraseña SOL encriptada para autenticación con SUNAT';
COMMENT ON COLUMN companies.cert_path IS 'Ruta del certificado digital (.CER/.P12) almacenado en Supabase Storage';
COMMENT ON COLUMN companies.client_id IS 'ID del cliente para APIs de facturación electrónica (opcional)';
COMMENT ON COLUMN companies.client_secret IS 'Secret del cliente para APIs de facturación electrónica (opcional)';
COMMENT ON COLUMN companies.production IS 'Ambiente de facturación: false=Beta/Pruebas, true=Producción';

-- Crear índice para búsquedas por ambiente de producción
CREATE INDEX IF NOT EXISTS idx_companies_production ON companies(production);

-- Función para validar configuración de facturación electrónica
CREATE OR REPLACE FUNCTION validate_electronic_billing_config(
  p_company_id UUID,
  p_sol_user TEXT,
  p_cert_path TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que los campos requeridos estén presentes
  IF p_sol_user IS NULL OR trim(p_sol_user) = '' THEN
    RAISE EXCEPTION 'Usuario SOL es requerido para facturación electrónica';
  END IF;
  
  IF p_cert_path IS NULL OR trim(p_cert_path) = '' THEN
    RAISE EXCEPTION 'Certificado digital es requerido para facturación electrónica';
  END IF;
  
  -- Validar formato del usuario SOL (debe ser RUC + usuario)
  IF length(p_sol_user) < 11 THEN
    RAISE EXCEPTION 'Usuario SOL debe contener al menos el RUC de la empresa';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Trigger para validar configuración antes de INSERT/UPDATE
CREATE OR REPLACE FUNCTION validate_company_electronic_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo validar si se están configurando datos de facturación electrónica
  IF NEW.sol_user IS NOT NULL OR NEW.cert_path IS NOT NULL THEN
    PERFORM validate_electronic_billing_config(NEW.id, NEW.sol_user, NEW.cert_path);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_validate_company_electronic_billing ON companies;
CREATE TRIGGER trigger_validate_company_electronic_billing
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION validate_company_electronic_billing();

-- Función auxiliar para verificar si una empresa tiene facturación electrónica configurada
CREATE OR REPLACE FUNCTION has_electronic_billing_configured(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    sol_user IS NOT NULL 
    AND trim(sol_user) != '' 
    AND cert_path IS NOT NULL 
    AND trim(cert_path) != ''
  FROM companies 
  WHERE id = p_company_id;
$$;

-- Función para obtener configuración de facturación (sin exponer credenciales sensibles)
CREATE OR REPLACE FUNCTION get_electronic_billing_status(p_company_id UUID)
RETURNS TABLE(
  has_config BOOLEAN,
  production_mode BOOLEAN,
  sol_user_configured BOOLEAN,
  cert_configured BOOLEAN,
  api_configured BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    has_electronic_billing_configured(p_company_id) as has_config,
    COALESCE(production, false) as production_mode,
    (sol_user IS NOT NULL AND trim(sol_user) != '') as sol_user_configured,
    (cert_path IS NOT NULL AND trim(cert_path) != '') as cert_configured,
    (client_id IS NOT NULL AND client_secret IS NOT NULL) as api_configured
  FROM companies 
  WHERE id = p_company_id;
$$;

COMMENT ON FUNCTION validate_electronic_billing_config(UUID, TEXT, TEXT) IS 'Valida que la configuración de facturación electrónica sea correcta';
COMMENT ON FUNCTION has_electronic_billing_configured(UUID) IS 'Verifica si una empresa tiene configurada la facturación electrónica';
COMMENT ON FUNCTION get_electronic_billing_status(UUID) IS 'Obtiene el estado de configuración de facturación electrónica sin exponer credenciales';
