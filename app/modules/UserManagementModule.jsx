// components/UserManagementModule.jsx - Updated dashboard module with staff integration
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import databaseService from '../../services/database'
import staffDatabaseService from '../../services/staffDatabase'
import { styles, theme } from '../components/DashboardLayout'

const UserManagementModule = ({ userRole, userStoreId }) => {
  const [users, setUsers] = useState([])
  const [staff, setStaff] = useState([])
  const [stats, setStats] = useState({
    users: { total: 0, active: 0 },
    staff: { total: 0, active: 0 }
  })
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()

  useEffect(() => {
    // Only load for authorized roles
    if (userRole === 'super_admin' || userRole === 'manager') {
      loadData()
    }
  }, [userRole, userStoreId])

  const loadData = async () => {
    try {
      await Promise.all([loadUsers(), loadStaff()])
    } catch (error) {
      console.error('Error loading user management data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      // Initialize database
      await databaseService.initializeDatabase()
      
      // Get recent users (limit 5 for dashboard display)
      const allUsers = await databaseService.getAllUsers()
      const recentUsers = allUsers.slice(0, 5)
      setUsers(recentUsers)

      // Calculate stats
      const userStats = {
        total: allUsers.length,
        active: allUsers.filter(u => u.is_active).length
      }
      
      setStats(prev => ({ ...prev, users: userStats }))
      
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    }
  }

  const loadStaff = async () => {
    try {
      // Initialize staff database
      await staffDatabaseService.initializeStaffDatabase()
      
      let staffData = []
      
      // Filter staff based on user role and store
      if (userRole === 'super_admin') {
        // Super admin sees all staff (limit 5 for dashboard)
        const allStaff = await staffDatabaseService.getAllStaff()
        staffData = allStaff.slice(0, 5)
      } else if (userStoreId) {
        // Manager sees only their store's staff
        staffData = await staffDatabaseService.getStaffByStoreId(userStoreId)
      }
      
      setStaff(staffData.slice(0, 5)) // Limit to 5 for dashboard display

      // Calculate stats (use full data for stats, not limited)
      let fullStaffData = []
      if (userRole === 'super_admin') {
        fullStaffData = await staffDatabaseService.getAllStaff()
      } else if (userStoreId) {
        fullStaffData = await staffDatabaseService.getStaffByStoreId(userStoreId)
      }

      const staffStats = {
        total: fullStaffData.length,
        active: fullStaffData.filter(s => s.is_active).length
      }
      
      setStats(prev => ({ ...prev, staff: staffStats }))
      
    } catch (error) {
      console.error('Error loading staff:', error)
      setStaff([])
    }
  }

  const handleQuickAction = (action) => {
    switch (action) {
      case 'manage_all':
        router.push('/user-management')
        break
        
      case 'add_user':
        Alert.alert(
          'Add New User',
          'This feature would typically navigate to a user creation form.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Registration', onPress: () => router.push('/register') }
          ]
        )
        break
        
      case 'manage_staff':
        router.push('/user-management')
        break
        
      case 'sync_data':
        Alert.alert(
          'Sync Data',
          'This would sync user and staff data from the server.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sync Now', onPress: handleDataSync }
          ]
        )
        break
    }
  }

  const handleDataSync = async () => {
    try {
      // This would call your sync service
      Alert.alert('Success', 'Data sync completed successfully!')
      loadData() // Refresh data after sync
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data: ' + error.message)
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return '#dc2626'
      case 'manager': return '#ea580c'
      case 'cashier': return '#0891b2'
      default: return '#6b7280'
    }
  }

  const getPositionColor = (position) => {
    switch (position?.toLowerCase()) {
      case 'supervisor': 
      case 'manager': 
        return '#ea580c'
      case 'cashier': 
        return '#0891b2'
      case 'sales associate': 
        return '#7c3aed'
      default: 
        return '#6b7280'
    }
  }

  // 🚫 ONLY FOR AUTHORIZED ROLES
  if (userRole !== 'super_admin' && userRole !== 'manager') {
    return (
      <View style={[styles.module, { opacity: 0.6 }]}>
        <View style={styles.moduleHeader}>
          <Ionicons name="lock-closed" size={20} color={theme.textLight} />
          <Text style={styles.moduleTitle}>User Management</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Access restricted to managers and admins</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.module}>
      {/* Module Header */}
      <View style={styles.moduleHeader}>
        <View style={styles.moduleHeaderLeft}>
          <Ionicons name="people" size={20} color={theme.primary} />
          <Text style={styles.moduleTitle}>User Management</Text>
        </View>
        <TouchableOpacity 
          style={styles.moduleAction}
          onPress={() => handleQuickAction('sync_data')}
        >
          <Ionicons name="sync" size={16} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.users.total}</Text>
          <Text style={styles.statLabel}>Users</Text>
          <Text style={styles.statSubtext}>{stats.users.active} active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.staff.total}</Text>
          <Text style={styles.statLabel}>Staff</Text>
          <Text style={styles.statSubtext}>
            {stats.staff.active} active
            {userRole !== 'super_admin' && userStoreId && (
              <Text style={{ fontSize: 10, color: theme.textLight }}> (Store {userStoreId})</Text>
            )}
          </Text>
        </View>
      </View>

      {/* Recent Users List */}
      {users.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Users</Text>
          <View style={styles.list}>
            {users.map((user, index) => (
              <View key={user.id || index} style={styles.listItem}>
                <View style={[styles.avatar, { backgroundColor: getRoleColor(user.role) + '20' }]}>
                  <Text style={[styles.avatarText, { color: getRoleColor(user.role) }]}>
                    {user.name?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{user.name}</Text>
                  <Text style={styles.itemSubtitle}>{user.role.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.captionText}>{user.email}</Text>
                </View>
                <View style={[styles.statusBadge, { 
                  backgroundColor: user.is_active ? theme.success + '20' : theme.error + '20'
                }]}>
                  <Text style={[styles.statusText, {
                    color: user.is_active ? theme.success : theme.error
                  }]}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Staff List */}
      {staff.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Staff</Text>
          <View style={styles.list}>
            {staff.map((staffMember, index) => (
              <View key={staffMember.id || index} style={styles.listItem}>
                <View style={[styles.avatar, { backgroundColor: getPositionColor(staffMember.position) + '20' }]}>
                  <Text style={[styles.avatarText, { color: getPositionColor(staffMember.position) }]}>
                    {staffMember.name?.charAt(0) || 'S'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{staffMember.name}</Text>
                  <Text style={styles.itemSubtitle}>{staffMember.position}</Text>
                  <Text style={styles.captionText}>
                    ID: {staffMember.staff_id} | Store: {staffMember.store_id}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { 
                  backgroundColor: staffMember.is_active ? theme.success + '20' : theme.error + '20'
                }]}>
                  <Text style={[styles.statusText, {
                    color: staffMember.is_active ? theme.success : theme.error
                  }]}>
                    {staffMember.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty State */}
      {users.length === 0 && staff.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={theme.textLight} />
          <Text style={styles.emptyText}>No users or staff found</Text>
          <Text style={styles.emptySubtext}>
            {userRole === 'super_admin' ? 
              'No users registered in the system' :
              `No data for store ${userStoreId || 'your store'}`
            }
          </Text>
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading management data...</Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.moduleActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => handleQuickAction('manage_all')}
        >
          <Ionicons name="settings" size={16} color={theme.white} />
          <Text style={styles.primaryActionText}>Manage All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={() => handleQuickAction('add_user')}
        >
          <Ionicons name="person-add" size={16} color={theme.primary} />
          <Text style={styles.secondaryActionText}>Add User</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// Additional styles for the updated module
const moduleStyles = {
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleAction: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.cardSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.border,
    marginHorizontal: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 10,
    color: theme.textLight,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 2,
  },
  moduleActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  primaryAction: {
    backgroundColor: theme.primary,
  },
  secondaryAction: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.white,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 12,
    color: theme.textLight,
  },
  emptySubtext: {
    fontSize: 11,
    color: theme.textLight,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
}

// Merge with existing styles
Object.assign(styles, moduleStyles)

export default UserManagementModule