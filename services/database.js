// services/database.js - Fixed version with better error handling
import * as SQLite from 'expo-sqlite'

class DatabaseService {
  constructor() {
    this.db = null
    this.isInitialized = false
  }

  // Initialize database and create tables
  async initializeDatabase() {
    try {
      console.log('🔧 Initializing SQLite database...')
      
      // Close existing connection if any
      if (this.db) {
        await this.db.closeAsync()
      }
      
      // Open database connection
      this.db = await SQLite.openDatabaseAsync('pos_system.db')
      
      // Enable foreign keys and WAL mode for better performance
      await this.db.execAsync(`
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
      `)
      
      // Create all tables
      await this.createTables()
      
      // Verify tables were created
      await this.verifyTables()
      
      // Seed initial data if tables are empty
      await this.seedInitialData()
      
      this.isInitialized = true
      console.log('✅ Database initialized successfully!')
      return this.db
    } catch (error) {
      console.error('❌ Database initialization failed:', error)
      this.isInitialized = false
      throw error
    }
  }

  // Verify all tables exist
  async verifyTables() {
    const requiredTables = [
      'companies', 'stores', 'users', 'categories', 'products', 
      'customers', 'sales', 'sale_items', 'inventory_movements'
    ]
    
    for (const tableName of requiredTables) {
      const result = await this.db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      )
      
      if (!result) {
        throw new Error(`Table '${tableName}' was not created`)
      }
    }
    
