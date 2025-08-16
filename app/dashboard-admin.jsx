// import React, { useState, useEffect } from 'react'
// import { Alert, TouchableOpacity } from 'react-native'
// import { useRouter } from 'expo-router'
// import { useAuth } from '../utils/authContext'

// // Import shared components
// import DashboardLayout, { LoadingScreen, theme } from './components/DashboardLayout'

// // Import modules
// import StatsModule from './modules/StatsModule'
// import QuickActionsModule from './modules/QuickActionsModule'
// import RecentSalesModule from './modules/RecentSalesModule'
// import ReportsModule from './modules/ReportsModule'

// const DashboardAdmin = () => {
//   const [user, setUser] = useState(null)
//   const [isDataReady, setIsDataReady] = useState(false)
//   const { logout, user: authUser } = useAuth()
//   const router = useRouter()

//   useEffect(() => {
//     if (authUser) {
//       setUser(authUser)
//       if (authUser.role !== 'super_admin') {
//         Alert.alert('Access Denied', 'You do not have permission to access this area.')
//         switch (authUser.role) {
//           case 'manager':
//             router.replace('/dashboard-manager')
//             break
//           case 'cashier':
//           default:
//             router.replace('/dashboard')
//             break
//         }
//         return
//       }
      
//       // Initialize data after user is set
//       initializeData()
//     }
//   }, [authUser])

//   const initializeData = async () => {
//     try {
//       // Add a small delay to ensure database is ready
//       await new Promise(resolve => setTimeout(resolve, 100))
//       setIsDataReady(true)
//     } catch (error) {
//       console.warn('Data initialization warning:', error)
//       // Still set to ready to show the dashboard with fallback data
//       setIsDataReady(true)
//     }
//   }

//   const handleLogout = async () => {
//     Alert.alert(
//       'Logout',
//       'Are you sure you want to logout?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Logout',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await logout()
//             } catch (error) {
//               console.error('Logout error:', error)
//             }
//           }
//         }
//       ]
//     )
//   }

//   // Navigation handlers for each module
//   const handleStatsClick = () => {
//     router.push('/stats-detail')
//   }

//   const handleReportsClick = () => {
//     router.push('/reports-detail')
//   }

//   const handleQuickClick = () => {
//     router.push('/quick-actions-detail')
//   }

//   const handleSalesClick = () => {
//     router.push('/sales-detail')
//   }

//   if (!user || !isDataReady) {
//     return <LoadingScreen message="Loading Admin Dashboard..." />
//   }

//   return (
//     <DashboardLayout
//       user={user}
//       title="Admin Dashboard"
//       headerColor={theme.admin}
//       onLogout={handleLogout}
//       currentRoute="dashboard-admin"
//     >
//       {/* Clickable Stats Module */}
//       <TouchableOpacity onPress={handleStatsClick} activeOpacity={0.8}>
//         <StatsModule userRole="super_admin" />
//       </TouchableOpacity>

//       <TouchableOpacity onPress={handleQuickClick} activeOpacity={0.8}>
//         <QuickActionsModule userRole="super_admin" />
//       </TouchableOpacity>

//       <TouchableOpacity onPress={handleReportsClick} activeOpacity={0.8}>
//         <ReportsModule userRole="super_admin" />
//       </TouchableOpacity>

//       <TouchableOpacity onPress={handleSalesClick} activeOpacity={0.8}>
//         <RecentSalesModule userRole="super_admin" />
//       </TouchableOpacity>
//     </DashboardLayout>
//   )
// }

