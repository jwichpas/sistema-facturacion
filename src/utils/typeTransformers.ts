/**
 * Type transformation utilities to handle conversions between database types and application types
 * This addresses the incompatibilities between Supabase auto-generated types and our application interfaces
 */

import type { Database } from '@/types/database'
import type {
  Party,
  Brand,
  Category,
  Company,
  PartyContact,
  Product,
  ProductImage,
  Warehouse,
  Branch
} from '@/types'

// Database row types for convenience
type DbParty = Database['public']['Tables']['parties']['Row']
type DbBrand = Database['public']['Tables']['brands']['Row']
type DbCategory = Database['public']['Tables']['categories']['Row']
type DbCompany = Database['public']['Tables']['companies']['Row']
type DbPartyContact = Database['public']['Tables']['party_contacts']['Row']
type DbProduct = Database['public']['Tables']['products']['Row']
type DbProductImage = Database['public']['Tables']['product_images']['Row']
type DbWarehouse = Database['public']['Tables']['warehouses']['Row']
type DbBranch = Database['public']['Tables']['branches']['Row']

/**
 * Transforms null values to undefined for optional fields
 */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

/**
 * Transforms database Party to application Party interface
 */
export function transformPartyFromDB(dbParty: DbParty): Party {
  return {
    id: dbParty.id,
    company_id: dbParty.company_id,
    is_customer: dbParty.is_customer,
    is_supplier: dbParty.is_supplier,
    doc_type: dbParty.doc_type,
    doc_number: dbParty.doc_number,
    apellido_paterno: nullToUndefined(dbParty.apellido_paterno),
    apellido_materno: nullToUndefined(dbParty.apellido_materno),
    nombres: nullToUndefined(dbParty.nombres),
    razon_social: nullToUndefined(dbParty.razon_social),
    fullname: dbParty.fullname,
    email: nullToUndefined(dbParty.email),
    phone: nullToUndefined(dbParty.phone),
    address: nullToUndefined(dbParty.address),
    ubigeo_code: nullToUndefined(dbParty.ubigeo_code),
    created_at: dbParty.created_at || new Date().toISOString(),
    updated_at: dbParty.updated_at || new Date().toISOString()
  }
}

/**
 * Transforms database Brand to application Brand interface
 * Note: Adds default active=true since DB doesn't have this field yet
 */
export function transformBrandFromDB(dbBrand: DbBrand): Brand {
  return {
    id: dbBrand.id,
    company_id: dbBrand.company_id,
    code: dbBrand.code || '',
    name: dbBrand.name,
    active: true // Default to true until migration adds this field
  }
}

/**
 * Transforms database Category to application Category interface
 * Note: Adds default active=true since DB doesn't have this field yet
 */
export function transformCategoryFromDB(dbCategory: DbCategory): Category {
  return {
    id: dbCategory.id,
    company_id: dbCategory.company_id,
    code: dbCategory.code || '',
    name: dbCategory.name,
    parent_id: nullToUndefined(dbCategory.parent_id),
    level: dbCategory.level || 0,
    active: true // Default to true until migration adds this field
  }
}

/**
 * Transforms database Company to application Company interface
 */
export function transformCompanyFromDB(dbCompany: DbCompany): Company {
  return {
    id: dbCompany.id,
    ruc: dbCompany.ruc,
    legal_name: dbCompany.legal_name,
    trade_name: nullToUndefined(dbCompany.trade_name),
    email: nullToUndefined(dbCompany.email),
    phone: nullToUndefined(dbCompany.phone),
    address: nullToUndefined(dbCompany.address),
    ubigeo_code: nullToUndefined(dbCompany.ubigeo_code),
    currency_code: dbCompany.currency_code,
    valuation_method: dbCompany.valuation_method as 'PROMEDIO_MOVIL' | 'FIFO',
    sol_user: nullToUndefined(dbCompany.sol_user),
    sol_pass: nullToUndefined(dbCompany.sol_pass),
    cert_path: nullToUndefined(dbCompany.cert_path),
    client_id: nullToUndefined(dbCompany.client_id),
    client_secret: nullToUndefined(dbCompany.client_secret),
    production: dbCompany.production || false,
    created_at: dbCompany.created_at || new Date().toISOString(),
    updated_at: dbCompany.updated_at || new Date().toISOString()
  }
}

/**
 * Transforms database PartyContact to application PartyContact interface
 */
export function transformPartyContactFromDB(dbContact: DbPartyContact): PartyContact {
  return {
    id: dbContact.id,
    company_id: dbContact.company_id,
    party_id: dbContact.party_id,
    name: dbContact.name,
    email: dbContact.email,
    phone: dbContact.phone,
    notes: dbContact.notes,
    created_at: dbContact.created_at,
    updated_at: dbContact.updated_at,
    deleted_at: nullToUndefined(dbContact.deleted_at)
  }
}

/**
 * Transforms database Product to application Product interface
 */
export function transformProductFromDB(dbProduct: DbProduct): Product {
  return {
    id: dbProduct.id,
    company_id: dbProduct.company_id,
    sku: dbProduct.sku,
    barcode: nullToUndefined(dbProduct.barcode),
    name: dbProduct.name,
    description: nullToUndefined(dbProduct.description),
    brand_id: nullToUndefined(dbProduct.brand_id),
    category_id: nullToUndefined(dbProduct.category_id),
    unit_code: dbProduct.unit_code,
    width: dbProduct.width || 0,
    height: dbProduct.height || 0,
    length: dbProduct.length || 0,
    weight_kg: dbProduct.weight_kg || 0,
    volume_m3: ((dbProduct.width || 0) * (dbProduct.height || 0) * (dbProduct.length || 0)) / 1000000000,
    is_serialized: dbProduct.is_serialized || false,
    is_batch_controlled: dbProduct.is_batch_controlled || false,
    min_stock: dbProduct.min_stock || 0,
    max_stock: dbProduct.max_stock || 0,
    active: dbProduct.active || true,
    created_at: dbProduct.created_at || new Date().toISOString(),
    updated_at: dbProduct.updated_at || new Date().toISOString()
  }
}

