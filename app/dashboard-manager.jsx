// app/dashboard-manager.jsx - Enhanced Manager Dashboard with Company Access
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Animated } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Alert, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/authContext'
import { Ionicons } from '@expo/vector-icons'
// Import shared components
import DashboardLayout, { LoadingScreen, theme } from './components/DashboardLayout'

// Import modules
import StatsModule from './modules/StatsModule'
import ProductStatsModule from './modules/ProductStatsModule'
import QuickActionsModule from './modules/QuickActionsModule'
import RecentSalesModule from './modules/RecentSalesModule'
import ReportsModule from './modules/ReportsModule'
import UserManagementModule from './modules/UserManagementModule'
import UserSwitchingModule from './modules/UserSwitchingModule' // NEW

const DashboardManager = () => {
  const [user, setUser] = useState(null)
  const [companyInfo, setCompanyInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const { logout, user: authUser, isSwitchedAccount, getOriginalUser, switchBackToOriginal } = useAuth()
  const router = useRouter()

  // Load company information for managers
  const loadCompanyInfo = async (userId, companyId) => {
    if (!companyId) return null

    try {
      // This would typically fetch from your company service
      // For now, we'll determine company based on company_id
      const mockCompanyInfo = {
        id: companyId,
        name: companyId === 'company-1' ? 'TechCorp' : 
              companyId === 'company-2' ? 'RetailCorp' : 
              `Company ${companyId}`,
        storeCount: companyId === 'company-1' ? 3 : 
                   companyId === 'company-2' ? 2 : 1,
        totalStaff: companyId === 'company-1' ? 15 : 
                   companyId === 'company-2' ? 8 : 5,
        monthlyRevenue: companyId === 'company-1' ? 450000 : 
                       companyId === 'company-2' ? 320000 : 150000,
        stores: companyId === 'company-1' ? [
          { id: 'store-001', name: 'Main Branch' },
          { id: 'store-002', name: 'Mall Branch' },
          { id: 'store-003', name: 'City Center' }
        ] : companyId === 'company-2' ? [
          { id: 'store-004', name: 'Downtown' },
          { id: 'store-005', name: 'Suburb Plaza' }
        ] : [
          { id: user.store_id || 'store-default', name: 'Default Store' }
        ]
      }

      setCompanyInfo(mockCompanyInfo)
      return mockCompanyInfo
    } catch (error) {
      console.error('Failed to load company info:', error)
      return null
    }
  }

  useEffect(() => {
    const initializeDashboard = async () => {
      if (authUser) {
        setUser(authUser)
        console.log('📊 Manager Dashboard - User loaded:', {
          name: authUser.name,
          role: authUser.role,
          store_id: authUser.store_id,
          company_id: authUser.company_id,
          is_staff_account: authUser.is_staff_account,
          email: authUser.email
        })
        
        // Verify manager or super_admin access (or switched staff account)
        if (!['manager', 'super_admin', 'staff', 'cashier', 'supervisor'].includes(authUser.role)) {
          Alert.alert(
            'Access Denied', 
            'You do not have permission to access the Manager Dashboard.',
            [
              { 
                text: 'Go to Main Dashboard', 
                onPress: () => router.replace('/dashboard') 
              }
            ]
          )
          return
        }

        // Load company info for managers and staff accounts
        if ((authUser.role === 'manager' || authUser.is_staff_account) && authUser.company_id) {
          await loadCompanyInfo(authUser.id, authUser.company_id)
        } else if (authUser.role === 'manager' && !authUser.company_id) {
          // Manager without company_id - create basic company info
          setCompanyInfo({
            id: 'default',
            name: 'Your Store',
            storeCount: 1,
            totalStaff: 5,
            monthlyRevenue: 75000,
            stores: [{ id: authUser.store_id, name: `Store ${authUser.store_id}` }]
          })
        }
      }
      setLoading(false)
    }

    initializeDashboard()
  }, [authUser])

  const handleLogout = async () => {
    // If this is a switched account, offer to switch back instead of logout
    if (isSwitchedAccount()) {
      const originalUser = getOriginalUser()
      Alert.alert(
        'Switch Back or Logout',
        `You are currently acting as ${user.name}. Would you like to switch back to ${originalUser?.name} or logout completely?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Switch Back', 
            onPress: async () => {
              try {
                await switchBackToOriginal()
                router.push('/dashboard-manager')
              } catch (error) {
                console.error('Switch back error:', error)
                Alert.alert('Error', 'Failed to switch back')
              }
            }
          },
          {
            text: 'Logout Completely',
            style: 'destructive',
            onPress: async () => {
              try {
                await logout()
              } catch (error) {
                console.error('Logout error:', error)
              }
            }
          }
        ]
      )
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await logout()
              } catch (error) {
                console.error('Logout error:', error)
              }
            }
          }
        ]
      )
    }
  }

  // Get dashboard title and subtitle based on role and company
  const getDashboardInfo = () => {
    if (!user) return { title: 'Manager Dashboard', subtitle: 'Loading...' }

    let title = 'Manager Dashboard'
    let subtitle = 'Management Console'
    
    // Update title based on current role
    if (user.is_staff_account) {
      title = `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard`
      subtitle = `Acting as ${user.name} (Staff Account)`
    } else if (user.role === 'manager') {
      title = 'Manager Dashboard'
      if (companyInfo) {
        subtitle = `${companyInfo.name} - Managing ${companyInfo.storeCount} store${companyInfo.storeCount > 1 ? 's' : ''}`
      } else if (user.company_id) {
        subtitle = `Company Manager - ${user.company_id}`
      } else if (user.store_id) {
        subtitle = `Store Manager - ${user.store_id}`
      }
    } else if (user.role === 'super_admin') {
      title = 'Super Admin Dashboard'
      subtitle = 'System Administration'
    } else if (user.role === 'cashier') {
      title = 'Cashier Dashboard'
      subtitle = `Store: ${user.store_id || 'Unknown'}`
    }

    return { title, subtitle }
  }

  // Get header color based on current role
  const getHeaderColor = () => {
    if (user?.is_staff_account) {
      switch (user.role) {
        case 'supervisor': return '#7c3aed'
        case 'cashier': return '#0891b2'
        case 'staff': return '#6b7280'
        default: return theme.manager
      }
    }
    
    switch (user?.role) {
      case 'super_admin': return theme.primary
      case 'manager': return theme.manager
      case 'cashier': return '#0891b2'
      default: return theme.manager
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading Manager Dashboard..." />
  }

  if (!user) {
    return <LoadingScreen message="Loading Manager Dashboard..." />
  }

  const { title, subtitle } = getDashboardInfo()

  return (
    <DashboardLayout
      user={user}
      title={title}
      subtitle={subtitle}
      headerColor={getHeaderColor()}
      onLogout={handleLogout}
      companyInfo={companyInfo}
      isSwitchedAccount={isSwitchedAccount()}
    >
      {/* ENHANCED: User Switching Module - Only for managers and super admins */}
      {(user.role === 'manager' || user.role === 'super_admin') && !user.is_staff_account && (
        <UserSwitchingModule 
          userRole={user.role} 
          userStoreId={user.store_id}
          userCompanyId={user.company_id}
          companyInfo={companyInfo}
        />
      )}

      {/* Company Overview for Managers */}
      {(user.role === 'manager' || user.is_staff_account) && companyInfo && (
        <CompanyOverviewModule 
          companyInfo={companyInfo}
          userRole={user.role}
          isSwitchedAccount={user.is_staff_account}
        />
      )}

      {/* Stats Overview with Company Context */}
      <StatsModule 
        userRole={user.role} 
        userStoreId={user.store_id}
        userCompanyId={user.company_id}
        companyInfo={companyInfo}
        showStoreFilter={user.role === 'manager' || user.role === 'super_admin'}
      />

      {/* ENHANCED: Product Stats Module with Company Context */}
      <ProductStatsModule 
        userRole={user.role} 
        userStoreId={user.store_id}
        userCompanyId={user.company_id}
        companyInfo={companyInfo}
      />

      {/* User & Staff Management - For managers and super admins */}
      {(user.role === 'manager' || user.role === 'super_admin') && (
        <UserManagementModule 
          userRole={user.role} 
          userStoreId={user.store_id}
          userCompanyId={user.company_id}
          companyInfo={companyInfo}
        />
      )}

      {/* Quick Actions for Manager with Company Context */}
      <QuickActionsModule 
        userRole={user.role}
        userStoreId={user.store_id}
        userCompanyId={user.company_id}
        companyInfo={companyInfo}
      />

      {/* Reports Module */}
      <ReportsModule 
        userRole={user.role}
        userStoreId={user.store_id}
        userCompanyId={user.company_id}
        companyInfo={companyInfo}
      />

      {/* Recent Sales */}
      <RecentSalesModule 
        userRole={user.role}
        userStoreId={user.store_id}
        userCompanyId={user.company_id}
        companyInfo={companyInfo}
      />
    </DashboardLayout>
  )
}

// Enhanced Company Overview Module
const CompanyOverviewModule = ({ companyInfo, userRole, isSwitchedAccount }) => {
  if (!companyInfo) return null

  return (
    <View style={styles.module}>
      <View style={styles.moduleHeader}>
        <View style={styles.moduleHeaderLeft}>
          <Ionicons name="business" size={20} color={theme.success} />
          <Text style={styles.moduleTitle}>
            {companyInfo.name} Overview
            {isSwitchedAccount && <Text style={styles.switchedAccountBadge}> (Staff View)</Text>}
          </Text>
        </View>
        <TouchableOpacity style={styles.moduleAction}>
          <Ionicons name="analytics" size={16} color={theme.success} />
        </TouchableOpacity>
      </View>

      {/* Company Stats */}
      <View style={styles.companyStatsRow}>
        <View style={styles.companyStatItem}>
          <Ionicons name="storefront" size={24} color={theme.success} />
          <Text style={styles.companyStatNumber}>{companyInfo.storeCount}</Text>
          <Text style={styles.companyStatLabel}>Store{companyInfo.storeCount > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.companyStatDivider} />
        <View style={styles.companyStatItem}>
          <Ionicons name="people" size={24} color={theme.primary} />
          <Text style={styles.companyStatNumber}>{companyInfo.totalStaff}</Text>
          <Text style={styles.companyStatLabel}>Staff</Text>
        </View>
        <View style={styles.companyStatDivider} />
        <View style={styles.companyStatItem}>
          <Ionicons name="trending-up" size={24} color={theme.warning} />
          <Text style={styles.companyStatNumber}>
            ₱{(companyInfo.monthlyRevenue / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.companyStatLabel}>Monthly Revenue</Text>
        </View>
      </View>

      {/* Store List */}
      {companyInfo.stores && companyInfo.stores.length > 1 && (
        <View style={styles.storesList}>
          <Text style={styles.storesListTitle}>Company Stores</Text>
          {companyInfo.stores.map((store, index) => (
            <View key={store.id} style={styles.storeItem}>
              <View style={styles.storeItemLeft}>
                <Ionicons name="storefront-outline" size={16} color={theme.textSecondary} />
                <Text style={styles.storeItemName}>{store.name}</Text>
              </View>
              <TouchableOpacity style={styles.storeItemAction}>
                <Ionicons name="arrow-forward" size={14} color={theme.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Quick Company Actions */}
      <View style={styles.companyActions}>
        <TouchableOpacity style={[styles.companyActionButton, styles.primaryCompanyAction]}>
          <Ionicons name="analytics" size={16} color={theme.white} />
          <Text style={styles.primaryCompanyActionText}>Company Analytics</Text>
        </TouchableOpacity>
        
        {!isSwitchedAccount && (
          <TouchableOpacity style={[styles.companyActionButton, styles.secondaryCompanyAction]}>
            <Ionicons name="people" size={16} color={theme.success} />
            <Text style={styles.secondaryCompanyActionText}>Manage Staff</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// Enhanced styles
const styles = StyleSheet.create({
  module: {
    backgroundColor: theme.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginLeft: 8,
  },
  switchedAccountBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.warning,
  },
  moduleAction: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.backgroundLight,
  },
  companyStatsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  companyStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  companyStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginTop: 8,
  },
  companyStatLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  companyStatDivider: {
    width: 1,
    backgroundColor: theme.border,
    marginHorizontal: 8,
  },
  storesList: {
    marginBottom: 20,
  },
  storesListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.backgroundLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  storeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeItemName: {
    fontSize: 14,
    color: theme.textPrimary,
    marginLeft: 8,
    fontWeight: '500',
  },
  storeItemAction: {
    padding: 4,
  },
  companyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  companyActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryCompanyAction: {
    backgroundColor: theme.success,
  },
  secondaryCompanyAction: {
    backgroundColor: theme.backgroundLight,
    borderWidth: 1,
    borderColor: theme.border,
  },
  primaryCompanyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.white,
  },
  secondaryCompanyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.success,
  },
})

export default DashboardManager