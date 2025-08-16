-- Habilitar RLS en tablas de negocio
alter table companies enable row level security;
alter table branches enable row level security;
alter table warehouses enable row level security;
alter table warehouse_zones enable row level security;
alter table parties enable row level security;
alter table party_contacts enable row level security;
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_codes enable row level security;
alter table product_purchase_prices enable row level security;
alter table price_lists enable row level security;
alter table price_list_items enable row level security;
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table sales_docs enable row level security;
alter table sales_doc_items enable row level security;
alter table purchase_docs enable row level security;
alter table purchase_doc_items enable row level security;
alter table stock_ledger enable row level security;
alter table stock_transfers enable row level security;
alter table stock_transfer_items enable row level security;
alter table warehouse_stock enable row level security;

-- Helpers de seguridad (roles y company_id)
-- helper: company_id desde JWT
create or replace function auth_company_id()
returns uuid language sql stable as $$
  select (auth.jwt() ->> 'company_id')::uuid;
$$;

-- helper: rol del usuario
create or replace function auth_role()
returns text language sql stable as $$
  select coalesce(auth.jwt() ->> 'role','authenticated');
$$;

-- Políticas para companies
drop policy if exists "companies_select" on companies;
create policy "companies_select" on companies
  for select using (
    auth.uid() IN (
      SELECT user_id FROM user_companies 
      WHERE company_id = companies.id AND is_active = true
    ) 
    or auth_role() = 'service_role'
  );

drop policy if exists "companies_modify" on companies;
create policy "companies_modify" on companies
  for all using (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = companies.id 
      AND uc.is_active = true
      AND r.permissions ? 'admin.companies'
    ) 
    or auth_role() = 'service_role'
  )
  with check (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = companies.id 
      AND uc.is_active = true
      AND r.permissions ? 'admin.companies'
    ) 
    or auth_role() = 'service_role'
  );

-- Products
drop policy if exists "products_select_by_company" on products;
create policy "products_select_by_company" on products
  for select
  using (
    auth.uid() IN (
      SELECT user_id FROM user_companies 
      WHERE company_id = products.company_id AND is_active = true
    ) 
    or auth_role() = 'service_role'
  );

drop policy if exists "products_modify_by_company" on products;
create policy "products_modify_by_company" on products
  for all
  using (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = products.company_id 
      AND uc.is_active = true
      AND (r.permissions ? 'products.create' OR r.permissions ? 'products.update' OR r.permissions ? 'products.delete')
    ) 
    or auth_role() = 'service_role'
  )
  with check (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = products.company_id 
      AND uc.is_active = true
      AND (r.permissions ? 'products.create' OR r.permissions ? 'products.update' OR r.permissions ? 'products.delete')
    ) 
    or auth_role() = 'service_role'
  );

-- Aplicar políticas similares para otras tablas principales
-- Branches
drop policy if exists "branches_select" on branches;
create policy "branches_select" on branches
  for select using (
    auth.uid() IN (
      SELECT user_id FROM user_companies 
      WHERE company_id = branches.company_id AND is_active = true
    ) 
    or auth_role() = 'service_role'
  );

drop policy if exists "branches_modify" on branches;
create policy "branches_modify" on branches
  for all using (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = branches.company_id 
      AND uc.is_active = true
      AND r.permissions ? 'admin.companies'
    ) 
    or auth_role() = 'service_role'
  )
  with check (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = branches.company_id 
      AND uc.is_active = true
      AND r.permissions ? 'admin.companies'
    ) 
    or auth_role() = 'service_role'
  );

-- Warehouses
drop policy if exists "warehouses_select" on warehouses;
create policy "warehouses_select" on warehouses
  for select using (
    auth.uid() IN (
      SELECT user_id FROM user_companies 
      WHERE company_id = warehouses.company_id AND is_active = true
    ) 
    or auth_role() = 'service_role'
  );

