-- ==========================================
-- SEED DATA FOR SISTEMA ERP
-- ==========================================

-- =====================================================
-- 1. CREAR USUARIO DE PRUEBA EN AUTH
-- =====================================================

-- Insertar usuario de prueba en auth.users
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16',
  'authenticated',
  'authenticated',
  'admin@techcorp.com',
  '$2a$10$7YnhPIZF8K.Y7C4zU7x8xeBGjhL7c9J1.q9U4Y6r2o1k5Q9e7q2q2', -- password: 'password123'
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Administrador TechCorp", "first_name": "Administrador", "last_name": "TechCorp"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Insertar identidad para el usuario
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16',
  '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16',
  '{"sub": "955bc867-6d3c-4ffa-9f7a-bd9e8b126f16", "email": "admin@techcorp.com", "email_verified": true, "phone_verified": false}',
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- =====================================================
-- 2. DATOS BÁSICOS SUNAT
-- =====================================================

-- Insertar datos básicos SUNAT primero
INSERT INTO sunat.cat_02_monedas (code, descripcion) VALUES
('PEN', 'Sol'),
('USD', 'Dólar Americano'),
('EUR', 'Euro')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sunat.cat_06_doc_identidad (code, descripcion) VALUES
('1', 'DNI'),
('6', 'RUC'),
('7', 'Pasaporte'),
('A', 'Cédula Diplomática'),
('B', 'Carnet de Identidad')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sunat.cat_06_unidades_medida (code, descripcion) VALUES
('NIU', 'Unidad'),
('KGM', 'Kilogramo'),
('GRM', 'Gramo'),
('LTR', 'Litro'),
('MLT', 'Mililitro'),
('MTR', 'Metro'),
('CMT', 'Centímetro'),
('M2', 'Metro cuadrado'),
('M3', 'Metro cúbico'),
('PZA', 'Pieza'),
('PAR', 'Par'),
('DOC', 'Docena'),
('CEN', 'Ciento'),
('MIL', 'Millar')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sunat.cat_10_tipo_documento (code, descripcion) VALUES
('01', 'Factura'),
('03', 'Boleta de Venta'),
('07', 'Nota de Crédito'),
('08', 'Nota de Débito'),
('09', 'Guía de Remisión'),
('14', 'Recibo por Honorarios'),
('20', 'Comprobante de Retención'),
('40', 'Constancia de Depósito de Detracción')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sunat.cat_07_afect_igv (code, descripcion) VALUES
('10', 'Gravado - Operación Onerosa'),
('11', 'Gravado - Retiro por premio'),
('12', 'Gravado - Retiro por donación'),
('13', 'Gravado - Retiro'),
('14', 'Gravado - Retiro por publicidad'),
('15', 'Gravado - Bonificaciones'),
('16', 'Gravado - Retiro por entrega a trabajadores'),
('20', 'Exonerado - Operación Onerosa'),
('21', 'Exonerado - Transferencia Gratuita'),
('30', 'Inafecto - Operación Onerosa'),
('31', 'Inafecto - Retiro por Bonificación'),
('32', 'Inafecto - Retiro'),
('33', 'Inafecto - Retiro por Muestras Médicas'),
('34', 'Inafecto - Retiro por Convenio Colectivo'),
('35', 'Inafecto - Retiro por premio'),
('36', 'Inafecto - Retiro por publicidad'),
('40', 'Exportación')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sunat.cat_12_tipo_operacion (code, descripcion) VALUES
('01', 'Entrada por compra'),
('02', 'Salida por venta'),
('03', 'Entrada por devolución de cliente'),
('04', 'Salida por devolución a proveedor'),
('05', 'Entrada por transferencia entre almacenes'),
('06', 'Salida por transferencia entre almacenes'),
('07', 'Entrada por ajuste de inventario'),
('08', 'Salida por ajuste de inventario'),
('09', 'Entrada por producción'),
('10', 'Salida por consumo en producción'),
('11', 'Entrada por donación'),
('12', 'Salida por donación'),
('13', 'Entrada por hallazgo'),
('14', 'Salida por pérdida'),
('15', 'Entrada inicial'),
('16', 'Salida por destrucción'),
('99', 'Otros')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sunat.cat_17_tipo_operacion (code, descripcion) VALUES
('01', 'Venta Interna'),
('02', 'Exportación'),
('03', 'No Domiciliados'),
('04', 'Venta Interna - Anticipos'),
('05', 'Venta Itinerante'),
('06', 'Factura Guía'),
('07', 'Venta Arroz Pilado'),
('08', 'Factura - Comprobante de Percepción'),
('10', 'Factura - Guía remisión transportista'),
('11', 'Factura - Guía remisión transportista'),
('12', 'Boleta de Venta - Comprobante de Percepción')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sunat.cat_18_modalidad_traslado (code, descripcion) VALUES
('01', 'Transporte público'),
('02', 'Transporte privado')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sunat.cat_20_motivo_traslado (code, descripcion) VALUES
('01', 'Venta'),
('02', 'Compra'),
('03', 'Venta con entrega a terceros'),
('04', 'Traslado entre establecimientos de la misma empresa'),
('05', 'Consignación'),
('06', 'Devolución'),
('07', 'Recojo de bienes transformados'),
('08', 'Importación'),
('09', 'Exportación'),
('10', 'Traslado de bienes para transformación'),
('11', 'Traslado de bienes para reparación'),
('12', 'Traslado emisor itinerante CP'),
('13', 'Otros')
ON CONFLICT (code) DO NOTHING;

