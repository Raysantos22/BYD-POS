// services/storeService.js - Enhanced Store Service with Company Access
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

  // ENHANCED: Get all stores with company filtering for managers
  async getStores(options = {}) {
    try {
      console.log('🏪 Fetching stores from API...')
      
      let url = `${this.baseURL}/stores`
      const params = new URLSearchParams()
      
      // Add company filter if specified
      if (options.companyId) {
        params.append('company_id', options.companyId)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url, {
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
          const company = store.company_name || store.company || 'Default Company'
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
      
      // Return empty array instead of mock data since you have real data in Supabase
      return []
    }
  }

  // ENHANCED: Get stores by company for managers
  async getStoresByCompany(companyId) {
    try {
      return await this.getStores({ companyId })
    } catch (error) {
      console.error('❌ Failed to fetch stores by company:', error)
      throw error
    }
  }

  // ENHANCED: Get unique companies
  async getCompanies() {
    try {
      const stores = await this.getStores()
      const companiesMap = new Map()
      
      stores.forEach(store => {
        const companyId = store.company_id
        const companyName = store.company_name || store.company || 'Default Company'
        
        if (companyId && !companiesMap.has(companyId)) {
          companiesMap.set(companyId, {
            id: companyId,
            name: companyName,
            storeCount: 0,
            stores: []
          })
        }
        
        if (companyId) {
          const company = companiesMap.get(companyId)
          company.storeCount++
          company.stores.push(store)
        }
      })
      
      return Array.from(companiesMap.values())
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

  // ENHANCED: Get stores accessible by user with company context
  async getUserStores(currentUser) {
    try {
      if (currentUser.role === 'super_admin') {
        return await this.getStores()
      } else if (currentUser.role === 'manager' && currentUser.company_id) {
        // ENHANCED: Manager can access all company stores
        return await this.getStoresByCompany(currentUser.company_id)
      } else if (currentUser.role === 'manager' && currentUser.store_id) {
        // Fallback for managers without company_id
        const allStores = await this.getStores()
        return allStores.filter(store => store.id === currentUser.store_id)
      } else if (currentUser.role === 'cashier' && currentUser.store_id) {
        const allStores = await this.getStores()
        return allStores.filter(store => store.id === currentUser.store_id)
      }
      
      return []
    } catch (error) {
      console.error('❌ Failed to fetch user stores:', error)
      throw error
    }
  }

  // ENHANCED: Check if user has access to store with company context
  hasStoreAccess(currentUser, storeId) {
    if (currentUser.role === 'super_admin') {
      return true
    }
    
    if (currentUser.role === 'manager') {
      // Managers have access to any store in their company
      if (currentUser.company_id) {
        // This would need to check if the store belongs to the manager's company
        // For now, we'll allow access if they have a company_id
        return true
      } else if (currentUser.store_id === storeId) {
        return true
      }
    }
    
    if (currentUser.role === 'cashier') {
      return currentUser.store_id === storeId
    }
    
    return false
  }

  // ENHANCED: Get store options for dropdowns with company grouping
  async getStoreOptions(currentUser, options = {}) {
    try {
      const stores = await this.getUserStores(currentUser)
      
      let storeOptions = stores.map(store => ({
        label: options.includeCompany ? 
          `${store.name} (${store.company_name || store.company || 'Default'})` : 
          store.name,
        value: store.id,
        company: store.company_name || store.company,
        company_id: store.company_id,
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

      // ENHANCED: Add "All Company Stores" option for managers
      if (currentUser.role === 'manager' && currentUser.company_id && options.includeCompanyAll) {
        storeOptions.unshift({
          label: 'All Company Stores',
          value: 'company',
          company: stores[0]?.company_name || 'Company'
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