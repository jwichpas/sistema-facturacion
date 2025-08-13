import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { authService, AuthenticationError, ValidationError } from '@/services/auth'
import type { LoginCredentials, SignUpCredentials, UserProfile } from '@/services/auth'
import type { User, Session } from '@supabase/supabase-js'
import type { Company } from '@/types'
import { STORAGE_KEYS, USER_ROLES } from '@/utils/constants'

// Auth store state interface
interface AuthState {
  user: User | null
  session: Session | null
  currentCompany: Company | null
  availableCompanies: Company[]
  userPermissions: string[]
  userRole: string | null
  loading: boolean
  initialized: boolean
  error: string | null
  sessionTimeout: number | null
}

// Company access interface
interface CompanyAccess {
  company_id: string
  role: string
  permissions: string[]
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const currentCompany = ref<Company | null>(null)
  const availableCompanies = ref<Company[]>([])
  const userPermissions = ref<string[]>([])
  const userRole = ref<string | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref<string | null>(null)
  const sessionTimeout = ref<number | null>(null)

  // Auth state listener
  let authStateListener: { data: { subscription: any } } | null = null

  // Getters
  const isAuthenticated = computed(() => !!session.value && !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => {
    const metadata = user.value?.user_metadata
    return metadata?.full_name || userEmail.value.split('@')[0] || 'Usuario'
  })
  const userAvatar = computed(() => user.value?.user_metadata?.avatar_url || null)
  const hasCompany = computed(() => !!currentCompany.value)
  const isAdmin = computed(() => userRole.value === USER_ROLES.ADMIN)
  const isManager = computed(() => {
    const role = userRole.value
    return role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER
  })

  // Permission checks
  const hasPermission = computed(() => (permission: string) => {
    if (isAdmin.value) return true
    return userPermissions.value.includes(permission)
  })

  const hasAnyPermission = computed(() => (permissions: string[]) => {
    if (isAdmin.value) return true
    return permissions.some((permission) => userPermissions.value.includes(permission))
  })

  const hasAllPermissions = computed(() => (permissions: string[]) => {
    if (isAdmin.value) return true
    return permissions.every((permission) => userPermissions.value.includes(permission))
  })

  // Session status
  const sessionExpiresAt = computed(() => {
    return session.value?.expires_at ? new Date(session.value.expires_at * 1000) : null
  })

  const sessionTimeRemaining = computed(() => {
    if (!sessionExpiresAt.value) return null
    const now = new Date()
    const remaining = sessionExpiresAt.value.getTime() - now.getTime()
    return Math.max(0, Math.floor(remaining / 1000)) // seconds
  })

  const isSessionExpiringSoon = computed(() => {
    const remaining = sessionTimeRemaining.value
    return remaining !== null && remaining < 300 // 5 minutes
  })

  // Actions
  const signIn = async (credentials: LoginCredentials) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await authService.signIn(credentials)

      if (data?.session && data?.user) {
        session.value = data.session
        user.value = data.user

        // Load user companies and permissions
        await Promise.all([loadUserCompanies(), loadUserPermissions()])

        // Set up session monitoring
        setupSessionMonitoring()

        return { success: true, data }
      }