    console.log('✅ All required tables verified')
  }

  // Create all database tables with better error handling
  async createTables() {
    try {
      console.log('📋 Creating database tables...')
      
      // Create tables one by one for better error tracking
      await this.createCompaniesTable()
      await this.createStoresTable()
      await this.createUsersTable()
      await this.createCategoriesTable()
      await this.createProductsTable()
      await this.createCustomersTable()
      await this.createSalesTable()
      await this.createSaleItemsTable()
      await this.createInventoryMovementsTable()
      await this.createIndexes()
      
      console.log('✅ All database tables created successfully')
    } catch (error) {
      console.error('❌ Error creating tables:', error)
      throw error
    }
  }

  async createCompaniesTable() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        logo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }

  async createStoresTable() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        manager_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id)
      );
    `)
  }

  async createUsersTable() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'cashier',
        company_id INTEGER,
        store_id INTEGER,
        phone TEXT,
        avatar TEXT,
        is_active INTEGER DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id),
        FOREIGN KEY (store_id) REFERENCES stores (id)
      );
    `)
  }

  async createCategoriesTable() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3b82f6',
        icon TEXT DEFAULT 'cube',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }

  async createProductsTable() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        cost REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 5,
        barcode TEXT UNIQUE,
        sku TEXT,
        category_id INTEGER,
        store_id INTEGER,
        image TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (store_id) REFERENCES stores (id)
      );
    `)
  }

  async createCustomersTable() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        store_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores (id)
      );
    `)
  }

  async createSalesTable() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT UNIQUE NOT NULL,
        store_id INTEGER NOT NULL,
        cashier_id INTEGER NOT NULL,
        customer_id INTEGER,
        customer_name TEXT,
        subtotal REAL NOT NULL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT DEFAULT 'completed',
        status TEXT DEFAULT 'completed',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores (id),
        FOREIGN KEY (cashier_id) REFERENCES users (id),
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      );
    `)
  }

  async createSaleItemsTable() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `)
  }

  async createInventoryMovementsTable() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reason TEXT,
        reference_id INTEGER,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `)
  }

  async createIndexes() {
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
      CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
      CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    `)
  }

  // Method to check database health
  async checkDatabaseHealth() {
    try {
      if (!this.db) {
        throw new Error('Database not initialized')
      }

      // Test basic query
      const result = await this.db.getFirstAsync('SELECT sqlite_version() as version')
      console.log('📊 Database Health Check:', result)

      // Check table counts
      const tables = await this.db.getAllAsync(`
        SELECT name, 
          (SELECT COUNT(*) FROM sqlite_master sm2 WHERE sm2.name = sm.name AND sm2.type = 'table') as exists
        FROM sqlite_master sm 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `)
      
      console.log('📋 Database Tables:', tables)
      return true
    } catch (error) {
      console.error('❌ Database health check failed:', error)
      return false
    }
  }

  // Enhanced seed data method
  async seedInitialData() {
    try {
      // Check if data already exists
      const existingCompany = await this.db.getFirstAsync('SELECT id FROM companies LIMIT 1')
      
      if (!existingCompany) {
        console.log('🌱 Seeding initial data...')

        // Insert company
        const companyResult = await this.db.runAsync(
          'INSERT INTO companies (name, address, phone, email) VALUES (?, ?, ?, ?)',
          ['TechCorp POS Solutions', '123 Business District, Tech City', '+1-555-0123', 'info@techcorp.com']
        )

        // Insert stores
        await this.db.runAsync(
          'INSERT INTO stores (company_id, name, address, phone) VALUES (?, ?, ?, ?)',
          [1, 'Main Store', '123 Main Street, Downtown', '+1-555-0124']
        )

        await this.db.runAsync(
          'INSERT INTO stores (company_id, name, address, phone) VALUES (?, ?, ?, ?)',
          [1, 'Branch Store', '456 Oak Avenue, Uptown', '+1-555-0125']
        )

        // Insert users with different roles
        const users = [
          ['Super Admin', 'admin@techcorp.com', 'password123', 'super_admin', 1, null, '+1-555-0100'],
          ['Store Manager', 'manager@techcorp.com', 'password123', 'manager', 1, 1, '+1-555-0101'],
          ['John Cashier', 'cashier@techcorp.com', 'password123', 'cashier', 1, 1, '+1-555-0102'],
          ['Jane Cashier', 'jane@techcorp.com', 'password123', 'cashier', 1, 1, '+1-555-0103'],
          ['Mike Manager', 'mike@techcorp.com', 'password123', 'manager', 1, 2, '+1-555-0104']
        ]

        for (const user of users) {
          await this.db.runAsync(
            'INSERT INTO users (name, email, password, role, company_id, store_id, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
            user
          )
        }

        // Insert categories
        const categories = [
          ['Beverages', 'Hot and cold drinks', '#3b82f6', 'cafe'],
          ['Food', 'Sandwiches, meals, and snacks', '#10b981', 'restaurant'],
          ['Bakery', 'Fresh baked goods', '#f59e0b', 'pizza'],
          ['Retail', 'Merchandise and retail items', '#8b5cf6', 'bag'],
          ['Office Supplies', 'Pens, paper, and office items', '#6b7280', 'briefcase']
        ]

        for (const category of categories) {
          await this.db.runAsync(
            'INSERT INTO categories (name, description, color, icon) VALUES (?, ?, ?, ?)',
            category
          )
        }

        // Insert products
        const products = [
          ['Coffee - Americano', 'Fresh brewed americano coffee', 3.50, 1.50, 100, 5, '1234567890123', 'AME001', 1, 1],
          ['Coffee - Latte', 'Creamy espresso with steamed milk', 4.25, 2.00, 80, 5, '1234567890124', 'LAT001', 1, 1],
          ['Espresso', 'Strong espresso shot', 2.75, 1.25, 120, 10, '1234567890125', 'ESP001', 1, 1],
          ['Cappuccino', 'Espresso with foam', 4.00, 1.75, 75, 5, '1234567890126', 'CAP001', 1, 1],
          
          ['Club Sandwich', 'Triple layer club sandwich', 8.99, 4.50, 25, 3, '1234567890127', 'CLB001', 2, 1],
          ['Caesar Salad', 'Fresh caesar salad with chicken', 9.50, 5.00, 20, 3, '1234567890128', 'SAL001', 2, 1],
          ['Burger - Classic', 'Classic beef burger with fries', 12.99, 6.50, 30, 5, '1234567890129', 'BUR001', 2, 1],
          
          ['Croissant - Plain', 'Fresh butter croissant', 3.25, 1.50, 40, 5, '1234567890130', 'CRO001', 3, 1],
          ['Muffin - Blueberry', 'Fresh blueberry muffin', 3.99, 1.75, 35, 5, '1234567890131', 'MUF001', 3, 1],
          ['Danish - Apple', 'Apple danish pastry', 4.50, 2.25, 25, 3, '1234567890132', 'DAN001', 3, 1],
          
          ['T-Shirt - Logo', 'Company logo t-shirt', 19.99, 8.00, 50, 10, '1234567890133', 'TSH001', 4, 1],
          ['Coffee Mug', 'Ceramic coffee mug', 12.99, 6.00, 30, 5, '1234567890134', 'MUG001', 4, 1],
          
          ['Pen - Black', 'Black ballpoint pen', 1.99, 0.50, 200, 20, '1234567890135', 'PEN001', 5, 1],
          ['Notebook', 'Spiral notebook', 4.99, 2.00, 100, 10, '1234567890136', 'NOT001', 5, 1]
        ]

        for (const product of products) {
          await this.db.runAsync(
            'INSERT INTO products (name, description, price, cost, stock_quantity, min_stock, barcode, sku, category_id, store_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            product
          )
        }

        // Insert sample customers
        const customers = [
          ['John Smith', 'john@email.com', '+1-555-1001', '123 Oak St', 0, 0, 1],
          ['Sarah Johnson', 'sarah@email.com', '+1-555-1002', '456 Pine Ave', 50, 150.00, 1],
          ['Mike Brown', 'mike@email.com', '+1-555-1003', '789 Elm Rd', 25, 75.50, 1],
          ['Emily Davis', null, '+1-555-1004', null, 0, 0, 1]
        ]

        for (const customer of customers) {
          await this.db.runAsync(
            'INSERT INTO customers (name, email, phone, address, loyalty_points, total_spent, store_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            customer
          )
        }

        // Insert sample sales for demo
        await this.seedSampleSales()

        console.log('✅ Initial data seeded successfully')
      } else {
        console.log('ℹ️  Database already contains data, skipping seed')
      }
    } catch (error) {
      console.error('❌ Error seeding initial data:', error)
      throw error
    }
  }

  // Add sample sales data
  async seedSampleSales() {
    const sampleSales = [
      {
        receipt_number: 'RCP' + Date.now() + '001',
        store_id: 1,
        cashier_id: 3,
        customer_name: 'Walk-in Customer',
        subtotal: 12.00,
        tax_amount: 1.20,
        total_amount: 13.20,
        payment_method: 'cash',
        items: [
          { product_id: 1, product_name: 'Coffee - Americano', quantity: 2, unit_price: 3.50, total_price: 7.00 },
          { product_id: 2, product_name: 'Coffee - Latte', quantity: 1, unit_price: 4.25, total_price: 4.25 }
        ]
      },
      {
        receipt_number: 'RCP' + Date.now() + '002',
        store_id: 1,
        cashier_id: 3,
        customer_id: 2,
        customer_name: 'Sarah Johnson',
        subtotal: 8.99,
        tax_amount: 0.90,
        total_amount: 9.89,
        payment_method: 'card',
        items: [
          { product_id: 5, product_name: 'Club Sandwich', quantity: 1, unit_price: 8.99, total_price: 8.99 }
        ]
      }
    ]

    for (const sale of sampleSales) {
      const saleResult = await this.db.runAsync(`
        INSERT INTO sales (
          receipt_number, store_id, cashier_id, customer_id, customer_name,
          subtotal, tax_amount, discount_amount, total_amount, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sale.receipt_number,
        sale.store_id,
        sale.cashier_id,
        sale.customer_id || null,
        sale.customer_name,
        sale.subtotal,
        sale.tax_amount,
        0,
        sale.total_amount,
        sale.payment_method
      ])

      const saleId = saleResult.lastInsertRowId

      for (const item of sale.items) {
        await this.db.runAsync(`
          INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          saleId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.total_price
        ])
      }
    }
  }

  // Rest of your existing methods remain the same...
  getDatabase() {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initializeDatabase() first.')
    }
    return this.db
  }

  async authenticateUser(email, password) {
    try {
      const user = await this.db.getFirstAsync(`
        SELECT 
          u.*,
          c.name as company_name,
          s.name as store_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.email = ? AND u.password = ? AND u.is_active = 1
      `, [email.toLowerCase().trim(), password])

      if (user) {
        await this.db.runAsync(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        )
      }

      return user
    } catch (error) {
      console.error('Authentication error:', error)
      throw error
    }
  }

  // ... (include all your other existing methods like getUsers, createUser, getProducts, etc.)
  
  async getSalesStats(storeId = null, dateFrom = null, dateTo = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as avg_transaction,
          COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END), 0) as today_revenue,
          COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_transactions
        FROM sales
        WHERE status = 'completed'
      `
      const params = []

      if (storeId) {
        query += ' AND store_id = ?'
        params.push(storeId)
      }

      if (dateFrom) {
        query += ' AND DATE(created_at) >= ?'
        params.push(dateFrom)
      }

      if (dateTo) {
        query += ' AND DATE(created_at) <= ?'
        params.push(dateTo)
      }

      const result = await this.db.getFirstAsync(query, params)
      return result || {
        total_transactions: 0,
        total_revenue: 0,
        avg_transaction: 0,
        today_revenue: 0,
        today_transactions: 0
      }
    } catch (error) {
      console.error('Error fetching sales stats:', error)
      throw error
    }
  }

  async getSales(storeId = null, limit = 50) {
    try {
      let query = `
        SELECT 
          s.*,
          u.name as cashier_name,
          st.name as store_name,
          COUNT(si.id) as item_count
        FROM sales s
        LEFT JOIN users u ON s.cashier_id = u.id
        LEFT JOIN stores st ON s.store_id = st.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE 1=1
      `
      const params = []

      if (storeId) {
        query += ' AND s.store_id = ?'
        params.push(storeId)
      }

      query += ` 
        GROUP BY s.id
        ORDER BY s.created_at DESC 
        LIMIT ?
      `
      params.push(limit)

      return await this.db.getAllAsync(query, params)
    } catch (error) {
      console.error('Error fetching sales:', error)
      throw error
    }
  }

  async closeDatabase() {
    if (this.db) {
      await this.db.closeAsync()
      this.db = null
      this.isInitialized = false
      console.log('🔒 Database connection closed')
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()
export default databaseService