/**
 * Transforms database ProductImage to application ProductImage interface
 */
export function transformProductImageFromDB(dbImage: DbProductImage): ProductImage {
  return {
    id: dbImage.id,
    company_id: dbImage.company_id,
    product_id: dbImage.product_id,
    storage_path: dbImage.storage_path,
    is_primary: dbImage.is_primary,
    created_at: dbImage.created_at
  }
}

/**
 * Transforms database Warehouse to application Warehouse interface
 */
export function transformWarehouseFromDB(dbWarehouse: DbWarehouse): Warehouse {
  return {
    id: dbWarehouse.id,
    company_id: dbWarehouse.company_id,
    branch_id: nullToUndefined(dbWarehouse.branch_id),
    code: dbWarehouse.code,
    name: dbWarehouse.name,
    width: dbWarehouse.width || 0,
    height: dbWarehouse.height || 0,
    length: dbWarehouse.length || 0,
    created_at: dbWarehouse.created_at || new Date().toISOString(),
    updated_at: dbWarehouse.updated_at || new Date().toISOString()
  }
}

/**
 * Transforms database Branch to application Branch interface
 */
export function transformBranchFromDB(dbBranch: DbBranch): Branch {
  return {
    id: dbBranch.id,
    company_id: dbBranch.company_id,
    code: dbBranch.code,
    name: dbBranch.name,
    address: nullToUndefined(dbBranch.address),
    ubigeo_code: nullToUndefined(dbBranch.ubigeo_code),
    created_at: dbBranch.created_at || new Date().toISOString(),
    updated_at: dbBranch.updated_at || new Date().toISOString()
  }
}

/**
 * Transforms application Party to database insert format
 */
export function transformPartyToDB(party: Partial<Party>): Database['public']['Tables']['parties']['Insert'] {
  return {
    company_id: party.company_id!,
    is_customer: party.is_customer || false,
    is_supplier: party.is_supplier || false,
    doc_type: party.doc_type!,
    doc_number: party.doc_number!,
    apellido_paterno: party.apellido_paterno || null,
    apellido_materno: party.apellido_materno || null,
    nombres: party.nombres || null,
    razon_social: party.razon_social || null,
    fullname: party.fullname || null,
    email: party.email || null,
    phone: party.phone || null,
    address: party.address || null,
    ubigeo_code: party.ubigeo_code || null
  }
}

/**
 * Transforms application Brand to database insert format
 */
export function transformBrandToDB(brand: Partial<Brand>): Database['public']['Tables']['brands']['Insert'] {
  return {
    company_id: brand.company_id!,
    code: brand.code || null,
    name: brand.name!
    // Note: active field will be added after migration
  }
}

/**
 * Transforms application Category to database insert format
 */
export function transformCategoryToDB(category: Partial<Category>): Database['public']['Tables']['categories']['Insert'] {
  return {
    company_id: category.company_id!,
    code: category.code || null,
    name: category.name!,
    parent_id: category.parent_id || null,
    level: category.level || 0
    // Note: active field will be added after migration
  }
}

/**
 * Transforms application Product to database insert format
 */
export function transformProductToDB(product: Partial<Product>): Database['public']['Tables']['products']['Insert'] {
  return {
    company_id: product.company_id!,
    sku: product.sku!,
    barcode: product.barcode || null,
    name: product.name!,
    description: product.description || null,
    brand_id: product.brand_id || null,
    category_id: product.category_id || null,
    unit_code: product.unit_code!,
    width: product.width || null,
    height: product.height || null,
    length: product.length || null,
    weight_kg: product.weight_kg || null,
    is_serialized: product.is_serialized || null,
    is_batch_controlled: product.is_batch_controlled || null,
    min_stock: product.min_stock || null,
    max_stock: product.max_stock || null,
    active: product.active || null
  }
}

/**
 * Array transformation helpers
 */
export function transformPartiesFromDB(dbParties: DbParty[]): Party[] {
  return dbParties.map(transformPartyFromDB)
}

export function transformBrandsFromDB(dbBrands: DbBrand[]): Brand[] {
  return dbBrands.map(transformBrandFromDB)
}

export function transformCategoriesFromDB(dbCategories: DbCategory[]): Category[] {
  return dbCategories.map(transformCategoryFromDB)
}

export function transformCompaniesFromDB(dbCompanies: DbCompany[]): Company[] {
  return dbCompanies.map(transformCompanyFromDB)
}

export function transformProductsFromDB(dbProducts: DbProduct[]): Product[] {
  return dbProducts.map(transformProductFromDB)
}

export function transformProductImagesFromDB(dbImages: DbProductImage[]): ProductImage[] {
  return dbImages.map(transformProductImageFromDB)
}

export function transformWarehousesFromDB(dbWarehouses: DbWarehouse[]): Warehouse[] {
  return dbWarehouses.map(transformWarehouseFromDB)
}

export function transformBranchesFromDB(dbBranches: DbBranch[]): Branch[] {
  return dbBranches.map(transformBranchFromDB)
}
