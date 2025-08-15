import React, { useState, useEffect } from 'react'
import { Alert, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/authContext'

// Import shared components
import DashboardLayout, { LoadingScreen, theme } from './components/DashboardLayout'

// Import modules
import StatsModule from './modules/StatsModule'
import QuickActionsModule from './modules/QuickActionsModule'
import RecentSalesModule from './modules/RecentSalesModule'
import ReportsModule from './modules/ReportsModule'

const DashboardAdmin = () => {
  const [user, setUser] = useState(null)
  const { logout, user: authUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authUser) {
      setUser(authUser)
      if (authUser.role !== 'super_admin') {
        Alert.alert('Access Denied', 'You do not have permission to access this area.')
        switch (authUser.role) {
          case 'manager':
            router.replace('/dashboard-manager')
            break
          case 'cashier':
          default:
            router.replace('/dashboard')
            break
        }
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

  // Navigation handlers for each module
  const handleStatsClick = () => {
    router.push('/stats-detail')
  }

  const handleReportsClick = () => {
    router.push('/reports-detail')
  }

  const handleQuickClick = () => {
    router.push('/quick-actions-detail')
  }

  const handleSalesClick = () => {
    router.push('/sales-detail')
  }

  if (!user) {
    return <LoadingScreen message="Loading Admin Dashboard..." />
  }

  return (
    <DashboardLayout
      user={user}
      title="Admin Dashboard"
      headerColor={theme.admin}
      onLogout={handleLogout}
      currentRoute="dashboard-admin" // Pass current route for hamburger menu
    >
      {/* Clickable Stats Module */}
      <TouchableOpacity onPress={handleStatsClick} activeOpacity={0.8}>
        <StatsModule userRole="super_admin" />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleQuickClick} activeOpacity={0.8}>
        <QuickActionsModule userRole="super_admin" />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleReportsClick} activeOpacity={0.8}>
        <ReportsModule userRole="super_admin" />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSalesClick} activeOpacity={0.8}>
        <RecentSalesModule userRole="super_admin" />
      </TouchableOpacity>
    </DashboardLayout>
  )
}

export default DashboardAdmin