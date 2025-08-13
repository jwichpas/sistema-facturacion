
# sistema-erp-policy.md

> Políticas **RLS** para multitenancy por `company_id`.  
> **Suposición**: el JWT de Supabase incluye la claim `company_id` (string) y roles (`role` = 'authenticated' | 'service_role' | 'anon').  
> Ajusta los nombres de claims si tu Auth usa otro formato.

---

## 0) Habilitar RLS en tablas de negocio

```sql
-- Habilitar RLS
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
```

---

## 1) Helpers de seguridad (roles y company_id)

```sql
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
```

---

## 2) Política base por `company_id` (plantilla reutilizable)

> Para cada tabla con columna `company_id`, aplicamos 2 políticas:
> - **SELECT**: ver sólo filas de tu `company_id`.
> - **MODIFY** (`INSERT/UPDATE/DELETE`): operar sólo dentro de tu `company_id`.

```sql
-- Products (ejemplo): SELECT
drop policy if exists "products_select_by_company" on products;
create policy "products_select_by_company" on products
  for select
  using (company_id = auth_company_id() or auth_role() = 'service_role');

-- Products: INSERT/UPDATE/DELETE
drop policy if exists "products_modify_by_company" on products;
create policy "products_modify_by_company" on products
  for all
  using (company_id = auth_company_id() or auth_role() = 'service_role')
  with check (company_id = auth_company_id() or auth_role() = 'service_role');
```

> Repite el patrón para todas las tablas con `company_id` (ejemplos a continuación).

```sql
-- Tabla genérica (reemplaza <table>)
-- SELECT
-- create policy "<table>_select_by_company" on <table>
--   for select using (company_id = auth_company_id() or auth_role() = 'service_role');
-- MODIFY
-- create policy "<table>_modify_by_company" on <table>
--   for all using (company_id = auth_company_id() or auth_role() = 'service_role')
--   with check (company_id = auth_company_id() or auth_role() = 'service_role');
```

---

## 3) Políticas para tablas sin `company_id` (catálogos SUNAT)

```sql
-- Solo lectura para todos los autenticados; escritura exclusiva service_role
drop policy if exists "sunat_read_all" on sunat.cat_06_doc_identidad;
create policy "sunat_read_all" on sunat.cat_06_doc_identidad
  for select using (true);

revoke insert, update, delete on sunat.cat_06_doc_identidad from authenticated, anon;
-- (Opcional) permitir al service_role
grant all on all tables in schema sunat to service_role;
```

> Repite para las demás tablas en `sunat.*` y `sunat.ubigeo`.

---

## 4) RLS para vistas materializadas y vistas

> Las **views** heredan RLS de las tablas subyacentes. Para `materialized views`, no aplica RLS directamente; controla el acceso mediante **policies** sobre tablas base o expón una **view** sobre la MV y usa `security_invoker` si corresponde.

```sql
-- Ejemplo: vista pública de encabezados inventario limitada por company_id a través de tablas base
-- (no requiere política adicional)
```

---

## 5) Políticas adicionales por módulo (ejemplos)

```sql
-- sales_docs
drop policy if exists "sales_docs_select" on sales_docs;
create policy "sales_docs_select" on sales_docs
  for select using (company_id = auth_company_id() or auth_role() = 'service_role');

drop policy if exists "sales_docs_modify" on sales_docs;
create policy "sales_docs_modify" on sales_docs
  for all using (company_id = auth_company_id() or auth_role() = 'service_role')
  with check (company_id = auth_company_id() or auth_role() = 'service_role');

-- stock_ledger (solo inserciones por backend; lectura por compañía)
drop policy if exists "stock_ledger_select" on stock_ledger;
create policy "stock_ledger_select" on stock_ledger
  for select using (company_id = auth_company_id() or auth_role() = 'service_role');

drop policy if exists "stock_ledger_insert" on stock_ledger;
create policy "stock_ledger_insert" on stock_ledger
  for insert with check (company_id = auth_company_id() or auth_role() = 'service_role');

-- warehouse_stock (solo lectura para app, escritura por funciones)
drop policy if exists "warehouse_stock_select" on warehouse_stock;
create policy "warehouse_stock_select" on warehouse_stock
  for select using ((select company_id from warehouses w where w.id = warehouse_id) = auth_company_id()
                    or auth_role() = 'service_role');
```

---

## 6) Storage (imágenes de productos) – referencia

> En Supabase Storage crea un bucket `products`. Reglas de acceso (pseudo):  
> - lectura: `auth.jwt().company_id == path_company_id`  
> - escritura: igual restricción.  
> Usa rutas `/products/<company_id>/<product_id>/<filename>`.

---

## 7) Notas y buenas prácticas

- Incluye `company_id` en el **JWT** en el login.  
- Para **service_role** (backend seguro), las policies permiten acceso total cuando `auth_role()='service_role'`.
- Mantén funciones de escritura (`post_transfer_to_ledger`, `f_after_*`) como **SEGURITY DEFINER** si las llamará el cliente sin privilegios elevados, y valida `company_id` dentro.
```sql
-- ejemplo opcional
-- alter function post_transfer_to_ledger(uuid) owner to postgres;
-- revoke all on function post_transfer_to_ledger(uuid) from public;
-- grant execute on function post_transfer_to_ledger(uuid) to authenticated;
```
