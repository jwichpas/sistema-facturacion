// Export all services for easy importing
export { default as ProductService } from './product'
export { default as CompanyService } from './company'
export { default as PartyService } from './party'
export { default as PurchaseService } from './purchase'
export { default as WarehouseService } from './warehouse'
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

export type {
  PurchaseDoc,
  PurchaseDocInsert,
  PurchaseDocUpdate,
  PurchaseDocItem,
  PurchaseDocItemInsert,
  PurchaseDocItemUpdate,
  PurchaseDocWithDetails,
  PurchaseDocItemWithDetails,
  PurchaseDocListItem,
  PurchaseDocFilters,
  PurchaseDocCreatePayload,
  PurchaseDocUpdatePayload,
  PurchaseTaxCalculation,
  PurchaseDocItemCalculation
} from './purchase'

export type {
  Warehouse,
  WarehouseInsert,
  WarehouseUpdate,
  WarehouseZone,
  WarehouseZoneInsert,
  WarehouseZoneUpdate,
  StockTransfer,
  StockTransferInsert,
  StockTransferUpdate,
  StockTransferItem,
  StockTransferItemInsert,
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
  Driver,
  DriverInsert,
  DriverUpdate,
  WarehouseWithDetails,
  WarehouseZoneWithDetails,
  StockTransferWithDetails,
  StockTransferItemWithDetails,
  VehicleWithDetails,
  DriverWithDetails,
  WarehouseFilters,
  WarehouseZoneFilters,
  StockTransferFilters,
  VehicleFilters,
  DriverFilters,
  StockTransferCreatePayload
} from './warehouse'
