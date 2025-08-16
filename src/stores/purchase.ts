import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import PurchaseService, {
  type PurchaseDoc,
  type PurchaseDocWithDetails,
  type PurchaseDocListItem,
  type PurchaseDocFilters,
  type PurchaseDocCreatePayload,
  type PurchaseDocUpdatePayload,
  type PurchaseTaxCalculation,
  type PurchaseDocItemCalculation
} from '@/services/purchase'
import { useAuthStore } from './auth'
import { supabase } from '@/services/supabase'

// Purchase store state interface
interface PurchaseState {
  purchaseDocs: PurchaseDocListItem[]
  currentPurchaseDoc: PurchaseDocWithDetails | null
  loading: boolean
  error: string | null
  filters: PurchaseDocFilters
  pagination: {
    page: number
    limit: number
    total: number
  }
  analytics: {
    totalPurchases: number
    totalDocuments: number
    averageTicket: number
    purchasesByDocType: Array<{ doc_type: string; count: number; total: number }>
    purchasesByDay: Array<{ date: string; total: number; count: number }>
  } | null
}

export const usePurchaseStore = defineStore('purchase', () => {
  // State
  const purchaseDocs = ref<PurchaseDocListItem[]>([])
  const currentPurchaseDoc = ref<PurchaseDocWithDetails | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<PurchaseDocFilters>({})
  const pagination = ref({
    page: 1,
    limit: 50,
    total: 0
  })
  const analytics = ref<PurchaseState['analytics']>(null)

  // Auth store
  const authStore = useAuthStore()

  // Computed
  const currentCompanyId = computed(() => authStore.currentCompany?.id)
  const hasError = computed(() => !!error.value)
  const isEmpty = computed(() => purchaseDocs.value.length === 0)
  const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit))

  // Filtered purchase documents
  const filteredPurchaseDocs = computed(() => {
    let filtered = [...purchaseDocs.value]

    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.series.toLowerCase().includes(searchTerm) ||
        doc.number.toString().includes(searchTerm) ||
        doc.supplier_name?.toLowerCase().includes(searchTerm)
      )
    }

    return filtered
  })

  // Actions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setFilters = (newFilters: Partial<PurchaseDocFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {}
  }

  const setPagination = (page: number, limit?: number) => {
    pagination.value.page = page
    if (limit) pagination.value.limit = limit
  }

  // Load purchase documents
  const loadPurchaseDocs = async (refresh = false) => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return
    }

    if (refresh) {
      purchaseDocs.value = []
      pagination.value.page = 1
    }

    setLoading(true)
    clearError()

    try {
      const data = await PurchaseService.listPurchaseDocs(currentCompanyId.value, filters.value)
      purchaseDocs.value = data
      pagination.value.total = data.length
    } catch (err) {
      console.error('Error loading purchase documents:', err)
      setError(err instanceof Error ? err.message : 'Failed to load purchase documents')
    } finally {
      setLoading(false)
    }
  }

  // Load single purchase document with details
  const loadPurchaseDoc = async (id: string) => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return null
    }

    setLoading(true)
    clearError()

    try {
      const data = await PurchaseService.getPurchaseDocWithDetails(currentCompanyId.value, id)
      currentPurchaseDoc.value = data
      return data
    } catch (err) {
      console.error('Error loading purchase document:', err)
      setError(err instanceof Error ? err.message : 'Failed to load purchase document')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Create purchase document
  const createPurchaseDoc = async (payload: PurchaseDocCreatePayload): Promise<PurchaseDoc | null> => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return null
    }

    setLoading(true)
    clearError()

    try {
      const data = await PurchaseService.createPurchaseDoc({
        ...payload,
        doc: {
          ...payload.doc,
          company_id: currentCompanyId.value
        }
      })

      // Refresh the list
      await loadPurchaseDocs()

      return data
    } catch (err) {
      console.error('Error creating purchase document:', err)
      setError(err instanceof Error ? err.message : 'Failed to create purchase document')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Update purchase document
  const updatePurchaseDoc = async (id: string, payload: PurchaseDocUpdatePayload): Promise<PurchaseDoc | null> => {
    setLoading(true)
    clearError()

    try {
      const data = await PurchaseService.updatePurchaseDoc(id, payload)

      // Update current document if it's the one being edited
      if (currentPurchaseDoc.value?.id === id) {
        await loadPurchaseDoc(id)
      }

      // Refresh the list
      await loadPurchaseDocs()

      return data
    } catch (err) {
      console.error('Error updating purchase document:', err)
      setError(err instanceof Error ? err.message : 'Failed to update purchase document')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Delete purchase document
  const deletePurchaseDoc = async (id: string): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      await PurchaseService.deletePurchaseDoc(id)

      // Remove from local state
      purchaseDocs.value = purchaseDocs.value.filter(doc => doc.id !== id)

      // Clear current document if it was deleted
      if (currentPurchaseDoc.value?.id === id) {
        currentPurchaseDoc.value = null
      }

      return true
    } catch (err) {
      console.error('Error deleting purchase document:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete purchase document')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Get next document number
  const getNextDocumentNumber = async (docType: string, series: string): Promise<number | null> => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return null
    }

    try {
      return await PurchaseService.getNextDocumentNumber(currentCompanyId.value, docType, series)
    } catch (err) {
      console.error('Error getting next document number:', err)
      setError(err instanceof Error ? err.message : 'Failed to get next document number')
      return null
    }
  }

  // Tax calculation helpers
  const calculateItemTax = (item: {
    quantity: number
    unit_cost: number
    discount_pct?: number
    igv_affectation?: string
  }): PurchaseDocItemCalculation => {
    return PurchaseService.calculateItemTax(item)
  }

  const calculateDocumentTotals = (items: PurchaseDocItemCalculation[]): PurchaseTaxCalculation => {
    return PurchaseService.calculateDocumentTotals(items)
  }

  // Inventory integration
  const updateInventoryOnReceipt = async (purchaseDocId: string, warehouseId: string): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      await PurchaseService.updateInventoryOnReceipt(purchaseDocId, warehouseId)

      // Update the document status or add a flag to indicate inventory was updated
      const docIndex = purchaseDocs.value.findIndex(doc => doc.id === purchaseDocId)
      if (docIndex !== -1) {
        // You could add a custom field to track inventory update status
        // purchaseDocs.value[docIndex].inventory_updated = true
      }

      return true
    } catch (err) {
      console.error('Error updating inventory on receipt:', err)
      setError(err instanceof Error ? err.message : 'Failed to update inventory')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Load purchase analytics
  const loadPurchaseAnalytics = async (dateFrom: string, dateTo: string) => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return
    }

    setLoading(true)
    clearError()

    try {
      const data = await PurchaseService.getPurchaseAnalytics(currentCompanyId.value, dateFrom, dateTo)
      analytics.value = data
    } catch (err) {
      console.error('Error loading purchase analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load purchase analytics')
    } finally {
      setLoading(false)
    }
  }

  // Get top suppliers
  const getTopSuppliers = async (dateFrom: string, dateTo: string, limit = 10) => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return []
    }

    try {
      return await PurchaseService.getTopSuppliers(currentCompanyId.value, dateFrom, dateTo, limit)
    } catch (err) {
      console.error('Error getting top suppliers:', err)
      setError(err instanceof Error ? err.message : 'Failed to get top suppliers')
      return []
    }
  }

  // Supplier-specific operations
  const getPurchasesBySupplier = async (supplierId: string, dateFrom?: string, dateTo?: string) => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return []
    }

    try {
      return await PurchaseService.getPurchasesBySupplier(currentCompanyId.value, supplierId, dateFrom, dateTo)
    } catch (err) {
      console.error('Error getting purchases by supplier:', err)
      setError(err instanceof Error ? err.message : 'Failed to get supplier purchases')
      return []
    }
  }

  const getSupplierPurchaseSummary = async (supplierId: string) => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return null
    }

    try {
      return await PurchaseService.getSupplierPurchaseSummary(currentCompanyId.value, supplierId)
    } catch (err) {
      console.error('Error getting supplier purchase summary:', err)
      setError(err instanceof Error ? err.message : 'Failed to get supplier summary')
      return null
    }
  }

  // Clear current document
  const clearCurrentPurchaseDoc = () => {
    currentPurchaseDoc.value = null
  }

  // Reset store
  const reset = () => {
    purchaseDocs.value = []
    currentPurchaseDoc.value = null
    loading.value = false
    error.value = null
    filters.value = {}
    pagination.value = { page: 1, limit: 50, total: 0 }
    analytics.value = null
  }

  // Watch for company changes
  watch(currentCompanyId, (newCompanyId) => {
    if (newCompanyId) {
      reset()
      loadPurchaseDocs()
    }
  })

  // Real-time subscriptions
  const setupRealtimeSubscription = () => {
    if (!currentCompanyId.value) return

    const subscription = supabase
      .channel('purchase_docs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_docs',
          filter: `company_id=eq.${currentCompanyId.value}`
        },
        (payload) => {
          console.log('Purchase document change:', payload)
          // Refresh data on changes
          loadPurchaseDocs()
        }
      )
      .subscribe()

    return subscription
  }

  return {
    // State
    purchaseDocs,
    currentPurchaseDoc,
    loading,
    error,
    filters,
    pagination,
    analytics,

    // Computed
    currentCompanyId,
    hasError,
    isEmpty,
    totalPages,
    filteredPurchaseDocs,

    // Actions
    setError,
    clearError,
    setLoading,
    setFilters,
    clearFilters,
    setPagination,
    loadPurchaseDocs,
    loadPurchaseDoc,
    createPurchaseDoc,
    updatePurchaseDoc,
    deletePurchaseDoc,
    getNextDocumentNumber,
    calculateItemTax,
    calculateDocumentTotals,
    updateInventoryOnReceipt,
    loadPurchaseAnalytics,
    getTopSuppliers,
    getPurchasesBySupplier,
    getSupplierPurchaseSummary,
    clearCurrentPurchaseDoc,
    reset,
    setupRealtimeSubscription
  }
})
