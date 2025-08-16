import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'
import type {
  Product,
  Brand,
  Category,
  ProductImage,
  ProductCode
} from '@/types'
import {
  transformProductFromDB,
  transformProductsFromDB,
  transformBrandFromDB,
  transformBrandsFromDB,
  transformCategoryFromDB,
  transformCategoriesFromDB,
  transformProductImageFromDB,
  transformProductImagesFromDB,
  transformProductToDB,
  transformBrandToDB,
  transformCategoryToDB
} from '@/utils/typeTransformers'

// Database types for internal use
type DbProduct = Database['public']['Tables']['products']['Row']
type DbBrand = Database['public']['Tables']['brands']['Row']
type DbCategory = Database['public']['Tables']['categories']['Row']
type DbProductImage = Database['public']['Tables']['product_images']['Row']
type DbProductCode = Database['public']['Tables']['product_codes']['Row']
type DbStockLedger = Database['public']['Tables']['stock_ledger']['Row']
type DbWarehouseStock = Database['public']['Tables']['warehouse_stock']['Row']

export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type BrandInsert = Database['public']['Tables']['brands']['Insert']
export type BrandUpdate = Database['public']['Tables']['brands']['Update']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type ProductImageInsert = Database['public']['Tables']['product_images']['Insert']
export type ProductCodeInsert = Database['public']['Tables']['product_codes']['Insert']

// Extended interfaces for better UX
export interface ProductWithDetails extends Product {
  brand?: Brand | null
  category?: Category | null
  images?: ProductImage[]
  codes?: ProductCode[]
  total_stock?: number
  stock_by_warehouse?: Array<{
    warehouse_id: string
    warehouse_name: string
    balance_qty: number
  }>
}

export interface StockMovement extends DbStockLedger {
  product?: Pick<Product, 'id' | 'name' | 'sku'>
  warehouse?: Pick<Database['public']['Tables']['warehouses']['Row'], 'id' | 'name' | 'code'>
}

export interface StockAlert {
  product_id: string
  product_name: string
  product_sku: string
  current_stock: number
  min_stock: number
  warehouse_id: string
  warehouse_name: string
  alert_type: 'low_stock' | 'out_of_stock'
}

export interface ProductListItem extends Product {
  brand_name?: string | null
  category_name?: string | null
  total_stock?: number
  primary_image?: string | null
}

export interface ProductFilters {
  search?: string
  brandId?: string | null
  categoryId?: string | null
  active?: boolean | null
  lowStock?: boolean
  outOfStock?: boolean
}

export interface BrandFilters {
  search?: string
  active?: boolean | null
}

export interface CategoryFilters {
  search?: string
  parentId?: string | null
  active?: boolean | null
}

export interface StockFilters {
  warehouseId?: string
  productId?: string
  dateFrom?: string
  dateTo?: string
  operationType?: string
}

export default class ProductService {
  static async listProducts(companyId: string, filters: ProductFilters = {}): Promise<ProductListItem[]> {
    let query = supabase
      .from('products')
      .select(
        `*,
        brands(name),
        categories(name),
        product_images!left(storage_path, is_primary)`
      )
      .eq('company_id', companyId)

    if (filters.active !== null && filters.active !== undefined) {
      query = query.eq('active', filters.active)
    }

    if (filters.brandId) {
      query = query.eq('brand_id', filters.brandId)
    }

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      query = query.or(
        `name.ilike.%${term}%,sku.ilike.%${term}%,barcode.ilike.%${term}%`
      )
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    type JoinedProduct = DbProduct & {
      brands?: { name?: string } | null
      categories?: { name?: string } | null
      product_images?: Array<{ storage_path: string; is_primary: boolean | null }>
    }

    const products: ProductListItem[] = (data as JoinedProduct[]).map((p) => {
      const primaryImage = p.product_images?.find(img => img.is_primary)?.storage_path ||
                          p.product_images?.[0]?.storage_path || null

      // Transform the database product to application product, then add extra fields
      const transformedProduct = transformProductFromDB(p)
      return {
        ...transformedProduct,
        brand_name: p.brands?.name ?? null,
        category_name: p.categories?.name ?? null,
        primary_image: primaryImage,
      }
    })

    // Fetch stock totals and apply stock filters
    const productIds = products.map((p) => p.id)
    if (productIds.length > 0) {
      const { data: stockRows, error: stockError } = await supabase
        .from('warehouse_stock')
        .select('product_id, balance_qty')
        .in('product_id', productIds)

      if (!stockError && stockRows) {
        const stockByProduct = new Map<string, number>()
        for (const row of stockRows) {
          const prev = stockByProduct.get(row.product_id) || 0
          stockByProduct.set(row.product_id, prev + (row.balance_qty || 0))
        }

        for (const p of products) {
          p.total_stock = stockByProduct.get(p.id) || 0
        }

        // Apply stock-based filters
        let filteredProducts = products
        if (filters.lowStock) {
          filteredProducts = filteredProducts.filter(p =>
            (p.total_stock || 0) <= (p.min_stock || 0) && (p.total_stock || 0) > 0
          )
        }
        if (filters.outOfStock) {
          filteredProducts = filteredProducts.filter(p => (p.total_stock || 0) === 0)
        }

        return filteredProducts
      }
    }

    return products
  }