-- Datos de Ubigeo (algunos ejemplos principales)
INSERT INTO sunat.ubigeo (code, departamento, provincia, distrito) VALUES
('150101', 'LIMA', 'LIMA', 'LIMA'),
('150102', 'LIMA', 'LIMA', 'ANCON'),
('150103', 'LIMA', 'LIMA', 'ATE'),
('150104', 'LIMA', 'LIMA', 'BARRANCO'),
('150105', 'LIMA', 'LIMA', 'BREÑA'),
('150106', 'LIMA', 'LIMA', 'CARABAYLLO'),
('150107', 'LIMA', 'LIMA', 'CHACLACAYO'),
('150108', 'LIMA', 'LIMA', 'CHORRILLOS'),
('150109', 'LIMA', 'LIMA', 'CIENEGUILLA'),
('150110', 'LIMA', 'LIMA', 'COMAS'),
('150111', 'LIMA', 'LIMA', 'EL AGUSTINO'),
('150112', 'LIMA', 'LIMA', 'INDEPENDENCIA'),
('150113', 'LIMA', 'LIMA', 'JESUS MARIA'),
('150114', 'LIMA', 'LIMA', 'LA MOLINA'),
('150115', 'LIMA', 'LIMA', 'LA VICTORIA'),
('150116', 'LIMA', 'LIMA', 'LINCE'),
('150117', 'LIMA', 'LIMA', 'LOS OLIVOS'),
('150118', 'LIMA', 'LIMA', 'LURIGANCHO'),
('150119', 'LIMA', 'LIMA', 'LURIN'),
('150120', 'LIMA', 'LIMA', 'MAGDALENA DEL MAR'),
('150121', 'LIMA', 'LIMA', 'PUEBLO LIBRE'),
('150122', 'LIMA', 'LIMA', 'MIRAFLORES'),
('150123', 'LIMA', 'LIMA', 'PACHACAMAC'),
('150124', 'LIMA', 'LIMA', 'PUCUSANA'),
('150125', 'LIMA', 'LIMA', 'PUENTE PIEDRA'),
('150126', 'LIMA', 'LIMA', 'PUNTA HERMOSA'),
('150127', 'LIMA', 'LIMA', 'PUNTA NEGRA'),
('150128', 'LIMA', 'LIMA', 'RIMAC'),
('150129', 'LIMA', 'LIMA', 'SAN BARTOLO'),
('150130', 'LIMA', 'LIMA', 'SAN BORJA'),
('150131', 'LIMA', 'LIMA', 'SAN ISIDRO'),
('150132', 'LIMA', 'LIMA', 'SAN JUAN DE LURIGANCHO'),
('150133', 'LIMA', 'LIMA', 'SAN JUAN DE MIRAFLORES'),
('150134', 'LIMA', 'LIMA', 'SAN LUIS'),
('150135', 'LIMA', 'LIMA', 'SAN MARTIN DE PORRES'),
('150136', 'LIMA', 'LIMA', 'SAN MIGUEL'),
('150137', 'LIMA', 'LIMA', 'SANTA ANITA'),
('150138', 'LIMA', 'LIMA', 'SANTA MARIA DEL MAR'),
('150139', 'LIMA', 'LIMA', 'SANTA ROSA'),
('150140', 'LIMA', 'LIMA', 'SANTIAGO DE SURCO'),
('150141', 'LIMA', 'LIMA', 'SURQUILLO'),
('150142', 'LIMA', 'LIMA', 'VILLA EL SALVADOR'),
('150143', 'LIMA', 'LIMA', 'VILLA MARIA DEL TRIUNFO')
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- COMPAÑÍAS DE EJEMPLO
-- ==========================================

