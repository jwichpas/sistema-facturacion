import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/services/auth'
import type { User, Session } from '@supabase/supabase-js'
import type { Company } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const currentCompany = ref<Company | null>(null)
  const availableCompanies = ref<Company[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!session.value && !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => user.value?.user_metadata?.full_name || userEmail.value)
  const hasCompany = computed(() => !!currentCompany.value)

  // Actions
  const signIn = async (email: string, password: string) => {
    loading.value = true
    try {
      const { session: newSession, user: newUser } = await authService.signIn({ email, password })
      session.value = newSession
      user.value = newUser

      // Load user companies after successful login
      if (newUser) {
        await loadUserCompanies()
      }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    loading.value = true
    try {
      const result = await authService.signUp({ email, password, full_name: fullName })
      return result
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    loading.value = true
    try {
      await authService.signOut()
      user.value = null
      session.value = null
      currentCompany.value = null
      availableCompanies.value = []

      // Clear company from localStorage
      localStorage.removeItem('current_company')
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const loadUserCompanies = async () => {
    if (!user.value) return

    try {
      // TODO: Implement company loading from Supabase
      // This will be implemented in a later task
      availableCompanies.value = []

      // Try to restore current company from localStorage
      const storedCompany = localStorage.getItem('current_company')
      if (storedCompany) {
        try {
          const company = JSON.parse(storedCompany)
          // Verify the company is still available to the user
          const isAvailable = availableCompanies.value.some((c) => c.id === company.id)
          if (isAvailable) {
            currentCompany.value = company
          }
        } catch {
          localStorage.removeItem('current_company')
        }
      }
    } catch (error) {
      console.error('Error loading user companies:', error)
    }
  }

  const setCurrentCompany = (company: Company) => {
    currentCompany.value = company
    localStorage.setItem('current_company', JSON.stringify(company))
  }

  const initializeAuth = async () => {
    if (initialized.value) return

    try {
      const {
        data: { session: currentSession },
      } = await authService.getSession()

      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
        await loadUserCompanies()
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      initialized.value = true
    }
  }

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    loading.value = true
    try {
      await authService.updateProfile(updates)

      // Update local user data
      if (user.value) {
        user.value = {
          ...user.value,
          user_metadata: {
            ...user.value.user_metadata,
            ...updates,
          },
        }
      }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    user: readonly(user),
    session: readonly(session),
    currentCompany: readonly(currentCompany),
    availableCompanies: readonly(availableCompanies),
    loading: readonly(loading),
    initialized: readonly(initialized),

    // Getters
    isAuthenticated,
    userEmail,
    userName,
    hasCompany,

    // Actions
    signIn,
    signUp,
    signOut,
    loadUserCompanies,
    setCurrentCompany,
    initializeAuth,
    updateProfile,
  }
})

// Helper function for readonly refs
function readonly<T>(ref: any): T {
  return ref
}
