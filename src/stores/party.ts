import { ref, computed, watch, readonly } from 'vue'
import { defineStore } from 'pinia'
import PartyService, {
  type Party,
  type PartyInsert,
  type PartyUpdate,
  type PartyContactInsert,
  type PartyContactUpdate
} from '@/services/party'
import type {
  PartyWithDetails,
  PartyFilters,
  PartyContact,
  DocumentType,
  PartyTransactionSummary
} from '@/types'
import { useAuthStore } from './auth'
import { supabase } from '@/services/supabase'

// Party store state interface
interface PartyState {
  parties: Party[]
  customers: Party[]
  suppliers: Party[]
  currentParty: PartyWithDetails | null
  contacts: PartyContact[]
  documentTypes: DocumentType[]
  loading: boolean
  error: string | null
  filters: PartyFilters
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export const usePartyStore = defineStore('party', () => {
  // State
  const parties = ref<Party[]>([])
  const customers = ref<Party[]>([])
  const suppliers = ref<Party[]>([])
  const currentParty = ref<PartyWithDetails | null>(null)
  const contacts = ref<PartyContact[]>([])
  const documentTypes = ref<DocumentType[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filters
  const filters = ref<PartyFilters>({
    search: '',
    docType: undefined,
    isCustomer: undefined,
    isSupplier: undefined,
    active: true
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
  const hasParties = computed(() => parties.value.length > 0)
  const hasCustomers = computed(() => customers.value.length > 0)
  const hasSuppliers = computed(() => suppliers.value.length > 0)
  const hasContacts = computed(() => contacts.value.length > 0)

  const filteredParties = computed(() => {
    let filtered = [...parties.value]

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(p =>
        (p.fullname && p.fullname.toLowerCase().includes(search)) ||
        p.doc_number.toLowerCase().includes(search) ||
        (p.email && p.email.toLowerCase().includes(search)) ||
        (p.razon_social && p.razon_social.toLowerCase().includes(search))
      )
    }

    if (filters.value.docType) {
      filtered = filtered.filter(p => p.doc_type === filters.value.docType)
    }

    if (filters.value.isCustomer !== undefined) {
      filtered = filtered.filter(p => p.is_customer === filters.value.isCustomer)
    }

    if (filters.value.isSupplier !== undefined) {
      filtered = filtered.filter(p => p.is_supplier === filters.value.isSupplier)
    }

    return filtered
  })

  const customersOnly = computed(() =>
    parties.value.filter(p => p.is_customer)
  )

  const suppliersOnly = computed(() =>
    parties.value.filter(p => p.is_supplier)
  )

  // Real-time subscriptions
  let partiesSubscription: any = null
  let contactsSubscription: any = null

  // Actions
  const loadDocumentTypes = () => {
    documentTypes.value = PartyService.getDocumentTypes()
  }

  const validateDocument = (docType: string, docNumber: string) => {
    return PartyService.validateDocumentNumber(docType, docNumber)
  }

  const computeFullname = (party: Partial<Party>) => {
    return PartyService.computeFullname(party)
  }

  const loadParties = async (companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) {
      error.value = 'No company selected'
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await PartyService.listParties(targetCompanyId, filters.value)
      parties.value = data
      pagination.value.total = data.length
    } catch (err) {
      console.error('Error loading parties:', err)
      error.value = err instanceof Error ? err.message : 'Error loading parties'
    } finally {
      loading.value = false
    }
  }

  const loadCustomers = async (companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) return

    try {
      const data = await PartyService.getCustomers(targetCompanyId, {
        search: filters.value.search,
        docType: filters.value.docType
      })
      customers.value = data
    } catch (err) {
      console.error('Error loading customers:', err)
      error.value = err instanceof Error ? err.message : 'Error loading customers'
    }
  }

  const loadSuppliers = async (companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) return

    try {
      const data = await PartyService.getSuppliers(targetCompanyId, {
        search: filters.value.search,
        docType: filters.value.docType
      })
      suppliers.value = data
    } catch (err) {
      console.error('Error loading suppliers:', err)
      error.value = err instanceof Error ? err.message : 'Error loading suppliers'
    }
  }

  const loadParty = async (id: string, companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) {
      error.value = 'No company selected'
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await PartyService.getPartyWithDetails(targetCompanyId, id)
      currentParty.value = data

      if (data?.contacts) {
        contacts.value = data.contacts
      }
    } catch (err) {
      console.error('Error loading party:', err)
      error.value = err instanceof Error ? err.message : 'Error loading party'
    } finally {
      loading.value = false
    }
  }