-- Compañía 1: Comercial ABC S.A.C.
INSERT INTO companies (
    id,
    ruc,
    legal_name,
    trade_name,
    email,
    phone,
    address,
    ubigeo_code,
    currency_code,
    valuation_method
) VALUES (
    '01234567-89ab-cdef-0123-456789abcdef',
    '20123456789',
    'COMERCIAL ABC SOCIEDAD ANONIMA CERRADA',
    'Comercial ABC',
    'contacto@comercialabc.com',
    '01-234-5678',
    'Av. Javier Prado Este 123, San Isidro',
    '150131',
    'PEN',
    'PROMEDIO_MOVIL'
) ON CONFLICT (ruc) DO NOTHING;

-- Compañía 2: Distribuidora XYZ E.I.R.L.
INSERT INTO companies (
    id,
    ruc,
    legal_name,
    trade_name,
    email,
    phone,
    address,
    ubigeo_code,
    currency_code,
    valuation_method
) VALUES (
    '11234567-89ab-cdef-0123-456789abcdef',
    '20987654321',
    'DISTRIBUIDORA XYZ EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA',
    'Distribuidora XYZ',
    'ventas@distribuidoraxyz.com',
    '01-987-6543',
    'Jr. Lampa 456, Cercado de Lima',
    '150101',
    'PEN',
    'FIFO'
) ON CONFLICT (ruc) DO NOTHING;

-- ==========================================
-- SUCURSALES
-- ==========================================

-- Sucursales para Comercial ABC
INSERT INTO branches (company_id, code, name, address, ubigeo_code) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'PRIN', 'Sucursal Principal', 'Av. Javier Prado Este 123, San Isidro', '150131'),
('01234567-89ab-cdef-0123-456789abcdef', 'MIRA', 'Sucursal Miraflores', 'Av. Larco 789, Miraflores', '150122'),
('01234567-89ab-cdef-0123-456789abcdef', 'SURCO', 'Sucursal Surco', 'Av. Primavera 321, Santiago de Surco', '150140')
ON CONFLICT (company_id, code) DO NOTHING;

-- Sucursales para Distribuidora XYZ
INSERT INTO branches (company_id, code, name, address, ubigeo_code) VALUES
('11234567-89ab-cdef-0123-456789abcdef', 'CENT', 'Centro de Distribución', 'Jr. Lampa 456, Cercado de Lima', '150101'),
('11234567-89ab-cdef-0123-456789abcdef', 'COMAS', 'Almacén Comas', 'Av. Tupac Amaru 654, Comas', '150110')
ON CONFLICT (company_id, code) DO NOTHING;

-- ==========================================
-- ALMACENES
-- ==========================================

-- Almacenes para Comercial ABC
INSERT INTO warehouses (company_id, branch_id, code, name, width, height, length) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 
 (SELECT id FROM branches WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'PRIN'), 
 'ALM01', 'Almacén Principal', 20.0, 5.0, 30.0),

('01234567-89ab-cdef-0123-456789abcdef', 
 (SELECT id FROM branches WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'PRIN'), 
 'ALM02', 'Almacén Productos Fríos', 10.0, 3.0, 15.0),

('01234567-89ab-cdef-0123-456789abcdef', 
 (SELECT id FROM branches WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'MIRA'), 
 'ALM03', 'Almacén Miraflores', 15.0, 4.0, 20.0)
ON CONFLICT (company_id, code) DO NOTHING;

-- Almacenes para Distribuidora XYZ
INSERT INTO warehouses (company_id, branch_id, code, name, width, height, length) VALUES
('11234567-89ab-cdef-0123-456789abcdef', 
 (SELECT id FROM branches WHERE company_id = '11234567-89ab-cdef-0123-456789abcdef' AND code = 'CENT'), 
 'CD01', 'Centro de Distribución Principal', 50.0, 8.0, 60.0),

