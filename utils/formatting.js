// utils/formatting.js

/**
 * Currency formatting utilities
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00'
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount))
}

/**
 * Number formatting utilities
 */
export const formatNumber = (number, locale = 'en-US') => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0'
  }
  
  return new Intl.NumberFormat(locale).format(Number(number))
}

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }
  
  return `${Number(value).toFixed(decimals)}%`
}

/**
 * Date and time formatting utilities
 */
export const formatDate = (date, options = {}) => {
  if (!date) return ''
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  const formatOptions = { ...defaultOptions, ...options }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', formatOptions)
  } catch (error) {
    console.error('Date formatting error:', error)
    return ''
  }
}

export const formatTime = (date, options = {}) => {
  if (!date) return ''
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
  
  const formatOptions = { ...defaultOptions, ...options }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString('en-US', formatOptions)
  } catch (error) {
    console.error('Time formatting error:', error)
    return ''
  }
}

export const formatDateTime = (date, options = {}) => {
  if (!date) return ''
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
  
  const formatOptions = { ...defaultOptions, ...options }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString('en-US', formatOptions)
  } catch (error) {
    console.error('DateTime formatting error:', error)
    return ''
  }
}

export const formatRelativeTime = (date) => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now - dateObj) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      return formatDate(dateObj)
    }
  } catch (error) {
    console.error('Relative time formatting error:', error)
    return ''
  }
}

/**
 * Text formatting utilities
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return ''
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  // Check if it's a valid US phone number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  // Return original if not a standard format
  return phoneNumber
}

export const formatName = (firstName, lastName, format = 'full') => {
  if (!firstName && !lastName) return ''
  
  switch (format) {
    case 'first':
      return firstName || ''
    case 'last':
      return lastName || ''
    case 'initials':
      return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
    case 'firstInitial':
      return `${firstName || ''} ${lastName?.[0] || ''}`.trim()
    case 'full':
    default:
      return `${firstName || ''} ${lastName || ''}`.trim()
  }
}

export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text || text.length <= maxLength) return text
  
  return text.substring(0, maxLength - suffix.length) + suffix
}

export const capitalizeWords = (text) => {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Business-specific formatting
 */
export const formatReceiptNumber = (number) => {
  if (!number) return ''
  
  // If it's already formatted, return as is
  if (typeof number === 'string' && number.startsWith('RCP')) {
    return number
  }
  
  // Otherwise, format it
  return `RCP${String(number).padStart(6, '0')}`
}

export const formatBarcode = (barcode) => {
  if (!barcode) return ''
  
  // Format as groups of 3-4 digits for readability
  return barcode.replace(/(\d{3,4})/g, '$1 ').trim()
}

export const formatSKU = (sku) => {
  if (!sku) return ''
  
  return sku.toUpperCase()
}

/**
 * Status formatting
 */
export const formatStatus = (status) => {
  if (!status) return ''
  
  return status
    .split('_')
    .map(word => capitalizeWords(word))
    .join(' ')
}

export const getStatusColor = (status) => {
  const statusColors = {
    completed: '#10b981',
    pending: '#f59e0b',
    cancelled: '#6b7280',
    refunded: '#ef4444',
    failed: '#ef4444',
    active: '#10b981',
    inactive: '#6b7280',
    low_stock: '#f59e0b',
    out_of_stock: '#ef4444',
    in_stock: '#10b981'
  }
  
  return statusColors[status] || '#6b7280'
}

/**
 * Quantity and stock formatting
 */
export const formatQuantity = (quantity, unit = '') => {
  if (quantity === null || quantity === undefined) return '0'
  
  const formattedQty = formatNumber(quantity)
  return unit ? `${formattedQty} ${unit}` : formattedQty
}

export const formatStockLevel = (current, minimum = 0) => {
  if (current === null || current === undefined) return 'Unknown'
  
  if (current <= 0) return 'Out of Stock'
  if (current <= minimum) return 'Low Stock'
  return 'In Stock'
}

/**
 * Address formatting
 */
export const formatAddress = (address) => {
  if (!address) return ''
  
  if (typeof address === 'string') return address
  
  // If it's an object with address parts
  const parts = []
  if (address.street) parts.push(address.street)
  if (address.city) parts.push(address.city)
  if (address.state) parts.push(address.state)
  if (address.zipCode) parts.push(address.zipCode)
  
  return parts.join(', ')
}

/**
 * File size formatting
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validation helpers
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

/**
 * Export default object with all functions
 */
export default {
  // Currency
  formatCurrency,
  formatNumber,
  formatPercentage,
  
  // Date & Time
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  
  // Text
  formatPhoneNumber,
  formatName,
  truncateText,
  capitalizeWords,
  
  // Business
  formatReceiptNumber,
  formatBarcode,
  formatSKU,
  
  // Status
  formatStatus,
  getStatusColor,
  
  // Quantity
  formatQuantity,
  formatStockLevel,
  
  // Address
  formatAddress,
  
  // File
  formatFileSize,
  
  // Validation
  isValidEmail,
  isValidPhoneNumber
}