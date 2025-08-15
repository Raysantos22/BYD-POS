// services/api.js

const API_BASE_URL = 'http://your-laravel-backend.com/api' // Replace with your Laravel API URL

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = null
  }

  // Set authentication token
  setToken(token) {
    this.token = token
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return headers
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: this.getHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication methods
  async login(credentials) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      if (response.token) {
        this.setToken(response.token)
        // Store token in AsyncStorage for persistence
        // await AsyncStorage.setItem('auth_token', response.token)
      }

      return response
    } catch (error) {
      throw new Error(error.message || 'Login failed')
    }
  }

  async register(userData) {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })

      if (response.token) {
        this.setToken(response.token)
        // Store token in AsyncStorage for persistence
        // await AsyncStorage.setItem('auth_token', response.token)
      }

      return response
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      })

      this.setToken(null)
      // Remove token from AsyncStorage
      // await AsyncStorage.removeItem('auth_token')
      
      return { success: true }
    } catch (error) {
      // Even if logout fails on server, clear local token
      this.setToken(null)
      // await AsyncStorage.removeItem('auth_token')
      throw error
    }
  }

  async forgotPassword(email) {
    try {
      return await this.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    } catch (error) {
      throw new Error(error.message || 'Password reset request failed')
    }
  }

  async resetPassword(data) {
    try {
      return await this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      throw new Error(error.message || 'Password reset failed')
    }
  }

  // User profile methods
  async getProfile() {
    try {
      return await this.request('/user/profile')
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch profile')
    }
  }

  async updateProfile(profileData) {
    try {
      return await this.request('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      })
    } catch (error) {
      throw new Error(error.message || 'Profile update failed')
    }
  }

  // POS-specific methods
  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = `/products${queryParams ? `?${queryParams}` : ''}`
      return await this.request(endpoint)
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch products')
    }
  }

  async createProduct(productData) {
    try {
      return await this.request('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      })
    } catch (error) {
      throw new Error(error.message || 'Failed to create product')
    }
  }

  async updateProduct(id, productData) {
    try {
      return await this.request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      })
    } catch (error) {
      throw new Error(error.message || 'Failed to update product')
    }
  }

  async deleteProduct(id) {
    try {
      return await this.request(`/products/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw new Error(error.message || 'Failed to delete product')
    }
  }

  // Sales/Transaction methods
  async createSale(saleData) {
    try {
      return await this.request('/sales', {
        method: 'POST',
        body: JSON.stringify(saleData),
      })
    } catch (error) {
      throw new Error(error.message || 'Failed to create sale')
    }
  }

  async getSales(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = `/sales${queryParams ? `?${queryParams}` : ''}`
      return await this.request(endpoint)
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch sales')
    }
  }

  async getSaleById(id) {
    try {
      return await this.request(`/sales/${id}`)
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch sale details')
    }
  }

  async refundSale(id, refundData) {
    try {
      return await this.request(`/sales/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify(refundData),
      })
    } catch (error) {
      throw new Error(error.message || 'Failed to process refund')
    }
  }

  // Customer methods
  async getCustomers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = `/customers${queryParams ? `?${queryParams}` : ''}`
      return await this.request(endpoint)
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch customers')
    }
  }

  async createCustomer(customerData) {
    try {
      return await this.request('/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
      })
    } catch (error) {
      throw new Error(error.message || 'Failed to create customer')
    }
  }

  async updateCustomer(id, customerData) {
    try {
      return await this.request(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData),
      })
    } catch (error) {
      throw new Error(error.message || 'Failed to update customer')
    }
  }

  // Dashboard/Analytics methods
  async getDashboardStats(dateRange = {}) {
    try {
      const queryParams = new URLSearchParams(dateRange).toString()
      const endpoint = `/dashboard/stats${queryParams ? `?${queryParams}` : ''}`
      return await this.request(endpoint)
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch dashboard stats')
    }
  }

  async getSalesReport(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = `/reports/sales${queryParams ? `?${queryParams}` : ''}`
      return await this.request(endpoint)
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch sales report')
    }
  }

  // Inventory methods
  async getInventory(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = `/inventory${queryParams ? `?${queryParams}` : ''}`
      return await this.request(endpoint)
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch inventory')
    }
  }

  async updateInventory(id, inventoryData) {
    try {
      return await this.request(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(inventoryData),
      })
    } catch (error) {
      throw new Error(error.message || 'Failed to update inventory')
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export dummy data for testing without backend
export const dummyData = {
  user: {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'cashier',
    avatar: null,
  },
  
  products: [
    {
      id: 1,
      name: 'Coffee - Americano',
      price: 3.50,
      category: 'Beverages',
      stock: 100,
      barcode: '1234567890123',
      image: null,
    },
    {
      id: 2,
      name: 'Sandwich - Club',
      price: 8.99,
      category: 'Food',
      stock: 25,
      barcode: '1234567890124',
      image: null,
    },
    {
      id: 3,
      name: 'Pastry - Croissant',
      price: 4.25,
      category: 'Bakery',
      stock: 15,
      barcode: '1234567890125',
      image: null,
    },
  ],
  
  recentSales: [
    {
      id: 1,
      total: 12.50,
      items_count: 2,
      payment_method: 'card',
      created_at: '2025-08-14T10:30:00Z',
      customer: 'Walk-in Customer',
    },
    {
      id: 2,
      total: 25.75,
      items_count: 3,
      payment_method: 'cash',
      created_at: '2025-08-14T09:15:00Z',
      customer: 'Jane Smith',
    },
  ],
  
  dashboardStats: {
    today_sales: 1250.00,
    today_transactions: 48,
    total_customers: 1205,
    low_stock_items: 5,
  }
}

export default apiService