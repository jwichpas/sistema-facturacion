-- Habilitar extensiones comunes en Supabase
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "btree_gin";

-- Función para actualizar updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create schema if not exists sunat;

-- Catálogo 06: Tipo de documento de identidad
create table if not exists sunat.cat_06_doc_identidad (
  code varchar(1) primary key, -- '1','6','7','A','B', etc.
  descripcion text not null
);

-- Catálogo 02: Monedas ISO 4217
create table if not exists sunat.cat_02_monedas (
  code varchar(3) primary key, -- 'PEN','USD', etc.
  descripcion text not null
);

-- Catálogo 10: Tipo de documento (traslado/comprobantes/internos)
create table if not exists sunat.cat_10_tipo_documento (
  code varchar(2) primary key,
  descripcion text not null
);

-- Catálogo 12: Tipo de operación (kardex)
create table if not exists sunat.cat_12_tipo_operacion (
  code varchar(2) primary key,
  descripcion text not null
);

-- Catálogo 07: Afectación IGV
create table if not exists sunat.cat_07_afect_igv (
  code varchar(2) primary key,
  descripcion text not null
);

-- Catálogo 17: Tipo de operación (ventas/compras)
create table if not exists sunat.cat_17_tipo_operacion (
  code varchar(2) primary key,
  descripcion text not null
);

-- Catálogo 18: Modalidad de traslado
create table if not exists sunat.cat_18_modalidad_traslado (
  code varchar(2) primary key,
  descripcion text not null
);

-- Catálogo 20: Motivo de traslado
create table if not exists sunat.cat_20_motivo_traslado (
  code varchar(2) primary key,
  descripcion text not null
);

-- Tabla de Unidades de Medida (Tabla 6 SUNAT) - versión resumida
create table if not exists sunat.cat_06_unidades_medida (
  code varchar(10) primary key, -- 'NIU', 'KG', 'MTR', etc.
  descripcion text not null
);

-- Ubigeo (INEI/SUNAT)
create table if not exists sunat.ubigeo (
  code varchar(6) primary key, -- dpto(2)+prov(2)+dist(2)
  departamento text,
  provincia text,
  distrito text
);

-- Create roles table
-- This table stores role definitions with permissions
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_permissions ON public.roles USING GIN(permissions);

-- Add unique constraint for role name
ALTER TABLE public.roles 
ADD CONSTRAINT uq_roles_name UNIQUE (name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON public.roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO public.roles (name, description, permissions) VALUES
('Super Admin', 'Administrador del sistema con todos los permisos', '["*"]'::jsonb),
('Admin', 'Administrador de empresa', '[
    "admin.users", "admin.companies", "admin.settings",
    "products.view", "products.create", "products.update", "products.delete", "products.manage",
    "inventory.view", "inventory.create", "inventory.update", "inventory.delete", "inventory.manage", "inventory.transfer",
    "sales.view", "sales.create", "sales.update", "sales.delete", "sales.reports",
    "invoices.view", "invoices.create", "invoices.update", "invoices.delete", "invoices.sunat",
    "customers.view", "customers.create", "customers.update", "customers.delete"
]'::jsonb),
('Manager', 'Gerente con permisos de gestión', '[
    "products.view", "products.create", "products.update", "products.manage",
    "inventory.view", "inventory.create", "inventory.update", "inventory.manage", "inventory.transfer",
    "sales.view", "sales.create", "sales.update", "sales.reports",
    "invoices.view", "invoices.create", "invoices.update", "invoices.sunat",
    "customers.view", "customers.create", "customers.update"
]'::jsonb),
('Seller', 'Vendedor con permisos básicos', '[
    "products.view",
    "inventory.view",
    "sales.view", "sales.create",
    "invoices.view", "invoices.create",
    "customers.view", "customers.create", "customers.update"
]'::jsonb),
('Viewer', 'Solo lectura', '[
    "products.view",
    "inventory.view",
    "sales.view",
    "invoices.view",
    "customers.view"
]'::jsonb)
ON CONFLICT (name) DO NOTHING;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  ruc varchar(11) not null unique,
  legal_name text not null,
  trade_name text,
  email text,
  phone text,
  address text,
  ubigeo_code varchar(6) references sunat.ubigeo(code),
  currency_code varchar(3) not null references sunat.cat_02_monedas(code),
  valuation_method text not null default 'PROMEDIO_MOVIL', -- 'FIFO' | 'PROMEDIO_MOVIL'
  
  -- Campos para facturación electrónica SUNAT
  sol_user text, -- Usuario SOL (SUNAT Operaciones en Línea)
  sol_pass text, -- Contraseña SOL (encriptada)
  cert_path text, -- Ruta del certificado digital (.CER/.P12) en storage
  client_id text, -- ID del cliente para APIs (opcional)
  client_secret text, -- Secret del cliente para APIs (opcional)
  production boolean not null default false, -- Ambiente: false=Beta, true=Producción
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON public.user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON public.user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_role_id ON public.user_companies(role_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_is_active ON public.user_companies(is_active);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_company ON public.user_companies(user_id, company_id);

-- Add unique constraint to prevent duplicate user-company relationships
ALTER TABLE public.user_companies 
ADD CONSTRAINT uq_user_companies_user_company UNIQUE (user_id, company_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_user_companies_updated_at 
    BEFORE UPDATE ON public.user_companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  address text,
  ubigeo_code varchar(6) references sunat.ubigeo(code),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, code)
);

create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  code text not null,
  name text not null,
  width numeric(18,6) not null default 0,
  height numeric(18,6) not null default 0,
  length numeric(18,6) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, code)
);

