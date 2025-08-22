// app/dashboard.jsx - Unified Production Dashboard for All User Roles
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Animated, ScrollView, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
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
import UserSwitchingModule from './modules/UserSwitchingModule'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [companyInfo, setCompanyInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roleBasedConfig, setRoleBasedConfig] = useState(null)
  
  const router = useRouter()
  const { 
    logout, 
    user: authUser, 
    isSwitchedAccount, 
    getOriginalUser, 
    switchBackToOriginal 
  } = useAuth()

  // Company info loading - will be fetched from Supabase
  const loadCompanyInfo = async (userId, companyId) => {
    if (!companyId) return null

    try {
      // TODO: Implement Supabase fetch
      // const response = await fetch(`${API_URL}/companies/${companyId}`, {
      //   headers: { Authorization: `Bearer ${authToken}` }
      // })
      // const companyData = await response.json()
      // setCompanyInfo(companyData)
      
      // For now, set to null until Supabase integration
      setCompanyInfo(null)
      return null
    } catch (error) {
      console.error('Failed to load company info:', error)
      return null
    }
  }

  // Role-based configuration for dashboard features
  const getRoleConfiguration = (userRole) => {
    const configurations = {
      super_admin: {
        title: 'Super Admin Dashboard',
        subtitle: 'System-wide Management & Control',
        headerColor: theme.primary,
        features: {
          userSwitching: true,
          userManagement: true,
          companyOverview: true,
          allStores: true,
          systemReports: true,
          advancedSettings: true
        },
        modules: ['stats', 'userSwitching', 'userManagement', 'productStats', 'quickActions', 'reports', 'recentSales']
      },
      manager: {
        title: 'Manager Dashboard',
        subtitle: 'Store & Staff Management',
        headerColor: theme.manager || '#10b981',
        features: {
          userSwitching: true,
          userManagement: true,
          companyOverview: true,
          storeManagement: true,
          detailedReports: true,
          staffScheduling: true
        },
        modules: ['stats', 'userSwitching', 'companyOverview', 'productStats', 'userManagement', 'quickActions', 'reports', 'recentSales']
      },
      cashier: {
        title: 'Cashier Dashboard',
        subtitle: 'Point of Sale Operations',
        headerColor: theme.cashier || '#0891b2',
        features: {
          userSwitching: false,
          userManagement: false,
          companyOverview: false,
          basicReports: true,
          salesOperations: true,
          productBrowsing: true
        },
        modules: ['stats', 'productStats', 'quickActions', 'recentSales']
      },
      staff: {
        title: 'Staff Dashboard',
        subtitle: 'Daily Operations',
        headerColor: '#6b7280',
        features: {
          userSwitching: false,
          userManagement: false,
          companyOverview: false,
          basicOperations: true,
          limitedReports: true
        },
        modules: ['stats', 'quickActions', 'recentSales']
      },
      supervisor: {
        title: 'Supervisor Dashboard',
        subtitle: 'Team Leadership & Operations',
        headerColor: '#7c3aed',
        features: {
          userSwitching: false,
          userManagement: false,
          companyOverview: false,
          teamManagement: true,
          operationalReports: true,
          shiftManagement: true
        },
        modules: ['stats', 'productStats', 'quickActions', 'reports', 'recentSales']
      }
    }

    return configurations[userRole] || configurations.cashier
  }

  useEffect(() => {
    const initializeDashboard = async () => {
      if (authUser) {
        setUser(authUser)
        
        // Set role-based configuration
        const config = getRoleConfiguration(authUser.role)
        setRoleBasedConfig(config)
        
        console.log('📊 Dashboard - User loaded:', {
          name: authUser.name,
          role: authUser.role,
          store_id: authUser.store_id,
          company_id: authUser.company_id,
          is_staff_account: authUser.is_staff_account,
          email: authUser.email
        })
        
        // Verify user has access to dashboard
        const allowedRoles = ['cashier', 'manager', 'super_admin', 'staff', 'supervisor']
        if (!allowedRoles.includes(authUser.role)) {
          Alert.alert('Access Denied', 'You do not have permission to access this dashboard.')
          await logout()
          return
        }

        // Load company info if user has company_id
        if (authUser.company_id) {
          await loadCompanyInfo(authUser.id, authUser.company_id)
        }
      }
      setLoading(false)
    }

    initializeDashboard()
  }, [authUser])

  const handleLogout = async () => {
    // Handle logout differently for switched accounts
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
                // Dashboard will reload automatically due to useEffect
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

  // Dynamic subtitle based on user context
  const getDashboardSubtitle = () => {
    if (!user || !roleBasedConfig) return 'Loading...'
    
    let subtitle = roleBasedConfig.subtitle
    
    // Add context-specific information
    if (user.is_staff_account) {
      subtitle = `Acting as ${user.name} (Staff Account)`
    } else if (user.company_id && companyInfo) {
      subtitle = `${companyInfo.name} - ${roleBasedConfig.subtitle}`
    } else if (user.store_id) {
      subtitle = `${roleBasedConfig.subtitle} - Store ${user.store_id}`
    }
    
    return subtitle
  }

  // Render modules based on role configuration
  const renderModule = (moduleName) => {
    const commonProps = {
      userRole: user.role,
      userStoreId: user.store_id,
      userCompanyId: user.company_id,
      companyInfo: companyInfo,
      isSwitchedAccount: user.is_staff_account
    }

    switch (moduleName) {
      case 'stats':
        return (
          <StatsModule 
            key="stats"
            {...commonProps}
            showStoreFilter={roleBasedConfig.features.allStores}
          />
        )
        
      case 'userSwitching':
        if (!roleBasedConfig.features.userSwitching || user.is_staff_account) return null
        return (
          <UserSwitchingModule 
            key="userSwitching"
            {...commonProps}
          />
        )
        
      case 'companyOverview':
        if (!roleBasedConfig.features.companyOverview || !companyInfo) return null
        return (
          <CompanyOverviewModule 
            key="companyOverview"
            companyInfo={companyInfo}
            userRole={user.role}
            isSwitchedAccount={user.is_staff_account}
          />
        )
        
      case 'productStats':
        return (
          <ProductStatsModule 
            key="productStats"
            {...commonProps}
          />
        )
        
      case 'userManagement':
        if (!roleBasedConfig.features.userManagement) return null
        return (
          <UserManagementModule 
            key="userManagement"
            {...commonProps}
          />
        )
        
      case 'quickActions':
        return (
          <QuickActionsModule 
            key="quickActions"
            {...commonProps}
            features={roleBasedConfig.features}
          />
        )
        
      case 'reports':
        if (!roleBasedConfig.features.detailedReports && !roleBasedConfig.features.systemReports && !roleBasedConfig.features.operationalReports) return null
        return (
          <ReportsModule 
            key="reports"
            {...commonProps}
            reportLevel={
              roleBasedConfig.features.systemReports ? 'system' :
              roleBasedConfig.features.detailedReports ? 'detailed' :
              roleBasedConfig.features.operationalReports ? 'operational' : 'basic'
            }
          />
        )
        
      case 'recentSales':
        return (
          <RecentSalesModule 
            key="recentSales"
            {...commonProps}
          />
        )
        
      default:
        return null
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading Dashboard..." />
  }

  if (!user || !roleBasedConfig) {
    return <LoadingScreen message="Preparing Dashboard..." />
  }

  return (
    <DashboardLayout
      user={user}
      title={roleBasedConfig.title}
      subtitle={getDashboardSubtitle()}
      headerColor={roleBasedConfig.headerColor}
      onLogout={handleLogout}
      companyInfo={companyInfo}
      isSwitchedAccount={isSwitchedAccount()}
    >
      {/* Render modules based on role configuration */}
      {roleBasedConfig.modules.map(moduleName => renderModule(moduleName))}
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
          <Text style={styles.companyStatNumber}>{companyInfo.storeCount || 0}</Text>
          <Text style={styles.companyStatLabel}>Store{(companyInfo.storeCount || 0) > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.companyStatDivider} />
        <View style={styles.companyStatItem}>
          <Ionicons name="people" size={24} color={theme.primary} />
          <Text style={styles.companyStatNumber}>{companyInfo.totalStaff || 0}</Text>
          <Text style={styles.companyStatLabel}>Staff</Text>
        </View>
        <View style={styles.companyStatDivider} />
        <View style={styles.companyStatItem}>
          <Ionicons name="trending-up" size={24} color={theme.warning} />
          <Text style={styles.companyStatNumber}>
            ₱{((companyInfo.monthlyRevenue || 0) / 1000).toFixed(0)}K
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
                <View>
                  <Text style={styles.storeItemName}>{store.name}</Text>
                  {store.location && (
                    <Text style={styles.storeItemLocation}>{store.location}</Text>
                  )}
                </View>
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

const styles = StyleSheet.create({
  module: {
    backgroundColor: theme.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginLeft: 8,
  },
  switchedAccountBadge: {
    fontSize: 12,
    color: theme.warning,
    fontWeight: '500',
  },
  moduleAction: {
    padding: 8,
  },
  companyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  companyStatItem: {
    flex: 1,
    alignItems: 'center',
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
  },
  companyStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.border,
    marginHorizontal: 16,
  },
  storesList: {
    marginBottom: 16,
  },
  storesListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.background,
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
    fontWeight: '500',
    color: theme.textPrimary,
    marginLeft: 8,
  },
  storeItemLocation: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 8,
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
  },
  primaryCompanyAction: {
    backgroundColor: theme.primary,
  },
  secondaryCompanyAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.success,
  },
  primaryCompanyActionText: {
    color: theme.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  secondaryCompanyActionText: {
    color: theme.success,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
})

export default Dashboard
