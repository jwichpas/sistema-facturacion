import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import ProductService, {
  type Product,
  type ProductWithDetails,
  type ProductListItem,
  type Brand,
  type Category,
  type ProductFilters,
  type BrandFilters,
  type CategoryFilters,
  type StockFilters,
  type StockMovement,
  type StockAlert,
  type ProductInsert,
  type ProductUpdate,
  type BrandInsert,
  type BrandUpdate,
  type CategoryInsert,
  type CategoryUpdate,
  type ProductCode,
  type ProductImage
} from '@/services/product'
import { useAuthStore } from './auth'
import { supabase } from '@/services/supabase'

// Product store state interface
interface ProductState {
  products: ProductListItem[]
  currentProduct: ProductWithDetails | null
  brands: Brand[]
  categories: Category[]
  stockMovements: StockMovement[]
  stockAlerts: StockAlert[]
  loading: boolean
  error: string | null
  filters: ProductFilters
  brandFilters: BrandFilters
  categoryFilters: CategoryFilters
  stockFilters: StockFilters
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export const useProductStore = defineStore('product', () => {
  // State
  const products = ref<ProductListItem[]>([])
  const currentProduct = ref<ProductWithDetails | null>(null)
  const brands = ref<Brand[]>([])
  const categories = ref<Category[]>([])
  const stockMovements = ref<StockMovement[]>([])
  const stockAlerts = ref<StockAlert[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filters
  const filters = ref<ProductFilters>({
    search: '',
    brandId: null,
    categoryId: null,
    active: true,
    lowStock: false,
    outOfStock: false
  })

  const brandFilters = ref<BrandFilters>({
    search: '',
    active: true
  })

  const categoryFilters = ref<CategoryFilters>({
    search: '',
    parentId: undefined,
    active: true
  })

  const stockFilters = ref<StockFilters>({
    warehouseId: undefined,
    productId: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    operationType: undefined
  })

  // Pagination
  const pagination = ref({
    page: 1,
    limit: 50,
    total: 0
  })

  // Get auth store
  const authStore = useAuthStore()

  // Getters
  const hasProducts = computed(() => products.value.length > 0)
  const hasBrands = computed(() => brands.value.length > 0)
  const hasCategories = computed(() => categories.value.length > 0)
  const hasStockAlerts = computed(() => stockAlerts.value.length > 0)

  const filteredProducts = computed(() => {
    let filtered = [...products.value]

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        (p.barcode && p.barcode.toLowerCase().includes(search))
      )
    }

    return filtered
  })

  const categoriesTree = computed(() => {
    const buildTree = (parentId: string | null = null): Category[] => {
      return categories.value
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }))
    }
    return buildTree()
  })

  const lowStockProducts = computed(() =>
    products.value.filter(p =>
      (p.total_stock || 0) <= (p.min_stock || 0) && (p.total_stock || 0) > 0
    )
  )

  const outOfStockProducts = computed(() =>
    products.value.filter(p => (p.total_stock || 0) === 0)
  )

  // Real-time subscriptions
  let productsSubscription: any = null
  let stockSubscription: any = null

  // Actions
  const loadProducts = async (companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) {
      error.value = 'No company selected'
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await ProductService.listProducts(targetCompanyId, filters.value)
      products.value = data
      pagination.value.total = data.length
    } catch (err) {
      console.error('Error loading products:', err)
      error.value = err instanceof Error ? err.message : 'Error loading products'
    } finally {
      loading.value = false
    }
  }

  const loadProduct = async (id: string, companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) {
      error.value = 'No company selected'
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await ProductService.getProductWithDetails(targetCompanyId, id)
      currentProduct.value = data
    } catch (err) {
      console.error('Error loading product:', err)
      error.value = err instanceof Error ? err.message : 'Error loading product'
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (payload: ProductInsert) => {
    loading.value = true
    error.value = null

    try {
      const newProduct = await ProductService.createProduct(payload)
      await loadProducts() // Refresh the list
      return newProduct
    } catch (err) {
      console.error('Error creating product:', err)
      error.value = err instanceof Error ? err.message : 'Error creating product'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (id: string, payload: ProductUpdate) => {
    loading.value = true
    error.value = null

    try {
      const updatedProduct = await ProductService.updateProduct(id, payload)

      // Update current product if it's the one being edited
      if (currentProduct.value?.id === id) {
        await loadProduct(id)
      }

      // Refresh the list
      await loadProducts()
      return updatedProduct
    } catch (err) {
      console.error('Error updating product:', err)
      error.value = err instanceof Error ? err.message : 'Error updating product'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await ProductService.deleteProduct(id)

      // Clear current product if it's the one being deleted
      if (currentProduct.value?.id === id) {
        currentProduct.value = null
      }

      // Refresh the list
      await loadProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
      error.value = err instanceof Error ? err.message : 'Error deleting product'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Brand management
  const loadBrands = async (companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) return

    try {
      const data = await ProductService.listBrands(targetCompanyId, brandFilters.value)
      brands.value = data
    } catch (err) {
      console.error('Error loading brands:', err)
      error.value = err instanceof Error ? err.message : 'Error loading brands'
    }
  }

  const createBrand = async (payload: BrandInsert) => {
    loading.value = true
    error.value = null

    try {
      const newBrand = await ProductService.createBrand(payload)
      await loadBrands()
      return newBrand
    } catch (err) {
      console.error('Error creating brand:', err)
      error.value = err instanceof Error ? err.message : 'Error creating brand'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateBrand = async (id: string, payload: BrandUpdate) => {
    loading.value = true
    error.value = null

    try {
      const updatedBrand = await ProductService.updateBrand(id, payload)
      await loadBrands()
      return updatedBrand
    } catch (err) {
      console.error('Error updating brand:', err)
      error.value = err instanceof Error ? err.message : 'Error updating brand'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteBrand = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await ProductService.deleteBrand(id)
      await loadBrands()
    } catch (err) {
      console.error('Error deleting brand:', err)
      error.value = err instanceof Error ? err.message : 'Error deleting brand'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Category management
  const loadCategories = async (companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) return

    try {
      const data = await ProductService.listCategories(targetCompanyId, categoryFilters.value)
      categories.value = data
    } catch (err) {
      console.error('Error loading categories:', err)
      error.value = err instanceof Error ? err.message : 'Error loading categories'
    }
  }

  const createCategory = async (payload: CategoryInsert) => {
    loading.value = true
    error.value = null

    try {
      const newCategory = await ProductService.createCategory(payload)
      await loadCategories()
      return newCategory
    } catch (err) {
      console.error('Error creating category:', err)
      error.value = err instanceof Error ? err.message : 'Error creating category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCategory = async (id: string, payload: CategoryUpdate) => {
    loading.value = true
    error.value = null

    try {
      const updatedCategory = await ProductService.updateCategory(id, payload)
      await loadCategories()
      return updatedCategory
    } catch (err) {
      console.error('Error updating category:', err)
      error.value = err instanceof Error ? err.message : 'Error updating category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCategory = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await ProductService.deleteCategory(id)
      await loadCategories()
    } catch (err) {
      console.error('Error deleting category:', err)
      error.value = err instanceof Error ? err.message : 'Error deleting category'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Stock management
  const loadStockMovements = async (companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) return

    try {
      const data = await ProductService.getStockMovements(targetCompanyId, stockFilters.value)
      stockMovements.value = data
    } catch (err) {
      console.error('Error loading stock movements:', err)
      error.value = err instanceof Error ? err.message : 'Error loading stock movements'
    }
  }

  const loadStockAlerts = async (companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) return

    try {
      const data = await ProductService.getStockAlerts(targetCompanyId)
      stockAlerts.value = data
    } catch (err) {
      console.error('Error loading stock alerts:', err)
      error.value = err instanceof Error ? err.message : 'Error loading stock alerts'
    }
  }

  // Product code management
  const addProductCode = async (productId: string, codeType: string, codeValue: string) => {
    const companyId = authStore.currentCompany?.id
    if (!companyId) throw new Error('No company selected')

    try {
      const newCode = await ProductService.addProductCode({
        company_id: companyId,
        product_id: productId,
        code_type: codeType,
        code_value: codeValue
      })

      // Refresh current product if it's loaded
      if (currentProduct.value?.id === productId) {
        await loadProduct(productId)
      }

      return newCode
    } catch (err) {
      console.error('Error adding product code:', err)
      throw err
    }
  }

  const removeProductCode = async (codeId: string) => {
    try {
      await ProductService.removeProductCode(codeId)

      // Refresh current product if it's loaded
      if (currentProduct.value) {
        await loadProduct(currentProduct.value.id)
      }
    } catch (err) {
      console.error('Error removing product code:', err)
      throw err
    }
  }

  const findProductByCode = async (codeValue: string, companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) return null

    try {
      return await ProductService.findProductByCode(targetCompanyId, codeValue)
    } catch (err) {
      console.error('Error finding product by code:', err)
      return null
    }
  }

  // Image management
  const addProductImage = async (productId: string, storagePath: string, isPrimary = false) => {
    const companyId = authStore.currentCompany?.id
    if (!companyId) throw new Error('No company selected')

    try {
      const newImage = await ProductService.addImage({
        company_id: companyId,
        product_id: productId,
        storage_path: storagePath,
        is_primary: isPrimary
      })

      // Refresh current product if it's loaded
      if (currentProduct.value?.id === productId) {
        await loadProduct(productId)
      }

      return newImage
    } catch (err) {
      console.error('Error adding product image:', err)
      throw err
    }
  }

  const removeProductImage = async (imageId: string) => {
    try {
      await ProductService.removeImage(imageId)

      // Refresh current product if it's loaded
      if (currentProduct.value) {
        await loadProduct(currentProduct.value.id)
      }
    } catch (err) {
      console.error('Error removing product image:', err)
      throw err
    }
  }

  const setPrimaryImage = async (imageId: string) => {
    try {
      await ProductService.setPrimaryImage(imageId)

      // Refresh current product if it's loaded
      if (currentProduct.value) {
        await loadProduct(currentProduct.value.id)
      }
    } catch (err) {
      console.error('Error setting primary image:', err)
      throw err
    }
  }

  // Filter management
  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const updateBrandFilters = (newFilters: Partial<BrandFilters>) => {
    brandFilters.value = { ...brandFilters.value, ...newFilters }
  }

  const updateCategoryFilters = (newFilters: Partial<CategoryFilters>) => {
    categoryFilters.value = { ...categoryFilters.value, ...newFilters }
  }

  const updateStockFilters = (newFilters: Partial<StockFilters>) => {
    stockFilters.value = { ...stockFilters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      search: '',
      brandId: null,
      categoryId: null,
      active: true,
      lowStock: false,
      outOfStock: false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Real-time subscriptions
  const setupRealtimeSubscriptions = (companyId: string) => {
    // Subscribe to product changes
    productsSubscription = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          loadProducts(companyId)
        }
      )
      .subscribe()

    // Subscribe to stock changes
    stockSubscription = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'warehouse_stock'
        },
        () => {
          loadProducts(companyId)
          loadStockAlerts(companyId)
        }
      )
      .subscribe()
  }

  const teardownRealtimeSubscriptions = () => {
    if (productsSubscription) {
      supabase.removeChannel(productsSubscription)
      productsSubscription = null
    }
    if (stockSubscription) {
      supabase.removeChannel(stockSubscription)
      stockSubscription = null
    }
  }

  // Initialize data when company changes
  const initializeProductData = async (companyId: string) => {
    await Promise.all([
      loadProducts(companyId),
      loadBrands(companyId),
      loadCategories(companyId),
      loadStockAlerts(companyId)
    ])

    setupRealtimeSubscriptions(companyId)
  }

  // Watch for company changes
  watch(
    () => authStore.currentCompany?.id,
    async (newCompanyId, oldCompanyId) => {
      if (oldCompanyId) {
        teardownRealtimeSubscriptions()
      }

      if (newCompanyId) {
        await initializeProductData(newCompanyId)
      } else {
        // Clear data when no company is selected
        products.value = []
        currentProduct.value = null
        brands.value = []
        categories.value = []
        stockMovements.value = []
        stockAlerts.value = []
      }
    },
    { immediate: true }
  )

  // Watch for filter changes to reload products
  watch(
    filters,
    () => {
      if (authStore.currentCompany?.id) {
        loadProducts()
      }
    },
    { deep: true }
  )

  return {
    // State
    products: readonly(products),
    currentProduct: readonly(currentProduct),
    brands: readonly(brands),
    categories: readonly(categories),
    stockMovements: readonly(stockMovements),
    stockAlerts: readonly(stockAlerts),
    loading: readonly(loading),
    error: readonly(error),
    filters: readonly(filters),
    brandFilters: readonly(brandFilters),
    categoryFilters: readonly(categoryFilters),
    stockFilters: readonly(stockFilters),
    pagination: readonly(pagination),

    // Getters
    hasProducts,
    hasBrands,
    hasCategories,
    hasStockAlerts,
    filteredProducts,
    categoriesTree,
    lowStockProducts,
    outOfStockProducts,

    // Actions
    loadProducts,
    loadProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    loadBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    loadStockMovements,
    loadStockAlerts,
    addProductCode,
    removeProductCode,
    findProductByCode,
    addProductImage,
    removeProductImage,
    setPrimaryImage,
    updateFilters,
    updateBrandFilters,
    updateCategoryFilters,
    updateStockFilters,
    clearFilters,
    clearError,
    initializeProductData
  }
})

// Helper function for readonly refs
function readonly<T>(ref: T): T {
  return ref
}