  static async getProduct(companyId: string, id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .single()
    if (error) throw error
    return data ? transformProductFromDB(data) : null
  }

  static async getProductWithDetails(companyId: string, id: string): Promise<ProductWithDetails | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        brands(*),
        categories(*),
        product_images(*),
        product_codes(*)
      `)
      .eq('company_id', companyId)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return null

    // Get stock information by warehouse
    const { data: stockData, error: stockError } = await supabase
      .from('warehouse_stock')
      .select(`
        balance_qty,
        warehouses(id, name, code)
      `)
      .eq('product_id', id)

    const stockByWarehouse = stockError ? [] : (stockData || []).map(stock => ({
      warehouse_id: (stock.warehouses as any)?.id || '',
      warehouse_name: (stock.warehouses as any)?.name || '',
      balance_qty: stock.balance_qty || 0
    }))

    const totalStock = stockByWarehouse.reduce((sum, stock) => sum + stock.balance_qty, 0)

    return {
      ...data,
      total_stock: totalStock,
      stock_by_warehouse: stockByWarehouse
    }
  }

  static async createProduct(payload: ProductInsert): Promise<Product> {
    const { data, error } = await supabase.from('products').insert(payload).select('*').single()
    if (error) throw error
    return transformProductFromDB(data)
  }

  static async updateProduct(id: string, payload: ProductUpdate): Promise<Product> {
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select('*').single()
    if (error) throw error
    return transformProductFromDB(data)
  }

  static async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  }

  // Brand Management
  static async listBrands(companyId: string, filters: BrandFilters = {}): Promise<Brand[]> {
    let query = supabase
      .from('brands')
      .select('*')
      .eq('company_id', companyId)

    // Note: active field doesn't exist in DB yet, so we skip this filter for now
    // TODO: Remove this comment after migration 20250816000001_add_missing_active_fields.sql is applied
    // if (filters.active !== null && filters.active !== undefined) {
    //   query = query.eq('active', filters.active)
    // }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`)
    }

    const { data, error } = await query.order('name')
    if (error) throw error

    // Transform database types to application types
    return transformBrandsFromDB(data || [])
  }

  static async getBrand(companyId: string, id: string): Promise<Brand | null> {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .single()
    if (error) throw error
    return data ? transformBrandFromDB(data) : null
  }

  static async createBrand(payload: BrandInsert): Promise<Brand> {
    const { data, error } = await supabase
      .from('brands')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return transformBrandFromDB(data)
  }

  static async updateBrand(id: string, payload: BrandUpdate): Promise<Brand> {
    const { data, error } = await supabase
      .from('brands')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return transformBrandFromDB(data)
  }

  static async deleteBrand(id: string): Promise<void> {
    const { error } = await supabase.from('brands').delete().eq('id', id)
    if (error) throw error
  }

  // Category Management
  static async listCategories(companyId: string, filters: CategoryFilters = {}): Promise<Category[]> {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('company_id', companyId)

    // Note: active field doesn't exist in DB yet, so we skip this filter for now
    // TODO: Remove this comment after migration 20250816000001_add_missing_active_fields.sql is applied
    // if (filters.active !== null && filters.active !== undefined) {
    //   query = query.eq('active', filters.active)
    // }

    if (filters.parentId !== undefined) {
      if (filters.parentId === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', filters.parentId)
      }
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`)
    }

    const { data, error } = await query.order('level').order('name')
    if (error) throw error
    return transformCategoriesFromDB(data || [])
  }

  static async getCategoriesTree(companyId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', companyId)
      // Note: active field doesn't exist in DB yet, so we skip this filter for now
      // TODO: Uncomment after migration 20250816000001_add_missing_active_fields.sql is applied
      // .eq('active', true)
      .order('level')
      .order('name')

    if (error) throw error
    return transformCategoriesFromDB(data || [])
  }

  static async getCategory(companyId: string, id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .single()
    if (error) throw error
    return data ? transformCategoryFromDB(data) : null
  }

  static async createCategory(payload: CategoryInsert): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return transformCategoryFromDB(data)
  }

  static async updateCategory(id: string, payload: CategoryUpdate): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return transformCategoryFromDB(data)
  }

  static async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  }

  // Product Code Management
  static async listProductCodes(productId: string): Promise<ProductCode[]> {
    const { data, error } = await supabase
      .from('product_codes')
      .select('*')
      .eq('product_id', productId)
      .order('code_type')
    if (error) throw error
    return data
  }

  static async addProductCode(payload: ProductCodeInsert): Promise<ProductCode> {
    const { data, error } = await supabase
      .from('product_codes')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async removeProductCode(id: string): Promise<void> {
    const { error } = await supabase.from('product_codes').delete().eq('id', id)
    if (error) throw error
  }

  static async findProductByCode(companyId: string, codeValue: string): Promise<Product | null> {
    // First try to find by main barcode
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('barcode', codeValue)
      .single()

    if (!error && data) return transformProductFromDB(data)

    // Then try to find by alternative codes
    const { data: codeData, error: codeError } = await supabase
      .from('product_codes')
      .select('product_id')
      .eq('company_id', companyId)
      .eq('code_value', codeValue)
      .single()

    if (codeError || !codeData) return null

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', codeData.product_id)
      .single()

    if (productError) return null
    return transformProductFromDB(productData)
  }

  // Stock Management
  static async getStockTotal(productId: string): Promise<number> {
    const { data, error } = await supabase
      .from('warehouse_stock')
      .select('balance_qty')
      .eq('product_id', productId)
    if (error) throw error
    return (data || []).reduce((sum, r) => sum + (r.balance_qty || 0), 0)
  }

  static async getStockByWarehouse(productId: string): Promise<Array<{
    warehouse_id: string
    warehouse_name: string
    warehouse_code: string
    balance_qty: number
  }>> {
    const { data, error } = await supabase
      .from('warehouse_stock')
      .select(`
        balance_qty,
        warehouses(id, name, code)
      `)
      .eq('product_id', productId)

    if (error) throw error

    return (data || []).map(stock => ({
      warehouse_id: (stock.warehouses as any)?.id || '',
      warehouse_name: (stock.warehouses as any)?.name || '',
      warehouse_code: (stock.warehouses as any)?.code || '',
      balance_qty: stock.balance_qty || 0
    }))
  }

  static async getStockMovements(companyId: string, filters: StockFilters = {}): Promise<StockMovement[]> {
    let query = supabase
      .from('stock_ledger')
      .select(`
        *,
        products(id, name, sku),
        warehouses(id, name, code)
      `)
      .eq('company_id', companyId)

    if (filters.warehouseId) {
      query = query.eq('warehouse_id', filters.warehouseId)
    }

    if (filters.productId) {
      query = query.eq('product_id', filters.productId)
    }

    if (filters.operationType) {
      query = query.eq('operation_type', filters.operationType)
    }

    if (filters.dateFrom) {
      query = query.gte('movement_date', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('movement_date', filters.dateTo)
    }

    const { data, error } = await query
      .order('movement_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return data || []
  }

  static async getStockAlerts(companyId: string): Promise<StockAlert[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        min_stock,
        warehouse_stock(
          balance_qty,
          warehouses(id, name)
        )
      `)
      .eq('company_id', companyId)
      .eq('active', true)

    if (error) throw error

    const alerts: StockAlert[] = []

    for (const product of data || []) {
      const stockEntries = product.warehouse_stock as any[] || []

      for (const stock of stockEntries) {
        const currentStock = stock.balance_qty || 0
        const minStock = product.min_stock || 0

        if (currentStock === 0) {
          alerts.push({
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            current_stock: currentStock,
            min_stock: minStock,
            warehouse_id: stock.warehouses?.id || '',
            warehouse_name: stock.warehouses?.name || '',
            alert_type: 'out_of_stock'
          })
        } else if (currentStock <= minStock) {
          alerts.push({
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            current_stock: currentStock,
            min_stock: minStock,
            warehouse_id: stock.warehouses?.id || '',
            warehouse_name: stock.warehouses?.name || '',
            alert_type: 'low_stock'
          })
        }
      }
    }

    return alerts
  }

  // Image Management
  static async listImages(productId: string): Promise<ProductImage[]> {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return transformProductImagesFromDB(data || [])
  }

  static async addImage(record: ProductImageInsert): Promise<ProductImage> {
    // If this is set as primary, unset other primary images for the product
    if (record.is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', record.product_id)
    }

    const { data, error } = await supabase
      .from('product_images')
      .insert(record)
      .select('*')
      .single()
    if (error) throw error
    return transformProductImageFromDB(data)
  }

  static async updateImage(id: string, updates: Partial<ProductImageInsert>): Promise<ProductImage> {
    // If setting as primary, unset other primary images for the same product
    if (updates.is_primary) {
      const { data: currentImage } = await supabase
        .from('product_images')
        .select('product_id')
        .eq('id', id)
        .single()

      if (currentImage) {
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', currentImage.product_id)
          .neq('id', id)
      }
    }

    const { data, error } = await supabase
      .from('product_images')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return transformProductImageFromDB(data)
  }

  static async removeImage(imageId: string): Promise<void> {
    const { error } = await supabase.from('product_images').delete().eq('id', imageId)
    if (error) throw error
  }

  static async setPrimaryImage(imageId: string): Promise<void> {
    // Get the product_id for this image
    const { data: image, error: imageError } = await supabase
      .from('product_images')
      .select('product_id')
      .eq('id', imageId)
      .single()

    if (imageError || !image) throw imageError || new Error('Image not found')

    // Unset all primary images for this product
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', image.product_id)

    // Set this image as primary
    const { error } = await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId)

    if (error) throw error
  }
}
