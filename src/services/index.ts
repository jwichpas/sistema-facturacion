// Export all services for easy importing
export { default as ProductService } from './product'
export { default as CompanyService } from './company'
export { default as PartyService } from './party'
export { authService } from './auth'
export { supabase } from './supabase'

// Re-export types
export type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductWithDetails,
  ProductListItem,
  Brand,
  BrandInsert,
  BrandUpdate,
  Category,
  CategoryInsert,
  CategoryUpdate,
  ProductCode,
  ProductImage,
  StockLedger,
  StockMovement,
  StockAlert,
  ProductFilters,
  BrandFilters,
  CategoryFilters,
  StockFilters
} from './product'

export type { CompanyAccess } from './company'
export type {
  LoginCredentials,
  SignUpCredentials,
  UserProfile,
  AuthenticationError,
  ValidationError
} from './auth'

export type {
  Party,
  PartyInsert,
  PartyUpdate,
  PartyContactInsert,
  PartyContactUpdate,
  PartyListItem,
  PartyTransactionSummary
} from './party'
