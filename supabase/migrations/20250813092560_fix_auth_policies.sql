-- Crear funciones para manejar claims de JWT personalizados
-- Esta función se ejecuta en el hook de auth para agregar claims personalizados

-- Función que se ejecuta cuando el usuario se autentica o actualiza claims
CREATE OR REPLACE FUNCTION handle_user_claims()
RETURNS trigger AS $$
BEGIN
  -- Por ahora, simplificaremos y no dependeremos del JWT para company_id
  -- Las políticas usarán solo la tabla user_companies
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar función auth_company_id para que use la tabla user_companies
-- en lugar del JWT (más seguro y confiable)
CREATE OR REPLACE FUNCTION auth_company_id()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$
  SELECT uc.company_id 
  FROM user_companies uc 
  WHERE uc.user_id = auth.uid() 
    AND uc.is_active = true
  -- Si el usuario tiene múltiples empresas, tomamos la primera activa
  -- En la aplicación se debe manejar la selección de empresa actual
  LIMIT 1;
$$;

-- Función para obtener todas las empresas del usuario actual
CREATE OR REPLACE FUNCTION auth_user_companies()
RETURNS TABLE(company_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT uc.company_id 
  FROM user_companies uc 
  WHERE uc.user_id = auth.uid() 
    AND uc.is_active = true;
$$;

-- Función para verificar si el usuario tiene acceso a una empresa específica
CREATE OR REPLACE FUNCTION auth_has_company_access(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM user_companies uc 
    WHERE uc.user_id = auth.uid() 
      AND uc.company_id = target_company_id 
      AND uc.is_active = true
  );
$$;

-- Función para verificar permisos específicos del usuario en una empresa
CREATE OR REPLACE FUNCTION auth_has_permission(permission_key text, target_company_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM user_companies uc
    JOIN roles r ON uc.role_id = r.id
    WHERE uc.user_id = auth.uid() 
      AND uc.is_active = true
      AND (target_company_id IS NULL OR uc.company_id = target_company_id)
      AND r.permissions ? permission_key
  );
$$;

-- Actualizar todas las políticas para usar las nuevas funciones de seguridad
-- Esto es más confiable que depender del JWT

-- Políticas para companies - simplificadas
DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (
    auth_has_company_access(companies.id) 
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "companies_modify" ON companies;
CREATE POLICY "companies_modify" ON companies
  FOR ALL USING (
    auth_has_permission('admin.companies', companies.id) 
    OR auth_role() = 'service_role'
  )
  WITH CHECK (
    auth_has_permission('admin.companies', companies.id) 
    OR auth_role() = 'service_role'
  );

-- Políticas para products - simplificadas
DROP POLICY IF EXISTS "products_select_by_company" ON products;
CREATE POLICY "products_select_by_company" ON products
  FOR SELECT USING (
    auth_has_company_access(products.company_id) 
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "products_modify_by_company" ON products;
CREATE POLICY "products_modify_by_company" ON products
  FOR ALL USING (
    (auth_has_permission('products.create', products.company_id) 
     OR auth_has_permission('products.update', products.company_id) 
     OR auth_has_permission('products.delete', products.company_id))
    OR auth_role() = 'service_role'
  )
  WITH CHECK (
    (auth_has_permission('products.create', products.company_id) 
     OR auth_has_permission('products.update', products.company_id) 
     OR auth_has_permission('products.delete', products.company_id))
    OR auth_role() = 'service_role'
  );

-- Políticas para branches - simplificadas
DROP POLICY IF EXISTS "branches_select" ON branches;
CREATE POLICY "branches_select" ON branches
  FOR SELECT USING (
    auth_has_company_access(branches.company_id) 
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "branches_modify" ON branches;
CREATE POLICY "branches_modify" ON branches
  FOR ALL USING (
    auth_has_permission('admin.branches', branches.company_id) 
    OR auth_role() = 'service_role'
  )
  WITH CHECK (
    auth_has_permission('admin.branches', branches.company_id) 
    OR auth_role() = 'service_role'
  );

-- Políticas para warehouses
DROP POLICY IF EXISTS "warehouses_select" ON warehouses;
CREATE POLICY "warehouses_select" ON warehouses
  FOR SELECT USING (
    auth_has_company_access(warehouses.company_id) 
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "warehouses_modify" ON warehouses;
CREATE POLICY "warehouses_modify" ON warehouses
  FOR ALL USING (
    auth_has_permission('inventory.warehouses', warehouses.company_id) 
    OR auth_role() = 'service_role'
  )
  WITH CHECK (
    auth_has_permission('inventory.warehouses', warehouses.company_id) 
    OR auth_role() = 'service_role'
  );

-- Políticas para parties (customers/suppliers)
DROP POLICY IF EXISTS "parties_select" ON parties;
CREATE POLICY "parties_select" ON parties
  FOR SELECT USING (
    auth_has_company_access(parties.company_id) 
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "parties_modify" ON parties;
CREATE POLICY "parties_modify" ON parties
  FOR ALL USING (
    (auth_has_permission('parties.customers', parties.company_id) 
     OR auth_has_permission('parties.suppliers', parties.company_id))
    OR auth_role() = 'service_role'
  )
  WITH CHECK (
    (auth_has_permission('parties.customers', parties.company_id) 
     OR auth_has_permission('parties.suppliers', parties.company_id))
    OR auth_role() = 'service_role'
  );

-- Políticas para sales_docs
DROP POLICY IF EXISTS "sales_docs_select" ON sales_docs;
CREATE POLICY "sales_docs_select" ON sales_docs
  FOR SELECT USING (
    auth_has_company_access(sales_docs.company_id) 
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "sales_docs_modify" ON sales_docs;
CREATE POLICY "sales_docs_modify" ON sales_docs
  FOR ALL USING (
    auth_has_permission('sales.create', sales_docs.company_id) 
    OR auth_role() = 'service_role'
  )
  WITH CHECK (
    auth_has_permission('sales.create', sales_docs.company_id) 
    OR auth_role() = 'service_role'
  );

-- Políticas para purchase_docs
DROP POLICY IF EXISTS "purchase_docs_select" ON purchase_docs;
CREATE POLICY "purchase_docs_select" ON purchase_docs
  FOR SELECT USING (
    auth_has_company_access(purchase_docs.company_id) 
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "purchase_docs_modify" ON purchase_docs;
CREATE POLICY "purchase_docs_modify" ON purchase_docs
  FOR ALL USING (
    auth_has_permission('purchases.create', purchase_docs.company_id) 
    OR auth_role() = 'service_role'
  )
  WITH CHECK (
    auth_has_permission('purchases.create', purchase_docs.company_id) 
    OR auth_role() = 'service_role'
  );

-- Políticas para stock_ledger
DROP POLICY IF EXISTS "stock_ledger_select" ON stock_ledger;
CREATE POLICY "stock_ledger_select" ON stock_ledger
  FOR SELECT USING (
    auth_has_company_access(stock_ledger.company_id) 
    OR auth_role() = 'service_role'
  );

-- Políticas para warehouse_stock
DROP POLICY IF EXISTS "warehouse_stock_select" ON warehouse_stock;
CREATE POLICY "warehouse_stock_select" ON warehouse_stock
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM warehouses w 
      WHERE w.id = warehouse_stock.warehouse_id 
        AND auth_has_company_access(w.company_id)
    )
    OR auth_role() = 'service_role'
  );

-- Políticas para user_companies (los usuarios pueden ver sus propias asignaciones)
DROP POLICY IF EXISTS "user_companies_select" ON user_companies;
CREATE POLICY "user_companies_select" ON user_companies
  FOR SELECT USING (
    user_companies.user_id = auth.uid() 
    OR auth_role() = 'service_role'
  );

-- Los administradores pueden gestionar user_companies de su empresa
DROP POLICY IF EXISTS "user_companies_modify" ON user_companies;
CREATE POLICY "user_companies_modify" ON user_companies
  FOR ALL USING (
    auth_has_permission('admin.users', user_companies.company_id) 
    OR auth_role() = 'service_role'
  )
  WITH CHECK (
    auth_has_permission('admin.users', user_companies.company_id) 
    OR auth_role() = 'service_role'
  );

-- Políticas para roles (solo lectura para usuarios normales)
DROP POLICY IF EXISTS "roles_select" ON roles;
CREATE POLICY "roles_select" ON roles
  FOR SELECT USING (
    auth.uid() IS NOT NULL 
    OR auth_role() = 'service_role'
  );

DROP POLICY IF EXISTS "roles_modify" ON roles;
CREATE POLICY "roles_modify" ON roles
  FOR ALL USING (
    auth_role() = 'service_role'
    -- Solo service_role puede modificar roles por seguridad
  );

-- Nota importante para el desarrollo:
-- Las políticas ahora son más seguras y no dependen del JWT
-- Para implementar selección de empresa en el frontend:
-- 1. Usar filtros a nivel de aplicación basados en las empresas del usuario
-- 2. Las consultas deben incluir company_id en los WHERE cuando sea necesario
-- 3. Las políticas RLS garantizan que solo se acceda a datos permitidos

COMMENT ON FUNCTION auth_company_id() IS 'Obtiene la primera empresa activa del usuario actual - usar solo para compatibilidad';
COMMENT ON FUNCTION auth_user_companies() IS 'Obtiene todas las empresas del usuario actual';
COMMENT ON FUNCTION auth_has_company_access(uuid) IS 'Verifica si el usuario tiene acceso a una empresa específica';
COMMENT ON FUNCTION auth_has_permission(text, uuid) IS 'Verifica si el usuario tiene un permiso específico en una empresa';
