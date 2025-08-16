// services/authService.js - Fixed authentication service with correct IP
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

class AuthService {
  constructor() {
    // Use your actual IP address from ipconfig (10.151.5.198)
    this.baseURL = 'http://10.151.5.198:3000';
    this.token = null;
    this.user = null;
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
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

    // Add response interceptor to handle token expiration
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url}`, error.response?.data);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          await this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // Initialize service - load stored credentials
  async initialize() {
    try {
      console.log('🔄 Initializing AuthService...');
      console.log('📡 Base URL:', this.baseURL);
      
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
        
        // Verify token is still valid
        const isValid = await this.verifyToken();
        if (isValid) {
          console.log('✅ Auth restored from storage');
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

  // Verify if current token is valid
  async verifyToken() {
    try {
      if (!this.token) return false;
      
      const response = await this.api.get('/auth/profile');
      return response.status === 200;
      
    } catch (error) {
      console.log('Token verification failed:', error.response?.status);
      return false;
    }
  }

  // Login method
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

      // Make login request
      const response = await this.api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      const { user, token, source } = response.data;
      
      if (!user || !token) {
        throw new Error('Invalid response from server');
      }

      // Store authentication data
      this.token = token;
      this.user = user;
      
      // Persist to storage
      await this.storeAuth(token, user);
      
      console.log(`✅ Login successful - User: ${user.name} (${user.role})`);
      console.log(`📊 Source: ${source}`);
      
      return {
        user,
        token,
        source
      };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Handle specific error cases
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            throw new Error(data.error || 'Invalid request');
          case 401:
            throw new Error('Invalid email or password');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(data.error || 'Login failed');
        }
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error(`Cannot connect to server at ${this.baseURL}. Please check if the server is running.`);
      } else {
        throw error;
      }
    }
  }

  // Register method
  async register(userData) {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      
      const response = await this.api.post('/auth/register', userData);
      const { user, token, source } = response.data;
      
      // Store authentication data
      this.token = token;
      this.user = user;
      
      // Persist to storage
      await this.storeAuth(token, user);
      
      console.log(`✅ Registration successful - User: ${user.name}`);
      
      return { user, token, source };
      
    } catch (error) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            throw new Error(data.error || 'Invalid registration data');
          case 409:
            throw new Error('User with this email already exists');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(data.error || 'Registration failed');
        }
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to server at ${this.baseURL}. Please check if the server is running.`);
      } else {
        throw new Error('Network error. Please check your internet connection.');
      }
    }
  }

  // Logout method
  async logout() {
    try {
      console.log('🚪 Logging out...');
      
      // Try to notify server (optional - don't fail if server is down)
      if (this.token) {
        try {
          await this.api.post('/auth/logout');
        } catch (error) {
          console.log('Server logout notification failed (continuing anyway)');
        }
      }
      
      // Clear local data
      this.token = null;
      this.user = null;
      
      // Clear storage
      await this.clearStoredAuth();
      
      console.log('✅ Logout successful');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear local data even if server call fails
      this.token = null;
      this.user = null;
      await this.clearStoredAuth();
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await this.api.get('/auth/profile');
      this.user = response.data.user;
      await AsyncStorage.setItem('auth_user', JSON.stringify(this.user));
      return this.user;
    } catch (error) {
      console.error('Get profile failed:', error);
      throw error;
    }
  }

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await this.api.put('/auth/profile', profileData);
      this.user = response.data.user;
      await AsyncStorage.setItem('auth_user', JSON.stringify(this.user));
      return this.user;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Change password failed:', error);
      throw error;
    }
  }

  // Check server health
  async checkHealth() {
    try {
      console.log('🔍 Checking server health at:', `${this.baseURL}/health`);
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      console.log('✅ Health check successful:', response.data);
      return {
        status: response.data.status,
        database: response.data.database,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      throw new Error(`Server unavailable at ${this.baseURL}: ${error.message}`);
    }
  }

  // Get current authentication status
  getAuthStatus() {
    return {
      isAuthenticated: !!(this.token && this.user),
      user: this.user,
      token: this.token
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

  // Update base URL (useful for switching between dev/prod)
  updateBaseURL(newURL) {
    this.baseURL = newURL;
    this.api.defaults.baseURL = newURL;
    console.log('📡 API Base URL updated to:', newURL);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;