create table if not exists warehouse_zones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  code text not null,
  name text,
  width numeric(18,6) not null default 0,
  height numeric(18,6) not null default 0,
  length numeric(18,6) not null default 0,
  capacity_kg numeric(18,6),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(warehouse_id, code)
);

create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  is_customer boolean not null default false,
  is_supplier boolean not null default false,
  doc_type varchar(1) not null references sunat.cat_06_doc_identidad(code),
  doc_number text not null,
  apellido_paterno text,
  apellido_materno text,
  nombres text,
  razon_social text,
  fullname text,
  email text,
  phone text,
  address text,
  ubigeo_code varchar(6) references sunat.ubigeo(code),
  country_code varchar(2) default 'PE',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, doc_type, doc_number),
  check (is_customer or is_supplier)
);

create table if not exists party_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  party_id uuid not null references parties(id) on delete cascade,
  name text,
  email text,
  phone text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  code text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, name)
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  parent_id uuid references categories(id) on delete set null,
  name text not null,
  code text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, name)
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sku text not null,
  barcode text,
  name text not null,
  description text,
  brand_id uuid references brands(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  unit_code varchar(10) not null references sunat.cat_06_unidades_medida(code),
  width numeric(18,6) default 0,
  height numeric(18,6) default 0,
  length numeric(18,6) default 0,
  weight_kg numeric(18,6) default 0,
  is_serialized boolean default false,
  is_batch_controlled boolean default false,
  min_stock numeric(18,6) default 0,
  max_stock numeric(18,6) default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, sku)
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

create table if not exists product_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  code_type text not null, -- 'EAN','UPC','SKU_ALT','SERIE','LOTE'
  code_value text not null,
  unique(product_id, code_type, code_value)
);

create table if not exists product_purchase_prices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  supplier_id uuid not null references parties(id) on delete restrict,
  currency_code varchar(3) not null references sunat.cat_02_monedas(code),
  unit_price numeric(18,6) not null,
  observed_at date not null,
  source_doc_type varchar(2) references sunat.cat_10_tipo_documento(code),
  source_doc_series text,
  source_doc_number text,
  created_at timestamptz default now(),
  unique(company_id, product_id, supplier_id, observed_at, source_doc_type, source_doc_series, source_doc_number)
);

create table if not exists price_lists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  currency_code varchar(3) not null references sunat.cat_02_monedas(code),
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, name)
);

create table if not exists price_list_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  price_list_id uuid not null references price_lists(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  unit_price numeric(18,6) not null,
  valid_from date not null,
  valid_to date,
  unique(price_list_id, product_id, valid_from)
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  plate text not null,
  provider_party_id uuid references parties(id) on delete set null, -- terceros
  brand text,
  model text,
  year int,
  own boolean default true,
  capacity_kg numeric(18,6),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, plate)
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  party_id uuid not null references parties(id) on delete restrict,
  license_number text not null,
  license_class text,
  valid_until date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, license_number)
);