drop policy if exists "warehouses_modify" on warehouses;
create policy "warehouses_modify" on warehouses
  for all using (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = warehouses.company_id 
      AND uc.is_active = true
      AND r.permissions ? 'inventory.manage'
    ) 
    or auth_role() = 'service_role'
  )
  with check (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = warehouses.company_id 
      AND uc.is_active = true
      AND r.permissions ? 'inventory.manage'
    ) 
    or auth_role() = 'service_role'
  );

-- Parties (customers/suppliers)
drop policy if exists "parties_select" on parties;
create policy "parties_select" on parties
  for select using (
    auth.uid() IN (
      SELECT user_id FROM user_companies 
      WHERE company_id = parties.company_id AND is_active = true
    ) 
    or auth_role() = 'service_role'
  );

drop policy if exists "parties_modify" on parties;
create policy "parties_modify" on parties
  for all using (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = parties.company_id 
      AND uc.is_active = true
      AND (r.permissions ? 'customers.create' OR r.permissions ? 'customers.update' OR r.permissions ? 'customers.delete')
    ) 
    or auth_role() = 'service_role'
  )
  with check (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = parties.company_id 
      AND uc.is_active = true
      AND (r.permissions ? 'customers.create' OR r.permissions ? 'customers.update' OR r.permissions ? 'customers.delete')
    ) 
    or auth_role() = 'service_role'
  );

-- Sales docs
drop policy if exists "sales_docs_select" on sales_docs;
create policy "sales_docs_select" on sales_docs
  for select using (
    auth.uid() IN (
      SELECT user_id FROM user_companies 
      WHERE company_id = sales_docs.company_id AND is_active = true
    ) 
    or auth_role() = 'service_role'
  );

drop policy if exists "sales_docs_modify" on sales_docs;
create policy "sales_docs_modify" on sales_docs
  for all using (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = sales_docs.company_id 
      AND uc.is_active = true
      AND (r.permissions ? 'sales.create' OR r.permissions ? 'sales.update' OR r.permissions ? 'sales.delete')
    ) 
    or auth_role() = 'service_role'
  )
  with check (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = sales_docs.company_id 
      AND uc.is_active = true
      AND (r.permissions ? 'sales.create' OR r.permissions ? 'sales.update' OR r.permissions ? 'sales.delete')
    ) 
    or auth_role() = 'service_role'
  );

-- Sales doc items
drop policy if exists "sales_doc_items_select" on sales_doc_items;
create policy "sales_doc_items_select" on sales_doc_items
  for select using (
    auth.uid() IN (
      SELECT user_id FROM user_companies 
      WHERE company_id = sales_doc_items.company_id AND is_active = true
    ) 
    or auth_role() = 'service_role'
  );

drop policy if exists "sales_doc_items_modify" on sales_doc_items;
create policy "sales_doc_items_modify" on sales_doc_items
  for all using (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = sales_doc_items.company_id 
      AND uc.is_active = true
      AND (r.permissions ? 'sales.create' OR r.permissions ? 'sales.update' OR r.permissions ? 'sales.delete')
    ) 
    or auth_role() = 'service_role'
  )
  with check (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = sales_doc_items.company_id 
      AND uc.is_active = true
      AND (r.permissions ? 'sales.create' OR r.permissions ? 'sales.update' OR r.permissions ? 'sales.delete')
    ) 
    or auth_role() = 'service_role'
  );

-- Stock ledger (solo inserciones por backend; lectura por compañía)
drop policy if exists "stock_ledger_select" on stock_ledger;
create policy "stock_ledger_select" on stock_ledger
  for select using (
    auth.uid() IN (
      SELECT user_id FROM user_companies 
      WHERE company_id = stock_ledger.company_id AND is_active = true
    ) 
    or auth_role() = 'service_role'
  );

drop policy if exists "stock_ledger_insert" on stock_ledger;
create policy "stock_ledger_insert" on stock_ledger
  for insert with check (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      JOIN roles r ON uc.role_id = r.id
      WHERE uc.company_id = stock_ledger.company_id 
      AND uc.is_active = true
      AND r.permissions ? 'inventory.manage'
    ) 
    or auth_role() = 'service_role'
  );

