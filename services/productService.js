// services/productService.js - Enhanced Product service with Manager Company Access
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
  
  async getCategories(currentUser, options = {}) {
    try {
      console.log('🔄 Fetching categories from Supabase...')
      
      let url = `${this.baseURL}/categories`
      const params = new URLSearchParams()
      
      // ENHANCED: For managers, filter by company
      if (currentUser.role === 'manager' && currentUser.company_id) {
        params.append('company_id', currentUser.company_id)
      }
      
      // For super admin with store filter
      if (currentUser.role === 'super_admin' && options.storeId) {
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
      
      // ENHANCED: For managers, use their assigned store or first company store
      if (currentUser.role === 'manager') {
        if (currentUser.store_id) {
          categoryData.store_id = currentUser.store_id
        }
        // Add company_id for server-side validation
        if (currentUser.company_id) {
          categoryData.company_id = currentUser.company_id
        }
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
      console.log('🔄 Fetching products from Supabase...', {
        userRole: currentUser.role,
        userStoreId: currentUser.store_id,
        userCompanyId: currentUser.company_id,
        options
      })
      
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

      // ENHANCED: Handle different user roles and filtering
      if (currentUser.role === 'super_admin') {
        // Super admin can see all stores or filter by specific store
        if (options.storeId && options.storeId !== 'all') {
          params.append('store_id', options.storeId)
        }
      } else if (currentUser.role === 'manager') {
        // ENHANCED: Manager can see all company stores
        if (currentUser.company_id) {
          if (options.storeId && options.storeId !== 'company') {
            // Specific store within their company
            params.append('store_id', options.storeId)
          } else {
            // All company stores
            params.append('company_id', currentUser.company_id)
          }
        } else if (currentUser.store_id) {
          // Fallback to their assigned store
          params.append('store_id', currentUser.store_id)
        }
      } else if (currentUser.role === 'cashier' && currentUser.store_id) {
        // Cashiers only see their store
        params.append('store_id', currentUser.store_id)
      }

      // Handle multi-store company filtering for managers
      if (options.companyStoreIds && options.companyStoreIds.length > 0) {
        params.append('store_ids', options.companyStoreIds.join(','))
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log('🔗 API URL:', url)

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

      // ENHANCED: Validate store access for managers
      if (currentUser.role === 'manager' && currentUser.company_id) {
        // Verify all selected stores belong to manager's company
        const response = await fetch(`${this.baseURL}/stores?company_id=${currentUser.company_id}`, {
          headers: this.getAuthHeaders()
        })
        
        if (response.ok) {
          const data = await response.json()
          const allowedStoreIds = data.stores.map(store => store.id)
          const invalidStores = selectedStoreIds.filter(id => !allowedStoreIds.includes(id))
          
          if (invalidStores.length > 0) {
            throw new Error('You can only create products in stores belonging to your company')
          }
        }
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
      
      // ENHANCED: Enhanced store validation for managers
      if (currentUser.role === 'manager') {
        if (!productData.store_id) {
          // Use manager's assigned store as fallback
          if (currentUser.store_id) {
            productData.store_id = currentUser.store_id
          } else {
            throw new Error('Store ID is required for product creation')
          }
        }
        
        // Add company context for server-side validation
        if (currentUser.company_id) {
          productData.company_id = currentUser.company_id
        }
      } else if (currentUser.role !== 'super_admin' && currentUser.store_id) {
        // For non-admin roles, use their assigned store
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

  // ENHANCED: Product stats with company support
  async getProductStats(currentUser, options = {}) {
    try {
      console.log('📊 Fetching product statistics...', {
        userRole: currentUser.role,
        userCompanyId: currentUser.company_id,
        options
      })

      let url = `${this.baseURL}/products/stats`
      const params = new URLSearchParams()

      // Handle different user contexts
      if (currentUser.role === 'super_admin') {
        if (options.storeId && options.storeId !== 'all') {
          params.append('store_id', options.storeId)
        }
      } else if (currentUser.role === 'manager') {
        if (options.storeId && options.storeId !== 'company') {
          // Specific store stats
          params.append('store_id', options.storeId)
        } else if (currentUser.company_id) {
          // Company-wide stats
          params.append('company_id', currentUser.company_id)
        } else if (currentUser.store_id) {
          // Fallback to manager's store
          params.append('store_id', currentUser.store_id)
        }
      } else if (currentUser.store_id) {
        // Other roles use their assigned store
        params.append('store_id', currentUser.store_id)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url, {
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

  // ENHANCED: Get low stock products with company support
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

  // ENHANCED: Manager-specific utilities
  async getManagerCompanyProducts(currentUser) {
    if (currentUser.role !== 'manager' || !currentUser.company_id) {
      throw new Error('This function is only available for managers')
    }

    return this.getProducts(currentUser, { 
      companyId: currentUser.company_id 
    })
  }

  async getManagerCompanyCategories(currentUser) {
    if (currentUser.role !== 'manager' || !currentUser.company_id) {
      throw new Error('This function is only available for managers')
    }

    return this.getCategories(currentUser, { 
      companyId: currentUser.company_id 
    })
  }

  // Bulk operations for managers
  async bulkUpdateCompanyProducts(currentUser, updates) {
    if (currentUser.role !== 'manager' || !currentUser.company_id) {
      throw new Error('This function is only available for managers')
    }

    try {
      const response = await fetch(`${this.baseURL}/products/bulk-update`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          company_id: currentUser.company_id,
          updates: updates
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Bulk update failed')
      }

      const result = await response.json()
      console.log('✅ Bulk update completed:', result.updated_count)
      return result

    } catch (error) {
      console.error('❌ Bulk update failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const productService = new ProductService()
export default productService