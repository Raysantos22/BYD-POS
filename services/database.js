// services/database.js - Simplified version for users only
import * as SQLite from 'expo-sqlite'

class DatabaseService {
  constructor() {
    this.db = null
    this.isInitialized = false
  }

  // Initialize database and create users table only
  async initializeDatabase() {
    try {
      console.log('🔧 Initializing SQLite database...')
      
      // Close existing connection if any
      if (this.db) {
        await this.db.closeAsync()
      }
      
      // Open database connection
      this.db = await SQLite.openDatabaseAsync('pos_users.db')
      
      // Enable foreign keys and WAL mode for better performance
      await this.db.execAsync(`
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
      `)
      
      // Create users table only
      await this.createUsersTable()
      
      // Verify table was created
      await this.verifyUsersTable()
      
      // Seed demo users if table is empty
      await this.seedDemoUsers()
      
      this.isInitialized = true
      console.log('✅ Database initialized successfully!')
      return this.db
    } catch (error) {
      console.error('❌ Database initialization failed:', error)
      this.isInitialized = false
      throw error
    }
  }

  // Create users table with simplified schema
  async createUsersTable() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'cashier',
        phone TEXT,
        is_active INTEGER DEFAULT 1,
        last_login TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `)
    
    // Create index for email lookups
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `)
    
    console.log('✅ Users table created')
  }

  // Verify users table exists
  async verifyUsersTable() {
    const result = await this.db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    )
    
    if (!result) {
      throw new Error("Users table was not created")
    }
    
    console.log('✅ Users table verified')
  }

  // Seed demo users if table is empty
  async seedDemoUsers() {
    try {
      const existingUser = await this.db.getFirstAsync('SELECT id FROM users LIMIT 1')
      
      if (!existingUser) {
        console.log('🌱 Seeding demo users...')

        const demoUsers = [
          {
            id: 'demo-admin-1',
            name: 'Demo Admin',
            email: 'admin@techcorp.com',
            password: 'password123',
            role: 'super_admin',
            phone: '+1-555-0100',
            is_active: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-manager-1',
            name: 'Demo Manager',
            email: 'manager@techcorp.com',
            password: 'password123',
            role: 'manager',
            phone: '+1-555-0101',
            is_active: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-cashier-1',
            name: 'Demo Cashier',
            email: 'cashier@techcorp.com',
            password: 'password123',
            role: 'cashier',
            phone: '+1-555-0102',
            is_active: 1,
            created_at: new Date().toISOString()
          }
        ]

        for (const user of demoUsers) {
          await this.db.runAsync(`
            INSERT INTO users (id, name, email, password, role, phone, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            user.id,
            user.name,
            user.email,
            user.password,
            user.role,
            user.phone,
            user.is_active,
            user.created_at,
            user.created_at // same for updated_at
          ])
        }

        console.log('✅ Demo users seeded successfully')
      } else {
        console.log('ℹ️  Users already exist, skipping seed')
      }
    } catch (error) {
      console.error('❌ Error seeding demo users:', error)
    }
  }

  // Get database instance
  getDatabase() {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initializeDatabase() first.')
    }
    return this.db
  }

  // Authenticate user
  async authenticateUser(email, password) {
    try {
      const user = await this.db.getFirstAsync(`
        SELECT * FROM users 
        WHERE email = ? AND password = ? AND is_active = 1
      `, [email.toLowerCase().trim(), password])

      if (user) {
        // Update last login
        await this.db.runAsync(
          'UPDATE users SET last_login = ? WHERE id = ?',
          [new Date().toISOString(), user.id]
        )
      }

      return user
    } catch (error) {
      console.error('Authentication error:', error)
      throw error
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      const users = await this.db.getAllAsync(`
        SELECT * FROM users 
        ORDER BY created_at DESC
      `)
      return users || []
    } catch (error) {
      console.error('Get all users error:', error)
      throw error
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const user = await this.db.getFirstAsync(
        'SELECT * FROM users WHERE id = ?',
        [id]
      )
      return user
    } catch (error) {
      console.error('Get user by ID error:', error)
      throw error
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const user = await this.db.getFirstAsync(
        'SELECT * FROM users WHERE email = ?',
        [email.toLowerCase()]
      )
      return user
    } catch (error) {
      console.error('Get user by email error:', error)
      throw error
    }
  }

  // Clear all users (for testing)
  async clearAllUsers() {
    try {
      await this.db.runAsync('DELETE FROM users')
      console.log('✅ All users cleared')
    } catch (error) {
      console.error('Clear users error:', error)
      throw error
    }
  }

  // Insert or update user from Supabase sync
  async upsertUser(userData) {
    try {
      // Prepare clean data - ensure all values are proper types
      const cleanUser = {
        id: String(userData.id || ''),
        name: String(userData.name || 'Unknown User'),
        email: String(userData.email || '').toLowerCase(),
        password: String(userData.password || 'temp_password_123'),
        role: String(userData.role || 'cashier'),
        phone: userData.phone ? String(userData.phone) : null,
        is_active: userData.is_active ? 1 : 0,
        last_login: userData.last_login ? String(userData.last_login) : null,
        created_at: String(userData.created_at || new Date().toISOString()),
        updated_at: String(userData.updated_at || new Date().toISOString())
      }

      // Validate required fields
      if (!cleanUser.id || !cleanUser.email || !cleanUser.name) {
        throw new Error(`Missing required fields: ${JSON.stringify(cleanUser)}`)
      }

      console.log(`📝 Upserting user: ${cleanUser.email}`)

      // Use INSERT OR REPLACE for upsert functionality
      await this.db.runAsync(`
        INSERT OR REPLACE INTO users 
        (id, name, email, password, role, phone, is_active, last_login, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        cleanUser.id,
        cleanUser.name,
        cleanUser.email,
        cleanUser.password,
        cleanUser.role,
        cleanUser.phone,
        cleanUser.is_active,
        cleanUser.last_login,
        cleanUser.created_at,
        cleanUser.updated_at
      ])

      console.log(`✅ User upserted: ${cleanUser.email}`)
      return cleanUser

    } catch (error) {
      console.error(`❌ Failed to upsert user:`, error)
      throw error
    }
  }

  // Sync users from Supabase data
  async syncUsers(usersData) {
    if (!Array.isArray(usersData) || usersData.length === 0) {
      console.log('⚠️ No users data to sync')
      return { synced: 0, failed: 0, errors: [] }
    }

    console.log(`🔄 Syncing ${usersData.length} users...`)

    let synced = 0
    let failed = 0
    let errors = []

    // Use transaction for better performance and data integrity
    await this.db.execAsync('BEGIN TRANSACTION')

    try {
      for (const userData of usersData) {
        try {
          await this.upsertUser(userData)
          synced++
        } catch (error) {
          failed++
          errors.push({
            user: userData.email || userData.id,
            error: error.message
          })
          console.error(`❌ Failed to sync user: ${userData.email}`, error.message)
        }
      }

      // Commit transaction
      await this.db.execAsync('COMMIT')
      
      console.log(`✅ Sync completed: ${synced} synced, ${failed} failed`)
      
      return {
        synced,
        failed,
        errors: errors.slice(0, 5), // Return first 5 errors
        total: usersData.length
      }

    } catch (error) {
      // Rollback on any error
      await this.db.execAsync('ROLLBACK')
      console.error('❌ Sync transaction failed:', error)
      throw error
    }
  }

  // Get database stats
  async getDatabaseStats() {
    try {
      const userCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM users')
      const activeUsers = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM users WHERE is_active = 1')
      
      return {
        users: userCount?.count || 0,
        activeUsers: activeUsers?.count || 0,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Get stats error:', error)
      return { users: 0, activeUsers: 0, error: error.message }
    }
  }

  // Check database health
  async checkDatabaseHealth() {
    try {
      if (!this.db) {
        throw new Error('Database not initialized')
      }

      // Test basic query
      const result = await this.db.getFirstAsync('SELECT sqlite_version() as version')
      console.log('📊 Database Health Check:', result)

      // Check users table
      const userCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM users')
      console.log('📋 Users count:', userCount)
      
      return {
        healthy: true,
        version: result?.version,
        userCount: userCount?.count || 0
      }
    } catch (error) {
      console.error('❌ Database health check failed:', error)
      return { healthy: false, error: error.message }
    }
  }

  // Close database
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