// services/productDatabase.js - Local SQLite database for products and categories
import * as SQLite from 'expo-sqlite'

class ProductDatabaseService {
  constructor() {
    this.db = null
    this.isInitialized = false
    this.initPromise = null
  }

  async initializeProductDatabase() {
    if (this.initPromise) {
      return this.initPromise
    }

    if (this.isInitialized && this.db) {
      return this.db
    }

    this.initPromise = this._initializeDatabase()
    return this.initPromise
  }

  async _initializeDatabase() {
    try {
      console.log('🔧 Initializing Product database...')
      
      this.db = await SQLite.openDatabaseAsync('product_database.db')
      
      await this.createTables()
      await this.seedDemoData()
      
      this.isInitialized = true
      console.log('✅ Product database initialized successfully!')
      
      return this.db
    } catch (error) {
      console.error('❌ Product database initialization failed:', error)
      this.isInitialized = false
      this.db = null
      this.initPromise = null
      throw error
    }
  }

  async createTables() {
    if (!this.db) throw new Error('Database not initialized')
    
    // Create categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3b82f6',
        icon TEXT DEFAULT 'cube-outline',
        store_id TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `)
    
    // Create products table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT UNIQUE,
        barcode TEXT,
        category_id TEXT,
        store_id TEXT NOT NULL,
        
        -- Pricing
        default_price REAL NOT NULL DEFAULT 0.00,
        manila_price REAL,
        delivery_price REAL,
        wholesale_price REAL,
        
        -- Inventory
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 5,
        max_stock_level INTEGER DEFAULT 100,
        
        -- Product details
        unit TEXT DEFAULT 'pcs',
        weight REAL,
        dimensions TEXT, -- JSON string
        
        -- Images and media
        image_url TEXT,
        images TEXT, -- JSON string
        
        -- Status and metadata
        is_active INTEGER DEFAULT 1,
        is_featured INTEGER DEFAULT 0,
        tags TEXT, -- JSON string
        
        -- Tracking
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `)
    
