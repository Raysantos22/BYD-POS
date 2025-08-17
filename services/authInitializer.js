// services/authInitializer.js - Simplified for Vercel deployment only
import authService from './authService';

class AuthInitializer {
  constructor() {
    this.isInitialized = false;
    this.activeService = 'supabase'; // Always use Vercel + Supabase
    this.lastCheck = null;
    this.isHealthy = false;
    this.fallbackData = this.createFallbackData();
    this.useLocalFallback = false;
  }

  // Initialize authentication services
  async initialize() {
    try {
      console.log('🚀 Starting authentication service initialization...');
      console.log('📡 Target server: https://byd-pos-middleware.vercel.app');
      
      // Test connection to your Vercel deployment
      const connectionStatus = await this.testVercelConnection();
      
      if (connectionStatus.isConnected) {
        console.log('✅ Connected to Vercel + Supabase backend');
        this.activeService = 'supabase';
        this.isHealthy = true;
        this.useLocalFallback = false;
        
        // Initialize the auth service
        await authService.initialize();
        
      } else {
        console.log('⚠️ Vercel connection failed, using offline mode');
        console.log('Error details:', connectionStatus.error);
        
        // Use local fallback for demo purposes
        this.activeService = 'local';
        this.isHealthy = false;
        this.useLocalFallback = true;
      }
      
      this.isInitialized = true;
      this.lastCheck = new Date().toISOString();
      
      console.log(`✅ Auth initialization complete - Mode: ${this.useLocalFallback ? 'Offline Demo' : 'Online Vercel'}`);
      return this.activeService;
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      this.activeService = 'local';
      this.isHealthy = false;
      this.useLocalFallback = true;
      this.isInitialized = true;
      this.lastCheck = new Date().toISOString();
      return 'local';
    }
  }

  // Test connection to Vercel deployment
  async testVercelConnection() {
    try {
      console.log('🔍 Testing Vercel deployment connection...');
      
      // Use the health check with retry logic for 503 errors
      const healthData = await authService.checkHealth(3); // 3 retry attempts
      
      const isConnected = healthData.status === 'healthy' && healthData.database === 'connected';
      
      if (isConnected) {
        console.log('✅ Vercel deployment is healthy');
      } else {
        console.log('⚠️ Vercel deployment responded but database not connected');
      }
      
      return {
        isConnected,
        healthData,
        error: isConnected ? null : `Database: ${healthData.database}, Status: ${healthData.status}`
      };
      
    } catch (error) {
      console.log('❌ Vercel connection test failed:', error.message);
      
      // Provide helpful error messages based on error type
      let userFriendlyError = error.message;
      
      if (error.message.includes('503')) {
        userFriendlyError = 'Server temporarily unavailable (likely cold start). Please try again.';
      } else if (error.message.includes('timeout')) {
        userFriendlyError = 'Connection timeout. Server might be starting up.';
      } else if (error.message.includes('Network Error')) {
        userFriendlyError = 'Network connection failed. Check your internet.';
      }
      
      return {
        isConnected: false,
        healthData: null,
        error: userFriendlyError
      };
    }
  }

  // Check service health
  async checkHealth() {
    try {
      const healthData = await authService.checkHealth(2); // 2 retry attempts
      
      this.isHealthy = healthData.status === 'healthy';
      this.lastCheck = new Date().toISOString();
      
      if (this.isHealthy && this.useLocalFallback) {
        console.log('🔄 Service recovered - switching to Vercel mode');
        this.activeService = 'supabase';
        this.useLocalFallback = false;
      } else if (!this.isHealthy && !this.useLocalFallback) {
        console.log('⚠️ Service degraded - switching to offline mode');
        this.activeService = 'local';
        this.useLocalFallback = true;
      }
      
      return healthData;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.isHealthy = false;
      this.lastCheck = new Date().toISOString();
      
      if (!this.useLocalFallback) {
        this.activeService = 'local';
        this.useLocalFallback = true;
        console.log('🔄 Switched to offline mode due to health check failure');
      }
      
      throw error;
    }
  }

  // Get current status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeService: this.activeService,
      isHealthy: this.isHealthy,
      lastCheck: this.lastCheck,
      useLocalFallback: this.useLocalFallback,
      serverUrl: 'https://byd-pos-middleware.vercel.app'
    };
  }

  // Handle login based on active service
  async handleLogin(email, password) {
    if (!this.useLocalFallback) {
      // Use real authentication via Vercel + Supabase
      try {
        return await authService.login(email, password);
      } catch (error) {
        // If login fails due to server issues, try fallback
        if (error.message.includes('503') || error.message.includes('timeout') || error.message.includes('Network Error')) {
          console.log('🔄 Server login failed, attempting fallback...');
          this.useLocalFallback = true;
          this.activeService = 'local';
          return this.fallbackLogin(email, password);
        }
        throw error;
      }
    } else {
      // Use local fallback
      return this.fallbackLogin(email, password);
    }
  }

  // Handle registration based on active service
  async handleRegister(userData) {
    if (!this.useLocalFallback) {
      // Use real authentication via Vercel + Supabase
      try {
        return await authService.register(userData);
      } catch (error) {
        // If registration fails due to server issues, inform user
        if (error.message.includes('503') || error.message.includes('timeout')) {
          throw new Error('Registration requires server connection. Please try again when the server is available.');
        }
        throw error;
      }
    } else {
      // Registration not available in offline mode
      throw new Error('Registration is not available in offline mode. Please check your internet connection and try again.');
    }
  }

  // Fallback login for demo mode
  async fallbackLogin(email, password) {
    console.log('🔄 Using offline demo login...');
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = this.fallbackData.users.find(u => 
          u.email.toLowerCase() === email.toLowerCase()
        );
        
        if (user && password === 'password123') {
          const token = 'demo_token_' + Date.now();
          resolve({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            },
            token,
            source: 'local'
          });
        } else {
          reject(new Error('Invalid credentials. For demo mode, use: admin@techcorp.com / password123'));
        }
      }, 1000); // Simulate network delay
    });
  }

  // Create fallback data for demo mode
  createFallbackData() {
    return {
      users: [
        {
          id: 1,
          email: 'admin@techcorp.com',
          name: 'Demo Admin',
          role: 'super_admin'
        },
        {
          id: 2,
          email: 'manager@techcorp.com',
          name: 'Demo Manager',
          role: 'manager'
        },
        {
          id: 3,
          email: 'cashier@techcorp.com',
          name: 'Demo Cashier',
          role: 'cashier'
        }
      ]
    };
  }

  // Force retry connection to Vercel
  async retryConnection() {
    console.log('🔄 Retrying connection to Vercel...');
    
    try {
      const connectionStatus = await this.testVercelConnection();
      
      if (connectionStatus.isConnected) {
        console.log('✅ Connection restored');
        this.activeService = 'supabase';
        this.isHealthy = true;
        this.useLocalFallback = false;
        this.lastCheck = new Date().toISOString();
        return true;
      } else {
        console.log('❌ Connection still failing:', connectionStatus.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Retry connection failed:', error);
      return false;
    }
  }

  // Get fallback data (for demo mode)
  getFallbackData() {
    return this.fallbackData;
  }
}

// Export singleton instance
export const authInitializer = new AuthInitializer();
export default authInitializer;