// services/supabaseService.js
import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase URL and anon key
const SUPABASE_URL = 'https://your-project-id.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

class SupabaseService {
  constructor() {
    this.client = supabase
  }

  // Authentication Methods
  async signInWithEmail(email, password) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Get user profile data
      const userProfile = await this.getUserProfile(data.user.id)
      
      return {
        user: data.user,
        session: data.session,
        profile: userProfile
      }
    } catch (error) {
      console.error('Supabase sign in error:', error)
      throw error
    }
  }

  async signUpWithEmail(email, password, userData) {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: userData // This goes to auth.users.raw_user_meta_data
        }
      })

      if (error) throw error

      // Create user profile in our users table
      if (data.user) {
        await this.createUserProfile({
          id: data.user.id,
          email,
          ...userData
        })
      }

      return data
    } catch (error) {
      console.error('Supabase sign up error:', error)
      throw error
    }
  }

  async signOut() {
    try {
      const { error } = await this.client.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Supabase sign out error:', error)
      throw error
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.client.auth.getUser()
      if (error) throw error
      
      if (user) {
        const profile = await this.getUserProfile(user.id)
        return { user, profile }
      }
      
      return null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  // User Profile Methods
  async createUserProfile(userData) {
    try {
      const { data, error } = await this.client
        .from('users')
        .insert([{
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role || 'cashier',
          company_id: userData.company_id || 1,
          store_id: userData.store_id || 1,
          is_active: true
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Create user profile error:', error)
      throw error
    }
  }

  async getUserProfile(userId) {
    try {
      const { data, error } = await this.client
        .from('users')
        .select(`
          *,
          company:companies(*),
          store:stores(*)
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Get user profile error:', error)
      return null
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await this.client
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Update user profile error:', error)
      throw error
    }
  }

  // Data Fetching Methods
  async getUsers(storeId = null) {
    try {
      let query = this.client
        .from('users')
        .select(`
          *,
          company:companies(name),
          store:stores(name)
        `)
        .eq('is_active', true)

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get users error:', error)
      return []
    }
  }

  async getProducts(storeId = null, categoryId = null) {
    try {
      let query = this.client
        .from('products')
        .select(`
          *,
          category:categories(name, color),
          store:stores(name)
        `)
        .eq('is_active', true)

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query.order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get products error:', error)
      return []
    }
  }

  async getCategories() {
    try {
      const { data, error } = await this.client
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get categories error:', error)
      return []
    }
  }

  async getSales(storeId = null, limit = 50) {
    try {
      let query = this.client
        .from('sales')
        .select(`
          *,
          cashier:users!sales_cashier_id_fkey(name),
          store:stores(name),
          sale_items(
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get sales error:', error)
      return []
    }
  }

  async getSalesStats(storeId = null, dateFrom = null, dateTo = null) {
    try {
      let query = this.client
        .from('sales')
        .select('total_amount, created_at')
        .eq('status', 'completed')

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate stats from the data
      const transactions = data || []
      const today = new Date().toISOString().split('T')[0]
      
      const stats = {
        total_transactions: transactions.length,
        total_revenue: transactions.reduce((sum, sale) => sum + (sale.total_amount || 0), 0),
        avg_transaction: transactions.length > 0 
          ? transactions.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) / transactions.length 
          : 0,
        today_revenue: transactions
          .filter(sale => sale.created_at && sale.created_at.startsWith(today))
          .reduce((sum, sale) => sum + (sale.total_amount || 0), 0),
        today_transactions: transactions
          .filter(sale => sale.created_at && sale.created_at.startsWith(today))
          .length
      }

      return stats
    } catch (error) {
      console.error('Get sales stats error:', error)
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
      let query = this.client
        .from('products')
        .select(`
          *,
          category:categories(name, color)
        `)
        .eq('is_active', true)
        .filter('stock_quantity', 'lte', 'min_stock')

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      const { data, error } = await query.order('stock_quantity', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get low stock products error:', error)
      return []
    }
  }

  // Create/Update Methods
  async createSale(saleData, items) {
    try {
      // Start a transaction by creating the sale first
      const { data: sale, error: saleError } = await this.client
        .from('sales')
        .insert([{
          receipt_number: `RCP${Date.now()}`,
          store_id: saleData.store_id,
          cashier_id: saleData.cashier_id,
          customer_id: saleData.customer_id,
          customer_name: saleData.customer_name,
          subtotal: saleData.subtotal,
          tax_amount: saleData.tax_amount || 0,
          discount_amount: saleData.discount_amount || 0,
          total_amount: saleData.total_amount,
          payment_method: saleData.payment_method,
          notes: saleData.notes
        }])
        .select()
        .single()

      if (saleError) throw saleError

      // Insert sale items
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }))

      const { error: itemsError } = await this.client
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) throw itemsError

      // Update product stock quantities
      for (const item of items) {
        const { error: stockError } = await this.client
          .rpc('update_product_stock', {
            product_id: item.product_id,
            quantity_sold: item.quantity
          })

        if (stockError) {
          console.error('Error updating stock for product:', item.product_id, stockError)
        }
      }

      return sale
    } catch (error) {
      console.error('Create sale error:', error)
      throw error
    }
  }

  async createProduct(productData) {
    try {
      const { data, error } = await this.client
        .from('products')
        .insert([productData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Create product error:', error)
      throw error
    }
  }

  async updateProduct(productId, updates) {
    try {
      const { data, error } = await this.client
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Update product error:', error)
      throw error
    }
  }

  // Utility Methods
  async testConnection() {
    try {
      const { data, error } = await this.client
        .from('companies')
        .select('count')
        .limit(1)

      if (error) throw error
      
      console.log('✅ Supabase connection test successful')
      return true
    } catch (error) {
      console.error('❌ Supabase connection test failed:', error)
      return false
    }
  }

  // Real-time subscriptions
  subscribeToSales(storeId, callback) {
    return this.client
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: storeId ? `store_id=eq.${storeId}` : undefined
        },
        callback
      )
      .subscribe()
  }

  subscribeToProducts(storeId, callback) {
    return this.client
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: storeId ? `store_id=eq.${storeId}` : undefined
        },
        callback
      )
      .subscribe()
  }

  // Unsubscribe from real-time updates
  unsubscribe(subscription) {
    if (subscription) {
      this.client.removeChannel(subscription)
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService()
export default supabaseService