  const createParty = async (payload: Omit<PartyInsert, 'fullname'>) => {
    loading.value = true
    error.value = null

    try {
      const newParty = await PartyService.createParty(payload)
      await loadParties() // Refresh the list
      return newParty
    } catch (err) {
      console.error('Error creating party:', err)
      error.value = err instanceof Error ? err.message : 'Error creating party'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateParty = async (id: string, payload: Omit<PartyUpdate, 'fullname'>) => {
    loading.value = true
    error.value = null

    try {
      const updatedParty = await PartyService.updateParty(id, payload)

      // Update current party if it's the one being edited
      if (currentParty.value?.id === id) {
        await loadParty(id)
      }

      // Refresh the list
      await loadParties()
      return updatedParty
    } catch (err) {
      console.error('Error updating party:', err)
      error.value = err instanceof Error ? err.message : 'Error updating party'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteParty = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await PartyService.deleteParty(id)

      // Clear current party if it's the one being deleted
      if (currentParty.value?.id === id) {
        currentParty.value = null
      }

      // Refresh the list
      await loadParties()
    } catch (err) {
      console.error('Error deleting party:', err)
      error.value = err instanceof Error ? err.message : 'Error deleting party'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Contact management
  const loadContacts = async (partyId: string) => {
    try {
      const data = await PartyService.listContacts(partyId)
      contacts.value = data
    } catch (err) {
      console.error('Error loading contacts:', err)
      error.value = err instanceof Error ? err.message : 'Error loading contacts'
    }
  }

  const createContact = async (payload: PartyContactInsert) => {
    loading.value = true
    error.value = null

    try {
      const newContact = await PartyService.createContact(payload)

      // Refresh contacts for the party
      await loadContacts(payload.party_id)

      // Update current party if it's loaded
      if (currentParty.value?.id === payload.party_id) {
        await loadParty(payload.party_id)
      }

      return newContact
    } catch (err) {
      console.error('Error creating contact:', err)
      error.value = err instanceof Error ? err.message : 'Error creating contact'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateContact = async (id: string, payload: PartyContactUpdate) => {
    loading.value = true
    error.value = null

    try {
      const updatedContact = await PartyService.updateContact(id, payload)

      // Find the contact to get party_id
      const contact = contacts.value.find(c => c.id === id)
      if (contact) {
        await loadContacts(contact.party_id)

        // Update current party if it's loaded
        if (currentParty.value?.id === contact.party_id) {
          await loadParty(contact.party_id)
        }
      }

      return updatedContact
    } catch (err) {
      console.error('Error updating contact:', err)
      error.value = err instanceof Error ? err.message : 'Error updating contact'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteContact = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      // Find the contact to get party_id before deletion
      const contact = contacts.value.find(c => c.id === id)

      await PartyService.deleteContact(id)

      if (contact) {
        await loadContacts(contact.party_id)

        // Update current party if it's loaded
        if (currentParty.value?.id === contact.party_id) {
          await loadParty(contact.party_id)
        }
      }
    } catch (err) {
      console.error('Error deleting contact:', err)
      error.value = err instanceof Error ? err.message : 'Error deleting contact'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Search and lookup utilities
  const searchParties = async (query: string, type?: 'customer' | 'supplier', companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) return []

    try {
      return await PartyService.searchParties(targetCompanyId, query, type)
    } catch (err) {
      console.error('Error searching parties:', err)
      return []
    }
  }

  const findPartyByDocument = async (docType: string, docNumber: string, companyId?: string) => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) return null

    try {
      return await PartyService.findPartyByDocument(targetCompanyId, docType, docNumber)
    } catch (err) {
      console.error('Error finding party by document:', err)
      return null
    }
  }

  const getPartyTransactionSummary = async (partyId: string, companyId?: string): Promise<PartyTransactionSummary | null> => {
    const targetCompanyId = companyId || authStore.currentCompany?.id
    if (!targetCompanyId) return null

    try {
      return await PartyService.getPartyTransactionSummary(targetCompanyId, partyId)
    } catch (err) {
      console.error('Error getting party transaction summary:', err)
      return null
    }
  }

  // Filter management
  const updateFilters = (newFilters: Partial<PartyFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      search: '',
      docType: undefined,
      isCustomer: undefined,
      isSupplier: undefined,
      active: true
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Real-time subscriptions
  const setupRealtimeSubscriptions = (companyId: string) => {
    // Subscribe to party changes
    partiesSubscription = supabase
      .channel('parties-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parties',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          loadParties(companyId)
        }
      )
      .subscribe()

    // Subscribe to contact changes
    contactsSubscription = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'party_contacts',
          filter: `company_id=eq.${companyId}`
        },
        (payload: any) => {
          // Reload contacts if current party is affected
          if (currentParty.value && payload.new?.party_id === currentParty.value.id) {
            loadContacts(currentParty.value.id)
          }
        }
      )
      .subscribe()
  }

  const teardownRealtimeSubscriptions = () => {
    if (partiesSubscription) {
      supabase.removeChannel(partiesSubscription)
      partiesSubscription = null
    }
    if (contactsSubscription) {
      supabase.removeChannel(contactsSubscription)
      contactsSubscription = null
    }
  }

  // Initialize data when company changes
  const initializePartyData = async (companyId: string) => {
    loadDocumentTypes()

    await Promise.all([
      loadParties(companyId),
      loadCustomers(companyId),
      loadSuppliers(companyId)
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
        await initializePartyData(newCompanyId)
      } else {
        // Clear data when no company is selected
        parties.value = []
        customers.value = []
        suppliers.value = []
        currentParty.value = null
        contacts.value = []
        documentTypes.value = []
      }
    },
    { immediate: true }
  )

  // Watch for filter changes to reload parties
  watch(
    filters,
    () => {
      if (authStore.currentCompany?.id) {
        loadParties()
        loadCustomers()
        loadSuppliers()
      }
    },
    { deep: true }
  )

  return {
    // State
    parties: readonly(parties),
    customers: readonly(customers),
    suppliers: readonly(suppliers),
    currentParty: readonly(currentParty),
    contacts: readonly(contacts),
    documentTypes: readonly(documentTypes),
    loading: readonly(loading),
    error: readonly(error),
    filters: readonly(filters),
    pagination: readonly(pagination),

    // Getters
    hasParties,
    hasCustomers,
    hasSuppliers,
    hasContacts,
    filteredParties,
    customersOnly,
    suppliersOnly,

    // Actions
    loadDocumentTypes,
    validateDocument,
    computeFullname,
    loadParties,
    loadCustomers,
    loadSuppliers,
    loadParty,
    createParty,
    updateParty,
    deleteParty,
    loadContacts,
    createContact,
    updateContact,
    deleteContact,
    searchParties,
    findPartyByDocument,
    getPartyTransactionSummary,
    updateFilters,
    clearFilters,
    clearError,
    initializePartyData
  }
})
