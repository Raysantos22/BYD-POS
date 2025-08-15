// services/hybridAuthService.js
import { databaseService } from './database'
import { supabaseService } from './supabaseService'

class HybridAuthService {
  constructor() {
    this.useSupabase = false // Toggle this to switch between local/remote
    this.currentUser = null
  }

  // Configure which service to use
  setDataSource(useSupabase = false) {
    this.useSupabase = useSupabase
    console.log(`🔧 Auth service configured to use: ${useSupabase ? 'Supabase' : 'Local SQLite'}`)
  }

  // Test connections and determine best service
  async initializeService() {
    try {
      console.log('🔍 Testing data source connections...')
      
      // Test Supabase connection
      const supabaseConnected = await supabaseService.testConnection()
      
      // Test local database
      const localConnected = await databaseService.checkDatabaseHealth()
      
      if (supabaseConnected && this.useSupabase) {
        console.log('✅ Using Supabase as primary data source')
        return 'supabase'
      } else if (localConnected) {
        console.log('✅ Using local SQLite as primary data source')
        return 'local'
      } else {
        throw new Error('No data source available')
      }
    } catch (error) {
      console.error('❌ Error initializing hybrid auth service:', error)
      throw error
    }
  }

  // Authentication Methods
  async login(email, password) {
    try {
      if (this.useSupabase) {
        return await this.loginWithSupabase(email, password)
      } else {
        return await this.loginWithLocal(email, password)
      }
    } catch (error) {
      // Fallback to other service if primary fails
      console.warn('⚠️ Primary auth failed, trying fallback...')
      try {
        if (this.useSupabase) {
          return await this.loginWithLocal(email, password)
        } else {
          return await this.loginWithSupabase(email, password)
        }
      } catch (fallbackError) {
        console.error('❌ Both auth services failed')
        throw error // Throw original error
      }
    }
  }

  async loginWithSupabase(email, password) {
    try {
      const result = await supabaseService.signInWithEmail(email, password)
      
      this.currentUser = {
        id: result.user.id,
        email: result.user.email,
        name: result.profile?.name || result.user.email,
        role: result.profile?.role || 'cashier',
        company_id: result.profile?.company_id,
        store_id: result.profile?.store_id,
        company_name: result.profile?.company?.name,
        store_name: result.profile?.store?.name,
        source: 'supabase'
      }

      console.log('✅ Supabase login successful')
      return this.currentUser
    } catch (error) {
      console.error('❌ Supabase login failed:', error)
      throw error
    }
  }

  async loginWithLocal(email, password) {
    try {
      const user = await databaseService.authenticateUser(email, password)
      
      if (!user) {
        throw new Error('Invalid email or password')
      }

      this.currentUser = {
        ...user,
        source: 'local'
      }

      console.log('✅ Local login successful')
      return this.currentUser
    } catch (error) {
      console.error('❌ Local login failed:', error)
      throw error
    }
  }

  async register(userData) {
    try {
      if (this.useSupabase) {
        return await this.registerWithSupabase(userData)
      } else {
        return await this.registerWithLocal(userData)
      }
    } catch (error) {
      console.error('❌ Registration failed:', error)
      throw error
    }
  }

  async registerWithSupabase(userData) {
    try {
      const result = await supabaseService.signUpWithEmail(
        userData.email,
        userData.password,
        {
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          company_id: userData.company_id,
          store_id: userData.store_id
        }
      )

      console.log('✅ Supabase registration successful')
      return result
    } catch (error) {
      console.error('❌ Supabase registration failed:', error)
      throw error
    }
  }

  async registerWithLocal(userData) {
    try {
      const user = await databaseService.createUser(userData)
      
      // Automatically log in after registration
      this.currentUser = {
        ...user,
        source: 'local'
      }

      console.log('✅ Local registration successful')
      return user
    } catch (error) {
      console.error('❌ Local registration failed:', error)
      throw error
    }
  }

  async logout() {
    try {
      if (this.useSupabase) {
        await supabaseService.signOut()
      }
      
      this.currentUser = null
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout error:', error)
      this.currentUser = null // Clear user anyway
    }
  }

