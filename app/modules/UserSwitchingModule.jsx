// components/UserSwitchingModule.jsx - Switch between user accounts with passcode
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, Modal, ScrollView, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../../utils/authContext'
import databaseService from '../../services/database'
import staffDatabaseService from '../../services/staffDatabase'
import staffService from '../../services/staffService'
import { styles, theme } from '../components/DashboardLayout'

const UserSwitchingModule = ({ userRole, userStoreId, userCompanyId, companyInfo }) => {
  const [users, setUsers] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [passcode, setPasscode] = useState('')
  const [switching, setSwitching] = useState(false)
  const [accountType, setAccountType] = useState('') // 'user' or 'staff'
  
  const router = useRouter()
  const { user: currentUser, setUser, switchUser } = useAuth()

  useEffect(() => {
    if (userRole === 'super_admin' || userRole === 'manager') {
      loadAvailableAccounts()
    }
  }, [userRole, userStoreId, userCompanyId])

  const loadAvailableAccounts = async () => {
    try {
      await Promise.all([loadUsers(), loadStaff()])
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      await databaseService.initializeDatabase()
      
      let allUsers = await databaseService.getAllUsers()
      
      // Filter users based on current user role
      if (userRole === 'manager' && userCompanyId) {
        // Managers can switch to users in their company
        allUsers = allUsers.filter(user => 
          user.company_id === userCompanyId && user.id !== currentUser?.id
        )
      } else if (userRole === 'super_admin') {
        // Super admin can switch to any user except themselves
        allUsers = allUsers.filter(user => user.id !== currentUser?.id)
      }
      
      setUsers(allUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    }
  }

  const loadStaff = async () => {
    try {
      const currentUserContext = {
        role: userRole,
        store_id: userStoreId,
        company_id: userCompanyId
      }
      
      const staffData = await staffService.getStaff(currentUserContext)
      setStaff(staffData)
    } catch (error) {
      console.error('Error loading staff:', error)
      setStaff([])
    }
  }

  const handleAccountSwitch = (account, type) => {
    setSelectedAccount(account)
    setAccountType(type)
    setPasscode('')
    setShowSwitchModal(true)
  }

  const verifyAndSwitchAccount = async () => {
    if (!selectedAccount || !passcode.trim()) {
      Alert.alert('Error', 'Please enter the passcode')
      return
    }

    try {
      setSwitching(true)

      let isValidPasscode = false
      let switchToUser = null

      if (accountType === 'staff') {
        // Verify staff passcode
        if (selectedAccount.passcode === passcode.trim()) {
          isValidPasscode = true
          
          // Create user object from staff data
          switchToUser = {
            id: selectedAccount.id,
            name: selectedAccount.name,
            email: `${selectedAccount.staff_id}@staff.local`,
            role: selectedAccount.role || 'staff',
            store_id: selectedAccount.store_id,
            company_id: userCompanyId,
            staff_id: selectedAccount.staff_id,
            is_staff_account: true,
            original_user: currentUser // Keep reference to original user
          }
        }
      } else if (accountType === 'user') {
        // For users, we'll use a simple verification (you can enhance this)
        if (userRole === 'super_admin') {
          // Super admin can switch without passcode verification for users
          isValidPasscode = true
          switchToUser = {
            ...selectedAccount,
            original_user: currentUser
          }
        } else {
          // For managers, you might want to implement a different verification
          Alert.alert('Feature', 'User account switching requires additional verification')
          return
        }
      }

      if (isValidPasscode && switchToUser) {
        // Switch to the selected account
        await setUser(switchToUser)
        
        setShowSwitchModal(false)
        setSelectedAccount(null)
        setPasscode('')
        
        Alert.alert(
          'Account Switched',
          `You are now acting as ${switchToUser.name} (${switchToUser.role})`,
          [
            {
              text: 'Go to Dashboard',
              onPress: () => {
                // Navigate to appropriate dashboard based on role
                if (switchToUser.role === 'manager') {
                  router.push('/dashboard-manager')
                } else if (switchToUser.role === 'cashier') {
                  router.push('/dashboard')
                } else {
                  router.push('/dashboard')
                }
              }
            }
          ]
        )

        console.log('✅ Switched to account:', switchToUser.name, switchToUser.role)
      } else {
        Alert.alert('Error', 'Invalid passcode. Please try again.')
      }

    } catch (error) {
      console.error('❌ Error switching account:', error)
      Alert.alert('Error', 'Failed to switch account: ' + error.message)
    } finally {
      setSwitching(false)
    }
  }

  const handleSwitchBack = async () => {
    if (currentUser?.original_user) {
      try {
        await setUser(currentUser.original_user)
        Alert.alert('Switched Back', `Welcome back, ${currentUser.original_user.name}`)
        router.push('/dashboard-manager')
      } catch (error) {
        console.error('Error switching back:', error)
        Alert.alert('Error', 'Failed to switch back')
      }
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return '#dc2626'
      case 'manager': return '#ea580c'
      case 'cashier': return '#0891b2'
      case 'staff': return '#6b7280'
      case 'supervisor': return '#7c3aed'
      default: return '#6b7280'
    }
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'manager': return 'Manager'
      case 'cashier': return 'Cashier'
      case 'staff': return 'Staff'
      case 'supervisor': return 'Supervisor'
      default: return role || 'User'
    }
  }

  // Only show for authorized roles
  if (userRole !== 'super_admin' && userRole !== 'manager') {
    return null
  }

  return (
    <View style={styles.module}>
      {/* Module Header */}
      <View style={styles.moduleHeader}>
        <View style={styles.moduleHeaderLeft}>
          <Ionicons name="swap-horizontal" size={20} color={theme.primary} />
          <Text style={styles.moduleTitle}>Switch User Account</Text>
        </View>
        {currentUser?.original_user && (
          <TouchableOpacity 
            style={styles.switchBackButton}
            onPress={handleSwitchBack}
          >
            <Ionicons name="arrow-back" size={16} color={theme.white} />
            <Text style={styles.switchBackText}>Switch Back</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Current Account Display */}
      <View style={styles.currentAccount}>
        <View style={[styles.currentAccountIcon, { backgroundColor: getRoleColor(currentUser?.role) + '20' }]}>
          <Text style={[styles.currentAccountText, { color: getRoleColor(currentUser?.role) }]}>
            {currentUser?.name?.charAt(0) || 'U'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.currentAccountName}>
            {currentUser?.name} {currentUser?.is_staff_account && '(Staff Account)'}
          </Text>
          <Text style={styles.currentAccountRole}>
            Current Role: {getRoleDisplayName(currentUser?.role)}
          </Text>
          {currentUser?.store_id && (
            <Text style={styles.currentAccountStore}>Store: {currentUser.store_id}</Text>
          )}
        </View>
      </View>

      {/* Available Staff Accounts */}
      {staff.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Switch to Staff Account
            {userRole === 'manager' && companyInfo && ` (${companyInfo.name})`}
          </Text>
          <View style={styles.accountsList}>
            {staff.slice(0, 4).map((staffMember, index) => (
              <TouchableOpacity
                key={staffMember.id || index}
                style={styles.accountItem}
                onPress={() => handleAccountSwitch(staffMember, 'staff')}
              >
                <View style={[styles.accountAvatar, { backgroundColor: getRoleColor(staffMember.role) + '20' }]}>
                  <Text style={[styles.accountAvatarText, { color: getRoleColor(staffMember.role) }]}>
                    {staffMember.name?.charAt(0) || 'S'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>{staffMember.name}</Text>
                  <Text style={styles.accountRole}>{getRoleDisplayName(staffMember.role)}</Text>
                  <Text style={styles.accountDetails}>ID: {staffMember.staff_id}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Available User Accounts (Super Admin Only) */}
      {userRole === 'super_admin' && users.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Switch to User Account</Text>
          <View style={styles.accountsList}>
            {users.slice(0, 3).map((user, index) => (
              <TouchableOpacity
                key={user.id || index}
                style={styles.accountItem}
                onPress={() => handleAccountSwitch(user, 'user')}
              >
                <View style={[styles.accountAvatar, { backgroundColor: getRoleColor(user.role) + '20' }]}>
                  <Text style={[styles.accountAvatarText, { color: getRoleColor(user.role) }]}>
                    {user.name?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>{user.name}</Text>
                  <Text style={styles.accountRole}>{getRoleDisplayName(user.role)}</Text>
                  <Text style={styles.accountDetails}>{user.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Empty State */}
      {staff.length === 0 && users.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={theme.textLight} />
          <Text style={styles.emptyText}>No accounts available</Text>
          <Text style={styles.emptySubtext}>
            {userRole === 'manager' ? 
              'No staff accounts found in your company' :
              'No user accounts available for switching'
            }
          </Text>
        </View>
      )}

      {/* Switch Account Modal */}
      <Modal
        visible={showSwitchModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowSwitchModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSwitchModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Switch Account</Text>
            <View style={{ width: 60 }} />
          </View>
          
          {selectedAccount && (
            <View style={styles.modalContent}>
              <View style={styles.selectedAccountInfo}>
                <View style={[styles.selectedAccountAvatar, { backgroundColor: getRoleColor(selectedAccount.role) + '20' }]}>
                  <Text style={[styles.selectedAccountAvatarText, { color: getRoleColor(selectedAccount.role) }]}>
                    {selectedAccount.name?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.selectedAccountName}>{selectedAccount.name}</Text>
                  <Text style={styles.selectedAccountRole}>
                    {getRoleDisplayName(selectedAccount.role)}
                  </Text>
                  {accountType === 'staff' && (
                    <Text style={styles.selectedAccountDetails}>
                      Staff ID: {selectedAccount.staff_id}
                    </Text>
                  )}
                </View>
              </View>

              {accountType === 'staff' && (
                <View style={styles.passcodeSection}>
                  <Text style={styles.passcodeLabel}>Enter Staff Passcode:</Text>
                  <TextInput
                    style={styles.passcodeInput}
                    value={passcode}
                    onChangeText={setPasscode}
                    placeholder="Enter passcode"
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus
                  />
                  <Text style={styles.passcodeHint}>
                    Enter the 4-6 digit passcode for this staff member
                  </Text>
                </View>
              )}

              {accountType === 'user' && userRole === 'super_admin' && (
                <View style={styles.confirmationSection}>
                  <Text style={styles.confirmationText}>
                    As Super Admin, you can switch to this user account without additional verification.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.switchButton, (!passcode.trim() && accountType === 'staff') && styles.switchButtonDisabled]}
                onPress={verifyAndSwitchAccount}
                disabled={switching || (!passcode.trim() && accountType === 'staff')}
              >
                {switching ? (
                  <Text style={styles.switchButtonText}>Switching...</Text>
                ) : (
                  <>
                    <Ionicons name="swap-horizontal" size={16} color={theme.white} />
                    <Text style={styles.switchButtonText}>Switch Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  )
}

// Enhanced styles for user switching
const switchingStyles = {
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
  switchBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  switchBackText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.white,
  },
  currentAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.primary + '30',
  },
  currentAccountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  currentAccountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentAccountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  currentAccountRole: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  currentAccountStore: {
    fontSize: 11,
    color: theme.textLight,
    marginTop: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  accountsList: {
    gap: 8,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  accountRole: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 1,
  },
  accountDetails: {
    fontSize: 11,
    color: theme.textLight,
    marginTop: 1,
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
    paddingVertical: 20,
  },
  selectedAccountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: 24,
  },
  selectedAccountAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedAccountAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedAccountName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  selectedAccountRole: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  selectedAccountDetails: {
    fontSize: 12,
    color: theme.textLight,
    marginTop: 2,
  },
  passcodeSection: {
    marginBottom: 32,
  },
  passcodeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  passcodeInput: {
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  passcodeHint: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  confirmationSection: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: theme.backgroundLight,
    borderRadius: 12,
  },
  confirmationText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  switchButtonDisabled: {
    backgroundColor: theme.textLight,
    opacity: 0.6,
  },
  switchButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: theme.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
}

// Merge styles
Object.assign(styles, switchingStyles)

export default UserSwitchingModule