create table if not exists sales_docs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid not null references parties(id) on delete restrict,
  doc_type varchar(2) not null, -- Factura/Boleta, etc.
  series text not null,
  number bigint not null,
  issue_date date not null,
  currency_code varchar(3) not null references sunat.cat_02_monedas(code),
  exchange_rate numeric(18,6),
  op_type varchar(2) references sunat.cat_17_tipo_operacion(code),
  igv_affectation varchar(2) default '10' references sunat.cat_07_afect_igv(code),
  total_ope_gravadas numeric(18,6) default 0,
  total_ope_exoneradas numeric(18,6) default 0,
  total_ope_inafectas numeric(18,6) default 0,
  total_igv numeric(18,6) default 0,
  total_isc numeric(18,6) default 0,
  total_descuentos numeric(18,6) default 0,
  total_otros_cargos numeric(18,6) default 0,
  total numeric(18,6) not null,
  notes text,
  greenter_xml bytea,
  greenter_cdr bytea,
  greenter_hash text,
  greenter_ticket text,
  greenter_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, doc_type, series, number)
);

create table if not exists sales_doc_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sales_doc_id uuid not null references sales_docs(id) on delete cascade,
  product_id uuid not null references products(id),
  description text,
  unit_code varchar(10) not null references sunat.cat_06_unidades_medida(code),
  quantity numeric(18,6) not null,
  unit_price numeric(18,6) not null, -- sin IGV
  discount_pct numeric(18,6) default 0,
  igv_affectation varchar(2) default '10' references sunat.cat_07_afect_igv(code),
  igv_amount numeric(18,6) default 0,
  isc_amount numeric(18,6) default 0,
  total_line numeric(18,6) not null, -- sin IGV
  created_at timestamptz default now()
);

create table if not exists purchase_docs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  supplier_id uuid not null references parties(id) on delete restrict,
  doc_type varchar(2) not null references sunat.cat_10_tipo_documento(code),
  series text not null,
  number text not null,
  issue_date date not null,
  arrival_date date,
  currency_code varchar(3) not null references sunat.cat_02_monedas(code),
  exchange_rate numeric(18,6),
  op_type varchar(2) references sunat.cat_17_tipo_operacion(code),
  total_ope_gravadas numeric(18,6) default 0,
  total_ope_exoneradas numeric(18,6) default 0,
  total_ope_inafectas numeric(18,6) default 0,
  total_igv numeric(18,6) default 0,
  total_isc numeric(18,6) default 0,
  total_descuentos numeric(18,6) default 0,
  total_otros_cargos numeric(18,6) default 0,
  total numeric(18,6) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, doc_type, series, number)
);

create table if not exists purchase_doc_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  purchase_doc_id uuid not null references purchase_docs(id) on delete cascade,
  product_id uuid not null references products(id),
  description text,
  unit_code varchar(10) not null references sunat.cat_06_unidades_medida(code),
  quantity numeric(18,6) not null,
  unit_cost numeric(18,6) not null, -- sin IGV
  discount_pct numeric(18,6) default 0,
  igv_affectation varchar(2) default '10' references sunat.cat_07_afect_igv(code),
  igv_amount numeric(18,6) default 0,
  isc_amount numeric(18,6) default 0,
  total_line numeric(18,6) not null, -- sin IGV
  created_at timestamptz default now()
);

create table if not exists stock_ledger (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  zone_id uuid references warehouse_zones(id) on delete set null,
  product_id uuid not null references products(id) on delete restrict,
  movement_date date not null,
  ref_doc_type varchar(2) references sunat.cat_10_tipo_documento(code),
  ref_doc_series text,
  ref_doc_number text,
  operation_type varchar(2) references sunat.cat_12_tipo_operacion(code),
  qty_in numeric(18,6) default 0,
  qty_out numeric(18,6) default 0,
  unit_cost_in numeric(18,6),
  total_cost_in numeric(18,6),
  unit_cost_out numeric(18,6),
  total_cost_out numeric(18,6),
  balance_qty numeric(18,6) not null default 0,
  balance_unit_cost numeric(18,6),
  balance_total_cost numeric(18,6),
  source text,
  source_id uuid,
  created_at timestamptz default now()
);

create table if not exists stock_transfers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  from_warehouse_id uuid not null references warehouses(id),
  to_warehouse_id uuid not null references warehouses(id),
  transfer_date date not null,
  reason varchar(2) references sunat.cat_20_motivo_traslado(code),
  modality varchar(2) references sunat.cat_18_modalidad_traslado(code),
  vehicle_id uuid references vehicles(id),
  driver_id uuid references drivers(id),
  notes text,
  created_at timestamptz default now()
);

create table if not exists stock_transfer_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  transfer_id uuid not null references stock_transfers(id) on delete cascade,
  product_id uuid not null references products(id),
  unit_code varchar(10) not null references sunat.cat_06_unidades_medida(code),
  quantity numeric(18,6) not null
);

