// Export all stores for easy importing
export { useAuthStore } from './auth'
export { useUIStore } from './ui'
export { useCounterStore } from './counter'
export { useCompanyStore } from './company'

// Store initialization function
export const initializeStores = async () => {
  const { useUIStore } = await import('./ui')
  const { useAuthStore } = await import('./auth')
  const { useCompanyStore } = await import('./company')

  const uiStore = useUIStore()
  const authStore = useAuthStore()
  const companyStore = useCompanyStore()

  // Initialize UI store
  uiStore.initializeUI()

  // Initialize auth store
  await authStore.initializeAuth()

  // Company store will initialize automatically when auth state changes
}
