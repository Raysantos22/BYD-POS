// services/storeService.js - Store Management Service with Company Support
import authService from './authService'

class StoreService {
  constructor() {
    this.baseURL = 'https://byd-pos-middleware.vercel.app'
  }

  getAuthHeaders() {
    const token = authService.token
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  // Get all stores with company grouping
  async getStores(options = {}) {
    try {
      console.log('🏪 Fetching stores from API...')
      
      const response = await fetch(`${this.baseURL}/stores`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      let stores = data.stores || []

      // Group by company if requested
      if (options.groupByCompany) {
        const grouped = {}
        stores.forEach(store => {
          const company = store.company || 'Default Company'
          if (!grouped[company]) {
            grouped[company] = []
          }
          grouped[company].push(store)
        })
        return grouped
      }

      console.log('✅ Stores fetched:', stores.length)
      return stores

    } catch (error) {
      console.error('❌ Failed to fetch stores:', error)
      
      // Return mock data for development
      const mockStores = [
        { 
          id: 'store-001', 
          name: 'Main Branch', 
          company: 'TechCorp',
          address: '123 Main St, City',
          phone: '+1234567890',
          is_active: true
        },
        { 
          id: 'store-002', 
          name: 'Mall Branch', 
          company: 'TechCorp',
          address: '456 Mall Ave, City',
          phone: '+1234567891',
          is_active: true
        },
        { 
          id: 'store-003', 
          name: 'City Center', 
          company: 'TechCorp',
          address: '789 Center Blvd, City',
          phone: '+1234567892',
          is_active: true
        },
        { 
          id: 'store-004', 
          name: 'Downtown', 
          company: 'RetailCorp',
          address: '321 Downtown St, City',
          phone: '+1234567893',
          is_active: true
        },
        { 
          id: 'store-005', 
          name: 'Suburb Plaza', 
          company: 'RetailCorp',
          address: '654 Suburb Rd, City',
          phone: '+1234567894',
          is_active: true
        }
      ]

      if (options.groupByCompany) {
        const grouped = {}
        mockStores.forEach(store => {
          const company = store.company
          if (!grouped[company]) {
            grouped[company] = []
          }
          grouped[company].push(store)
        })
        return grouped
      }

      return mockStores
    }
  }


  // Get stores by company
  async getStoresByCompany(company) {
    try {
      const stores = await this.getStores()
      return stores.filter(store => store.company === company)
    } catch (error) {
      console.error('❌ Failed to fetch stores by company:', error)
      throw error
    }
  }

  // Get unique companies
  async getCompanies() {
    try {
      const stores = await this.getStores()
      const companies = [...new Set(stores.map(store => store.company))]
      return companies.map(company => ({
        name: company,
        storeCount: stores.filter(store => store.company === company).length,
        stores: stores.filter(store => store.company === company)
      }))
    } catch (error) {
      console.error('❌ Failed to fetch companies:', error)
      throw error
    }
  }

  // Create new store
  async createStore(storeData, currentUser) {
    try {
      console.log('📝 Creating store:', storeData.name)
      
      if (!currentUser || currentUser.role !== 'super_admin') {
        throw new Error('Only super admins can create stores')
      }

      const response = await fetch(`${this.baseURL}/stores`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(storeData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Store created:', result.store?.name)
      return result.store

    } catch (error) {
      console.error('❌ Failed to create store:', error)
      throw error
    }
  }

  // Update store
  async updateStore(storeId, updates, currentUser) {
    try {
      console.log('📝 Updating store:', storeId)
      
      if (!currentUser || currentUser.role !== 'super_admin') {
        throw new Error('Only super admins can update stores')
      }

      const response = await fetch(`${this.baseURL}/stores/${storeId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Store updated:', result.store?.name)
      return result.store

    } catch (error) {
      console.error('❌ Failed to update store:', error)
      throw error
    }
  }

  // Get store by ID
  async getStoreById(storeId) {
    try {
      const stores = await this.getStores()
      return stores.find(store => store.id === storeId)
    } catch (error) {
      console.error('❌ Failed to fetch store by ID:', error)
      throw error
    }
  }

  // Get stores accessible by user
  async getUserStores(currentUser) {
    try {
      const allStores = await this.getStores()
      
      if (currentUser.role === 'super_admin') {
        return allStores
      } else if (currentUser.role === 'manager' && currentUser.store_id) {
        return allStores.filter(store => store.id === currentUser.store_id)
      } else if (currentUser.role === 'cashier' && currentUser.store_id) {
        return allStores.filter(store => store.id === currentUser.store_id)
      }
      
      return []
    } catch (error) {
      console.error('❌ Failed to fetch user stores:', error)
      throw error
    }
  }

  // Check if user has access to store
  hasStoreAccess(currentUser, storeId) {
    if (currentUser.role === 'super_admin') {
      return true
    }
    
    if (currentUser.role === 'manager' || currentUser.role === 'cashier') {
      return currentUser.store_id === storeId
    }
    
    return false
  }

  // Get store options for dropdowns
  async getStoreOptions(currentUser, options = {}) {
    try {
      const stores = await this.getUserStores(currentUser)
      
      let storeOptions = stores.map(store => ({
        label: options.includeCompany ? 
          `${store.name} (${store.company})` : 
          store.name,
        value: store.id,
        company: store.company,
        ...store
      }))

      // Add "All Stores" option for super admin
      if (currentUser.role === 'super_admin' && options.includeAll) {
        storeOptions.unshift({
          label: 'All Stores',
          value: 'all',
          company: null
        })
      }

      // Group by company if requested
      if (options.groupByCompany) {
        const grouped = {}
        storeOptions.forEach(option => {
          const company = option.company || 'Other'
          if (!grouped[company]) {
            grouped[company] = []
          }
          grouped[company].push(option)
        })
        return grouped
      }

      return storeOptions
    } catch (error) {
      console.error('❌ Failed to get store options:', error)
      return []
    }
  }

  // Multi-store product management helpers
  async getProductAvailability(productId, currentUser) {
    try {
      console.log('🔍 Checking product availability across stores:', productId)
      
      // This would typically call an API endpoint
      // For now, return mock data
      const mockAvailability = {
        product_id: productId,
        stores: [
          {
            store_id: 'store-001',
            store_name: 'Main Branch',
            is_available: true,
            stock_quantity: 50,
            price_override: null,
            last_updated: new Date().toISOString()
          },
          {
            store_id: 'store-002',
            store_name: 'Mall Branch',
            is_available: true,
            stock_quantity: 25,
            price_override: 105.00,
            last_updated: new Date().toISOString()
          },
          {
            store_id: 'store-003',
            store_name: 'City Center',
            is_available: false,
            stock_quantity: 0,
            price_override: null,
            last_updated: new Date().toISOString()
          }
        ]
      }

      return mockAvailability
    } catch (error) {
      console.error('❌ Failed to get product availability:', error)
      throw error
    }
  }

  async updateProductAvailability(productId, storeAvailability, currentUser) {
    try {
      console.log('📝 Updating product availability:', productId)
      
      if (!currentUser || currentUser.role !== 'super_admin') {
        throw new Error('Only super admins can manage multi-store availability')
      }

      // This would typically call an API endpoint
      console.log('Store availability updates:', storeAvailability)
      
      // Mock successful update
      return {
        success: true,
        updated_stores: storeAvailability.length,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Failed to update product availability:', error)
      throw error
    }
  }

  // Company management for super admins
  async createCompany(companyData, currentUser) {
    try {
      console.log('📝 Creating company:', companyData.name)
      
      if (!currentUser || currentUser.role !== 'super_admin') {
        throw new Error('Only super admins can create companies')
      }

      // Mock company creation
      const newCompany = {
        id: `company-${Date.now()}`,
        name: companyData.name,
        description: companyData.description || '',
        settings: companyData.settings || {},
        created_at: new Date().toISOString(),
        created_by: currentUser.id
      }

      console.log('✅ Company created:', newCompany.name)
      return newCompany
    } catch (error) {
      console.error('❌ Failed to create company:', error)
      throw error
    }
  }

  // Bulk operations for multiple stores
  async bulkUpdateStores(storeIds, updates, currentUser) {
    try {
      console.log('📝 Bulk updating stores:', storeIds.length)
      
      if (!currentUser || currentUser.role !== 'super_admin') {
        throw new Error('Only super admins can perform bulk operations')
      }

      const results = []
      for (const storeId of storeIds) {
        try {
          const result = await this.updateStore(storeId, updates, currentUser)
          results.push({ storeId, success: true, data: result })
        } catch (error) {
          results.push({ storeId, success: false, error: error.message })
        }
      }

      console.log('✅ Bulk update completed:', results.filter(r => r.success).length, 'of', results.length)
      return results
    } catch (error) {
      console.error('❌ Failed to bulk update stores:', error)
      throw error
    }
  }

  async bulkCreateProducts(productData, storeIds, currentUser) {
    try {
      console.log('📝 Bulk creating product in stores:', storeIds.length)
      
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        throw new Error('Insufficient permissions for bulk product creation')
      }

      const results = []
      
      // Import productService here to avoid circular dependency
      const productService = require('./productService').default
      
      for (const storeId of storeIds) {
        try {
          const storeProductData = {
            ...productData,
            store_id: storeId,
            // Use store-specific stock if provided
            stock_quantity: productData.store_specific_stock?.[storeId] || productData.stock_quantity || 0,
            // Use store-specific price if provided
            store_price: productData.store_specific_prices?.[storeId] || null
          }
          
          const result = await productService.createProduct(storeProductData, currentUser)
          results.push({ 
            storeId, 
            success: true, 
            data: result,
            store_name: (await this.getStoreById(storeId))?.name || storeId
          })
        } catch (error) {
          results.push({ 
            storeId, 
            success: false, 
            error: error.message,
            store_name: (await this.getStoreById(storeId))?.name || storeId
          })
        }
      }

      const successCount = results.filter(r => r.success).length
      console.log(`✅ Bulk product creation completed: ${successCount}/${results.length} stores`)
      
      return {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount,
        results: results
      }
    } catch (error) {
      console.error('❌ Failed to bulk create products:', error)
      throw error
    }
  }

  // Store statistics and analytics
  async getStoreStats(storeId = null, currentUser) {
    try {
      console.log('📊 Fetching store statistics...')
      
      // Mock store statistics
      const mockStats = {
        totalStores: 5,
        activeStores: 5,
        totalProducts: 150,
        totalCategories: 8,
        totalStaff: 25,
        averageStockLevel: 75,
        storePerformance: [
          { store_id: 'store-001', name: 'Main Branch', revenue: 125000, products: 45, staff: 8 },
          { store_id: 'store-002', name: 'Mall Branch', revenue: 98000, products: 38, staff: 6 },
          { store_id: 'store-003', name: 'City Center', revenue: 87000, products: 42, staff: 5 },
          { store_id: 'store-004', name: 'Downtown', revenue: 76000, products: 35, staff: 4 },
          { store_id: 'store-005', name: 'Suburb Plaza', revenue: 65000, products: 30, staff: 2 }
        ]
      }

      // Filter by specific store if requested
      if (storeId && storeId !== 'all') {
        const storePerf = mockStats.storePerformance.find(s => s.store_id === storeId)
        if (storePerf) {
          return {
            store: storePerf,
            totalProducts: storePerf.products,
            totalStaff: storePerf.staff,
            revenue: storePerf.revenue
          }
        }
      }

      return mockStats
    } catch (error) {
      console.error('❌ Failed to get store stats:', error)
      throw error
    }
  }

  // Validation helpers
  validateStoreData(storeData) {
    const errors = []
    
    if (!storeData.name || storeData.name.trim().length === 0) {
      errors.push('Store name is required')
    }
    
    if (!storeData.company || storeData.company.trim().length === 0) {
      errors.push('Company is required')
    }
    
    if (storeData.phone && !/^\+?[\d\s\-\(\)]+$/.test(storeData.phone)) {
      errors.push('Invalid phone number format')
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }

  // Utility methods
  formatStoreDisplay(store, options = {}) {
    if (!store) return 'Unknown Store'
    
    let display = store.name
    
    if (options.includeCompany && store.company) {
      display += ` (${store.company})`
    }
    
    if (options.includeAddress && store.address) {
      display += ` - ${store.address}`
    }
    
    return display
  }

  getStoresByCompanyMap(stores) {
    const companyMap = {}
    stores.forEach(store => {
      const company = store.company || 'Other'
      if (!companyMap[company]) {
        companyMap[company] = []
      }
      companyMap[company].push(store)
    })
    return companyMap
  }

  // Connection status
  async checkConnectionStatus() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        timeout: 5000
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
}

// Export singleton instance
export const storeService = new StoreService()
export default storeService