('11234567-89ab-cdef-0123-456789abcdef', 
 (SELECT id FROM branches WHERE company_id = '11234567-89ab-cdef-0123-456789abcdef' AND code = 'COMAS'), 
 'ALM04', 'Almacén Norte', 25.0, 6.0, 35.0)
ON CONFLICT (company_id, code) DO NOTHING;

-- ==========================================
-- ZONAS DE ALMACÉN
-- ==========================================

-- Zonas para Almacén Principal (ALM01)
INSERT INTO warehouse_zones (company_id, warehouse_id, code, name, width, height, length, capacity_kg) VALUES
('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM warehouses WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ALM01'),
 'A1', 'Zona A1 - Electrónicos', 5.0, 5.0, 10.0, 2000.0),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM warehouses WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ALM01'),
 'B1', 'Zona B1 - Textiles', 8.0, 5.0, 15.0, 1500.0),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM warehouses WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ALM01'),
 'C1', 'Zona C1 - Alimentos', 7.0, 5.0, 5.0, 3000.0)
ON CONFLICT (warehouse_id, code) DO NOTHING;

-- ==========================================
-- MARCAS Y CATEGORÍAS
-- ==========================================

-- Marcas para Comercial ABC
INSERT INTO brands (company_id, name, code) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'Samsung', 'SAMS'),
('01234567-89ab-cdef-0123-456789abcdef', 'LG', 'LG'),
('01234567-89ab-cdef-0123-456789abcdef', 'Sony', 'SONY'),
('01234567-89ab-cdef-0123-456789abcdef', 'Nike', 'NIKE'),
('01234567-89ab-cdef-0123-456789abcdef', 'Adidas', 'ADID'),
('01234567-89ab-cdef-0123-456789abcdef', 'Marca Propia', 'MP')
ON CONFLICT (company_id, name) DO NOTHING;

-- Categorías para Comercial ABC
INSERT INTO categories (company_id, parent_id, name, code) VALUES
('01234567-89ab-cdef-0123-456789abcdef', NULL, 'Electrónicos', 'ELEC'),
('01234567-89ab-cdef-0123-456789abcdef', NULL, 'Ropa y Calzado', 'ROPA'),
('01234567-89ab-cdef-0123-456789abcdef', NULL, 'Hogar', 'HOGAR'),
('01234567-89ab-cdef-0123-456789abcdef', NULL, 'Alimentos y Bebidas', 'ALIM')
ON CONFLICT (company_id, name) DO NOTHING;

-- Subcategorías
INSERT INTO categories (company_id, parent_id, name, code) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ELEC'), 
 'Televisores', 'TV'),
('01234567-89ab-cdef-0123-456789abcdef', 
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ELEC'), 
 'Celulares', 'CEL'),
('01234567-89ab-cdef-0123-456789abcdef', 
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ROPA'), 
 'Zapatillas', 'ZAP'),
('01234567-89ab-cdef-0123-456789abcdef', 
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ROPA'), 
 'Camisetas', 'CAM')
ON CONFLICT (company_id, name) DO NOTHING;

-- ==========================================
-- PRODUCTOS
-- ==========================================

-- Productos para Comercial ABC
INSERT INTO products (
    company_id, sku, barcode, name, description, 
    brand_id, category_id, unit_code, 
    width, height, length, weight_kg,
    min_stock, max_stock, active
) VALUES 
-- Televisores
('01234567-89ab-cdef-0123-456789abcdef', 'TV-SAMS-55-4K', '7501234567890', 
 'Televisor Samsung 55" 4K UHD', 'Smart TV Samsung 55 pulgadas 4K UHD con HDR',
 (SELECT id FROM brands WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'SAMS'),
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'TV'),
 'NIU', 123.0, 71.0, 8.0, 15.5, 5, 50, true),

('01234567-89ab-cdef-0123-456789abcdef', 'TV-LG-43-OLED', '7501234567891', 
 'Televisor LG 43" OLED', 'Smart TV LG 43 pulgadas OLED con WebOS',
 (SELECT id FROM brands WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'LG'),
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'TV'),
 'NIU', 97.0, 56.0, 5.0, 12.8, 3, 30, true),

