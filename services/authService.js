// services/authService.js - Simplified version for users only
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import databaseService from './database';

class AuthService {
  constructor() {
    this.baseURL = 'https://byd-pos-middleware.vercel.app';
    this.token = null;
    this.user = null;
    this.isOfflineMode = false;
    this.lastSyncTime = null;
    
    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url}`);
        
        // Handle auth errors
        if ((error.response?.status === 401 || error.response?.status === 403) && 
            !error.config?.url?.includes('/auth/logout')) {
          console.log('🔄 Auth error detected, clearing local session...');
          await this.clearLocalAuth();
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Initialize service
  async initialize() {
    try {
      console.log('🔄 Initializing AuthService...');
      
      // Initialize SQLite database first
      await databaseService.initializeDatabase();
      
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      const lastSync = await AsyncStorage.getItem('last_supabase_sync');
      
      this.lastSyncTime = lastSync ? new Date(lastSync) : null;
      
      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
        
        try {
          const isValid = await this.verifyToken();
          if (isValid) {
            console.log('✅ Auth restored from storage');
            this.syncUsersFromSupabase().catch(err => 
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

  // Simplified sync method - only sync users
  async syncUsersFromSupabase(force = false) {
    try {
      console.log('🔄 Starting users sync from Supabase...');
      
      // Check if we need to sync
      if (!force && this.lastSyncTime) {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (this.lastSyncTime > hourAgo) {
          console.log('ℹ️ Sync skipped - already synced within last hour');
          return { synced: false, reason: 'Recently synced' };
        }
      }

      // Get users from Supabase
      const response = await this.api.get('/sync/users');
      const { users } = response.data;
      
      console.log('📊 Sync data received:', { users: users?.length || 0 });

      if (!users || !Array.isArray(users) || users.length === 0) {
        console.log('⚠️ No users to sync');
        return { synced: false, reason: 'No users data received' };
      }

      // Sync users to SQLite
      const syncResult = await databaseService.syncUsers(users);
      
      if (syncResult.synced > 0) {
        // Update last sync time
        this.lastSyncTime = new Date();
        await AsyncStorage.setItem('last_supabase_sync', this.lastSyncTime.toISOString());
        
        console.log(`✅ Users sync completed - ${syncResult.synced}/${syncResult.total} users synced`);
        
        return {
          synced: true,
          counts: {
            users: syncResult.synced,
            failed: syncResult.failed,
            total: syncResult.total
          },
          syncTime: this.lastSyncTime,
          details: `Synced ${syncResult.synced} users successfully`,
          errors: syncResult.errors
        };
      } else {
        throw new Error(`Sync failed: All ${users.length} users failed to sync`);
      }

    } catch (error) {
      console.error('❌ Users sync failed:', error);
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  // Login method with simplified offline fallback
  async login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);
      
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

        // Sync users after successful online login
        try {
          await this.syncUsersFromSupabase(true);
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
              phone: offlineUser.phone
            },
            token: 'offline_token_' + Date.now(),
            source: 'local'
          };
          this.isOfflineMode = true;
        } else {
          throw new Error('No account found with these credentials. Please check your email and password.');
        }
      }

      if (!loginResult) {
        throw new Error('Login failed - no account found');
      }

      // Store authentication data
      this.token = loginResult.token;
      this.user = loginResult.user;
      
      await this.storeAuth(loginResult.token, loginResult.user);
      
      console.log(`✅ Login successful - User: ${loginResult.user.name} (${loginResult.user.role})`);
      console.log(`📊 Source: ${loginResult.source} (${isOnlineLogin ? 'Online' : 'Offline'})`);
      
      return loginResult;
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  // Register method
  async register(userData) {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      
      const response = await this.api.post('/auth/register', userData);
      const { user, token, source } = response.data;
      
      console.log(`✅ Registration successful - User: ${user.name}`);
      
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
            throw new Error('An account with this email already exists.');
          case 503:
            throw new Error('Server is temporarily unavailable. Please try again.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(data.error || `Server error (${status})`);
        }
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

  // Get detailed sync status with database stats
  async getDetailedSyncStatus() {
    try {
      const dbStats = await databaseService.getDatabaseStats();
      return {
        lastSyncTime: this.lastSyncTime,
        isOfflineMode: this.isOfflineMode,
        hasSyncedData: !!this.lastSyncTime,
        databaseStats: dbStats
      };
    } catch (error) {
      console.error('Failed to get detailed sync status:', error);
      return {
        lastSyncTime: this.lastSyncTime,
        isOfflineMode: this.isOfflineMode,
        hasSyncedData: !!this.lastSyncTime,
        error: error.message
      };
    }
  }

  // Force sync
  async forcSync() {
    return await this.syncUsersFromSupabase(true);
  }

  // Verify token
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

  // Logout
  async logout() {
    try {
      console.log('🚪 Logging out...');
      
      const wasAuthenticated = !!(this.token && this.user);
      const userEmail = this.user?.email || 'unknown';
      
      // Clear local data first
      this.token = null;
      this.user = null;
      this.isOfflineMode = false;
      await this.clearStoredAuth();
      
      // Try to notify server
      if (wasAuthenticated) {
        try {
          const logoutApi = axios.create({
            baseURL: this.baseURL,
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
          });
          
          await logoutApi.post('/auth/logout', {}, {
            headers: { 'Authorization': `Bearer ${this.token}` }
          });
          console.log('✅ Server logout notification successful');
        } catch (serverError) {
          console.log('⚠️ Server logout notification failed:', serverError.message);
        }
      }
      
      console.log(`✅ Logout successful for: ${userEmail}`);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Ensure local cleanup happens
      this.token = null;
      this.user = null;
      this.isOfflineMode = false;
      await this.clearStoredAuth();
    }
  }

  // Clear local auth
  async clearLocalAuth() {
    console.log('🧹 Clearing local authentication...');
    this.token = null;
    this.user = null;
    this.isOfflineMode = false;
    await this.clearStoredAuth();
  }

  // Get profile
  async getProfile() {
    try {
      if (this.isOfflineMode) {
        const user = await databaseService.getUserById(this.user.id);
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

  // Check server health
  async checkHealth(retryCount = 3) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        console.log(`🔍 Health check attempt ${attempt}/${retryCount}`);
        
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
          console.log(`⏳ Server returned 503, waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        
        if (attempt === retryCount) {
          if (error.response?.status === 503) {
            throw new Error('Server temporarily unavailable. Please try again.');
          } else {
            throw new Error(`Server health check failed: ${error.message}`);
          }
        }
      }
    }
  }

  // Get auth status
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

  async clearStoredAuth() {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

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