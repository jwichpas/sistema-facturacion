// Company-related utilities and constants

// Peruvian document types (SUNAT Catalog 06)
export const DOCUMENT_TYPES = {
  DNI: '1',
  CARNET_EXTRANJERIA: '4',
  RUC: '6',
  PASAPORTE: '7',
  CEDULA_DIPLOMATICA: 'A',
  OTROS: '0'
} as const

// Currency codes (SUNAT Catalog 02)
export const CURRENCIES = {
  PEN: 'PEN', // Soles
  USD: 'USD', // Dólares
  EUR: 'EUR'  // Euros
} as const

// Valuation methods
export const VALUATION_METHODS = {
  PROMEDIO_MOVIL: 'PROMEDIO_MOVIL',
  FIFO: 'FIFO'
} as const

// Company permissions
export const COMPANY_PERMISSIONS = {
  // Admin permissions
  ADMIN_USERS: 'admin.users',
  ADMIN_COMPANIES: 'admin.companies',
  ADMIN_SETTINGS: 'admin.settings',

  // Product permissions
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_MANAGE: 'products.manage',

  // Inventory permissions
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',
  INVENTORY_MANAGE: 'inventory.manage',
  INVENTORY_TRANSFER: 'inventory.transfer',

  // Sales permissions
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_UPDATE: 'sales.update',
  SALES_DELETE: 'sales.delete',
  SALES_REPORTS: 'sales.reports',

  // Invoice permissions
  INVOICES_VIEW: 'invoices.view',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_UPDATE: 'invoices.update',
  INVOICES_DELETE: 'invoices.delete',
  INVOICES_SUNAT: 'invoices.sunat',

  // Customer permissions
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',

  // Purchase permissions
  PURCHASES_VIEW: 'purchases.view',
  PURCHASES_CREATE: 'purchases.create',
  PURCHASES_UPDATE: 'purchases.update',
  PURCHASES_DELETE: 'purchases.delete',

  // Report permissions
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_SUNAT: 'reports.sunat'
} as const

// Company roles
export const COMPANY_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SELLER: 'Seller',
  VIEWER: 'Viewer'
} as const

/**
 * Validate Peruvian RUC (Tax ID)
 */
export function validateRUC(ruc: string): boolean {
  if (!ruc || ruc.length !== 11) return false

  // Check if it contains only numbers
  if (!/^\d{11}$/.test(ruc)) return false

  // RUC validation algorithm
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let sum = 0

  for (let i = 0; i < 10; i++) {
    sum += parseInt(ruc[i]) * weights[i]
  }

  const remainder = sum % 11
  const checkDigit = remainder < 2 ? remainder : 11 - remainder

  return checkDigit === parseInt(ruc[10])
}

/**
 * Validate Peruvian DNI (National ID)
 */
export function validateDNI(dni: string): boolean {
  if (!dni || dni.length !== 8) return false
  return /^\d{8}$/.test(dni)
}

/**
 * Validate document number based on type
 */
export function validateDocumentNumber(docType: string, docNumber: string): boolean {
  switch (docType) {
    case DOCUMENT_TYPES.DNI:
      return validateDNI(docNumber)
    case DOCUMENT_TYPES.RUC:
      return validateRUC(docNumber)
    case DOCUMENT_TYPES.CARNET_EXTRANJERIA:
      return docNumber.length >= 8 && docNumber.length <= 12
    case DOCUMENT_TYPES.PASAPORTE:
      return docNumber.length >= 6 && docNumber.length <= 12
    default:
      return docNumber.length > 0
  }
}

/**
 * Format RUC with dashes for display
 */
export function formatRUC(ruc: string): string {
  if (!ruc || ruc.length !== 11) return ruc
  return `${ruc.slice(0, 2)}-${ruc.slice(2, 10)}-${ruc.slice(10)}`
}

/**
 * Format DNI with dashes for display
 */
export function formatDNI(dni: string): string {
  if (!dni || dni.length !== 8) return dni
  return `${dni.slice(0, 2)}-${dni.slice(2, 5)}-${dni.slice(5)}`
}

/**
 * Format document number based on type
 */