-- Stock agregado por almacén
create table if not exists warehouse_stock (
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  balance_qty numeric(18,6) not null default 0,
  primary key (warehouse_id, product_id)
);

-- Controla la configuración de series por empresa, tipo de documento y almacén (opcional).
CREATE TABLE public.document_series (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_type_code VARCHAR(4) NOT NULL, -- Ej: 01 = Factura, 03 = Boleta
    series VARCHAR(4) NOT NULL, -- Ej: F001, B001
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (company_id, document_type_code, series)
);

-- Registra el último número usado para cada combinación de empresa + tipo de documento + serie.

CREATE TABLE public.document_counters (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_type_code VARCHAR(4) NOT NULL,
    series VARCHAR(4) NOT NULL,
    last_number BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (company_id, document_type_code, series)
);

-- Esto evita conflictos de concurrencia en ventas o facturación electrónica:
CREATE OR REPLACE FUNCTION public.next_document_number(
    p_company_id UUID,
    p_document_type_code VARCHAR,
    p_series VARCHAR
)
RETURNS BIGINT AS $$
DECLARE
    new_number BIGINT;
BEGIN
    UPDATE public.document_counters
    SET last_number = last_number + 1,
        updated_at = now()
    WHERE company_id = p_company_id
      AND document_type_code = p_document_type_code
      AND series = p_series
    RETURNING last_number INTO new_number;

    IF new_number IS NULL THEN
        INSERT INTO public.document_counters(company_id, document_type_code, series, last_number)
        VALUES (p_company_id, p_document_type_code, p_series, 1)
        RETURNING last_number INTO new_number;
    END IF;

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Índices recomendados
create index if not exists idx_stock_ledger_product_date on stock_ledger(company_id, product_id, movement_date);
create index if not exists idx_sales_unique on sales_docs(company_id, doc_type, series, number);
create index if not exists idx_purchase_unique on purchase_docs(company_id, doc_type, series, number);
create index if not exists idx_parties_doc on parties(company_id, doc_type, doc_number);
create index if not exists idx_products_sku on products(company_id, sku);

-- Vistas SUNAT (12.1 y 13.1)
create or replace view v_sunat_inventory_header as
select
  c.legal_name as denominacion_libro,
  to_char(date_trunc('month', sl.movement_date), 'YYYY-MM') as periodo,
  c.ruc as ruc,
  c.legal_name as razon_social,
  coalesce(b.name, w.name) as establecimiento,
  p.sku as codigo_existencia,
  p.name as descripcion_existencia,
  p.unit_code as unidad_medida,
  c.valuation_method as metodo_valuacion
from stock_ledger sl
join companies c on c.id = sl.company_id
left join warehouses w on w.id = sl.warehouse_id
left join branches b on b.id = w.branch_id
join products p on p.id = sl.product_id
group by 1,2,3,4,5,6,7,8,9;

create or replace view v_sunat_formato_12_1 as
select
  sl.company_id,
  sl.product_id,
  sl.movement_date as fecha_emision,
  sl.ref_doc_type as tipo_doc,
  sl.ref_doc_series as serie_doc,
  sl.ref_doc_number as numero_doc,
  sl.operation_type as tipo_operacion,
  sl.qty_in as entradas_unid,
  sl.qty_out as salidas_unid,
  sl.balance_qty as saldo_final_unid
from stock_ledger sl
order by sl.product_id, sl.movement_date, sl.created_at;

create or replace view v_sunat_formato_13_1 as
select
  sl.company_id,
  sl.product_id,
  sl.movement_date as fecha_emision,
  sl.ref_doc_type as tipo_doc,
  sl.ref_doc_series as serie_doc,
  sl.ref_doc_number as numero_doc,
  sl.operation_type as tipo_operacion,
  sl.qty_in as entradas_cantidad,
  sl.unit_cost_in as entradas_costo_unit,
  sl.total_cost_in as entradas_costo_total,
  sl.qty_out as salidas_cantidad,
  sl.unit_cost_out as salidas_costo_unit,
  sl.total_cost_out as salidas_costo_total,
  sl.balance_qty as saldo_cantidad,
  sl.balance_unit_cost as saldo_costo_unit,
  sl.balance_total_cost as saldo_costo_total
from stock_ledger sl
order by sl.product_id, sl.movement_date, sl.created_at;

create or replace view v_sunat_formato_13_1_resumen_diario as
select company_id, product_id, movement_date,
       sum(qty_in) entradas_cantidad,
       sum(total_cost_in) entradas_costo_total,
       sum(qty_out) salidas_cantidad,
       sum(total_cost_out) salidas_costo_total