    // Create inventory movements table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
        quantity INTEGER NOT NULL,
        previous_stock INTEGER DEFAULT 0,
        new_stock INTEGER DEFAULT 0,
        unit_cost REAL,
        total_cost REAL,
        reference_type TEXT,
        reference_id TEXT,
        notes TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `)
    
    // Create indexes
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
      CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
      CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON inventory_movements(store_id);
    `)
    
    console.log('✅ Product tables and indexes created')
  }

  async seedDemoData() {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      const existingCategories = await this.db.getFirstAsync('SELECT id FROM categories LIMIT 1')
      const existingProducts = await this.db.getFirstAsync('SELECT id FROM products LIMIT 1')
      
      if (!existingCategories) {
        console.log('🌱 Seeding demo categories...')
        
        const categories = [
          {
            id: 'cat-001',
            name: 'Food & Beverages',
            description: 'Food items and drinks',
            color: '#10b981',
            icon: 'restaurant-outline',
            store_id: 'store-001'
          },
          {
            id: 'cat-002',
            name: 'Electronics',
            description: 'Electronic devices and accessories',
            color: '#3b82f6',
            icon: 'hardware-chip-outline',
            store_id: 'store-001'
          },
          {
            id: 'cat-003',
            name: 'Clothing',
            description: 'Apparel and fashion items',
            color: '#8b5cf6',
            icon: 'shirt-outline',
            store_id: 'store-001'
          },
          {
            id: 'cat-004',
            name: 'Home & Garden',
            description: 'Household and garden items',
            color: '#f59e0b',
            icon: 'home-outline',
            store_id: 'store-001'
          },
          {
            id: 'cat-005',
            name: 'Health & Beauty',
            description: 'Personal care and beauty products',
            color: '#ec4899',
            icon: 'heart-outline',
            store_id: 'store-001'
          }
        ]

        for (const category of categories) {
          await this.db.runAsync(`
            INSERT INTO categories (id, name, description, color, icon, store_id, is_active, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            category.id,
            category.name,
            category.description,
            category.color,
            category.icon,
            category.store_id,
            1,
            'demo-admin',
            new Date().toISOString(),
            new Date().toISOString()
          ])
        }
        console.log('✅ Demo categories seeded')
      }

      if (!existingProducts) {
        console.log('🌱 Seeding demo products...')

        const products = [
          {
            id: 'prod-001',
            name: 'Coca Cola 500ml',
            description: 'Refreshing cola drink',
            sku: 'COKE-500',
            barcode: '1234567890123',
            category_id: 'cat-001',
            store_id: 'store-001',
            default_price: 25.00,
            manila_price: 28.00,
            delivery_price: 30.00,
            wholesale_price: 22.00,
            stock_quantity: 100,
            unit: 'pcs'
          },
          {
            id: 'prod-002',
            name: 'iPhone 13 Pro',
            description: 'Latest iPhone model',
            sku: 'IPHONE-13PRO',
            barcode: '9876543210987',
            category_id: 'cat-002',
            store_id: 'store-001',
            default_price: 55000.00,
            manila_price: 56000.00,
            delivery_price: 57000.00,
            wholesale_price: 52000.00,
            stock_quantity: 10,
            unit: 'pcs'
          },
          {
            id: 'prod-003',
            name: 'Basic T-Shirt',
            description: 'Comfortable cotton t-shirt',
            sku: 'TSHIRT-BASIC',
            barcode: '5555666677778',
            category_id: 'cat-003',
            store_id: 'store-001',
            default_price: 299.00,
            manila_price: 320.00,
            delivery_price: 350.00,
            wholesale_price: 250.00,
            stock_quantity: 50,
            unit: 'pcs'
          },
          {
            id: 'prod-004',
            name: 'Shampoo 400ml',
            description: 'Hair care shampoo',
            sku: 'SHAMPOO-400',
            barcode: '1111222233334',
            category_id: 'cat-005',
            store_id: 'store-001',
            default_price: 150.00,
            manila_price: 160.00,
            delivery_price: 170.00,
            wholesale_price: 130.00,
            stock_quantity: 75,
            unit: 'bottle'
          }
        ]

        for (const product of products) {
          await this.db.runAsync(`
            INSERT INTO products (
              id, name, description, sku, barcode, category_id, store_id,
              default_price, manila_price, delivery_price, wholesale_price,
              stock_quantity, min_stock_level, max_stock_level, unit,
              is_active, is_featured, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            product.id, product.name, product.description, product.sku, product.barcode,
            product.category_id, product.store_id, product.default_price, product.manila_price,
            product.delivery_price, product.wholesale_price, product.stock_quantity,
            5, 100, product.unit, 1, 0, 'demo-admin',
            new Date().toISOString(), new Date().toISOString()
          ])
        }
        console.log('✅ Demo products seeded')
      }
    } catch (error) {
      console.error('❌ Error seeding demo data:', error)
    }
  }

  // Categories methods
  async getCategoriesByStore(storeId, activeOnly = true) {
    try {
      await this.initializeProductDatabase()
      
      let query = 'SELECT * FROM categories WHERE store_id = ?'
      let params = [storeId]

      if (activeOnly) {
        query += ' AND is_active = 1'
      }

      query += ' ORDER BY name ASC'

      const categories = await this.db.getAllAsync(query, params)
      console.log(`📊 Found ${categories?.length || 0} categories for store ${storeId}`)
      return categories || []
    } catch (error) {
      console.error('Get categories error:', error)
      throw error
    }
  }

  async createCategory(categoryData, currentUser) {
    try {
      await this.initializeProductDatabase()
      
      if (!categoryData.name || !categoryData.store_id) {
        throw new Error('Category name and store ID are required')
      }

      const newCategory = {
        id: `cat-${Date.now()}`,
        name: String(categoryData.name).trim(),
        description: categoryData.description || '',
        color: categoryData.color || '#3b82f6',
        icon: categoryData.icon || 'cube-outline',
        store_id: String(categoryData.store_id),
        is_active: 1,
        created_by: currentUser?.id || 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await this.db.runAsync(`
        INSERT INTO categories (id, name, description, color, icon, store_id, is_active, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newCategory.id, newCategory.name, newCategory.description, newCategory.color,
        newCategory.icon, newCategory.store_id, newCategory.is_active, newCategory.created_by,
        newCategory.created_at, newCategory.updated_at
      ])

      console.log(`✅ Category created: ${newCategory.name}`)
      return newCategory
    } catch (error) {
      console.error('Create category error:', error)
      throw error
    }
  }

  // Products methods
  async getProductsByStore(storeId, options = {}) {
    try {
      await this.initializeProductDatabase()
      
      const { categoryId, activeOnly = true, search, limit } = options
      
      let query = `
        SELECT p.*, c.name as category_name, c.color as category_color
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.store_id = ?
      `
      let params = [storeId]

      if (activeOnly) {
        query += ' AND p.is_active = 1'
      }

      if (categoryId) {
        query += ' AND p.category_id = ?'
        params.push(categoryId)
      }

      if (search) {
        query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)'
        const searchParam = `%${search}%`
        params.push(searchParam, searchParam, searchParam)
      }

      query += ' ORDER BY p.name ASC'

      if (limit) {
        query += ' LIMIT ?'
        params.push(limit)
      }

      const products = await this.db.getAllAsync(query, params)
      console.log(`📊 Found ${products?.length || 0} products for store ${storeId}`)
      return products || []
    } catch (error) {
      console.error('Get products error:', error)
      throw error
    }
  }

  async createProduct(productData, currentUser) {
    try {
      await this.initializeProductDatabase()
      
      if (!productData.name || !productData.store_id || !productData.default_price) {
        throw new Error('Product name, store ID, and default price are required')
      }

      // Check if SKU already exists
      if (productData.sku) {
        const existing = await this.db.getFirstAsync(
          'SELECT id FROM products WHERE sku = ? AND is_active = 1',
          [productData.sku.toUpperCase()]
        )
        if (existing) {
          throw new Error(`SKU "${productData.sku}" already exists`)
        }
      }

      const newProduct = {
        id: `prod-${Date.now()}`,
        name: String(productData.name).trim(),
        description: productData.description || '',
        sku: productData.sku ? String(productData.sku).toUpperCase().trim() : null,
        barcode: productData.barcode || null,
        category_id: productData.category_id || null,
        store_id: String(productData.store_id),
        default_price: parseFloat(productData.default_price),
        manila_price: productData.manila_price ? parseFloat(productData.manila_price) : null,
        delivery_price: productData.delivery_price ? parseFloat(productData.delivery_price) : null,
        wholesale_price: productData.wholesale_price ? parseFloat(productData.wholesale_price) : null,
        stock_quantity: parseInt(productData.stock_quantity || 0),
        min_stock_level: parseInt(productData.min_stock_level || 5),
        max_stock_level: parseInt(productData.max_stock_level || 100),
        unit: productData.unit || 'pcs',
        weight: productData.weight ? parseFloat(productData.weight) : null,
        dimensions: productData.dimensions ? JSON.stringify(productData.dimensions) : null,
        image_url: productData.image_url || null,
        images: productData.images ? JSON.stringify(productData.images) : null,
        is_active: 1,
        is_featured: productData.is_featured ? 1 : 0,
        tags: productData.tags ? JSON.stringify(productData.tags) : null,
        created_by: currentUser?.id || 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await this.db.runAsync(`
        INSERT INTO products (
          id, name, description, sku, barcode, category_id, store_id,
          default_price, manila_price, delivery_price, wholesale_price,
          stock_quantity, min_stock_level, max_stock_level, unit, weight,
          dimensions, image_url, images, is_active, is_featured, tags,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newProduct.id, newProduct.name, newProduct.description, newProduct.sku,
        newProduct.barcode, newProduct.category_id, newProduct.store_id,
        newProduct.default_price, newProduct.manila_price, newProduct.delivery_price,
        newProduct.wholesale_price, newProduct.stock_quantity, newProduct.min_stock_level,
        newProduct.max_stock_level, newProduct.unit, newProduct.weight, newProduct.dimensions,
        newProduct.image_url, newProduct.images, newProduct.is_active, newProduct.is_featured,
        newProduct.tags, newProduct.created_by, newProduct.created_at, newProduct.updated_at
      ])

      console.log(`✅ Product created: ${newProduct.name}`)
      return newProduct
    } catch (error) {
      console.error('Create product error:', error)
      throw error
    }
  }

  // Inventory methods
  async updateStock(productId, newQuantity, movementType = 'adjustment', notes = '', currentUser = null) {
    try {
      await this.initializeProductDatabase()
      
      // Get current stock
      const product = await this.db.getFirstAsync(
        'SELECT stock_quantity, store_id FROM products WHERE id = ?',
        [productId]
      )
      
      if (!product) {
        throw new Error('Product not found')
      }

      const previousStock = product.stock_quantity
      const quantity = newQuantity - previousStock

      // Update product stock
      await this.db.runAsync(
        'UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?',
        [newQuantity, new Date().toISOString(), productId]
      )

      // Record inventory movement
      const movement = {
        id: `inv-${Date.now()}`,
        product_id: productId,
        store_id: product.store_id,
        movement_type: movementType,
        quantity: quantity,
        previous_stock: previousStock,
        new_stock: newQuantity,
        notes: notes,
        created_by: currentUser?.id || 'system',
        created_at: new Date().toISOString()
      }

      await this.db.runAsync(`
        INSERT INTO inventory_movements (
          id, product_id, store_id, movement_type, quantity,
          previous_stock, new_stock, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        movement.id, movement.product_id, movement.store_id, movement.movement_type,
        movement.quantity, movement.previous_stock, movement.new_stock,
        movement.notes, movement.created_by, movement.created_at
      ])

      console.log(`✅ Stock updated for product ${productId}: ${previousStock} → ${newQuantity}`)
      return { success: true, previousStock, newStock: newQuantity }
    } catch (error) {
      console.error('Update stock error:', error)
      throw error
    }
  }

  async getInventoryMovements(storeId, options = {}) {
    try {
      await this.initializeProductDatabase()
      
      const { productId, limit = 50 } = options
      
      let query = `
        SELECT im.*, p.name as product_name, p.sku
        FROM inventory_movements im
        LEFT JOIN products p ON im.product_id = p.id
        WHERE im.store_id = ?
      `
      let params = [storeId]

      if (productId) {
        query += ' AND im.product_id = ?'
        params.push(productId)
      }

      query += ' ORDER BY im.created_at DESC LIMIT ?'
      params.push(limit)

      const movements = await this.db.getAllAsync(query, params)
      return movements || []
    } catch (error) {
      console.error('Get inventory movements error:', error)
      throw error
    }
  }

  // Statistics
  async getProductStats(storeId) {
    try {
      await this.initializeProductDatabase()
      
      const totalProducts = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM products WHERE store_id = ? AND is_active = 1',
        [storeId]
      )
      
      const totalCategories = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM categories WHERE store_id = ? AND is_active = 1',
        [storeId]
      )

      const lowStockProducts = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM products WHERE store_id = ? AND is_active = 1 AND stock_quantity <= min_stock_level',
        [storeId]
      )

      const outOfStockProducts = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM products WHERE store_id = ? AND is_active = 1 AND stock_quantity = 0',
        [storeId]
      )

      return {
        totalProducts: totalProducts?.count || 0,
        totalCategories: totalCategories?.count || 0,
        lowStockProducts: lowStockProducts?.count || 0,
        outOfStockProducts: outOfStockProducts?.count || 0
      }
    } catch (error) {
      console.error('Get product stats error:', error)
      return { totalProducts: 0, totalCategories: 0, lowStockProducts: 0, outOfStockProducts: 0 }
    }
  }

  // Clean up methods
  async closeDatabase() {
    try {
      if (this.db) {
        await this.db.closeAsync()
        console.log('🔒 Product database closed')
      }
    } catch (error) {
      console.error('Error closing database:', error)
    } finally {
      this.db = null
      this.isInitialized = false
      this.initPromise = null
    }
  }
}

// Export singleton instance
export const productDatabaseService = new ProductDatabaseService()
export default productDatabaseService