export function formatDocumentNumber(docType: string, docNumber: string): string {
  switch (docType) {
    case DOCUMENT_TYPES.DNI:
      return formatDNI(docNumber)
    case DOCUMENT_TYPES.RUC:
      return formatRUC(docNumber)
    default:
      return docNumber
  }
}

/**
 * Get document type name
 */
export function getDocumentTypeName(docType: string): string {
  const names: Record<string, string> = {
    [DOCUMENT_TYPES.DNI]: 'DNI',
    [DOCUMENT_TYPES.CARNET_EXTRANJERIA]: 'Carnet de Extranjería',
    [DOCUMENT_TYPES.RUC]: 'RUC',
    [DOCUMENT_TYPES.PASAPORTE]: 'Pasaporte',
    [DOCUMENT_TYPES.CEDULA_DIPLOMATICA]: 'Cédula Diplomática',
    [DOCUMENT_TYPES.OTROS]: 'Otros'
  }

  return names[docType] || 'Desconocido'
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    [CURRENCIES.PEN]: 'S/',
    [CURRENCIES.USD]: '$',
    [CURRENCIES.EUR]: '€'
  }

  return symbols[currencyCode] || currencyCode
}

/**
 * Get currency name
 */
export function getCurrencyName(currencyCode: string): string {
  const names: Record<string, string> = {
    [CURRENCIES.PEN]: 'Soles',
    [CURRENCIES.USD]: 'Dólares',
    [CURRENCIES.EUR]: 'Euros'
  }

  return names[currencyCode] || currencyCode
}

/**
 * Check if user has permission
 */
export function hasPermission(userPermissions: string[], permission: string): boolean {
  return userPermissions.includes('*') || userPermissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: string[], permissions: string[]): boolean {
  if (userPermissions.includes('*')) return true
  return permissions.some(permission => userPermissions.includes(permission))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: string[], permissions: string[]): boolean {
  if (userPermissions.includes('*')) return true
  return permissions.every(permission => userPermissions.includes(permission))
}

/**
 * Get role permissions
 */