-- Warehouse stock (solo lectura para app, escritura por funciones)
drop policy if exists "warehouse_stock_select" on warehouse_stock;
create policy "warehouse_stock_select" on warehouse_stock
  for select using (
    auth.uid() IN (
      SELECT uc.user_id FROM user_companies uc
      WHERE uc.company_id = (select company_id from warehouses w where w.id = warehouse_stock.warehouse_id) 
      AND uc.is_active = true
    ) 
    or auth_role() = 'service_role'
  );

-- Políticas para tablas sin company_id (catálogos SUNAT)
-- Solo lectura para todos los autenticados; escritura exclusiva service_role
alter table sunat.cat_06_doc_identidad enable row level security;
drop policy if exists "sunat_doc_identidad_read_all" on sunat.cat_06_doc_identidad;
create policy "sunat_doc_identidad_read_all" on sunat.cat_06_doc_identidad
  for select using (true);

alter table sunat.cat_02_monedas enable row level security;
drop policy if exists "sunat_monedas_read_all" on sunat.cat_02_monedas;
create policy "sunat_monedas_read_all" on sunat.cat_02_monedas
  for select using (true);

alter table sunat.cat_10_tipo_documento enable row level security;
drop policy if exists "sunat_tipo_documento_read_all" on sunat.cat_10_tipo_documento;
create policy "sunat_tipo_documento_read_all" on sunat.cat_10_tipo_documento
  for select using (true);

alter table sunat.cat_12_tipo_operacion enable row level security;
drop policy if exists "sunat_tipo_operacion_read_all" on sunat.cat_12_tipo_operacion;
create policy "sunat_tipo_operacion_read_all" on sunat.cat_12_tipo_operacion
  for select using (true);

alter table sunat.cat_07_afect_igv enable row level security;
drop policy if exists "sunat_afect_igv_read_all" on sunat.cat_07_afect_igv;
create policy "sunat_afect_igv_read_all" on sunat.cat_07_afect_igv
  for select using (true);

alter table sunat.cat_17_tipo_operacion enable row level security;
drop policy if exists "sunat_tipo_operacion_17_read_all" on sunat.cat_17_tipo_operacion;
create policy "sunat_tipo_operacion_17_read_all" on sunat.cat_17_tipo_operacion
  for select using (true);

alter table sunat.cat_18_modalidad_traslado enable row level security;
drop policy if exists "sunat_modalidad_traslado_read_all" on sunat.cat_18_modalidad_traslado;
create policy "sunat_modalidad_traslado_read_all" on sunat.cat_18_modalidad_traslado
  for select using (true);

alter table sunat.cat_20_motivo_traslado enable row level security;
drop policy if exists "sunat_motivo_traslado_read_all" on sunat.cat_20_motivo_traslado;
create policy "sunat_motivo_traslado_read_all" on sunat.cat_20_motivo_traslado
  for select using (true);

alter table sunat.cat_06_unidades_medida enable row level security;
drop policy if exists "sunat_unidades_medida_read_all" on sunat.cat_06_unidades_medida;
create policy "sunat_unidades_medida_read_all" on sunat.cat_06_unidades_medida
  for select using (true);

alter table sunat.ubigeo enable row level security;
drop policy if exists "sunat_ubigeo_read_all" on sunat.ubigeo;
create policy "sunat_ubigeo_read_all" on sunat.ubigeo
  for select using (true);

-- Revocar permisos de escritura en tablas SUNAT para usuarios normales
revoke insert, update, delete on all tables in schema sunat from authenticated, anon;

-- Permitir al service_role
grant all on all tables in schema sunat to service_role;

ALTER TABLE public.document_counters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_series DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_purchase_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_doc_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_docs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_doc_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_docs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses DISABLE ROW LEVEL SECURITY;
