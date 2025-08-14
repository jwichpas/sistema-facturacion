// Export all stores for easy importing
export { useAuthStore } from './auth'
export { useUIStore } from './ui'
export { useCounterStore } from './counter'
export { useCompanyStore } from './company'
export { useProductStore } from './product'

// Store initialization function
export const initializeStores = async () => {
  const { useUIStore } = await import('./ui')
  const { useAuthStore } = await import('./auth')
  const { useCompanyStore } = await import('./company')
  const { useProductStore } = await import('./product')

  const uiStore = useUIStore()
  const authStore = useAuthStore()
  const companyStore = useCompanyStore()
  const productStore = useProductStore()

  // Initialize UI store
  uiStore.initializeUI()

  // Initialize auth store
  await authStore.initializeAuth()

  // Company and product stores will initialize automatically when auth state changes
}
