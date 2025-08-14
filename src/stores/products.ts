import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import ProductService, { type ProductListItem, type ProductInsert, type ProductUpdate, type Brand, type Category } from '@/services/product'
import { useAuthStore } from '@/stores/auth'

export interface ProductFiltersState {
  search: string
  brandId: string | null
  categoryId: string | null
  active: boolean | null
}

export const useProductsStore = defineStore('products', () => {
  const auth = useAuthStore()

  const items = ref<ProductListItem[]>([])
  const brands = ref<Brand[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const filters = ref<ProductFiltersState>({ search: '', brandId: null, categoryId: null, active: true })

  const hasCompany = computed(() => !!auth.currentCompany)
  const companyId = computed(() => auth.currentCompany?.id || '')

  const filteredItems = computed(() => items.value)

  const loadAux = async () => {
    if (!hasCompany.value) return
    const [b, c] = await Promise.all([
      ProductService.listBrands(companyId.value),
      ProductService.listCategories(companyId.value),
    ])
    brands.value = b
    categories.value = c
  }

  const list = async () => {
    if (!hasCompany.value) return
    loading.value = true
    error.value = null
    try {
      items.value = await ProductService.listProducts(companyId.value, filters.value)
    } catch (e: any) {
      error.value = e.message || 'Error al listar productos'
    } finally {
      loading.value = false
    }
  }

  const create = async (payload: Omit<ProductInsert, 'company_id'>) => {
    if (!hasCompany.value) throw new Error('No company selected')
    const created = await ProductService.createProduct({ ...payload, company_id: companyId.value })
    await list()
    return created
  }

  const update = async (id: string, payload: ProductUpdate) => {
    const updated = await ProductService.updateProduct(id, payload)
    await list()
    return updated
  }

  const remove = async (id: string) => {
    await ProductService.deleteProduct(id)
    await list()
  }

  return {
    items,
    brands,
    categories,
    filters,
    loading,
    error,

    filteredItems,

    loadAux,
    list,
    create,
    update,
    remove,
  }
})