-- Celulares
('01234567-89ab-cdef-0123-456789abcdef', 'CEL-SAMS-A54', '7501234567892', 
 'Samsung Galaxy A54 5G', 'Smartphone Samsung Galaxy A54 5G 128GB',
 (SELECT id FROM brands WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'SAMS'),
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'CEL'),
 'NIU', 7.6, 15.8, 0.8, 0.202, 10, 100, true),

('01234567-89ab-cdef-0123-456789abcdef', 'CEL-SONY-XP5', '7501234567893', 
 'Sony Xperia 5 IV', 'Smartphone Sony Xperia 5 IV 256GB',
 (SELECT id FROM brands WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'SONY'),
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'CEL'),
 'NIU', 6.7, 15.6, 0.8, 0.172, 5, 50, true),

-- Zapatillas
('01234567-89ab-cdef-0123-456789abcdef', 'ZAP-NIKE-AIR42', '7501234567894', 
 'Nike Air Max 270 Talla 42', 'Zapatillas Nike Air Max 270 para hombre talla 42',
 (SELECT id FROM brands WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'NIKE'),
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ZAP'),
 'PAR', 32.0, 12.0, 19.0, 0.6, 15, 150, true),

('01234567-89ab-cdef-0123-456789abcdef', 'ZAP-ADID-UB40', '7501234567895', 
 'Adidas Ultraboost 22 Talla 40', 'Zapatillas Adidas Ultraboost 22 para running talla 40',
 (SELECT id FROM brands WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ADID'),
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ZAP'),
 'PAR', 30.0, 11.0, 18.0, 0.55, 20, 200, true),

-- Camisetas
('01234567-89ab-cdef-0123-456789abcdef', 'CAM-NIKE-DRY-M', '7501234567896', 
 'Camiseta Nike Dri-FIT Talla M', 'Camiseta deportiva Nike Dri-FIT para hombre talla M',
 (SELECT id FROM brands WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'NIKE'),
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'CAM'),
 'NIU', 0.0, 0.0, 0.0, 0.15, 50, 500, true),

('01234567-89ab-cdef-0123-456789abcdef', 'CAM-ADID-3S-L', '7501234567897', 
 'Camiseta Adidas 3-Stripes Talla L', 'Camiseta casual Adidas 3-Stripes para hombre talla L',
 (SELECT id FROM brands WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'ADID'),
 (SELECT id FROM categories WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND code = 'CAM'),
 'NIU', 0.0, 0.0, 0.0, 0.18, 40, 400, true)

ON CONFLICT (company_id, sku) DO NOTHING;

-- ==========================================
-- CLIENTES Y PROVEEDORES (PARTIES)
-- ==========================================

-- Clientes para Comercial ABC
INSERT INTO parties (
    company_id, is_customer, is_supplier, doc_type, doc_number,
    apellido_paterno, apellido_materno, nombres, razon_social,
    email, phone, address, ubigeo_code, country_code
) VALUES 
-- Personas naturales
('01234567-89ab-cdef-0123-456789abcdef', true, false, '1', '12345678',
 'García', 'Pérez', 'Juan Carlos', NULL,
 'juan.garcia@email.com', '987-654-321', 'Av. Brasil 123, Jesús María', '150113', 'PE'),

('01234567-89ab-cdef-0123-456789abcdef', true, false, '1', '87654321',
 'Rodríguez', 'Silva', 'María Elena', NULL,
 'maria.rodriguez@email.com', '987-654-322', 'Jr. Huancavelica 456, Lima', '150101', 'PE'),

-- Empresas clientes
('01234567-89ab-cdef-0123-456789abcdef', true, false, '6', '20456789123',
 NULL, NULL, NULL, 'CORPORACION MEGA SAC',
 'compras@mega.com', '01-456-7890', 'Av. Argentina 789, Callao', '150101', 'PE'),

('01234567-89ab-cdef-0123-456789abcdef', true, false, '6', '20789123456',
 NULL, NULL, NULL, 'RETAIL SOLUTIONS EIRL',
 'ventas@retailsolutions.com', '01-789-1234', 'Av. Colonial 321, Callao', '150101', 'PE'),

-- Proveedores
('01234567-89ab-cdef-0123-456789abcdef', false, true, '6', '20111222333',
 NULL, NULL, NULL, 'DISTRIBUIDORA TECH SAC',
 'contacto@distritech.com', '01-111-2222', 'Av. Universitaria 555, Los Olivos', '150117', 'PE'),