export function getRolePermissions(roleName: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    [COMPANY_ROLES.SUPER_ADMIN]: ['*'],
    [COMPANY_ROLES.ADMIN]: [
      COMPANY_PERMISSIONS.ADMIN_USERS,
      COMPANY_PERMISSIONS.ADMIN_COMPANIES,
      COMPANY_PERMISSIONS.ADMIN_SETTINGS,
      COMPANY_PERMISSIONS.PRODUCTS_VIEW,
      COMPANY_PERMISSIONS.PRODUCTS_CREATE,
      COMPANY_PERMISSIONS.PRODUCTS_UPDATE,
      COMPANY_PERMISSIONS.PRODUCTS_DELETE,
      COMPANY_PERMISSIONS.PRODUCTS_MANAGE,
      COMPANY_PERMISSIONS.INVENTORY_VIEW,
      COMPANY_PERMISSIONS.INVENTORY_CREATE,
      COMPANY_PERMISSIONS.INVENTORY_UPDATE,
      COMPANY_PERMISSIONS.INVENTORY_DELETE,
      COMPANY_PERMISSIONS.INVENTORY_MANAGE,
      COMPANY_PERMISSIONS.INVENTORY_TRANSFER,
      COMPANY_PERMISSIONS.SALES_VIEW,
      COMPANY_PERMISSIONS.SALES_CREATE,
      COMPANY_PERMISSIONS.SALES_UPDATE,
      COMPANY_PERMISSIONS.SALES_DELETE,
      COMPANY_PERMISSIONS.SALES_REPORTS,
      COMPANY_PERMISSIONS.INVOICES_VIEW,
      COMPANY_PERMISSIONS.INVOICES_CREATE,
      COMPANY_PERMISSIONS.INVOICES_UPDATE,
      COMPANY_PERMISSIONS.INVOICES_DELETE,
      COMPANY_PERMISSIONS.INVOICES_SUNAT,
      COMPANY_PERMISSIONS.CUSTOMERS_VIEW,
      COMPANY_PERMISSIONS.CUSTOMERS_CREATE,
      COMPANY_PERMISSIONS.CUSTOMERS_UPDATE,
      COMPANY_PERMISSIONS.CUSTOMERS_DELETE,
      COMPANY_PERMISSIONS.PURCHASES_VIEW,
      COMPANY_PERMISSIONS.PURCHASES_CREATE,
      COMPANY_PERMISSIONS.PURCHASES_UPDATE,
      COMPANY_PERMISSIONS.PURCHASES_DELETE,
      COMPANY_PERMISSIONS.REPORTS_VIEW,
      COMPANY_PERMISSIONS.REPORTS_EXPORT,
      COMPANY_PERMISSIONS.REPORTS_SUNAT
    ],
    [COMPANY_ROLES.MANAGER]: [
      COMPANY_PERMISSIONS.PRODUCTS_VIEW,
      COMPANY_PERMISSIONS.PRODUCTS_CREATE,
      COMPANY_PERMISSIONS.PRODUCTS_UPDATE,
      COMPANY_PERMISSIONS.PRODUCTS_MANAGE,
      COMPANY_PERMISSIONS.INVENTORY_VIEW,
      COMPANY_PERMISSIONS.INVENTORY_CREATE,
      COMPANY_PERMISSIONS.INVENTORY_UPDATE,
      COMPANY_PERMISSIONS.INVENTORY_MANAGE,
      COMPANY_PERMISSIONS.INVENTORY_TRANSFER,
      COMPANY_PERMISSIONS.SALES_VIEW,
      COMPANY_PERMISSIONS.SALES_CREATE,
      COMPANY_PERMISSIONS.SALES_UPDATE,
      COMPANY_PERMISSIONS.SALES_REPORTS,
      COMPANY_PERMISSIONS.INVOICES_VIEW,
      COMPANY_PERMISSIONS.INVOICES_CREATE,
      COMPANY_PERMISSIONS.INVOICES_UPDATE,
      COMPANY_PERMISSIONS.INVOICES_SUNAT,
      COMPANY_PERMISSIONS.CUSTOMERS_VIEW,
      COMPANY_PERMISSIONS.CUSTOMERS_CREATE,
      COMPANY_PERMISSIONS.CUSTOMERS_UPDATE,
      COMPANY_PERMISSIONS.PURCHASES_VIEW,
      COMPANY_PERMISSIONS.PURCHASES_CREATE,
      COMPANY_PERMISSIONS.PURCHASES_UPDATE,
      COMPANY_PERMISSIONS.REPORTS_VIEW,
      COMPANY_PERMISSIONS.REPORTS_EXPORT
    ],
    [COMPANY_ROLES.SELLER]: [
      COMPANY_PERMISSIONS.PRODUCTS_VIEW,
      COMPANY_PERMISSIONS.INVENTORY_VIEW,
      COMPANY_PERMISSIONS.SALES_VIEW,
      COMPANY_PERMISSIONS.SALES_CREATE,
      COMPANY_PERMISSIONS.INVOICES_VIEW,
      COMPANY_PERMISSIONS.INVOICES_CREATE,
      COMPANY_PERMISSIONS.CUSTOMERS_VIEW,
      COMPANY_PERMISSIONS.CUSTOMERS_CREATE,
      COMPANY_PERMISSIONS.CUSTOMERS_UPDATE
    ],
    [COMPANY_ROLES.VIEWER]: [
      COMPANY_PERMISSIONS.PRODUCTS_VIEW,
      COMPANY_PERMISSIONS.INVENTORY_VIEW,
      COMPANY_PERMISSIONS.SALES_VIEW,
      COMPANY_PERMISSIONS.INVOICES_VIEW,
      COMPANY_PERMISSIONS.CUSTOMERS_VIEW,
      COMPANY_PERMISSIONS.PURCHASES_VIEW,
      COMPANY_PERMISSIONS.REPORTS_VIEW
    ]
  }

  return rolePermissions[roleName] || []
}

/**
 * Validate ubigeo code format
 */
export function validateUbigeoCode(ubigeoCode: string): boolean {
  return /^\d{6}$/.test(ubigeoCode)
}

/**
 * Format ubigeo code for display
 */
export function formatUbigeoCode(ubigeoCode: string): string {
  if (!ubigeoCode || ubigeoCode.length !== 6) return ubigeoCode
  return `${ubigeoCode.slice(0, 2)}-${ubigeoCode.slice(2, 4)}-${ubigeoCode.slice(4)}`
}
