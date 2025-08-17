// services/authService.js - Enhanced with offline sync and better error handling
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import databaseService from './database';

class AuthService {
  constructor() {
    // Only use your Vercel deployment
    this.baseURL = 'https://byd-pos-middleware.vercel.app';
    this.token = null;
    this.user = null;
    this.isOfflineMode = false;
    this.lastSyncTime = null;
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url}`, error.response?.data);
        
        // Handle authentication errors (but not for logout endpoint)
        if ((error.response?.status === 401 || error.response?.status === 403) && 
            !error.config?.url?.includes('/auth/logout')) {
          console.log('🔄 Auth error detected, clearing local session...');
          await this.clearLocalAuth();
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Initialize service - load stored credentials and sync data
  async initialize() {
    try {
      console.log('🔄 Initializing AuthService...');
      console.log('📡 Base URL:', this.baseURL);
      
      // Initialize SQLite database first
      await databaseService.initializeDatabase();
      
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      const lastSync = await AsyncStorage.getItem('last_supabase_sync');
      
      this.lastSyncTime = lastSync ? new Date(lastSync) : null;
      
      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
        
        // Try to verify token and sync data
        try {
          const isValid = await this.verifyToken();
          if (isValid) {
            console.log('✅ Auth restored from storage');
            // Try to sync data from Supabase in background
            this.syncSupabaseToSQLite().catch(err => 
              console.log('⚠️ Background sync failed:', err.message)
            );
            return { user: this.user, token: this.token };
          } else {
            console.log('⚠️ Stored token invalid, clearing auth');
            await this.clearStoredAuth();
          }
        } catch (error) {
          console.log('⚠️ Token verification failed (server issue), keeping stored auth');
          this.isOfflineMode = true;
          return { user: this.user, token: this.token };
        }
      }
      
      console.log('ℹ️ No valid auth data found');
      return null;
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      await this.clearStoredAuth();
      return null;
    }
  }

  // Sync data from Supabase to SQLite
  async syncSupabaseToSQLite(force = false) {
    try {
      console.log('🔄 Starting Supabase to SQLite sync...');
      
      // Check if we need to sync (only sync once per hour unless forced)
      if (!force && this.lastSyncTime) {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (this.lastSyncTime > hourAgo) {
          console.log('ℹ️ Sync skipped - already synced within last hour');
          return { synced: false, reason: 'Recently synced' };
        }
      }

      // Try to get data from Supabase
      const syncData = await this.api.get('/sync/all');
      const { users, products, categories, customers, sales } = syncData.data;

      console.log('📊 Sync data received:', {
        users: users?.length || 0,
        products: products?.length || 0,
        categories: categories?.length || 0,
        customers: customers?.length || 0,
        sales: sales?.length || 0
      });

      const db = databaseService.getDatabase();
      
      // Start transaction for atomic sync
      await db.execAsync('BEGIN TRANSACTION');

      try {
        // Sync categories first (no dependencies)
        if (categories?.length) {
          for (const category of categories) {
            await db.runAsync(`
              INSERT OR REPLACE INTO categories 
              (id, name, description, color, icon, is_active, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              category.id, category.name, category.description,
              category.color, category.icon, category.is_active ? 1 : 0,
              category.created_at
            ]);
          }
          console.log(`✅ Synced ${categories.length} categories`);
        }

        // Sync users
        if (users?.length) {
          for (const user of users) {
            await db.runAsync(`
              INSERT OR REPLACE INTO users 
              (id, name, email, password, role, company_id, store_id, phone, avatar, is_active, last_login, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              user.id, user.name, user.email, user.password, user.role,
              user.company_id, user.store_id, user.phone, user.avatar,
              user.is_active ? 1 : 0, user.last_login, user.created_at, user.updated_at
            ]);
          }
          console.log(`✅ Synced ${users.length} users`);
        }

        // Sync products
        if (products?.length) {
          for (const product of products) {
            await db.runAsync(`
              INSERT OR REPLACE INTO products 
              (id, name, description, price, cost, stock_quantity, min_stock, barcode, sku, category_id, store_id, image, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              product.id, product.name, product.description, product.price,
              product.cost, product.stock_quantity, product.min_stock,
              product.barcode, product.sku, product.category_id, product.store_id,
              product.image, product.is_active ? 1 : 0, product.created_at, product.updated_at
            ]);
          }
          console.log(`✅ Synced ${products.length} products`);
        }

        // Sync customers
        if (customers?.length) {
          for (const customer of customers) {
            await db.runAsync(`
              INSERT OR REPLACE INTO customers 
              (id, name, email, phone, address, loyalty_points, total_spent, store_id, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              customer.id, customer.name, customer.email, customer.phone,
              customer.address, customer.loyalty_points, customer.total_spent,
              customer.store_id, customer.created_at, customer.updated_at
            ]);
          }
          console.log(`✅ Synced ${customers.length} customers`);
        }

        // Commit transaction
        await db.execAsync('COMMIT');
        
        // Update last sync time
        this.lastSyncTime = new Date();
        await AsyncStorage.setItem('last_supabase_sync', this.lastSyncTime.toISOString());
        
        console.log('✅ Supabase to SQLite sync completed successfully');
        return { 
          synced: true, 
          counts: {
            categories: categories?.length || 0,
            users: users?.length || 0,
            products: products?.length || 0,
            customers: customers?.length || 0,
            sales: sales?.length || 0
          },
          syncTime: this.lastSyncTime
        };

      } catch (dbError) {
        await db.execAsync('ROLLBACK');
        throw dbError;
      }

    } catch (error) {
      console.error('❌ Supabase sync failed:', error);
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  // Enhanced login method with offline fallback
  async login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('📡 Using server:', this.baseURL);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!this.isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      let loginResult = null;
      let isOnlineLogin = false;

      // Try online login first
      try {
        const response = await this.api.post('/auth/login', {
          email: email.trim().toLowerCase(),
          password: password.trim()
        });

        const { user, token, source } = response.data;
        
        if (!user || !token) {
          throw new Error('Invalid response from server');
        }

        loginResult = { user, token, source: source || 'supabase' };
        isOnlineLogin = true;
        this.isOfflineMode = false;

        // Sync data after successful online login
        try {
          await this.syncSupabaseToSQLite(true); // Force sync on login
        } catch (syncError) {
          console.log('⚠️ Post-login sync failed:', syncError.message);
        }

      } catch (onlineError) {
        console.log('⚠️ Online login failed, trying offline...', onlineError.message);
        
        // Try offline login using SQLite
        const offlineUser = await databaseService.authenticateUser(email, password);
        
        if (offlineUser) {
          loginResult = {
            user: {
              id: offlineUser.id,
              name: offlineUser.name,
              email: offlineUser.email,
              role: offlineUser.role,
              company_id: offlineUser.company_id,
              store_id: offlineUser.store_id,
              phone: offlineUser.phone,
              avatar: offlineUser.avatar
            },
            token: 'offline_token_' + Date.now(),
            source: 'local'
          };
          this.isOfflineMode = true;
        } else {
          // No account found in online or offline
          throw new Error('No account found with these credentials. Please check your email and password, or create a new account.');
        }
      }

      if (!loginResult) {
        throw new Error('Login failed - no account found');
      }

      // Store authentication data
      this.token = loginResult.token;
      this.user = loginResult.user;
      
      // Persist to storage
      await this.storeAuth(loginResult.token, loginResult.user);
      
      console.log(`✅ Login successful - User: ${loginResult.user.name} (${loginResult.user.role})`);
      console.log(`📊 Source: ${loginResult.source} (${isOnlineLogin ? 'Online' : 'Offline'})`);
      
      return loginResult;
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  // Register method (only works online)
  async register(userData) {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      
      const response = await this.api.post('/auth/register', userData);
      const { user, token, source } = response.data;
      
      console.log(`✅ Registration successful - User: ${user.name}`);
      
      // Don't auto-login after registration
      return { 
        user, 
        token, 
        source: source || 'supabase',
        message: 'Account created successfully! Please sign in to continue.'
      };
      
    } catch (error) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            throw new Error(data.error || 'Invalid registration data');
          case 409:
            throw new Error('An account with this email already exists. Please use a different email or try signing in.');
          case 503:
            throw new Error('Server is temporarily unavailable. Please try again in a moment.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(data.error || `Server error (${status})`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Cannot connect to server. Registration requires internet connection.');
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      lastSyncTime: this.lastSyncTime,
      isOfflineMode: this.isOfflineMode,
      hasSyncedData: !!this.lastSyncTime
    };
  }

  // Force sync
  async forcSync() {
    return await this.syncSupabaseToSQLite(true);
  }

  // Verify if current token is valid
  async verifyToken() {
    try {
      if (!this.token) return false;
      
      const response = await this.api.get('/auth/profile');
      return response.status === 200;
      
    } catch (error) {
      console.log('Token verification failed:', error.response?.status || error.message);
      return false;
    }
  }

  // FIXED: Enhanced logout method that handles token errors gracefully
  async logout() {
    try {
      console.log('🚪 Logging out...');
      
      // Always clear local data first to ensure user is logged out
      const wasAuthenticated = !!(this.token && this.user);
      const userEmail = this.user?.email || 'unknown';
      
      // Clear local data immediately
      this.token = null;
      this.user = null;
      this.isOfflineMode = false;
      await this.clearStoredAuth();
      
      // Try to notify server (but don't fail the logout if this fails)
      if (wasAuthenticated) {
        try {
          // Use a separate axios instance without interceptors to avoid recursive logout calls
          const logoutApi = axios.create({
            baseURL: this.baseURL,
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
          });
          
          await logoutApi.post('/auth/logout', {}, {
            headers: {
              'Authorization': `Bearer ${this.token}` // Use the old token for this final request
            }
          });
          console.log('✅ Server logout notification successful');
        } catch (serverError) {
          // Log but don't throw - logout should still succeed locally
          console.log('⚠️ Server logout notification failed (continuing with local logout):', 
                     serverError.response?.status || serverError.message);
        }
      }
      
      console.log(`✅ Logout successful for: ${userEmail}`);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still ensure local cleanup happens
      this.token = null;
      this.user = null;
      this.isOfflineMode = false;
      await this.clearStoredAuth();
      console.log('✅ Local logout completed despite server error');
    }
  }

  // Clear local authentication without server call
  async clearLocalAuth() {
    console.log('🧹 Clearing local authentication...');
    this.token = null;
    this.user = null;
    this.isOfflineMode = false;
    await this.clearStoredAuth();
  }

  // Get user profile
  async getProfile() {
    try {
      if (this.isOfflineMode) {
        // Get profile from SQLite
        const user = await databaseService.getDatabase().getFirstAsync(
          'SELECT * FROM users WHERE id = ?',
          [this.user.id]
        );
        return user;
      } else {
        const response = await this.api.get('/auth/profile');
        this.user = response.data.user;
        await AsyncStorage.setItem('auth_user', JSON.stringify(this.user));
        return this.user;
      }
    } catch (error) {
      console.error('Get profile failed:', error);
      throw error;
    }
  }

  // Check server health with retry logic for 503 errors
  async checkHealth(retryCount = 3) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        console.log(`🔍 Health check attempt ${attempt}/${retryCount} at:`, `${this.baseURL}/health`);
        
        const response = await axios.get(`${this.baseURL}/health`, { 
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ Health check successful:', response.data);
        return {
          status: response.data.status,
          database: response.data.database,
          timestamp: response.data.timestamp,
          server_info: response.data.server || {}
        };
        
      } catch (error) {
        console.error(`❌ Health check attempt ${attempt} failed:`, error.message);
        
        if (error.response?.status === 503 && attempt < retryCount) {
          console.log(`⏳ Server returned 503, waiting before retry ${attempt + 1}...`);
          // Wait longer for each retry (Vercel cold start can take time)
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        
        if (attempt === retryCount) {
          // Final attempt failed
          if (error.response?.status === 503) {
            throw new Error('Server is temporarily unavailable (503). This is likely due to Vercel cold start or maintenance. Please try again in a few moments.');
          } else {
            throw new Error(`Server health check failed: ${error.message}`);
          }
        }
      }
    }
  }

  // Get current authentication status
  getAuthStatus() {
    return {
      isAuthenticated: !!(this.token && this.user),
      user: this.user,
      token: this.token,
      isOfflineMode: this.isOfflineMode,
      lastSyncTime: this.lastSyncTime
    };
  }

  // Utility methods
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Store authentication data
  async storeAuth(token, user) {
    try {
      await AsyncStorage.multiSet([
        ['auth_token', token],
        ['auth_user', JSON.stringify(user)]
      ]);
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }
  }

  // Clear stored authentication data
  async clearStoredAuth() {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  // Get stored token
  async getStoredToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;