from stock_ledger
group by company_id, product_id, movement_date;
-- RPC function to update warehouse stock balance
create or replace function update_warehouse_stock_balance(
  p_warehouse_id uuid,
  p_product_id uuid,
  p_qty_change numeric
)
returns void
language plpgsql
security definer
as $$
begin
  -- Insert or update warehouse stock balance
  insert into warehouse_stock (warehouse_id, product_id, balance_qty)
  values (p_warehouse_id, p_product_id, p_qty_change)
  on conflict (warehouse_id, product_id)
  do update set balance_qty = warehouse_stock.balance_qty + p_qty_change;
end;
$$;

-- Trigger function to automatically update warehouse stock when stock_ledger changes
create or replace function update_warehouse_stock_from_ledger()
returns trigger
language plpgsql
as $$
begin
  -- Update warehouse stock balance based on stock ledger entry
  perform update_warehouse_stock_balance(
    NEW.warehouse_id,
    NEW.product_id,
    NEW.qty_in - NEW.qty_out
  );
  
  return NEW;
end;
$$;

-- Create trigger on stock_ledger to automatically update warehouse_stock
drop trigger if exists trigger_update_warehouse_stock on stock_ledger;
create trigger trigger_update_warehouse_stock
  after insert on stock_ledger
  for each row
  execute function update_warehouse_stock_from_ledger();

-- Materialized view for monthly kardex (SUNAT reporting)
create materialized view if not exists mv_kardex_mensual as
with per_month as (
  select
    sl.company_id,
    sl.product_id,
    date_trunc('month', sl.movement_date) as periodo,
    sum(sl.qty_in) as total_entradas,
    sum(sl.qty_out) as total_salidas,
    sum(sl.total_cost_in) as total_costo_entradas,
    sum(sl.total_cost_out) as total_costo_salidas
  from stock_ledger sl
  group by sl.company_id, sl.product_id, date_trunc('month', sl.movement_date)
)
select
  pm.company_id,
  pm.product_id,
  p.sku,
  p.name as product_name,
  p.unit_code,
  pm.periodo,
  pm.total_entradas,
  pm.total_salidas,
  pm.total_costo_entradas,
  pm.total_costo_salidas,
  last_rec.balance_qty as saldo_final_cantidad,
  last_rec.balance_total_cost as saldo_final_costo
from per_month pm
join products p on p.id = pm.product_id
left join lateral (
  select sl2.balance_qty, sl2.balance_total_cost
  from stock_ledger sl2
  where sl2.company_id = pm.company_id
    and sl2.product_id = pm.product_id
    and date_trunc('month', sl2.movement_date) = pm.periodo
  order by sl2.movement_date desc, sl2.created_at desc
  limit 1
) last_rec on true;

-- Create indexes for the materialized view
create unique index if not exists idx_mv_kardex_mensual_unique 
  on mv_kardex_mensual (company_id, product_id, periodo);

-- Function to refresh the materialized view
create or replace function refresh_kardex_mensual()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently mv_kardex_mensual;
end;
$$;

-- Enable RLS on all tables
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

-- Create triggers for updated_at on all tables
create trigger update_companies_updated_at before update on companies for each row execute function update_updated_at_column();
create trigger update_branches_updated_at before update on branches for each row execute function update_updated_at_column();
create trigger update_warehouses_updated_at before update on warehouses for each row execute function update_updated_at_column();
create trigger update_warehouse_zones_updated_at before update on warehouse_zones for each row execute function update_updated_at_column();
create trigger update_parties_updated_at before update on parties for each row execute function update_updated_at_column();
create trigger update_party_contacts_updated_at before update on party_contacts for each row execute function update_updated_at_column();
create trigger update_brands_updated_at before update on brands for each row execute function update_updated_at_column();
create trigger update_categories_updated_at before update on categories for each row execute function update_updated_at_column();
create trigger update_products_updated_at before update on products for each row execute function update_updated_at_column();
create trigger update_price_lists_updated_at before update on price_lists for each row execute function update_updated_at_column();
create trigger update_vehicles_updated_at before update on vehicles for each row execute function update_updated_at_column();
create trigger update_drivers_updated_at before update on drivers for each row execute function update_updated_at_column();
create trigger update_sales_docs_updated_at before update on sales_docs for each row execute function update_updated_at_column();
create trigger update_purchase_docs_updated_at before update on purchase_docs for each row execute function update_updated_at_column();