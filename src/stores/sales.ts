import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import SalesService, {
  type SalesDoc,
  type SalesDocWithDetails,
  type SalesDocListItem,
  type SalesDocFilters,
  type SalesDocCreatePayload,
  type SalesDocUpdatePayload,
  type TaxCalculation,
  type SalesDocItemCalculation
} from '@/services/sales'
import { useAuthStore } from './auth'
import { supabase } from '@/services/supabase'

// Sales store state interface
interface SalesState {
  salesDocs: SalesDocListItem[]
  currentSalesDoc: SalesDocWithDetails | null
  loading: boolean
  error: string | null
  filters: SalesDocFilters
  pagination: {
    page: number
    limit: number
    total: number
  }
  analytics: {
    totalSales: number
    totalDocuments: number
    averageTicket: number
    salesByDocType: Array<{ doc_type: string; count: number; total: number }>
    salesByDay: Array<{ date: string; total: number; count: number }>
  } | null
}

export const useSalesStore = defineStore('sales', () => {
  // State
  const salesDocs = ref<SalesDocListItem[]>([])
  const currentSalesDoc = ref<SalesDocWithDetails | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<SalesDocFilters>({})
  const pagination = ref({
    page: 1,
    limit: 50,
    total: 0
  })
  const analytics = ref<SalesState['analytics']>(null)

  // Auth store
  const authStore = useAuthStore()

  // Computed
  const currentCompanyId = computed(() => authStore.currentCompany?.id)
  const hasError = computed(() => !!error.value)
  const isEmpty = computed(() => salesDocs.value.length === 0)
  const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit))

  // Filtered sales documents
  const filteredSalesDocs = computed(() => {
    let filtered = [...salesDocs.value]

    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.series.toLowerCase().includes(searchTerm) ||
        doc.number.toString().includes(searchTerm) ||
        doc.customer_name?.toLowerCase().includes(searchTerm) ||
        doc.notes?.toLowerCase().includes(searchTerm)
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

  const setFilters = (newFilters: Partial<SalesDocFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {}
  }

  const setPagination = (page: number, limit?: number) => {
    pagination.value.page = page
    if (limit) pagination.value.limit = limit
  }

  // Load sales documents
  const loadSalesDocs = async (refresh = false) => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return
    }

    if (refresh) {
      salesDocs.value = []
      pagination.value.page = 1
    }

    setLoading(true)
    clearError()

    try {
      const data = await SalesService.listSalesDocs(currentCompanyId.value, filters.value)
      salesDocs.value = data
      pagination.value.total = data.length
    } catch (err) {
      console.error('Error loading sales documents:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sales documents')
    } finally {
      setLoading(false)
    }
  }

  // Load single sales document with details
  const loadSalesDoc = async (id: string) => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return null
    }

    setLoading(true)
    clearError()

    try {
      const data = await SalesService.getSalesDocWithDetails(currentCompanyId.value, id)
      currentSalesDoc.value = data
      return data
    } catch (err) {
      console.error('Error loading sales document:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sales document')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Create sales document
  const createSalesDoc = async (payload: SalesDocCreatePayload): Promise<SalesDoc | null> => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return null
    }

    setLoading(true)
    clearError()

    try {
      const data = await SalesService.createSalesDoc({
        ...payload,
        doc: {
          ...payload.doc,
          company_id: currentCompanyId.value
        }
      })

      // Refresh the list
      await loadSalesDocs()

      return data
    } catch (err) {
      console.error('Error creating sales document:', err)
      setError(err instanceof Error ? err.message : 'Failed to create sales document')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Update sales document
  const updateSalesDoc = async (id: string, payload: SalesDocUpdatePayload): Promise<SalesDoc | null> => {
    setLoading(true)
    clearError()

    try {
      const data = await SalesService.updateSalesDoc(id, payload)

      // Update current document if it's the one being edited
      if (currentSalesDoc.value?.id === id) {
        await loadSalesDoc(id)
      }

      // Refresh the list
      await loadSalesDocs()

      return data
    } catch (err) {
      console.error('Error updating sales document:', err)
      setError(err instanceof Error ? err.message : 'Failed to update sales document')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Delete sales document
  const deleteSalesDoc = async (id: string): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      await SalesService.deleteSalesDoc(id)

      // Remove from local state
      salesDocs.value = salesDocs.value.filter(doc => doc.id !== id)

      // Clear current document if it was deleted
      if (currentSalesDoc.value?.id === id) {
        currentSalesDoc.value = null
      }

      return true
    } catch (err) {
      console.error('Error deleting sales document:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete sales document')
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
      return await SalesService.getNextDocumentNumber(currentCompanyId.value, docType, series)
    } catch (err) {
      console.error('Error getting next document number:', err)
      setError(err instanceof Error ? err.message : 'Failed to get next document number')
      return null
    }
  }

  // Tax calculation helpers
  const calculateItemTax = (item: {
    quantity: number
    unit_price: number
    discount_pct?: number
    igv_affectation?: string
  }): SalesDocItemCalculation => {
    return SalesService.calculateItemTax(item)
  }

  const calculateDocumentTotals = (items: SalesDocItemCalculation[]): TaxCalculation => {
    return SalesService.calculateDocumentTotals(items)
  }

  // Update electronic invoicing status
  const updateElectronicInvoicingStatus = async (
    id: string,
    status: string,
    ticket?: string,
    xml?: Uint8Array,
    cdr?: Uint8Array,
    hash?: string
  ): Promise<boolean> => {
    try {
      await SalesService.updateElectronicInvoicingStatus(id, status, ticket, xml, cdr, hash)

      // Update local state
      const docIndex = salesDocs.value.findIndex(doc => doc.id === id)
      if (docIndex !== -1) {
        salesDocs.value[docIndex].greenter_status = status
        if (ticket) salesDocs.value[docIndex].greenter_ticket = ticket
        if (hash) salesDocs.value[docIndex].greenter_hash = hash
      }

      // Update current document if it's the one being updated
      if (currentSalesDoc.value?.id === id) {
        currentSalesDoc.value.greenter_status = status
        if (ticket) currentSalesDoc.value.greenter_ticket = ticket
        if (hash) currentSalesDoc.value.greenter_hash = hash
      }

      return true
    } catch (err) {
      console.error('Error updating electronic invoicing status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update electronic invoicing status')
      return false
    }
  }

  // Load sales analytics
  const loadSalesAnalytics = async (dateFrom: string, dateTo: string) => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return
    }

    setLoading(true)
    clearError()

    try {
      const data = await SalesService.getSalesAnalytics(currentCompanyId.value, dateFrom, dateTo)
      analytics.value = data
    } catch (err) {
      console.error('Error loading sales analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sales analytics')
    } finally {
      setLoading(false)
    }
  }

  // Get top customers
  const getTopCustomers = async (dateFrom: string, dateTo: string, limit = 10) => {
    if (!currentCompanyId.value) {
      setError('No company selected')
      return []
    }

    try {
      return await SalesService.getTopCustomers(currentCompanyId.value, dateFrom, dateTo, limit)
    } catch (err) {
      console.error('Error getting top customers:', err)
      setError(err instanceof Error ? err.message : 'Failed to get top customers')
      return []
    }
  }

  // Clear current document
  const clearCurrentSalesDoc = () => {
    currentSalesDoc.value = null
  }

  // Reset store
  const reset = () => {
    salesDocs.value = []
    currentSalesDoc.value = null
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
      loadSalesDocs()
    }
  })

  // Real-time subscriptions
  const setupRealtimeSubscription = () => {
    if (!currentCompanyId.value) return

    const subscription = supabase
      .channel('sales_docs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_docs',
          filter: `company_id=eq.${currentCompanyId.value}`
        },
        (payload) => {
          console.log('Sales document change:', payload)
          // Refresh data on changes
          loadSalesDocs()
        }
      )
      .subscribe()

    return subscription
  }

  return {
    // State
    salesDocs,
    currentSalesDoc,
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
    filteredSalesDocs,

    // Actions
    setError,
    clearError,
    setLoading,
    setFilters,
    clearFilters,
    setPagination,
    loadSalesDocs,
    loadSalesDoc,
    createSalesDoc,
    updateSalesDoc,
    deleteSalesDoc,
    getNextDocumentNumber,
    calculateItemTax,
    calculateDocumentTotals,
    updateElectronicInvoicingStatus,
    loadSalesAnalytics,
    getTopCustomers,
    clearCurrentSalesDoc,
    reset,
    setupRealtimeSubscription
  }
})