('01234567-89ab-cdef-0123-456789abcdef', false, true, '6', '20444555666',
 NULL, NULL, NULL, 'IMPORTACIONES GLOBALES SA',
 'ventas@impglobales.com', '01-444-5555', 'Av. Javier Prado 1000, San Isidro', '150131', 'PE'),

('01234567-89ab-cdef-0123-456789abcdef', false, true, '6', '20777888999',
 NULL, NULL, NULL, 'TEXTILES ANDINOS EIRL',
 'info@textilesandinos.com', '01-777-8888', 'Jr. Gamarra 200, La Victoria', '150115', 'PE')

ON CONFLICT (company_id, doc_type, doc_number) DO NOTHING;

-- ==========================================
-- LISTAS DE PRECIOS
-- ==========================================

-- Lista de precios para Comercial ABC
INSERT INTO price_lists (company_id, name, currency_code, is_default) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'Precio Público', 'PEN', true),
('01234567-89ab-cdef-0123-456789abcdef', 'Precio Mayorista', 'PEN', false),
('01234567-89ab-cdef-0123-456789abcdef', 'Precio Corporativo', 'PEN', false)
ON CONFLICT (company_id, name) DO NOTHING;

-- Precios para productos
INSERT INTO price_list_items (company_id, price_list_id, product_id, unit_price, valid_from) VALUES
-- Precios públicos
('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Público'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'TV-SAMS-55-4K'),
 2899.00, '2025-01-01'),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Público'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'TV-LG-43-OLED'),
 3499.00, '2025-01-01'),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Público'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'CEL-SAMS-A54'),
 1299.00, '2025-01-01'),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Público'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'CEL-SONY-XP5'),
 2599.00, '2025-01-01'),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Público'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'ZAP-NIKE-AIR42'),
 549.00, '2025-01-01'),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Público'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'ZAP-ADID-UB40'),
 699.00, '2025-01-01'),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Público'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'CAM-NIKE-DRY-M'),
 89.00, '2025-01-01'),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Público'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'CAM-ADID-3S-L'),
 79.00, '2025-01-01'),

-- Precios mayoristas (10% descuento)
('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Mayorista'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'TV-SAMS-55-4K'),
 2609.10, '2025-01-01'),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Mayorista'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'ZAP-NIKE-AIR42'),
 494.10, '2025-01-01'),

('01234567-89ab-cdef-0123-456789abcdef',
 (SELECT id FROM price_lists WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND name = 'Precio Mayorista'),
 (SELECT id FROM products WHERE company_id = '01234567-89ab-cdef-0123-456789abcdef' AND sku = 'CAM-NIKE-DRY-M'),
 80.10, '2025-01-01')

ON CONFLICT (price_list_id, product_id, valid_from) DO NOTHING;

-- ==========================================
-- DATOS INICIALES PARA LA SEGUNDA EMPRESA
-- ==========================================

-- Productos básicos para Distribuidora XYZ
INSERT INTO brands (company_id, name, code) VALUES
('11234567-89ab-cdef-0123-456789abcdef', 'Coca Cola', 'COCA'),
('11234567-89ab-cdef-0123-456789abcdef', 'Pepsi', 'PEPSI'),
('11234567-89ab-cdef-0123-456789abcdef', 'Inca Kola', 'INCA'),
('11234567-89ab-cdef-0123-456789abcdef', 'San Luis', 'SANLUIS')
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO categories (company_id, parent_id, name, code) VALUES
('11234567-89ab-cdef-0123-456789abcdef', NULL, 'Bebidas', 'BEB'),
('11234567-89ab-cdef-0123-456789abcdef', NULL, 'Snacks', 'SNACK'),
('11234567-89ab-cdef-0123-456789abcdef', NULL, 'Agua', 'AGUA')
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO products (
    company_id, sku, barcode, name, description, 
    brand_id, category_id, unit_code, 
    width, height, length, weight_kg,
    min_stock, max_stock, active
) VALUES 
('11234567-89ab-cdef-0123-456789abcdef', 'COCA-500ML', '7411234567890', 
 'Coca Cola 500ml', 'Gaseosa Coca Cola botella 500ml',
 (SELECT id FROM brands WHERE company_id = '11234567-89ab-cdef-0123-456789abcdef' AND code = 'COCA'),
 (SELECT id FROM categories WHERE company_id = '11234567-89ab-cdef-0123-456789abcdef' AND code = 'BEB'),
 'NIU', 6.5, 20.0, 6.5, 0.5, 100, 1000, true),

