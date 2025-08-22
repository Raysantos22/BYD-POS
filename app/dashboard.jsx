// app/dashboard.jsx - Updated Dashboard with Products Integration
import React, { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/authContext'

// Import shared components
import DashboardLayout, { LoadingScreen, theme } from './components/DashboardLayout'

// Import modules
import StatsModule from './modules/StatsModule'
import ProductStatsModule from './modules/ProductStatsModule'
import QuickActionsModule from './modules/QuickActionsModule'
import RecentSalesModule from './modules/RecentSalesModule'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const { logout, user: authUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authUser) {
      setUser(authUser)
      console.log('📊 Dashboard - User loaded:', {
        name: authUser.name,
        role: authUser.role,
        store_id: authUser.store_id,
        email: authUser.email
      })
      
      if (!['cashier', 'manager', 'super_admin'].includes(authUser.role)) {
        Alert.alert('Access Denied', 'You do not have permission to access this area.')
        router.replace('/login')
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
    return <LoadingScreen message="Loading Dashboard..." />
  }

  return (
    <DashboardLayout
      user={user}
      title={`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard`}
      subtitle={user.store_id ? `Store: ${user.store_id}` : 'POS Dashboard'}
      headerColor={theme.cashier}
      onLogout={handleLogout}
      currentRoute="dashboard"
    >
      {/* Main Stats Overview */}
      <StatsModule 
        userRole={user.role} 
        userStoreId={user.store_id}
      />

      {/* Product Stats Module */}
      <ProductStatsModule 
        userRole={user.role} 
        userStoreId={user.store_id}
      />

      {/* Quick Actions */}
      <QuickActionsModule 
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

export default Dashboard