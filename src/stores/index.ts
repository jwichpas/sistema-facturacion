// Export all stores for easy importing
export { useAuthStore } from './auth'
export { useUIStore } from './ui'
export { useCounterStore } from './counter'
export { useCompanyStore } from './company'
export { useProductStore } from './product'
export { usePartyStore } from './party'

// Store initialization function
export const initializeStores = async () => {
  const { useUIStore } = await import('./ui')
  const { useAuthStore } = await import('./auth')
  const { useCompanyStore } = await import('./company')
  const { useProductStore } = await import('./product')
  const { usePartyStore } = await import('./party')

  const uiStore = useUIStore()
  const authStore = useAuthStore()
  const companyStore = useCompanyStore()
  const productStore = useProductStore()
  const partyStore = usePartyStore()

  // Initialize UI store
  uiStore.initializeUI()

  // Initialize auth store
  await authStore.initializeAuth()

  // Company, product, and party stores will initialize automatically when auth state changes
}
