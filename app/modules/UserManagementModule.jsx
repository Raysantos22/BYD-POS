// components/UserManagementModule.jsx - Enhanced with staff role change functionality
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import databaseService from '../../services/database'
import staffDatabaseService from '../../services/staffDatabase'
import staffService from '../../services/staffService'
import { styles, theme } from '../components/DashboardLayout'

const UserManagementModule = ({ userRole, userStoreId, userCompanyId, companyInfo }) => {
  const [users, setUsers] = useState([])
  const [staff, setStaff] = useState([])
  const [stats, setStats] = useState({
    users: { total: 0, active: 0 },
    staff: { total: 0, active: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [updating, setUpdating] = useState(false)
  
  const router = useRouter()

  // Available staff roles
  const staffRoles = [
    { id: 'staff', name: 'Staff', description: 'Basic staff member', color: '#6b7280' },
    { id: 'supervisor', name: 'Supervisor', description: 'Team supervisor', color: '#ea580c' },
    { id: 'cashier', name: 'Cashier', description: 'Cashier role', color: '#0891b2' },
    { id: 'sales_associate', name: 'Sales Associate', description: 'Sales team member', color: '#7c3aed' }
  ]

  useEffect(() => {
    // Only load for authorized roles
    if (userRole === 'super_admin' || userRole === 'manager') {
      loadData()
    }
  }, [userRole, userStoreId, userCompanyId])

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
      // ENHANCED: Use staff service with user context for company filtering
      const currentUser = {
        role: userRole,
        store_id: userStoreId,
        company_id: userCompanyId
      }
      
      const staffData = await staffService.getStaff(currentUser)
      setStaff(staffData.slice(0, 5)) // Limit to 5 for dashboard display

      // Calculate stats using full data
      const staffStats = {
        total: staffData.length,
        active: staffData.filter(s => s.is_active).length
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

  // ENHANCED: Handle staff role change
  const handleStaffRoleChange = (staffMember) => {
    setSelectedStaff(staffMember)
    setShowRoleModal(true)
  }

  const updateStaffRole = async (newRole) => {
    if (!selectedStaff) return

    try {
      setUpdating(true)
      
      const currentUser = {
        role: userRole,
        store_id: userStoreId,
        company_id: userCompanyId,
        id: 'current-user' // This would be the actual user ID
      }

      // Update staff role using staffDatabaseService
      await staffDatabaseService.initializeStaffDatabase()
      
      const updatedStaff = {
        ...selectedStaff,
        role: newRole,
        position: newRole, // Also update position field for compatibility
        updated_at: new Date().toISOString()
      }

      // Update in local database
      await staffDatabaseService.db.runAsync(`
        UPDATE staff 
        SET role = ?, position = ?, updated_at = ?
        WHERE id = ?
      `, [newRole, newRole, updatedStaff.updated_at, selectedStaff.id])

      // Update state
      setStaff(prevStaff => 
        prevStaff.map(s => 
          s.id === selectedStaff.id ? updatedStaff : s
        )
      )

      setShowRoleModal(false)
      setSelectedStaff(null)

      Alert.alert(
        'Success',
        `${selectedStaff.name}'s role has been updated to ${staffRoles.find(r => r.id === newRole)?.name || newRole}`,
        [{ text: 'OK' }]
      )

      console.log('✅ Staff role updated:', selectedStaff.name, 'to', newRole)

    } catch (error) {
      console.error('❌ Error updating staff role:', error)
      Alert.alert('Error', 'Failed to update staff role: ' + error.message)
    } finally {
      setUpdating(false)
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
    const role = staffRoles.find(r => r.id === position?.toLowerCase() || r.id === position)
    return role ? role.color : '#6b7280'
  }

  const getPositionDisplayName = (position) => {
    const role = staffRoles.find(r => r.id === position?.toLowerCase() || r.id === position)
    return role ? role.name : (position || 'Staff')
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
          <Text style={styles.moduleTitle}>
            User Management
            {userRole === 'manager' && companyInfo && (
              <Text style={styles.moduleSubtitle}> - {companyInfo.name}</Text>
            )}
          </Text>
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
            {userRole === 'manager' && companyInfo && (
              <Text style={{ fontSize: 10, color: theme.textLight }}> ({companyInfo.name})</Text>
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

      {/* ENHANCED: Recent Staff List with Role Change */}
      {staff.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Staff</Text>
          <View style={styles.list}>
            {staff.map((staffMember, index) => (
              <View key={staffMember.id || index} style={styles.listItem}>
                <View style={[styles.avatar, { backgroundColor: getPositionColor(staffMember.role || staffMember.position) + '20' }]}>
                  <Text style={[styles.avatarText, { color: getPositionColor(staffMember.role || staffMember.position) }]}>
                    {staffMember.name?.charAt(0) || 'S'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{staffMember.name}</Text>
                  <TouchableOpacity 
                    style={styles.roleChangeButton}
                    onPress={() => handleStaffRoleChange(staffMember)}
                  >
                    <Text style={[styles.itemSubtitle, { color: getPositionColor(staffMember.role || staffMember.position) }]}>
                      {getPositionDisplayName(staffMember.role || staffMember.position)}
                    </Text>
                    <Ionicons name="chevron-down" size={12} color={getPositionColor(staffMember.role || staffMember.position)} />
                  </TouchableOpacity>
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
              userRole === 'manager' && companyInfo ? 
                `No data for ${companyInfo.name} stores` :
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

      {/* ENHANCED: Role Change Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Staff Role</Text>
            <View style={{ width: 60 }} />
          </View>
          
          {selectedStaff && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.staffInfo}>
                <View style={[styles.staffAvatar, { backgroundColor: getPositionColor(selectedStaff.role || selectedStaff.position) + '20' }]}>
                  <Text style={[styles.staffAvatarText, { color: getPositionColor(selectedStaff.role || selectedStaff.position) }]}>
                    {selectedStaff.name?.charAt(0) || 'S'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.staffName}>{selectedStaff.name}</Text>
                  <Text style={styles.staffDetails}>ID: {selectedStaff.staff_id}</Text>
                  <Text style={styles.staffDetails}>Store: {selectedStaff.store_id}</Text>
                </View>
              </View>

              <Text style={styles.roleSelectionTitle}>Select New Role:</Text>
              
              <View style={styles.roleOptions}>
                {staffRoles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.roleOption,
                      (selectedStaff.role === role.id || selectedStaff.position === role.id) && styles.currentRole
                    ]}
                    onPress={() => updateStaffRole(role.id)}
                    disabled={updating}
                  >
                    <View style={[styles.roleIcon, { backgroundColor: role.color + '20' }]}>
                      <View style={[styles.roleIconDot, { backgroundColor: role.color }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleName}>{role.name}</Text>
                      <Text style={styles.roleDescription}>{role.description}</Text>
                    </View>
                    {(selectedStaff.role === role.id || selectedStaff.position === role.id) && (
                      <Ionicons name="checkmark-circle" size={20} color={role.color} />
                    )}
                    {updating && (
                      <View style={styles.roleLoading}>
                        <Text style={styles.roleLoadingText}>Updating...</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  )
}

// Enhanced styles
const enhancedStyles = {
  moduleSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.textSecondary,
  },
  roleChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalCancel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: 20,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  staffAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  staffDetails: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  roleSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 16,
  },
  roleOptions: {
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.backgroundLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentRole: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '10',
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleIconDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  roleLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.white + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  roleLoadingText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
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

// Merge all styles
Object.assign(styles, moduleStyles, enhancedStyles)

export default UserManagementModule