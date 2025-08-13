// Formatting utilities for the ERP system

/**
 * Format currency values
 */
export const formatCurrency = (amount: number, currency = 'PEN', locale = 'es-PE'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format numbers with thousands separator
 */
export const formatNumber = (value: number, decimals = 2, locale = 'es-PE'): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format dates
 */
export const formatDate = (date: string | Date, locale = 'es-PE'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj)
}

/**
 * Format datetime
 */
export const formatDateTime = (date: string | Date, locale = 'es-PE'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

/**
 * Format RUC with dashes
 */
export const formatRUC = (ruc: string): string => {
  if (ruc.length !== 11) return ruc
  return `${ruc.slice(0, 2)}-${ruc.slice(2, 10)}-${ruc.slice(10)}`
}

/**
 * Format DNI with dashes
 */
export const formatDNI = (dni: string): string => {
  if (dni.length !== 8) return dni
  return `${dni.slice(0, 2)}-${dni.slice(2, 5)}-${dni.slice(5)}`
}

/**
 * Format document number based on type
 */
export const formatDocumentNumber = (docType: string, docNumber: string): string => {
  switch (docType) {
    case '1': // DNI
      return formatDNI(docNumber)
    case '6': // RUC
      return formatRUC(docNumber)
    default:
      return docNumber
  }
}

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format SUNAT document series and number
 */
export const formatDocumentCode = (series: string, number: number): string => {
  return `${series}-${number.toString().padStart(8, '0')}`
}

/**
 * Clean and format phone number
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  return phone
}

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatRUC,
  formatDNI,
  formatDocumentNumber,
  formatFileSize,
  truncateText,
  getInitials,
  formatPercentage,
  formatDocumentCode,
  formatPhone,
}