  // Data Fetching Methods with Fallback
  async getUsers(storeId = null) {
    try {
      if (this.useSupabase) {
        return await supabaseService.getUsers(storeId)
      } else {
        return await databaseService.getUsers(storeId)
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      return []
    }
  }

  async getProducts(storeId = null, categoryId = null) {
    try {
      if (this.useSupabase) {
        return await supabaseService.getProducts(storeId, categoryId)
      } else {
        return await databaseService.getProducts(storeId, categoryId)
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error)
      return []
    }
  }

  async getSales(storeId = null, limit = 50) {
    try {
      if (this.useSupabase) {
        return await supabaseService.getSales(storeId, limit)
      } else {
        return await databaseService.getSales(storeId, limit)
      }
    } catch (error) {
      console.error('❌ Error fetching sales:', error)
      return []
    }
  }

  async getSalesStats(storeId = null, dateFrom = null, dateTo = null) {
    try {
      if (this.useSupabase) {
        return await supabaseService.getSalesStats(storeId, dateFrom, dateTo)
      } else {
        return await databaseService.getSalesStats(storeId, dateFrom, dateTo)
      }
    } catch (error) {
      console.error('❌ Error fetching sales stats:', error)
      return {
        total_transactions: 0,
        total_revenue: 0,
        avg_transaction: 0,
        today_revenue: 0,
        today_transactions: 0
      }
    }
  }

  async getLowStockProducts(storeId = null) {
    try {
      if (this.useSupabase) {
        return await supabaseService.getLowStockProducts(storeId)
      } else {
        return await databaseService.getLowStockProducts(storeId)
      }
    } catch (error) {
      console.error('❌ Error fetching low stock products:', error)
      return []
    }
  }

  async createSale(saleData, items) {
    try {
      if (this.useSupabase) {
        return await supabaseService.createSale(saleData, items)
      } else {
        return await databaseService.createSale(saleData, items)
      }
    } catch (error) {
      console.error('❌ Error creating sale:', error)
      throw error
    }
  }

  // Sync Methods (for future implementation)
  async syncLocalToSupabase() {
    try {
      console.log('🔄 Starting sync from local to Supabase...')
      
      // Get all local data
      const localUsers = await databaseService.getUsers()
      const localProducts = await databaseService.getProducts()
      const localSales = await databaseService.getSales()
      
      // TODO: Implement sync logic
      // This would involve checking timestamps and syncing new/updated records
      
      console.log('✅ Sync completed')
    } catch (error) {
      console.error('❌ Sync failed:', error)
      throw error
    }
  }

  async syncSupabaseToLocal() {
    try {
      console.log('🔄 Starting sync from Supabase to local...')
      
      // Get Supabase data
      const supabaseUsers = await supabaseService.getUsers()
      const supabaseProducts = await supabaseService.getProducts()
      const supabaseSales = await supabaseService.getSales()
      
      // TODO: Implement sync logic
      // This would involve updating local database with remote data
      
      console.log('✅ Sync completed')
    } catch (error) {
      console.error('❌ Sync failed:', error)
      throw error
    }
  }

  // Utility Methods
  getCurrentUser() {
    return this.currentUser
  }

  isAuthenticated() {
    return this.currentUser !== null
  }

  getUserRole() {
    return this.currentUser?.role || null
  }

  getStoreId() {
    return this.currentUser?.store_id || null
  }

  getCompanyId() {
    return this.currentUser?.company_id || null
  }

  getDashboardRoute() {
    if (!this.currentUser) return '/login'
    
    const role = this.currentUser.role
    switch (role) {
      case 'super_admin':
        return '/dashboard-admin'
      case 'admin':
        return '/dashboard-admin'
      case 'manager':
        return '/dashboard-manager'
      case 'cashier':
        return '/dashboard-cashier'
      default:
        return '/dashboard-cashier'
    }
  }

  // Configuration Methods
  getDataSourceInfo() {
    return {
      primary: this.useSupabase ? 'supabase' : 'local',
      currentUser: this.currentUser,
      userSource: this.currentUser?.source || null
    }
  }
}

// Export singleton instance
export const hybridAuthService = new HybridAuthService()
export default hybridAuthService