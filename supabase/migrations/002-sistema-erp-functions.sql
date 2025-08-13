
# sistema-erp-functions.md

> Funciones, triggers y vistas materializadas para acelerar consultas y mantener la consistencia del **kardex**, precios y márgenes en tiempo real.

---

## 1) Helpers para fechas/períodos

create or replace function period_key(p_date date)
returns text language sql immutable as $$
  select to_char(date_trunc('month', p_date), 'YYYY-MM');
$$;

---

## 2) Actualización de `warehouse_stock` (stock agregado)

create or replace function sync_warehouse_stock(p_company uuid, p_warehouse uuid, p_product uuid)
returns void language plpgsql as $$
declare v_qty numeric(18,6);
begin
  select coalesce(sum(qty_in-qty_out),0) into v_qty
  from stock_ledger
  where company_id=p_company and warehouse_id=p_warehouse and product_id=p_product;

  insert into warehouse_stock(warehouse_id, product_id, balance_qty)
  values (p_warehouse, p_product, v_qty)
  on conflict (warehouse_id, product_id) do update set balance_qty=excluded.balance_qty;
end$$;

---

## 3) Triggers de compras y ventas → kardex + historial de precios

create or replace function f_after_purchase_item()
returns trigger language plpgsql as $$
begin
  -- Historial de compra
  insert into product_purchase_prices(company_id, product_id, supplier_id, currency_code, unit_price, observed_at,
                                      source_doc_type, source_doc_series, source_doc_number)
  select p.company_id, new.product_id, pd.supplier_id, pd.currency_code, new.unit_cost, pd.issue_date,
         pd.doc_type, pd.series, pd.number
  from purchase_docs pd join products p on p.id = new.product_id
  where pd.id = new.purchase_doc_id;

  -- Kardex: entrada
  insert into stock_ledger(company_id, warehouse_id, product_id, movement_date, ref_doc_type, ref_doc_series, ref_doc_number,
                           operation_type, qty_in, unit_cost_in, total_cost_in, source, source_id)
  select p.company_id,
         (select id from warehouses where company_id = p.company_id order by created_at limit 1), -- almacén por defecto
         new.product_id, coalesce(pd.arrival_date, pd.issue_date), pd.doc_type, pd.series, pd.number,
         '01', new.quantity, new.unit_cost, new.quantity*new.unit_cost, 'purchase', pd.id
  from purchase_docs pd join products p on p.id = new.product_id
  where pd.id = new.purchase_doc_id;

  -- Sincroniza stock agregado
  perform sync_warehouse_stock((select company_id from products where id=new.product_id),
                               (select id from warehouses where company_id=(select company_id from products where id=new.product_id) order by created_at limit 1),
                               new.product_id);
  return new;
end$$;

drop trigger if exists trg_after_purchase_item on purchase_doc_items;
create trigger trg_after_purchase_item
after insert on purchase_doc_items
for each row execute function f_after_purchase_item();


create or replace function f_after_sales_item()
returns trigger language plpgsql as $$
declare
  v_company uuid;
  v_wh uuid;
  v_issue date;
  v_doc_type varchar(2);
  v_series text;
  v_number bigint;
  v_unit_cost numeric(18,6);
begin
  select company_id, issue_date, doc_type, series, number into v_company, v_issue, v_doc_type, v_series, v_number
  from sales_docs where id=new.sales_doc_id;

  v_wh := (select id from warehouses where company_id=v_company order by created_at limit 1);

  -- costo promedio móvil: último balance_unit_cost
  select balance_unit_cost
    into v_unit_cost
  from stock_ledger
  where company_id=v_company and product_id=new.product_id
  order by movement_date desc, created_at desc
  limit 1;

  insert into stock_ledger(company_id, warehouse_id, product_id, movement_date, ref_doc_type, ref_doc_series, ref_doc_number,
                           operation_type, qty_out, unit_cost_out, total_cost_out, source, source_id)
  values (v_company, v_wh, new.product_id, v_issue, v_doc_type, v_series, v_number,
          '02', new.quantity, v_unit_cost, new.quantity*coalesce(v_unit_cost,0), 'sale', new.sales_doc_id);

  perform sync_warehouse_stock(v_company, v_wh, new.product_id);
  return new;
end$$;

drop trigger if exists trg_after_sales_item on sales_doc_items;
create trigger trg_after_sales_item
after insert on sales_doc_items
for each row execute function f_after_sales_item();

---

## 4) Función para recalcular saldos y costos (promedio móvil) por período

create or replace function recalc_inventory_average(p_company uuid, p_product uuid, p_period text)
returns void language plpgsql as $$
declare
  v_start date := to_date(p_period||'-01','YYYY-MM-DD');
  v_end   date := (v_start + interval '1 month')::date;
  v_qty numeric(18,6) := 0;
  v_total numeric(18,6) := 0;
  rec record;
