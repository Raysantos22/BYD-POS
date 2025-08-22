// services/productService.js - Enhanced Product service with Store Distribution
import authService from './authService'

class ProductService {
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

  // ========================= CATEGORIES =========================
  
  async getCategories(currentUser) {
    try {
      console.log('🔄 Fetching categories from Supabase...')
      
      const response = await fetch(`${this.baseURL}/categories`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ Categories fetched: ${data.count} items`)
      return data.categories || []

    } catch (error) {
      console.error('❌ Failed to fetch categories:', error)
      return []
    }
  }

  async createCategory(categoryData, currentUser) {
    try {
      console.log('📝 Creating category:', categoryData.name)
      
      // Use current user's store_id if not super admin
      if (currentUser.role !== 'super_admin' && currentUser.store_id) {
        categoryData.store_id = currentUser.store_id
      }

      const response = await fetch(`${this.baseURL}/categories`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(categoryData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Category created:', result.category?.name)
      return result.category

    } catch (error) {
      console.error('❌ Failed to create category:', error)
      throw error
    }
  }

  // ========================= PRODUCTS =========================
  
  async getProducts(currentUser, options = {}) {
    try {
      console.log('🔄 Fetching products from Supabase...')
      
      let url = `${this.baseURL}/products`
      const params = new URLSearchParams()
      
      if (options.categoryId) {
        params.append('category_id', options.categoryId)
      }
      
      if (options.search) {
        params.append('search', options.search)
      }
      
      if (options.limit) {
        params.append('limit', options.limit)
      }

      // Store filtering for super admin
      if (currentUser.role === 'super_admin' && options.storeId && options.storeId !== 'all') {
        params.append('store_id', options.storeId)
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
      
      // Transform the data to match your app's expected format
      const products = data.products?.map(product => ({
        ...product,
        category_name: product.categories?.name || null,
        category_color: product.categories?.color || '#3b82f6'
      })) || []
      
      console.log(`✅ Products fetched: ${data.count} items`)
      return products

    } catch (error) {
      console.error('❌ Failed to fetch products:', error)
      return []
    }
  }

  // ========================= MULTI-STORE PRODUCT CREATION =========================
  
  async createProductInMultipleStores(productData, selectedStoreIds, currentUser) {
    try {
      console.log(`📝 Creating product "${productData.name}" in ${selectedStoreIds.length} stores...`)
      
      if (!selectedStoreIds || selectedStoreIds.length === 0) {
        throw new Error('Please select at least one store')
      }

      const results = []
      const errors = []

      // Create product in each selected store
      for (const storeId of selectedStoreIds) {
        try {
          const storeProductData = {
            ...productData,
            store_id: storeId,
            // Use store-specific stock if provided
            stock_quantity: productData.store_specific_stock?.[storeId] || productData.stock_quantity || 0,
            // Use store-specific price if provided
            manila_price: productData.store_specific_prices?.[storeId] || productData.manila_price,
          }

          const createdProduct = await this.createProduct(storeProductData, currentUser)
          
          results.push({
            success: true,
            store_id: storeId,
            store_name: `Store ${storeId}`,
            product: createdProduct
          })

          console.log(`✅ Product created in store: ${storeId}`)

        } catch (storeError) {
          errors.push({
            success: false,
            store_id: storeId,
            store_name: `Store ${storeId}`,
            error: storeError.message
          })

          console.error(`❌ Failed to create product in store ${storeId}:`, storeError.message)
        }
      }

      const summary = {
        total_stores: selectedStoreIds.length,
        successful: results.length,
        failed: errors.length,
        results: results,
        errors: errors
      }

      if (results.length === 0) {
        throw new Error('Failed to create product in any store')
      }

      console.log(`🎉 Multi-store creation completed: ${results.length}/${selectedStoreIds.length} successful`)
      return summary

    } catch (error) {
      console.error('❌ Multi-store product creation failed:', error)
      throw error
    }
  }

  async createProduct(productData, currentUser) {
    try {
      console.log('📝 Creating product:', productData.name)
      
      // Use current user's store_id if not super admin
      if (currentUser.role !== 'super_admin' && currentUser.store_id) {
        productData.store_id = currentUser.store_id
      }

      // Validate required store_id
      if (!productData.store_id) {
        throw new Error('Store ID is required for product creation')
      }

      const response = await fetch(`${this.baseURL}/products`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Product created:', result.product?.name)
      return result.product

    } catch (error) {
      console.error('❌ Failed to create product:', error)
      throw error
    }
  }

  async updateStock(productId, newQuantity, movementType = 'adjustment', notes = '', currentUser = null) {
    try {
      console.log('📦 Updating stock for product:', productId, 'to', newQuantity)
      
      const response = await fetch(`${this.baseURL}/inventory/adjust`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          product_id: productId,
          new_quantity: newQuantity,
          movement_type: movementType,
          notes: notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Stock updated successfully')
      return result

    } catch (error) {
      console.error('❌ Stock update failed:', error)
      throw error
    }
  }

  async getProductStats(currentUser) {
    try {
      console.log('📊 Fetching product statistics...')

      const response = await fetch(`${this.baseURL}/products/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        console.warn('⚠️ Failed to fetch stats from server')
        return { totalProducts: 0, totalCategories: 0, lowStockProducts: 0, outOfStockProducts: 0 }
      }

      const data = await response.json()
      console.log('✅ Product stats fetched:', data.stats)
      return data.stats || { totalProducts: 0, totalCategories: 0, lowStockProducts: 0, outOfStockProducts: 0 }

    } catch (error) {
      console.error('❌ Failed to get product stats:', error)
      return { totalProducts: 0, totalCategories: 0, lowStockProducts: 0, outOfStockProducts: 0 }
    }
  }

  // ========================= UTILITIES =========================
  
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

  // Search products with debouncing
  async searchProducts(query, currentUser, options = {}) {
    if (!query || query.length < 2) {
      return []
    }
    
    return this.getProducts(currentUser, { ...options, search: query, limit: 20 })
  }

  // Get products by category
  async getProductsByCategory(categoryId, currentUser, options = {}) {
    return this.getProducts(currentUser, { ...options, categoryId })
  }

  // Get low stock products
  async getLowStockProducts(currentUser, options = {}) {
    const products = await this.getProducts(currentUser, options)
    return products.filter(product => 
      product.stock_quantity <= (product.min_stock_level || 5)
    )
  }

  // Validate product data
  validateProductData(productData) {
    const errors = []
    
    if (!productData.name || productData.name.trim().length === 0) {
      errors.push('Product name is required')
    }
    
    if (!productData.default_price || parseFloat(productData.default_price) <= 0) {
      errors.push('Valid default price is required')
    }
    
    if (!productData.store_id) {
      errors.push('Store selection is required')
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }

  getStockStatus(stock, minLevel) {
    if (stock === 0) return { text: 'Out of Stock', color: '#ef4444', level: 'critical' }
    if (stock <= minLevel) return { text: 'Low Stock', color: '#f59e0b', level: 'warning' }
    return { text: 'In Stock', color: '#10b981', level: 'good' }
  }
}

// Export singleton instance
export const productService = new ProductService()
export default productService