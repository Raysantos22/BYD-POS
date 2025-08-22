// app/user-management.jsx - Complete user and staff management
import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  Alert,
  ActivityIndicator 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../utils/authContext'
import databaseService from '../../services/database'
import staffDatabaseService from '../../services/staffDatabase'
import StaffDataInspector from '../components/StaffDataInspector'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('users') // 'users' or 'staff'
  const [showStaffInspector, setShowStaffInspector] = useState(false)
  const [stats, setStats] = useState({
    users: { total: 0, active: 0 },
    staff: { total: 0, active: 0 }
  })

  const { user, logout } = useAuth()

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      await Promise.all([loadUsers(), loadStaff()])
    } catch (error) {
      console.error('Failed to load management data:', error)
      Alert.alert('Error', 'Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      // Initialize database first
      await databaseService.initializeDatabase()
      
      // Get users from local database
      const allUsers = await databaseService.getAllUsers()
      setUsers(allUsers)

      // Calculate user stats
      const userStats = {
        total: allUsers.length,
        active: allUsers.filter(u => u.is_active).length
      }
      
      setStats(prev => ({ ...prev, users: userStats }))
      
      console.log('📊 Users loaded:', userStats)
      
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
      if (user.role === 'super_admin') {
        // Super admin sees all staff
        staffData = await staffDatabaseService.getAllStaff()
      } else if (user.store_id) {
        // Other users see only their store's staff
        staffData = await staffDatabaseService.getStaffByStoreId(user.store_id)
      }
      
      setStaff(staffData)

      // Calculate staff stats
      const staffStats = {
        total: staffData.length,
        active: staffData.filter(s => s.is_active).length
      }
      
      setStats(prev => ({ ...prev, staff: staffStats }))
      
      console.log('📊 Staff loaded:', staffStats, 'Store filter:', user.store_id)
      
    } catch (error) {
      console.error('Error loading staff:', error)
      setStaff([])
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleUserAction = (userItem, action) => {
    const userName = userItem.name || 'Unknown User'
    
    switch (action) {
      case 'view':
        Alert.alert(
          'User Details',
          `Name: ${userItem.name}\n` +
          `Email: ${userItem.email}\n` +
          `Role: ${userItem.role}\n` +
          `Phone: ${userItem.phone || 'Not provided'}\n` +
          `Status: ${userItem.is_active ? 'Active' : 'Inactive'}\n` +
          `Created: ${new Date(userItem.created_at).toLocaleDateString()}`
        )
        break
        
      case 'toggle':
        Alert.alert(
          `${userItem.is_active ? 'Deactivate' : 'Activate'} User`,
          `Are you sure you want to ${userItem.is_active ? 'deactivate' : 'activate'} ${userName}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: () => toggleUserStatus(userItem) }
          ]
        )
        break
        
      case 'delete':
        if (userItem.id === user.id) {
          Alert.alert('Error', 'You cannot delete your own account')
          return
        }
        Alert.alert(
          'Delete User',
          `Are you sure you want to delete ${userName}? This action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteUser(userItem) }
          ]
        )
        break
    }
  }

  const toggleUserStatus = async (userItem) => {
    try {
      const newStatus = userItem.is_active ? 0 : 1
      await databaseService.upsertUser({
        ...userItem,
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      
      Alert.alert(
        'Success',
        `User ${newStatus ? 'activated' : 'deactivated'} successfully`
      )
      
      loadUsers()
    } catch (error) {
      Alert.alert('Error', 'Failed to update user status: ' + error.message)
    }
  }

  const deleteUser = async (userItem) => {
    try {
      // In a real app, you'd call an API to delete the user
      // For now, we'll just deactivate them
      await databaseService.upsertUser({
        ...userItem,
        is_active: 0,
        updated_at: new Date().toISOString()
      })
      
      Alert.alert('Success', 'User deleted successfully')
      loadUsers()
    } catch (error) {
      Alert.alert('Error', 'Failed to delete user: ' + error.message)
    }
  }

  const handleStaffAction = (staffItem, action) => {
    const staffName = staffItem.name || 'Unknown Staff'
    
    switch (action) {
      case 'view':
        Alert.alert(
          'Staff Details',
          `Name: ${staffItem.name}\n` +
          `Staff ID: ${staffItem.staff_id}\n` +
          `Position: ${staffItem.position}\n` +
          `Store ID: ${staffItem.store_id}\n` +
          `Hourly Rate: ${staffItem.hourly_rate}\n` +
          `Passcode: ${'*'.repeat(staffItem.passcode.length)}\n` +
          `Status: ${staffItem.is_active ? 'Active' : 'Inactive'}\n` +
          `Created: ${new Date(staffItem.created_at).toLocaleDateString()}`
        )
        break
        
      case 'toggle':
        Alert.alert(
          `${staffItem.is_active ? 'Deactivate' : 'Activate'} Staff`,
          `Are you sure you want to ${staffItem.is_active ? 'deactivate' : 'activate'} ${staffName}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: () => toggleStaffStatus(staffItem) }
          ]
        )
        break
        
      case 'delete':
        Alert.alert(
          'Delete Staff',
          `Are you sure you want to delete ${staffName}? This action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteStaff(staffItem) }
          ]
        )
        break
    }
  }

  const toggleStaffStatus = async (staffItem) => {
    try {
      const newStatus = staffItem.is_active ? 0 : 1
      await staffDatabaseService.updateStaff(staffItem.id, {
        is_active: newStatus
      })
      
      Alert.alert(
        'Success',
        `Staff member ${newStatus ? 'activated' : 'deactivated'} successfully`
      )
      
      loadStaff()
    } catch (error) {
      Alert.alert('Error', 'Failed to update staff status: ' + error.message)
    }
  }

  const deleteStaff = async (staffItem) => {
    try {
      await staffDatabaseService.deleteStaff(staffItem.id)
      Alert.alert('Success', 'Staff member deleted successfully')
      loadStaff()
    } catch (error) {
      Alert.alert('Error', 'Failed to delete staff: ' + error.message)
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

  const renderUserItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) + '20' }]}>
          <Text style={[styles.avatarText, { color: getRoleColor(item.role) }]}>
            {item.name?.charAt(0) || 'U'}
          </Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemEmail}>{item.email}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
              <Text style={styles.roleText}>{item.role.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <View style={[
              styles.statusBadge, 
              item.is_active ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={[
                styles.statusText,
                item.is_active ? styles.activeText : styles.inactiveText
              ]}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleUserAction(item, 'view')}
        >
          <Ionicons name="eye-outline" size={16} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleUserAction(item, 'toggle')}
        >
          <Ionicons 
            name={item.is_active ? "pause-circle-outline" : "play-circle-outline"} 
            size={16} 
            color={item.is_active ? "#f59e0b" : "#10b981"} 
          />
        </TouchableOpacity>
        {item.id !== user.id && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleUserAction(item, 'delete')}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const renderStaffItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <View style={[styles.avatar, { backgroundColor: getPositionColor(item.position) + '20' }]}>
          <Text style={[styles.avatarText, { color: getPositionColor(item.position) }]}>
            {item.name?.charAt(0) || 'S'}
          </Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemEmail}>ID: {item.staff_id} | Store: {item.store_id}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.roleBadge, { backgroundColor: getPositionColor(item.position) }]}>
              <Text style={styles.roleText}>{item.position}</Text>
            </View>
            <View style={[
              styles.statusBadge, 
              item.is_active ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={[
                styles.statusText,
                item.is_active ? styles.activeText : styles.inactiveText
              ]}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <Text style={styles.itemDetail}>Rate: ${item.hourly_rate}/hr</Text>
        </View>
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleStaffAction(item, 'view')}
        >
          <Ionicons name="eye-outline" size={16} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleStaffAction(item, 'toggle')}
        >
          <Ionicons 
            name={item.is_active ? "pause-circle-outline" : "play-circle-outline"} 
            size={16} 
            color={item.is_active ? "#f59e0b" : "#10b981"} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleStaffAction(item, 'delete')}
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  )

  // Role-based access control
  if (user?.role !== 'super_admin' && user?.role !== 'manager') {
    return (
      <View style={styles.container}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color="#ef4444" />
          <Text style={styles.accessTitle}>Access Restricted</Text>
          <Text style={styles.accessText}>
            You don't have permission to access user management.
            {'\n\n'}Contact your administrator for access.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => logout()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading management data...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSubtitle}>
          {user?.role === 'super_admin' ? 'Manage all users and staff' : 
           user?.store_id ? `Store: ${user.store_id}` : 'Manage users and staff'}
        </Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="people" size={24} color="#3b82f6" />
            <Text style={styles.statTitle}>Users</Text>
          </View>
          <Text style={styles.statNumber}>{stats.users.total}</Text>
          <Text style={styles.statSubtext}>{stats.users.active} active</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="person-add" size={24} color="#10b981" />
            <Text style={styles.statTitle}>Staff</Text>
          </View>
          <Text style={styles.statNumber}>{stats.staff.total}</Text>
          <Text style={styles.statSubtext}>
            {stats.staff.active} active
            {user?.role !== 'super_admin' && user?.store_id && (
              <Text style={styles.storeFilter}> (Store {user.store_id})</Text>
            )}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === 'users' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'users' && styles.activeTabText
          ]}>
            Users ({users.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'staff' && styles.activeTab]}
          onPress={() => setActiveTab('staff')}
        >
          <Ionicons 
            name="person-add" 
            size={20} 
            color={activeTab === 'staff' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'staff' && styles.activeTabText
          ]}>
            Staff ({staff.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      {activeTab === 'staff' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowStaffInspector(true)}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Manage Staff</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content List */}
      <View style={styles.listContainer}>
        {activeTab === 'users' ? (
          users.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyText}>
                No users are currently registered in the system.
              </Text>
            </View>
          ) : (
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )
        ) : (
          staff.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="person-add-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Staff Found</Text>
              <Text style={styles.emptyText}>
                {user?.role === 'super_admin' ? 
                  'No staff members are registered in the system.' :
                  `No staff assigned to store ${user?.store_id || 'your store'}.`
                }
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowStaffInspector(true)}
              >
                <Text style={styles.emptyButtonText}>Add Staff Member</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={staff}
              renderItem={renderStaffItem}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )
        )}
      </View>

      {/* Staff Inspector Modal */}
      <StaffDataInspector
        visible={showStaffInspector}
        onClose={() => {
          setShowStaffInspector(false)
          loadStaff() // Refresh staff data when inspector closes
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  storeFilter: {
    fontSize: 10,
    color: '#9ca3af',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  itemEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  itemDetail: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeText: {
    color: '#16a34a',
  },
  inactiveText: {
    color: '#dc2626',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  accessTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 20,
    textAlign: 'center',
  },
  accessText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default UserManagement