('11234567-89ab-cdef-0123-456789abcdef', 'INCA-1.5L', '7411234567891', 
 'Inca Kola 1.5L', 'Gaseosa Inca Kola botella 1.5 litros',
 (SELECT id FROM brands WHERE company_id = '11234567-89ab-cdef-0123-456789abcdef' AND code = 'INCA'),
 (SELECT id FROM categories WHERE company_id = '11234567-89ab-cdef-0123-456789abcdef' AND code = 'BEB'),
 'NIU', 9.0, 31.0, 9.0, 1.5, 50, 500, true),

('11234567-89ab-cdef-0123-456789abcdef', 'AGUA-SL-625', '7411234567892', 
 'Agua San Luis 625ml', 'Agua mineral San Luis botella 625ml',
 (SELECT id FROM brands WHERE company_id = '11234567-89ab-cdef-0123-456789abcdef' AND code = 'SANLUIS'),
 (SELECT id FROM categories WHERE company_id = '11234567-89ab-cdef-0123-456789abcdef' AND code = 'AGUA'),
 'NIU', 7.0, 22.0, 7.0, 0.625, 200, 2000, true)

ON CONFLICT (company_id, sku) DO NOTHING;

-- ==========================================
-- MENSAJE FINAL
-- ==========================================

-- Insertar algunos registros de ejemplo en el kardex para que haya movimientos iniciales
-- (Esto se puede hacer manualmente después o mediante imports de datos históricos)

-- =====================================================
-- 9. PLANTILLAS DE NOTIFICACIONES
-- =====================================================

-- Plantillas globales para notificaciones
INSERT INTO notification_templates (name, type, channel, subject_template, body_template, available_variables) VALUES
-- Plantillas para ventas
('Venta Creada - In App', 'sale_created', 'in_app', NULL, 
 'Nueva venta {{doc_number}} creada por {{total_amount}} {{currency_code}}', 
 ARRAY['doc_number', 'total_amount', 'currency_code', 'customer_name']),

('Venta Creada - Email', 'sale_created', 'email', 
 'Nueva Venta Registrada - {{doc_number}}',
 'Se ha registrado una nueva venta:\n\nNúmero: {{doc_number}}\nCliente: {{customer_name}}\nMonto: {{total_amount}} {{currency_code}}\nFecha: {{created_at}}\n\nSaludos,\nSistema ERP',
 ARRAY['doc_number', 'total_amount', 'currency_code', 'customer_name', 'created_at']),

-- Plantillas para stock
('Stock Bajo - In App', 'stock_low', 'in_app', NULL,
 'Stock bajo: {{product_name}} ({{current_stock}} unidades)',
 ARRAY['product_name', 'current_stock', 'min_stock', 'warehouse_name']),

('Stock Bajo - Email', 'stock_low', 'email',
 'Alerta de Stock Bajo - {{product_name}}',
 'El producto {{product_name}} tiene stock bajo en el almacén {{warehouse_name}}:\n\nStock actual: {{current_stock}} unidades\nStock mínimo: {{min_stock}} unidades\n\nEs necesario realizar una reposición.\n\nSistema ERP',
 ARRAY['product_name', 'current_stock', 'min_stock', 'warehouse_name']),

-- Plantillas para compras
('Compra Creada - In App', 'purchase_created', 'in_app', NULL,
 'Nueva compra {{doc_number}} por {{total_amount}} {{currency_code}}',
 ARRAY['doc_number', 'total_amount', 'currency_code', 'supplier_name']),

-- Plantillas para usuarios
('Usuario Asignado - Email', 'user_assigned', 'email',
 'Acceso Otorgado a {{company_name}}',
 'Estimado/a {{user_name}},\n\nSe te ha otorgado acceso a la empresa {{company_name}} con el rol de {{role_name}}.\n\nPuedes acceder al sistema en: {{app_url}}\n\nSaludos,\nEquipo {{company_name}}',
 ARRAY['user_name', 'company_name', 'role_name', 'app_url']);

-- =====================================================
-- 10. NOTIFICACIONES DE PRUEBA
-- =====================================================

