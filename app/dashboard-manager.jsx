// app/dashboard-manager.jsx - Enhanced Manager Dashboard with Staff Management
import React, { useState, useEffect } from 'react'
import { Alert, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/authContext'

// Import shared components
import DashboardLayout, { LoadingScreen, theme } from './components/DashboardLayout'

// Import modules
import StatsModule from './modules/StatsModule'
import QuickActionsModule from './modules/QuickActionsModule'
import RecentSalesModule from './modules/RecentSalesModule'
import ReportsModule from './modules/ReportsModule'
import UserManagementModule from './modules/UserManagementModule'

const DashboardManager = () => {
  const [user, setUser] = useState(null)
  const { logout, user: authUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authUser) {
      setUser(authUser)
      console.log('📊 Manager Dashboard - User loaded:', {
        name: authUser.name,
        role: authUser.role,
        store_id: authUser.store_id,
        email: authUser.email
      })
      
      // Verify manager or super_admin access
      if (!['manager', 'super_admin'].includes(authUser.role)) {
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
      }
    }
  }, [authUser])

  const handleLogout = async () => {
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

  if (!user) {
    return <LoadingScreen message="Loading Manager Dashboard..." />
  }

  return (
    <DashboardLayout
      user={user}
      title="Manager Dashboard"
      subtitle={user.store_id ? `Store: ${user.store_id}` : 'Management Console'}
      headerColor={theme.manager}
      onLogout={handleLogout}
    >
      {/* Stats Overview */}
      <StatsModule 
        userRole={user.role} 
        userStoreId={user.store_id}
        showStoreFilter={user.role === 'manager'}
      />

      {/* User & Staff Management - Primary feature for managers */}
      <UserManagementModule 
        userRole={user.role} 
        userStoreId={user.store_id}
      />

      {/* Quick Actions for Manager */}
      <QuickActionsModule 
        userRole={user.role}
        userStoreId={user.store_id}
      />

      {/* Reports Module */}
      <ReportsModule 
        userRole={user.role}
        userStoreId={user.store_id}
      />

      {/* Recent Sales */}
      <RecentSalesModule 
        userRole={user.role}
        userStoreId={user.store_id}
      />
    </DashboardLayout>
  )
}

export default DashboardManager