      throw new Error('Invalid response from authentication service')
    } catch (err) {
      const errorMessage =
        err instanceof AuthenticationError || err instanceof ValidationError
          ? err.message
          : 'An unexpected error occurred during sign in'

      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const signUp = async (credentials: SignUpCredentials) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await authService.signUp(credentials)
      return { success: true, data }
    } catch (err) {
      const errorMessage =
        err instanceof AuthenticationError || err instanceof ValidationError
          ? err.message
          : 'An unexpected error occurred during sign up'

      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    loading.value = true
    error.value = null

    try {
      await authService.signOut()
      clearAuthState()
      return { success: true }
    } catch (err) {
      const errorMessage =
        err instanceof AuthenticationError
          ? err.message
          : 'An unexpected error occurred during sign out'

      error.value = errorMessage
      // Still clear state even if sign out fails
      clearAuthState()
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const refreshSession = async () => {
    try {
      const { data } = await authService.refreshSession()

      if (data?.session) {
        session.value = data.session
        user.value = data.session.user
        setupSessionMonitoring()
        return true
      }

      return false
    } catch (err) {
      console.error('Error refreshing session:', err)
      return false
    }
  }

  const loadUserCompanies = async () => {
    if (!user.value) return

    try {
      const companies = await authService.getUserCompanies(user.value.id)
      availableCompanies.value = companies

      // Try to restore current company from localStorage
      const storedCompanyId = localStorage.getItem(STORAGE_KEYS.CURRENT_COMPANY)
      if (storedCompanyId) {
        const company = companies.find((c) => c.id === storedCompanyId)
        if (company) {
          currentCompany.value = company
        } else {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_COMPANY)
        }
      }

      // If no current company but user has companies, set the first one
      if (!currentCompany.value && companies.length > 0) {
        setCurrentCompany(companies[0])
      }
    } catch (err) {
      console.error('Error loading user companies:', err)
      availableCompanies.value = []
    }
  }

  const loadUserPermissions = async () => {
    if (!user.value || !currentCompany.value) {
      userPermissions.value = []
      userRole.value = null
      return
    }

    try {
      // TODO: Load actual permissions from database
      // For now, set default permissions based on mock data
      userRole.value = USER_ROLES.ADMIN // Mock admin role
      userPermissions.value = [
        'companies.read',
        'companies.write',
        'products.read',
        'products.write',
        'sales.read',
        'sales.write',
        'purchases.read',
        'purchases.write',
        'reports.read',
        'users.read',
        'users.write',
      ]
    } catch (err) {
      console.error('Error loading user permissions:', err)
      userPermissions.value = []
      userRole.value = null
    }
  }

  const setCurrentCompany = async (company: Company) => {
    const previousCompany = currentCompany.value
    currentCompany.value = company
    localStorage.setItem(STORAGE_KEYS.CURRENT_COMPANY, company.id)

    try {
      // Reload permissions for the new company
      await loadUserPermissions()
    } catch (err) {
      console.error('Error loading permissions for company:', err)
      // Revert company change if permission loading fails
      currentCompany.value = previousCompany
      if (previousCompany) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_COMPANY, previousCompany.id)
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_COMPANY)
      }
      throw err
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    loading.value = true
    error.value = null

    try {
      await authService.updateProfile(updates)

      // Update local user data
      if (user.value) {
        user.value = {
          ...user.value,
          email: updates.email || user.value.email,
          user_metadata: {
            ...user.value.user_metadata,
            full_name: updates.full_name || user.value.user_metadata?.full_name,
            avatar_url: updates.avatar_url || user.value.user_metadata?.avatar_url,
            phone: updates.phone || user.value.user_metadata?.phone,
          },
        }
      }

      return { success: true }
    } catch (err) {
      const errorMessage =
        err instanceof AuthenticationError
          ? err.message
          : 'An unexpected error occurred during profile update'

      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (email: string) => {
    loading.value = true
    error.value = null

    try {
      await authService.resetPassword({ email })
      return { success: true }
    } catch (err) {
      const errorMessage =
        err instanceof AuthenticationError || err instanceof ValidationError
          ? err.message
          : 'An unexpected error occurred during password reset'

      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const updatePassword = async (password: string, confirmPassword?: string) => {
    loading.value = true
    error.value = null

    try {
      await authService.updatePassword({ password, confirmPassword })
      return { success: true }
    } catch (err) {
      const errorMessage =
        err instanceof AuthenticationError || err instanceof ValidationError
          ? err.message
          : 'An unexpected error occurred during password update'

      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const checkCompanyAccess = async (companyId: string): Promise<boolean> => {
    if (!user.value) return false

    try {
      return await authService.hasCompanyAccess(user.value.id, companyId)
    } catch {
      return false
    }
  }

  const initializeAuth = async () => {
    if (initialized.value) return

    loading.value = true

    try {
      const {
        data: { session: currentSession },
      } = await authService.getSession()

      if (currentSession?.user) {
        session.value = currentSession
        user.value = currentSession.user

        // Load user data
        await Promise.all([loadUserCompanies(), loadUserPermissions()])

        // Set up session monitoring
        setupSessionMonitoring()
      }

      // Set up auth state listener
      setupAuthStateListener()
    } catch (err) {
      console.error('Error initializing auth:', err)
      clearAuthState()
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Private methods
  const clearAuthState = () => {
    user.value = null
    session.value = null
    currentCompany.value = null
    availableCompanies.value = []
    userPermissions.value = []
    userRole.value = null
    error.value = null

    // Clear session monitoring
    if (sessionTimeout.value) {
      clearTimeout(sessionTimeout.value)
      sessionTimeout.value = null
    }

    // Clear auth state listener
    if (authStateListener) {
      authStateListener.data.subscription.unsubscribe()
      authStateListener = null
    }

    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_COMPANY)
    } catch {
      // Silently fail
    }
  }

  const setupSessionMonitoring = () => {
    if (sessionTimeout.value) {
      clearTimeout(sessionTimeout.value)
    }

    const remaining = sessionTimeRemaining.value
    if (remaining && remaining > 0) {
      // Set timeout to refresh session 5 minutes before expiry
      const refreshTime = Math.max(0, (remaining - 300) * 1000)

      sessionTimeout.value = setTimeout(async () => {
        const refreshed = await refreshSession()
        if (!refreshed) {
          await signOut()
        }
      }, refreshTime) as unknown
    }
  }

  const setupAuthStateListener = () => {
    if (authStateListener) return

    authStateListener = authService.onAuthStateChange(async (event, newSession) => {
      switch (event) {
        case 'SIGNED_IN':
          if (newSession?.user) {
            session.value = newSession
            user.value = newSession.user
            await Promise.all([loadUserCompanies(), loadUserPermissions()])
            setupSessionMonitoring()
          }
          break

        case 'SIGNED_OUT':
          clearAuthState()
          break

        case 'TOKEN_REFRESHED':
          if (newSession) {
            session.value = newSession
            user.value = newSession.user
            setupSessionMonitoring()
          }
          break

        case 'USER_UPDATED':
          if (newSession?.user) {
            user.value = newSession.user
          }
          break
      }
    })
  }

  // Watch for company changes to reload permissions
  watch(currentCompany, async (newCompany) => {
    if (newCompany && user.value) {
      await loadUserPermissions()
    }
  })

  return {
    // State
    user: readonly(user),
    session: readonly(session),
    currentCompany: readonly(currentCompany),
    availableCompanies: readonly(availableCompanies),
    userPermissions: readonly(userPermissions),
    userRole: readonly(userRole),
    loading: readonly(loading),
    initialized: readonly(initialized),
    error: readonly(error),

    // Getters
    isAuthenticated,
    userEmail,
    userName,
    userAvatar,
    hasCompany,
    isAdmin,
    isManager,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    sessionExpiresAt,
    sessionTimeRemaining,
    isSessionExpiringSoon,

    // Actions
    signIn,
    signUp,
    signOut,
    logout: signOut, // Alias for signOut
    refreshSession,
    loadUserCompanies,
    loadUserPermissions,
    setCurrentCompany,
    updateProfile,
    resetPassword,
    updatePassword,
    checkCompanyAccess,
    initializeAuth,
    clearError,
  }
})

// Helper function for readonly refs
function readonly<T>(ref: T): T {
  return ref
}