-- Notificaciones para el usuario de prueba
INSERT INTO notifications (title, message, type, priority, recipient_user_id, company_id, data, related_entity_type, related_entity_id, channels, created_by) VALUES
-- Notificación de bienvenida
('¡Bienvenido al Sistema ERP!', 
 'Tu cuenta ha sido configurada exitosamente. Puedes comenzar a explorar todas las funcionalidades del sistema.',
 'user_assigned', 'normal', 
 '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16', '01234567-89ab-cdef-0123-456789abcdef',
 '{"welcome": true, "features": ["ventas", "compras", "inventario", "reportes"]}',
 'user_companies', NULL,
 ARRAY['in_app'::notification_channel],
 '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16'),

-- Notificación de stock bajo para productos existentes
('Stock Bajo - Laptop Dell Inspiron', 
 'El producto Laptop Dell Inspiron 15 3000 tiene un stock bajo: 5 unidades (mínimo: 10 unidades) en Almacén Central.',
 'stock_low', 'high',
 '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16', '01234567-89ab-cdef-0123-456789abcdef',
 '{"current_stock": 5, "min_stock": 10, "warehouse": "Almacén Central", "product_name": "Laptop Dell Inspiron 15 3000"}',
 'products', '11111111-1111-1111-1111-111111111111',
 ARRAY['in_app'::notification_channel, 'email'::notification_channel],
 '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16'),

-- Notificación de nueva venta
('Nueva Venta Registrada', 
 'Se ha registrado una nueva venta F001-00000123 por S/ 2,500.00 al cliente TechCorp SAC.',
 'sale_created', 'normal',
 '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16', '01234567-89ab-cdef-0123-456789abcdef',
 '{"doc_number": "F001-00000123", "amount": 2500.00, "currency": "PEN", "customer": "TechCorp SAC"}',
 'sales_docs', NULL,
 ARRAY['in_app'::notification_channel],
 '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16'),

-- Notificación de sistema
('Mantenimiento Programado', 
 'El sistema tendrá un mantenimiento programado el próximo domingo de 2:00 AM a 4:00 AM. Durante este tiempo, el sistema no estará disponible.',
 'system_maintenance', 'normal',
 '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16', '01234567-89ab-cdef-0123-456789abcdef',
 '{"maintenance_date": "2025-08-20", "start_time": "02:00", "end_time": "04:00", "timezone": "America/Lima"}',
 NULL, NULL,
 ARRAY['in_app'::notification_channel, 'email'::notification_channel],
 '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16'),

-- Notificación leída (ejemplo)
('Backup Completado', 
 'El respaldo automático diario se ha completado exitosamente. Todos los datos están seguros.',
 'backup_completed', 'low',
 '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16', '01234567-89ab-cdef-0123-456789abcdef',
 '{"backup_size": "2.5 GB", "backup_time": "3 minutos", "status": "success"}',
 NULL, NULL,
 ARRAY['in_app'::notification_channel],
 '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16');

-- Marcar una notificación como leída
UPDATE notifications 
SET is_read = TRUE, read_at = NOW() 
WHERE title = 'Backup Completado';

-- =====================================================
-- 11. PREFERENCIAS DE NOTIFICACIONES
-- =====================================================

-- Las preferencias se crean automáticamente por el trigger cuando se asigna un usuario a una empresa
-- Pero podemos personalizar algunas para el usuario de prueba

-- Actualizar preferencias para recibir notificaciones importantes por email también
UPDATE notification_preferences 
SET enabled_channels = ARRAY['in_app'::notification_channel, 'email'::notification_channel]
WHERE user_id = '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16' 
  AND notification_type IN ('stock_low', 'stock_out', 'security_alert', 'sale_created');

-- Configurar horario silencioso (10 PM a 8 AM)
UPDATE notification_preferences 
SET quiet_hours_start = '22:00'::TIME, quiet_hours_end = '08:00'::TIME
WHERE user_id = '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16';

-- Deshabilitar notificaciones de mantenimiento los fines de semana
UPDATE notification_preferences 
SET enabled_weekdays = ARRAY[1,2,3,4,5] -- Solo días laborables
WHERE user_id = '955bc867-6d3c-4ffa-9f7a-bd9e8b126f16' 
  AND notification_type = 'system_maintenance';

COMMIT;