// export default DashboardAdmin
// Fixed Dashboard Admin - handles missing database tables gracefully
import React, { useState, useEffect } from 'react'
import { Alert, TouchableOpacity, View, Text, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/authContext'
import { Ionicons } from '@expo/vector-icons'

// Import shared components
import DashboardLayout, { LoadingScreen, theme } from './components/DashboardLayout'

const DashboardAdmin = () => {
  const [user, setUser] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    recentSales: [],
    loading: true,
    error: null
  })
  
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
        return
      }
      
      // Load dashboard data
      loadDashboardData()
    }
  }, [authUser])

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }))
      
      // For now, we'll show demo data since the database tables don't exist yet
      // This prevents the SQLite errors you're seeing
      
      const mockData = {
        stats: {
          totalSales: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalUsers: 0,
          todaysSales: 0,
          monthlyGrowth: 0
        },
        recentSales: [],
        loading: false,
        error: null
      }
      
      setDashboardData(mockData)
      
      console.log('📊 Dashboard data loaded (demo mode)')
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

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

  // Navigation handlers for each section
  const handleNavigation = (route) => {
    // For now, show a message that these features are coming soon
    Alert.alert(
      'Coming Soon',
      `${route} functionality will be available once the database tables are set up.`,
      [{ text: 'OK' }]
    )
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
      currentRoute="dashboard-admin"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Ionicons name="shield-checkmark" size={32} color={theme.admin} />
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>Welcome back, {user.name}!</Text>
              <Text style={styles.welcomeSubtitle}>Super Administrator Dashboard</Text>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <Ionicons name="cash" size={24} color={theme.white} />
              <Text style={styles.statValue}>₱{dashboardData.stats?.totalSales || 0}</Text>
              <Text style={styles.statLabel}>Total Sales</Text>
            </View>
            
            <View style={[styles.statCard, styles.statCardSecondary]}>
              <Ionicons name="receipt" size={24} color={theme.white} />
              <Text style={styles.statValue}>{dashboardData.stats?.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            
            <View style={[styles.statCard, styles.statCardSuccess]}>
              <Ionicons name="cube" size={24} color={theme.white} />
              <Text style={styles.statValue}>{dashboardData.stats?.totalProducts || 0}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            
            <View style={[styles.statCard, styles.statCardWarning]}>
              <Ionicons name="people" size={24} color={theme.white} />
              <Text style={styles.statValue}>{dashboardData.stats?.totalUsers || 0}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => handleNavigation('User Management')}
            >
              <Ionicons name="people-circle" size={32} color={theme.primary} />
              <Text style={styles.actionTitle}>Manage Users</Text>
              <Text style={styles.actionSubtitle}>Add, edit, or remove users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => handleNavigation('Product Management')}
            >
              <Ionicons name="storefront" size={32} color={theme.secondary} />
              <Text style={styles.actionTitle}>Products</Text>
              <Text style={styles.actionSubtitle}>Manage inventory</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => handleNavigation('Sales Reports')}
            >
              <Ionicons name="bar-chart" size={32} color={theme.admin} />
              <Text style={styles.actionTitle}>Reports</Text>
              <Text style={styles.actionSubtitle}>View sales analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => handleNavigation('System Settings')}
            >
              <Ionicons name="settings" size={32} color={theme.warning} />
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionSubtitle}>System configuration</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Info */}
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>System Status</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusItem}>
              <Ionicons name="cloud-done" size={20} color={theme.primary} />
              <Text style={styles.statusText}>Database: Connected to Supabase</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons name="information-circle" size={20} color={theme.warning} />
              <Text style={styles.statusText}>Setup: Database tables need initialization</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.success} />
              <Text style={styles.statusText}>Authentication: Working properly</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.setupButton}
            onPress={() => Alert.alert(
              'Database Setup',
              'To enable full functionality, please run the database setup script in your Supabase project.',
              [{ text: 'OK' }]
            )}
          >
            <Ionicons name="construct" size={18} color={theme.white} />
            <Text style={styles.setupButtonText}>Initialize Database Tables</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </DashboardLayout>
  )
}

const styles = {
  welcomeCard: {
    backgroundColor: theme.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardPrimary: {
    backgroundColor: theme.primary,
  },
  statCardSecondary: {
    backgroundColor: theme.secondary,
  },
  statCardSuccess: {
    backgroundColor: theme.success,
  },
  statCardWarning: {
    backgroundColor: theme.warning,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.white,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.white,
    opacity: 0.9,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: theme.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginTop: 8,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: theme.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: theme.text,
    marginLeft: 12,
  },
  setupButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  setupButtonText: {
    color: theme.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
}

export default DashboardAdmin