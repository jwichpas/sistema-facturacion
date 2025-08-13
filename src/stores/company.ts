import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import CompanyService, { type CompanyAccess } from '@/services/company'
import type { Company } from '@/types'
import { useAuthStore } from './auth'

// Company store state interface
interface CompanyState {
  currentCompany: Company | null
  availableCompanies: CompanyAccess[]
  companyPermissions: string[]
  companyRole: string | null
  loading: boolean
  error: string | null
  switchingCompany: boolean
}

export const useCompanyStore = defineStore('company', () => {
  // State
  const currentCompany = ref<Company | null>(null)
  const availableCompanies = ref<CompanyAccess[]>([])
  const companyPermissions = ref<string[]>([])
  const companyRole = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const switchingCompany = ref(false)

  // Get auth store
  const authStore = useAuthStore()

  // Getters
  const hasCompany = computed(() => !!currentCompany.value)

  const companyInfo = computed(() => {
    if (!currentCompany.value) return null

    return {
      id: currentCompany.value.id,
      ruc: currentCompany.value.ruc,
      legalName: currentCompany.value.legal_name,
      tradeName: currentCompany.value.trade_name,
      email: currentCompany.value.email,
      phone: currentCompany.value.phone,
      address: currentCompany.value.address,
      currency: currentCompany.value.currency_code,
      valuationMethod: currentCompany.value.valuation_method
    }
  })

  const hasCompanies = computed(() => availableCompanies.value.length > 0)

  const canSwitchCompany = computed(() => availableCompanies.value.length > 1)

  // Permission checks
  const hasPermission = computed(() => (permission: string) => {
    // Super admin has all permissions
    if (companyRole.value === 'Super Admin') return true

    // Check if user has the specific permission
    return companyPermissions.value.includes(permission) || companyPermissions.value.includes('*')
  })

  const hasAnyPermission = computed(() => (permissions: string[]) => {
    if (companyRole.value === 'Super Admin') return true

    return permissions.some(permission =>
      companyPermissions.value.includes(permission) || companyPermissions.value.includes('*')
    )
  })

  const hasAllPermissions = computed(() => (permissions: string[]) => {
    if (companyRole.value === 'Super Admin') return true

    return permissions.every(permission =>
      companyPermissions.value.includes(permission) || companyPermissions.value.includes('*')
    )
  })

  // Role checks
  const isAdmin = computed(() => companyRole.value === 'Admin' || companyRole.value === 'Super Admin')
  const isManager = computed(() => ['Admin', 'Super Admin', 'Manager'].includes(companyRole.value || ''))
  const isSeller = computed(() => companyRole.value === 'Seller')
  const isViewer = computed(() => companyRole.value === 'Viewer')

  // Actions
  const loadUserCompanies = async () => {
    if (!authStore.isAuthenticated) {
      availableCompanies.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const companiesAccess = await CompanyService.getUserCompanies()
      availableCompanies.value = companiesAccess

      // If no current company is set but user has companies, set the first one
      if (!currentCompany.value && companiesAccess.length > 0) {
        await setCurrentCompany(companiesAccess[0].company)
      }

      // If current company is set, update permissions
      if (currentCompany.value) {
        updateCompanyContext()
      }

    } catch (err) {
      console.error('Error loading user companies:', err)
      error.value = err instanceof Error ? err.message : 'Error loading companies'
      availableCompanies.value = []
    } finally {
      loading.value = false
    }
  }

  const setCurrentCompany = async (company: Company) => {
    if (currentCompany.value?.id === company.id) {
      return // Already the current company
    }

    switchingCompany.value = true
    error.value = null

    try {
      // Validate access to the company
      await CompanyService.validateCompanyAccess(company.id)

      // Set the new company
      currentCompany.value = company

      // Update company context (permissions, role)
      updateCompanyContext()

      // Store in localStorage for persistence
      localStorage.setItem('currentCompanyId', company.id)

      // Update auth store's current company as well for backward compatibility
      if (authStore.setCurrentCompany) {
        await authStore.setCurrentCompany(company)
      }

    } catch (err) {
      console.error('Error setting current company:', err)
      error.value = err instanceof Error ? err.message : 'Error switching company'
      throw err
    } finally {
      switchingCompany.value = false
    }
  }

  const updateCompanyContext = () => {
    if (!currentCompany.value) {
      companyPermissions.value = []
      companyRole.value = null
      return
    }

    // Find the company access info for the current company
    const companyAccess = availableCompanies.value.find(
      ca => ca.company.id === currentCompany.value?.id
    )

    if (companyAccess) {
      companyPermissions.value = companyAccess.permissions
      companyRole.value = companyAccess.role
    } else {
      companyPermissions.value = []
      companyRole.value = null
    }
  }

  const refreshCompanyData = async () => {
    if (!currentCompany.value) return

    try {
      const updatedCompany = await CompanyService.getCompany(currentCompany.value.id)
      if (updatedCompany) {
        currentCompany.value = updatedCompany
      }
    } catch (err) {
      console.error('Error refreshing company data:', err)
      error.value = err instanceof Error ? err.message : 'Error refreshing company data'
    }
  }

  const validateCompanyAccess = async (companyId: string): Promise<boolean> => {
    try {
      return await CompanyService.hasCompanyAccess(companyId)
    } catch (err) {
      console.error('Error validating company access:', err)
      return false
    }
  }

  const validatePermission = async (permission: string): Promise<boolean> => {
    if (!currentCompany.value) return false

    try {
      return await CompanyService.hasPermission(permission, currentCompany.value.id)
    } catch (err) {
      console.error('Error validating permission:', err)
      return false
    }
  }

  const clearCompanyData = () => {
    currentCompany.value = null
    availableCompanies.value = []
    companyPermissions.value = []
    companyRole.value = null
    error.value = null
    localStorage.removeItem('currentCompanyId')
  }

  const clearError = () => {
    error.value = null
  }

  // Initialize company data when auth state changes
  const initializeCompanyData = async () => {
    if (!authStore.isAuthenticated) {
      clearCompanyData()
      return
    }

    // Try to restore current company from localStorage
    const storedCompanyId = localStorage.getItem('currentCompanyId')

    // Load available companies
    await loadUserCompanies()

    // If we have a stored company ID, try to set it
    if (storedCompanyId && availableCompanies.value.length > 0) {
      const companyAccess = availableCompanies.value.find(
        ca => ca.company.id === storedCompanyId
      )

      if (companyAccess) {
        await setCurrentCompany(companyAccess.company)
      }
    }
  }

  // Watch for auth state changes
  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        await initializeCompanyData()
      } else {
        clearCompanyData()
      }
    },
    { immediate: true }
  )

  return {
    // State
    currentCompany: readonly(currentCompany),
    availableCompanies: readonly(availableCompanies),
    companyPermissions: readonly(companyPermissions),
    companyRole: readonly(companyRole),
    loading: readonly(loading),
    error: readonly(error),
    switchingCompany: readonly(switchingCompany),

    // Getters
    hasCompany,
    companyInfo,
    hasCompanies,
    canSwitchCompany,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager,
    isSeller,
    isViewer,

    // Actions
    loadUserCompanies,
    setCurrentCompany,
    updateCompanyContext,
    refreshCompanyData,
    validateCompanyAccess,
    validatePermission,
    clearCompanyData,
    clearError,
    initializeCompanyData
  }
})

// Helper function for readonly refs
function readonly<T>(ref: T): T {
  return ref
}
