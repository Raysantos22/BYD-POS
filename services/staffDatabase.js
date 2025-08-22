// services/staffDatabase.js - Complete fixed version with all methods
import * as SQLite from 'expo-sqlite'

class StaffDatabaseService {
  constructor() {
    this.db = null
    this.isInitialized = false
    this.initPromise = null
  }

  // Initialize staff database
  async initializeStaffDatabase() {
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
      console.log('🔧 Initializing Staff database...')
      
      this.db = await SQLite.openDatabaseAsync('staff_database.db')
      
      await this.createTables()
      await this.seedDemoData()
      
      this.isInitialized = true
      console.log('✅ Staff database initialized successfully!')
      
      return this.db
    } catch (error) {
      console.error('❌ Staff database initialization failed:', error)
      this.isInitialized = false
      this.db = null
      this.initPromise = null
      throw error
    }
  }

  // FIXED: Add the missing ensureInitialized method
  async ensureInitialized() {
    if (!this.isInitialized || !this.db) {
      await this.initializeStaffDatabase()
    }
    if (!this.db) {
      throw new Error('Database initialization failed')
    }
    return this.db
  }

  async createTables() {
    if (!this.db) throw new Error('Database not initialized')
    
    // Create stores table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        manager_id TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `)
    
    // Create staff table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        staff_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        store_id TEXT NOT NULL,
        passcode TEXT NOT NULL,
        role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'supervisor')),
        hourly_rate REAL DEFAULT 15.00,
        image_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `)
    
    // Create indexes
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_staff_store_id ON staff(store_id);
      CREATE INDEX IF NOT EXISTS idx_staff_staff_id ON staff(staff_id);
      CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);
    `)
    
    console.log('✅ Tables and indexes created')
  }

  async seedDemoData() {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      // Check if data already exists
      const existingStores = await this.db.getFirstAsync('SELECT id FROM stores LIMIT 1')
      const existingStaff = await this.db.getFirstAsync('SELECT id FROM staff LIMIT 1')
      
      if (!existingStores) {
        console.log('🌱 Seeding demo stores...')
        
        const stores = [
          {
            id: 'store-001',
            name: 'Main Branch',
            address: '123 Main St, Downtown',
            phone: '+1-555-0100'
          },
          {
            id: 'store-002',
            name: 'North Branch', 
            address: '456 North Ave, Uptown',
            phone: '+1-555-0200'
          },
          {
            id: 'store-003',
            name: 'East Branch',
            address: '789 East Blvd, Eastside', 
            phone: '+1-555-0300'
          }
        ]

        for (const store of stores) {
          await this.db.runAsync(`
            INSERT INTO stores (id, name, address, phone, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            store.id,
            store.name,
            store.address,
            store.phone,
            1,
            new Date().toISOString(),
            new Date().toISOString()
          ])
        }
        console.log('✅ Demo stores seeded')
      }

      if (!existingStaff) {
        console.log('🌱 Seeding demo staff...')

        const staff = [
          {
            id: 'staff-001',
            staff_id: 'STF001',
            name: 'Alice Johnson',
            store_id: 'store-001',
            passcode: '1234',
            role: 'staff',
            hourly_rate: 16.50
          },
          {
            id: 'staff-002',
            staff_id: 'STF002',
            name: 'Bob Wilson',
            store_id: 'store-001',
            passcode: '5678',
            role: 'supervisor',
            hourly_rate: 20.00
          },
          {
            id: 'staff-003',
            staff_id: 'STF003',
            name: 'Carol Davis',
            store_id: 'store-002',
            passcode: '9876',
            role: 'staff',
            hourly_rate: 17.00
          },
          {
            id: 'staff-004',
            staff_id: 'STF004',
            name: 'David Brown',
            store_id: 'store-002',
            passcode: '4321',
            role: 'supervisor',
            hourly_rate: 21.00
          },
          {
            id: 'staff-005',
            staff_id: 'STF005',
            name: 'Eva Martinez',
            store_id: 'store-003',
            passcode: '8765',
            role: 'staff',
            hourly_rate: 16.00
          }
        ]

        for (const staffMember of staff) {
          await this.db.runAsync(`
            INSERT INTO staff (id, staff_id, name, store_id, passcode, role, hourly_rate, is_active, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            staffMember.id,
            staffMember.staff_id,
            staffMember.name,
            staffMember.store_id,
            staffMember.passcode,
            staffMember.role,
            staffMember.hourly_rate,
            1,
            'demo-admin',
            new Date().toISOString(),
            new Date().toISOString()
          ])
        }
        console.log('✅ Demo staff seeded')
      }
    } catch (error) {
      console.error('❌ Error seeding demo data:', error)
    }
  }

  // FIXED: Add clearDeletedStaff method
  async clearDeletedStaff(staffId) {
    try {
      await this.ensureInitialized()
      
      // Permanently delete inactive staff with this ID
      const result = await this.db.runAsync(
        'DELETE FROM staff WHERE staff_id = ? AND is_active = 0',
        [staffId.toUpperCase()]
      )
      
      if (result.changes > 0) {
        console.log(`🗑️ Cleared deleted staff with ID: ${staffId}`)
      }
      
      return result.changes > 0
    } catch (error) {
      console.error('Error clearing deleted staff:', error)
      return false
    }
  }

  // Get staff by user access with proper filtering
  async getStaffByUserAccess(user) {
    try {
      await this.ensureInitialized()
      
      if (!user) {
        console.log('⚠️ No user provided')
        return []
      }

      let query = `
        SELECT s.*, st.name as store_name 
        FROM staff s
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.is_active = 1
      `
      let params = []

      if (user.role === 'super_admin') {
        // Super admin sees all staff
        console.log('👑 Super admin accessing all staff')
      } else if (user.role === 'manager' && user.store_id) {
        // Manager sees only their store's staff
        console.log(`🏪 Manager accessing staff for store: ${user.store_id}`)
        query += ` AND s.store_id = ?`
        params.push(user.store_id)
      } else if (user.store_id) {
        // Other roles with store access
        console.log(`🏪 User accessing staff for store: ${user.store_id}`)
        query += ` AND s.store_id = ?`
        params.push(user.store_id)
      } else {
        console.log('⚠️ User has no store access')
        return []
      }

      query += ` ORDER BY s.role DESC, s.created_at DESC`

      const staff = await this.db.getAllAsync(query, params)
      console.log(`📊 Found ${staff?.length || 0} staff members`)
      return staff || []
    } catch (error) {
      console.error('Get staff by user access error:', error)
      throw error
    }
  }

  // Get staff by store ID
  async getStaffByStoreId(storeId, roleFilter = null, activeOnly = true) {
    try {
      await this.ensureInitialized()
      
      let query = `
        SELECT s.*, st.name as store_name 
        FROM staff s
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.store_id = ?
      `
      let params = [storeId]

      if (activeOnly) {
        query += ' AND s.is_active = 1'
      }

      if (roleFilter && ['staff', 'supervisor'].includes(roleFilter)) {
        query += ' AND s.role = ?'
        params.push(roleFilter)
      }

      query += ' ORDER BY s.role DESC, s.created_at DESC'

      const staff = await this.db.getAllAsync(query, params)
      console.log(`📊 Found ${staff?.length || 0} staff for store ${storeId}`)
      return staff || []
    } catch (error) {
      console.error('Get staff by store ID error:', error)
      throw error
    }
  }

  // Get all staff (for super admin)
  async getAllStaff() {
    try {
      await this.ensureInitialized()
      
      const staff = await this.db.getAllAsync(`
        SELECT s.*, st.name as store_name 
        FROM staff s
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.is_active = 1
        ORDER BY st.name, s.role DESC, s.created_at DESC
      `)
      return staff || []
    } catch (error) {
      console.error('Get all staff error:', error)
      throw error
    }
  }

  // FIXED: Create staff member with proper error handling
  async createStaff(staffData, currentUser) {
    try {
      await this.ensureInitialized()
      
      // Validate required fields
      if (!staffData.name || !staffData.staff_id || !staffData.store_id || !staffData.passcode) {
        throw new Error('Name, staff ID, store ID, and passcode are required')
      }

      // For managers, validate store access
      if (currentUser?.role === 'manager' && currentUser.store_id) {
        if (staffData.store_id !== currentUser.store_id) {
          throw new Error('Managers can only create staff for their assigned store')
        }
      }

      // Clear any previously deleted staff with same ID
      await this.clearDeletedStaff(staffData.staff_id)

      // Check if active staff ID already exists
      const existing = await this.db.getFirstAsync(
        'SELECT id FROM staff WHERE staff_id = ? AND is_active = 1',
        [staffData.staff_id.toUpperCase()]
      )

      if (existing) {
        throw new Error(`Staff ID "${staffData.staff_id}" already exists`)
      }

      // Verify store exists
      const store = await this.db.getFirstAsync(
        'SELECT id FROM stores WHERE id = ? AND is_active = 1',
        [staffData.store_id]
      )

      if (!store) {
        throw new Error('Store does not exist')
      }

      const newStaff = {
        id: `staff-${Date.now()}`,
        staff_id: String(staffData.staff_id).toUpperCase().trim(),
        name: String(staffData.name).trim(),
        store_id: String(staffData.store_id),
        passcode: String(staffData.passcode).trim(),
        role: String(staffData.role || 'staff'),
        hourly_rate: parseFloat(staffData.hourly_rate || 15.00),
        image_url: staffData.image_url || null,
        is_active: 1,
        created_by: currentUser?.id || 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await this.db.runAsync(`
        INSERT INTO staff (id, staff_id, name, store_id, passcode, role, hourly_rate, image_url, is_active, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newStaff.id,
        newStaff.staff_id,
        newStaff.name,
        newStaff.store_id,
        newStaff.passcode,
        newStaff.role,
        newStaff.hourly_rate,
        newStaff.image_url,
        newStaff.is_active,
        newStaff.created_by,
        newStaff.created_at,
        newStaff.updated_at
      ])

      console.log(`✅ Staff created: ${newStaff.staff_id}`)
      return newStaff
    } catch (error) {
      console.error('Create staff error:', error)
      throw error
    }
  }

  // Update staff member
  async updateStaff(staffId, updateData, currentUser = null) {
    try {
      await this.ensureInitialized()
      
      // For managers, validate store access
      if (currentUser?.role === 'manager' && currentUser.store_id) {
        const existing = await this.getStaffById(staffId)
        if (existing && existing.store_id !== currentUser.store_id) {
          throw new Error('Access denied: Staff not in your store')
        }
      }
      
      const updateFields = []
      const updateValues = []

      for (const [key, value] of Object.entries(updateData)) {
        if (key !== 'id' && key !== 'created_at' && key !== 'created_by') {
          if (key === 'role' && !['staff', 'supervisor'].includes(value)) {
            throw new Error('Invalid role')
          }
          updateFields.push(`${key} = ?`)
          updateValues.push(value)
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update')
      }

      updateFields.push('updated_at = ?')
      updateValues.push(new Date().toISOString())
      updateValues.push(staffId)

      const query = `UPDATE staff SET ${updateFields.join(', ')} WHERE id = ?`
      const result = await this.db.runAsync(query, updateValues)

      if (result.changes === 0) {
        throw new Error('Staff member not found')
      }

      console.log(`✅ Staff updated: ${staffId}`)
      return await this.getStaffById(staffId)
    } catch (error) {
      console.error('Update staff error:', error)
      throw error
    }
  }

  // Delete staff member (soft delete)
  async deleteStaff(staffId, currentUser = null) {
    try {
      await this.ensureInitialized()
      
      // For managers, validate store access
      if (currentUser?.role === 'manager' && currentUser.store_id) {
        const existing = await this.getStaffById(staffId)
        if (existing && existing.store_id !== currentUser.store_id) {
          throw new Error('Access denied: Staff not in your store')
        }
      }
      
      const result = await this.db.runAsync(
        'UPDATE staff SET is_active = 0, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), staffId]
      )

      if (result.changes === 0) {
        throw new Error('Staff member not found')
      }

      console.log(`✅ Staff deleted: ${staffId}`)
      return { success: true }
    } catch (error) {
      console.error('Delete staff error:', error)
      throw error
    }
  }

  // Get staff by ID
  async getStaffById(staffId) {
    try {
      await this.ensureInitialized()
      
      const staff = await this.db.getFirstAsync(`
        SELECT s.*, st.name as store_name 
        FROM staff s
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.id = ?
      `, [staffId])
      
      return staff
    } catch (error) {
      console.error('Get staff by ID error:', error)
      throw error
    }
  }

  // Get staff stats by store
  async getStaffStatsByStore(storeId) {
    try {
      await this.ensureInitialized()
      
      const total = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM staff WHERE store_id = ?',
        [storeId]
      )
      
      const active = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM staff WHERE store_id = ? AND is_active = 1',
        [storeId]
      )

      const supervisors = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM staff WHERE store_id = ? AND role = "supervisor" AND is_active = 1',
        [storeId]
      )

      const regularStaff = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM staff WHERE store_id = ? AND role = "staff" AND is_active = 1',
        [storeId]
      )

      return {
        total: total?.count || 0,
        active: active?.count || 0,
        inactive: (total?.count || 0) - (active?.count || 0),
        supervisors: supervisors?.count || 0,
        staff: regularStaff?.count || 0
      }
    } catch (error) {
      console.error('Get staff stats error:', error)
      return { total: 0, active: 0, inactive: 0, supervisors: 0, staff: 0 }
    }
  }

  // Get all staff stats (for super admin)
  async getAllStaffStats() {
    try {
      await this.ensureInitialized()
      
      const total = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM staff')
      const active = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM staff WHERE is_active = 1')
      const supervisors = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM staff WHERE role = "supervisor" AND is_active = 1')
      const regularStaff = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM staff WHERE role = "staff" AND is_active = 1')

      return {
        total: total?.count || 0,
        active: active?.count || 0,
        inactive: (total?.count || 0) - (active?.count || 0),
        supervisors: supervisors?.count || 0,
        staff: regularStaff?.count || 0
      }
    } catch (error) {
      console.error('Get all staff stats error:', error)
      return { total: 0, active: 0, inactive: 0, supervisors: 0, staff: 0 }
    }
  }

  // Get stores
  async getAllStores() {
    try {
      await this.ensureInitialized()
      
      const stores = await this.db.getAllAsync(`
        SELECT * FROM stores 
        WHERE is_active = 1 
        ORDER BY name
      `)
      return stores || []
    } catch (error) {
      console.error('Get stores error:', error)
      return []
    }
  }

  // Clear data (for testing)
  async clearAllStaff() {
    try {
      await this.ensureInitialized()
      await this.db.runAsync('DELETE FROM staff')
      console.log('✅ All staff cleared')
    } catch (error) {
      console.error('Clear staff error:', error)
      throw error
    }
  }

  async clearAllStores() {
    try {
      await this.ensureInitialized()
      await this.db.runAsync('DELETE FROM stores')
      console.log('✅ All stores cleared')
    } catch (error) {
      console.error('Clear stores error:', error)
      throw error
    }
  }

  // Close database
  async closeDatabase() {
    try {
      if (this.db) {
        await this.db.closeAsync()
        console.log('🔒 Staff database closed')
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
export const staffDatabaseService = new StaffDatabaseService()
export default staffDatabaseService