begin
  for rec in
    select * from stock_ledger
    where company_id=p_company and product_id=p_product
      and movement_date >= v_start and movement_date < v_end
    order by movement_date, created_at, id
  loop
    if coalesce(rec.qty_in,0) > 0 then
      v_qty := v_qty + rec.qty_in;
      v_total := v_total + coalesce(rec.total_cost_in, rec.qty_in*rec.unit_cost_in, 0);
    end if;

    if coalesce(rec.qty_out,0) > 0 then
      -- costo unitario salida = promedio actual
      update stock_ledger
        set unit_cost_out = nullif(v_total,0)/nullif(v_qty,0),
            total_cost_out = rec.qty_out * (nullif(v_total,0)/nullif(v_qty,0))
      where id = rec.id;
      v_qty := v_qty - rec.qty_out;
      v_total := v_total - coalesce((rec.qty_out * (nullif(v_total,0)/nullif(v_qty + rec.qty_out,0))),0);
    end if;

    update stock_ledger
      set balance_qty = v_qty,
          balance_unit_cost = case when v_qty=0 then null else v_total/v_qty end,
          balance_total_cost = v_total
    where id = rec.id;
  end loop;
end$$;

> Úsala cuando cargues compras/ventas históricas o hagas migraciones de datos.

---

## 5) Materialized views para reportes SUNAT y dashboard

-- Resumen mensual por producto (para 12.1/13.1)
create materialized view if not exists mv_kardex_mensual as
select company_id,
       product_id,
       period_key(movement_date) as periodo,
       sum(qty_in) as entradas_unid,
       sum(qty_out) as salidas_unid,
       sum(total_cost_in) as entradas_valor,
       sum(total_cost_out) as salidas_valor
from stock_ledger
group by company_id, product_id, period_key(movement_date);

create index if not exists mv_kardex_mensual_idx on mv_kardex_mensual(company_id, product_id, periodo);

create or replace function refresh_mv_kardex(p_period text default null)
returns void language plpgsql as $$
begin
  refresh materialized view concurrently mv_kardex_mensual;
end$$;

---

## 6) Funciones utilitarias

-- Obtiene stock por almacén y producto rápidamente
create or replace function get_stock(p_company uuid, p_warehouse uuid, p_product uuid)
returns numeric language sql stable as $$
  select balance_qty from warehouse_stock ws
  join warehouses w on w.id = ws.warehouse_id
  where ws.warehouse_id=p_warehouse and ws.product_id=p_product and w.company_id=p_company;
$$;

-- Upsert party desde datos de doc
create or replace function upsert_party(p_company uuid, p_doc_type varchar, p_doc_number text, p_fullname text, p_is_customer bool, p_is_supplier bool)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id from parties where company_id=p_company and doc_type=p_doc_type and doc_number=p_doc_number;
  if v_id is null then
    insert into parties(company_id, doc_type, doc_number, razon_social, is_customer, is_supplier)
    values (p_company, p_doc_type, p_doc_number, p_fullname, p_is_customer, p_is_supplier)
    returning id into v_id;
  else
    update parties set razon_social=p_fullname, is_customer = is_customer or p_is_customer, is_supplier = is_supplier or p_is_supplier
    where id=v_id;
  end if;
  return v_id;
end$$;

---

## 7) Vistas de utilidad/margen en tiempo real

create or replace view v_sales_margin as
select s.company_id, s.id as sales_doc_id, si.id as sales_item_id, si.product_id,
       si.quantity, si.unit_price, (si.quantity * si.unit_price) as revenue,
       sl.unit_cost_out as unit_cost,
       (si.quantity * sl.unit_cost_out) as cost,
       (si.quantity * si.unit_price) - (si.quantity * sl.unit_cost_out) as margin
from sales_doc_items si
join sales_docs s on s.id = si.sales_doc_id
left join lateral (
  select unit_cost_out from stock_ledger
  where company_id = si.company_id and product_id = si.product_id and source = 'sale' and source_id = si.sales_doc_id
  order by created_at desc limit 1
) sl on true;

---

## 8) Hooks para transferencias (doble asiento en kardex)

create or replace function post_transfer_to_ledger(p_transfer uuid)
returns void language plpgsql as $$
declare r record; v_company uuid; v_doc_series text; v_doc_number text;
begin
  select company_id into v_company from stock_transfers where id=p_transfer;
  v_doc_series := 'TR'; v_doc_number := (extract(epoch from now()))::bigint::text;

  for r in select * from stock_transfer_items where transfer_id=p_transfer loop
    -- salida origen
    insert into stock_ledger(company_id, warehouse_id, product_id, movement_date, ref_doc_type, ref_doc_series, ref_doc_number,
                             operation_type, qty_out, unit_cost_out, total_cost_out, source, source_id)
    values (v_company,
            (select from_warehouse_id from stock_transfers where id=p_transfer),
            r.product_id,
            (select transfer_date from stock_transfers where id=p_transfer),
            '09', v_doc_series, v_doc_number,
            '09', r.quantity, null, null, 'transfer', p_transfer);

    -- entrada destino
    insert into stock_ledger(company_id, warehouse_id, product_id, movement_date, ref_doc_type, ref_doc_series, ref_doc_number,
                             operation_type, qty_in, unit_cost_in, total_cost_in, source, source_id)
    values (v_company,
            (select to_warehouse_id from stock_transfers where id=p_transfer),
            r.product_id,
            (select transfer_date from stock_transfers where id=p_transfer),
            '09', v_doc_series, v_doc_number,
            '08', r.quantity, null, null, 'transfer', p_transfer);

    -- sync stock
    perform sync_warehouse_stock(v_company, (select from_warehouse_id from stock_transfers where id=p_transfer), r.product_id);
    perform sync_warehouse_stock(v_company, (select to_warehouse_id from stock_transfers where id=p_transfer), r.product_id);
  end loop;
end$$;