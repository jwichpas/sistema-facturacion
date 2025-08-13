-- Test query para verificar la estructura actual
-- Verificar que existen los datos en user_companies
SELECT 
  uc.id,
  uc.user_id,
  uc.company_id,
  uc.role_id,
  uc.is_active,
  c.id as company_id_check,
  c.legal_name,
  c.ruc,
  r.id as role_id_check,
  r.name as role_name,
  r.permissions
FROM user_companies uc
LEFT JOIN companies c ON uc.company_id = c.id
LEFT JOIN roles r ON uc.role_id = r.id
WHERE uc.user_id = '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16'
  AND uc.is_active = true;

-- Verificar si las tablas existen y tienen datos
SELECT COUNT(*) as user_companies_count FROM user_companies;
SELECT COUNT(*) as companies_count FROM companies;
SELECT COUNT(*) as roles_count FROM roles;

-- Verificar la estructura de roles
SELECT id, name, permissions FROM roles LIMIT 5;
