// Core ERP System Types

// Company and Organization Types
export interface Company {
  id: string
  ruc: string
  legal_name: string
  trade_name?: string
  email?: string
  phone?: string
  address?: string
  ubigeo_code?: string
  currency_code: string
  valuation_method: 'PROMEDIO_MOVIL' | 'FIFO'
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  company_id: string
  code: string
  name: string
  address?: string
  ubigeo_code?: string
}

export interface Warehouse {
  id: string
  company_id: string
  branch_id?: string
  code: string
  name: string
  width: number
  height: number
  length: number
  volume_m3: number
}

// User and Authentication Types
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: User
}

// Product and Inventory Types
export interface Product {
  id: string
  company_id: string
  sku: string
  barcode?: string
  name: string
  description?: string
  brand_id?: string
  category_id?: string
  unit_code: string
  width: number
  height: number
  length: number
  weight_kg: number
  volume_m3: number
  is_serialized: boolean
  is_batch_controlled: boolean
  min_stock: number
  max_stock: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  company_id: string
  code: string
  name: string
  parent_id?: string
  level: number
  active: boolean
}

export interface Brand {
  id: string
  company_id: string
  code: string
  name: string
  active: boolean
}

// Stock and Movement Types
export interface StockLedger {
  id: string
  company_id: string
  warehouse_id: string
  product_id: string
  movement_date: string
  ref_doc_type?: string
  ref_doc_series?: string
  ref_doc_number?: string
  operation_type?: string
  qty_in: number
  qty_out: number
  unit_cost_in?: number
  total_cost_in?: number
  unit_cost_out?: number
  total_cost_out?: number
  balance_qty: number
  balance_unit_cost?: number
  balance_total_cost?: number
  source?: string
  source_id?: string
}

// Party (Customer/Supplier) Types
export interface Party {
  id: string
  company_id: string
  is_customer: boolean
  is_supplier: boolean
  doc_type: string
  doc_number: string
  apellido_paterno?: string
  apellido_materno?: string
  nombres?: string
  razon_social?: string
  fullname: string
  email?: string
  phone?: string
  address?: string
  ubigeo_code?: string
  created_at: string
  updated_at: string
}

// Sales Document Types
export interface SalesDoc {
  id: string
  company_id: string
  branch_id?: string
  customer_id: string
  doc_type: string
  series: string
  number: number
  issue_date: string
  currency_code: string
  exchange_rate?: number
  total: number
  greenter_status?: string
  created_at: string
  updated_at: string
  items: SalesDocItem[]
}

export interface SalesDocItem {
  id: string
  sales_doc_id: string
  product_id: string
  description?: string
  unit_code: string
  quantity: number
  unit_price: number
  discount_pct: number
  igv_amount: number
  total_line: number
}

// Purchase Document Types
export interface PurchaseDoc {
  id: string
  company_id: string
  branch_id?: string
  supplier_id: string
  doc_type: string
  series: string
  number: number
  issue_date: string
  currency_code: string
  exchange_rate?: number
  total: number
  created_at: string
  updated_at: string
  items: PurchaseDocItem[]
}

export interface PurchaseDocItem {
  id: string
  purchase_doc_id: string
  product_id: string
  description?: string
  unit_code: string
  quantity: number
  unit_price: number
  discount_pct: number
  igv_amount: number
  total_line: number
}

// UI and Application Types
export interface NavigationItem {
  id: string
  label: string
  icon: string
  route?: string
  children?: NavigationItem[]
  permissions?: string[]
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export interface SearchResult {
  id: string
  type: 'product' | 'customer' | 'supplier' | 'document'
  title: string
  subtitle?: string
  url: string
}

// Form Types
export interface FormField {
  name: string
  type: 'text' | 'number' | 'select' | 'date' | 'file' | 'textarea' | 'checkbox'
  label: string
  required?: boolean
  options?: Array<{ value: any; label: string }>
  validation?: any
  placeholder?: string
  disabled?: boolean
}

export interface WizardStep {
  id: string
  title: string
  component: any
  validation?: any
  canSkip?: boolean
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface ValidationError extends AppError {
  field: string
  value: any
}

export interface NetworkError extends AppError {
  status: number
  endpoint: string
}

// Theme and UI State Types
export type Theme = 'light' | 'dark' | 'system'
export type Locale = 'es' | 'en'

// API Response Types
export interface ApiResponse<T = any> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}
