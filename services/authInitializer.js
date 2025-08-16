// services/authInitializer.js - Service initialization and fallback handler
import authService from './authService';

class AuthInitializer {
  constructor() {
    this.isInitialized = false;
    this.activeService = null;
    this.lastCheck = null;
    this.isHealthy = false;
    this.fallbackData = this.createFallbackData();
  }

  // Initialize authentication services
  async initialize() {
    try {
      console.log('🚀 Starting authentication service initialization...');
      
      // Try to connect to Node.js + Supabase server
      const supabaseStatus = await this.testSupabaseConnection();
      
      if (supabaseStatus.isConnected) {
        console.log('✅ Connected to Supabase via Node.js server');
        this.activeService = 'supabase';
        this.isHealthy = true;
        
        // Initialize the auth service
        await authService.initialize();
        
      } else {
        console.log('⚠️ Supabase connection failed, using local fallback');
        console.log('Reason:', supabaseStatus.error);
        this.activeService = 'local';
        this.isHealthy = false;
      }
      
      this.isInitialized = true;
      this.lastCheck = new Date().toISOString();
      
      console.log(`✅ Auth initialization complete - Active service: ${this.activeService}`);
      return this.activeService;
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      this.activeService = 'local';
      this.isHealthy = false;
      this.isInitialized = true;
      this.lastCheck = new Date().toISOString();
      return 'local';
    }
  }

  // Test connection to Supabase via Node.js
  async testSupabaseConnection() {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      const healthData = await authService.checkHealth();
      
      const isConnected = healthData.status === 'healthy' && healthData.database === 'connected';
      
      return {
        isConnected,
        healthData,
        error: isConnected ? null : `Database: ${healthData.database}, Status: ${healthData.status}`
      };
      
    } catch (error) {
      console.log('🔌 Supabase connection test failed:', error.message);
      return {
        isConnected: false,
        healthData: null,
        error: error.message
      };
    }
  }

  // Check service health
  async checkHealth() {
    try {
      const healthData = await authService.checkHealth();
      
      this.isHealthy = healthData.status === 'healthy';
      this.lastCheck = new Date().toISOString();
      
      if (this.isHealthy && this.activeService !== 'supabase') {
        console.log('🔄 Service recovered - switching to Supabase');
        this.activeService = 'supabase';
      } else if (!this.isHealthy && this.activeService === 'supabase') {
        console.log('⚠️ Service degraded - switching to local fallback');
        this.activeService = 'local';
      }
      
      return healthData;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.isHealthy = false;
      this.lastCheck = new Date().toISOString();
      
      if (this.activeService === 'supabase') {
        this.activeService = 'local';
        console.log('🔄 Switched to local fallback due to health check failure');
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
      lastCheck: this.lastCheck
    };
  }

  // Handle login based on active service
  async handleLogin(email, password) {
    if (this.activeService === 'supabase') {
      // Use real authentication via Node.js + Supabase
      return await authService.login(email, password);
    } else {
      // Use local fallback
      return this.fallbackLogin(email, password);
    }
  }

  // Handle registration based on active service
  async handleRegister(userData) {
    if (this.activeService === 'supabase') {
      // Use real authentication via Node.js + Supabase
      return await authService.register(userData);
    } else {
      // Use local fallback
      return this.fallbackRegister(userData);
    }
  }

  // Fallback login for demo mode
  async fallbackLogin(email, password) {
    console.log('🔄 Using fallback login...');
    
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
          reject(new Error('Invalid email or password'));
        }
      }, 1000); // Simulate network delay
    });
  }

  // Fallback registration for demo mode
  async fallbackRegister(userData) {
    console.log('🔄 Using fallback registration...');
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check if user already exists
        const existingUser = this.fallbackData.users.find(u => 
          u.email.toLowerCase() === userData.email.toLowerCase()
        );
        
        if (existingUser) {
          reject(new Error('User with this email already exists'));
          return;
        }
        
        // Create new user
        const newUser = {
          id: this.fallbackData.users.length + 1,
          email: userData.email,
          name: userData.name,
          role: userData.role || 'cashier'
        };
        
        this.fallbackData.users.push(newUser);
        
        const token = 'demo_token_' + Date.now();
        resolve({
          user: newUser,
          token,
          source: 'local'
        });
      }, 1000);
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
      ],
      products: [
        {
          id: 1,
          name: 'Smartphone Pro',
          price: 999.99,
          stock_quantity: 25,
          category: 'Electronics'
        },
        {
          id: 2,
          name: 'Cotton T-Shirt',
          price: 29.99,
          stock_quantity: 50,
          category: 'Clothing'
        }
      ],
      categories: [
        { id: 1, name: 'Electronics', description: 'Electronic devices' },
        { id: 2, name: 'Clothing', description: 'Apparel and accessories' }
      ]
    };
  }

  // Force switch to specific service (for testing)
  async switchService(serviceName) {
    if (serviceName === 'supabase') {
      const status = await this.testSupabaseConnection();
      if (status.isConnected) {
        this.activeService = 'supabase';
        this.isHealthy = true;
        console.log('✅ Switched to Supabase service');
      } else {
        throw new Error('Cannot switch to Supabase - service not available');
      }
    } else if (serviceName === 'local') {
      this.activeService = 'local';
      this.isHealthy = false;
      console.log('✅ Switched to local fallback');
    } else {
      throw new Error('Invalid service name. Use "supabase" or "local"');
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