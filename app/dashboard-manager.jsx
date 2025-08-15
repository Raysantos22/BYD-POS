import React, { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/authContext'

// Import shared components
import DashboardLayout, { LoadingScreen, theme } from './components/DashboardLayout'

// Import modules
import StatsModule from './modules/StatsModule'
import QuickActionsModule from './modules/QuickActionsModule'
import RecentSalesModule from './modules/RecentSalesModule'
import ReportsModule from './modules/ReportsModule'

const DashboardManager = () => {
  const [user, setUser] = useState(null)
  const { logout, user: authUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authUser) {
      setUser(authUser)
      if (!['manager', 'super_admin'].includes(authUser.role)) {
        Alert.alert('Access Denied', 'You do not have permission to access this area.')
        router.replace('/dashboard')
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
      headerColor={theme.manager}
      onLogout={handleLogout}
    >
      <StatsModule userRole="manager" />
      <QuickActionsModule userRole="manager" />
      <ReportsModule userRole="manager" />
      <RecentSalesModule userRole="manager" />
    </DashboardLayout>
  )
}

export default DashboardManager