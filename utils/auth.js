// utils/auth.js - Final version with proper state management
import AsyncStorage from '@react-native-async-storage/async-storage'
import { databaseService } from '../services/database'

class AuthService {
  constructor() {
    this.currentUser = null
    this.isInitialized = false
    this.authListeners = []
  }

  // Initialize auth service
  async initialize() {
    try {
      await this.loadStoredUser()
      this.isInitialized = true
      console.log('🔐 Auth service initialized')
      return true
    } catch (error) {
      console.error('❌ Auth initialization failed:', error)
      this.isInitialized = true
      return false
    }
  }

  // Load user data from storage
  async loadStoredUser() {
    try {
      const userData = await AsyncStorage.getItem('user_data')
      const authToken = await AsyncStorage.getItem('auth_token')
      
      if (userData && authToken) {
        this.currentUser = JSON.parse(userData)
        console.log('✅ User loaded from storage:', this.currentUser.name)
        return this.currentUser
      } else {
        console.log('ℹ️ No stored user found')
        this.currentUser = null
        return null
      }
    } catch (error) {
      console.error('Error loading stored user:', error)
      this.currentUser = null
      return null
    }
  }

  // Login with email and password
  async login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email)
      
      // Get database instance
      const db = databaseService.getDatabase()
      
      // Authenticate user
      const user = await db.getFirstAsync(`
        SELECT 
          u.*,
          c.name as company_name,
          s.name as store_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.email = ? AND u.password = ? AND u.is_active = 1
      `, [email.toLowerCase().trim(), password])
      
      if (!user) {
        throw new Error('Invalid email or password')
      }

      // Update last login
      await db.runAsync(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      )

      // Create user data object
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        store_id: user.store_id,
        company_name: user.company_name,
        store_name: user.store_name,
        phone: user.phone,
        avatar: user.avatar,
        login_time: new Date().toISOString()
      }

      const authToken = `local_${user.id}_${Date.now()}`

      // Store in AsyncStorage first
      await AsyncStorage.setItem('user_data', JSON.stringify(userData))
      await AsyncStorage.setItem('auth_token', authToken)

      // Then update current user
      this.currentUser = userData

      console.log('✅ Login successful:', userData.name, '-', userData.role)
      
      // Notify auth listeners
      this.notifyAuthListeners('login', userData)
      
      return userData
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  // Register new user
  async register(userData) {
    try {
      console.log('📝 Registering new user:', userData.email)
      
      // Get database instance
      const db = databaseService.getDatabase()
      
      // Check if email already exists
      const existingUser = await db.getFirstAsync(
        'SELECT id FROM users WHERE email = ?',
        [userData.email.toLowerCase().trim()]
      )
      
      if (existingUser) {
        throw new Error('Email already exists')
      }

      // Create user in database
      const result = await db.runAsync(`
        INSERT INTO users (name, email, password, role, company_id, store_id, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.name,
        userData.email.toLowerCase().trim(),
        userData.password,
        userData.role || 'cashier',
        userData.company_id || 1,
        userData.store_id || 1,
        userData.phone
      ])

      console.log('✅ User registered successfully:', userData.email)
      
      // Auto-login after registration
      return await this.login(userData.email, userData.password)
    } catch (error) {
      console.error('❌ Registration failed:', error)
      throw error
    }
  }

  // Logout user - CRITICAL FIX
  async logout() {
    try {
      console.log('🚪 Logging out user:', this.currentUser?.name)
      
      // Clear current user FIRST
      const previousUser = this.currentUser
      this.currentUser = null
      
      // Then clear stored data
      await AsyncStorage.multiRemove(['user_data', 'auth_token'])
      
      // Verify data is cleared
      const checkToken = await AsyncStorage.getItem('auth_token')
      const checkUser = await AsyncStorage.getItem('user_data')
      
      if (checkToken || checkUser) {
        console.warn('⚠️ AsyncStorage may not have cleared properly')
        // Force clear again
        await AsyncStorage.clear()
      }
      
      // Notify auth listeners
      this.notifyAuthListeners('logout', previousUser)
      
      console.log('✅ Logout successful - user cleared')
      return true
    } catch (error) {
      console.error('❌ Logout error:', error)
      
      // Force clear everything
      this.currentUser = null
      try {
        await AsyncStorage.clear()
      } catch (clearError) {
        console.error('Failed to clear storage:', clearError)
      }
      
      throw error
    }
  }

  // Add auth state listener
  addAuthListener(callback) {
    this.authListeners.push(callback)
  }

  // Remove auth state listener
  removeAuthListener(callback) {
    this.authListeners = this.authListeners.filter(listener => listener !== callback)
  }

  // Notify all auth listeners
  notifyAuthListeners(event, user) {
    this.authListeners.forEach(callback => {
      try {
        callback(event, user)
      } catch (error) {
        console.error('Auth listener error:', error)
      }
    })
  }

  // Check if user is authenticated - IMPROVED
  isAuthenticated() {
    return !!this.currentUser
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser
  }

  // Force refresh auth state from storage
  async refreshAuthState() {
    try {
      await this.loadStoredUser()
      return this.currentUser
    } catch (error) {
      console.error('Error refreshing auth state:', error)
      this.currentUser = null
      return null
    }
  }

  // Check if user has specific role
  hasRole(role) {
    return this.currentUser?.role === role
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    return roles.includes(this.currentUser?.role)
  }

  // Check if user can access admin features
  isAdmin() {
    return this.hasRole('super_admin')
  }

  // Check if user can access manager features
  isManager() {
    return this.hasAnyRole(['manager', 'super_admin'])
  }

  // Check if user can access cashier features
  isCashier() {
    return this.hasAnyRole(['cashier', 'manager', 'super_admin'])
  }

  // Get dashboard route based on user role
  getDashboardRoute() {
    if (!this.currentUser) return '/login'
    
    switch (this.currentUser.role) {
      case 'super_admin':
        return '/dashboard-admin'
      case 'manager':
        return '/dashboard-manager'
      case 'cashier':
      default:
        return '/dashboard'
    }
  }

  // Reset password (simulation)
  async resetPassword(email) {
    try {
      console.log('🔄 Password reset requested for:', email)
      
      // In a real app, this would send an email
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Password reset email sent (simulated)')
      return { success: true, message: 'Password reset instructions sent to your email' }
    } catch (error) {
      console.error('❌ Password reset failed:', error)
      throw error
    }
  }

  // Get user permissions based on role
  getPermissions() {
    if (!this.currentUser) return []

    const permissions = {
      super_admin: [
        'view_all_stores',
        'manage_users',
        'manage_stores',
        'manage_companies',
        'view_all_reports',
        'manage_system_settings',
        'view_financial_data',
        'manage_inventory',
        'process_sales',
        'manage_customers'
      ],
      manager: [
        'view_store_reports',
        'manage_store_users',
        'manage_inventory',
        'view_store_financial_data',
        'process_sales',
        'manage_customers',
        'view_store_analytics'
      ],
      cashier: [
        'process_sales',
        'view_products',
        'manage_customers',
        'view_own_sales'
      ]
    }

    return permissions[this.currentUser.role] || []
  }

  // Check if user has specific permission
  hasPermission(permission) {
    const userPermissions = this.getPermissions()
    return userPermissions.includes(permission)
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService