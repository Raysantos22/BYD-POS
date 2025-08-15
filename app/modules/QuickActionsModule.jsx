import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { styles, theme } from '../components/DashboardLayout'

const QuickActionsModule = ({ userRole }) => {
  const router = useRouter()

  const getActions = () => {
    const baseActions = [
      { title: 'New Sale', icon: 'add-circle', color: theme.success, route: '/navigations/cashier' },
      { title: 'Products', icon: 'cube', color: theme.primary, route: '/navigations/products' }
    ]

    if (userRole === 'manager' || userRole === 'super_admin') {
      return [
        ...baseActions,
        { title: 'Reports', icon: 'bar-chart', color: theme.warning, route: '/navigations/reports' },
        { title: 'Inventory', icon: 'grid', color: theme.accent, route: '/navigations/inventory' }
      ]
    }

    if (userRole === 'super_admin') {
      return [
        ...baseActions,
        { title: 'Reports', icon: 'bar-chart', color: theme.warning, route: '/navigations/reports' },
        { title: 'Inventory', icon: 'grid', color: theme.accent, route: '/navigations/inventory' },
        { title: 'Users', icon: 'people', color: theme.error, route: '/navigations/user-management' },
        { title: 'Settings', icon: 'settings', color: theme.textSecondary, route: '/navigations/settings' }
      ]
    }

    return baseActions
  }

  const handlePress = (route, title) => {
    try {
      console.log(`Navigating to ${route}`)
      router.push(route)
    } catch (error) {
      console.error(`Navigation error for ${title}:`, error)
      // Optional: Show an alert to the user
      // Alert.alert('Navigation Error', `Could not navigate to ${title}`)
    }
  }

  return (
    <View style={styles.module}>
      <Text style={styles.moduleTitle}>Quick Actions</Text>
      
      <View style={styles.grid}>
        {getActions().map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, styles.gridItem2, { borderLeftColor: action.color, borderLeftWidth: 4 }]}
            onPress={() => handlePress(action.route, action.title)}
          >
            <Ionicons name={action.icon} size={32} color={action.color} />
            <Text style={[styles.cardTitle, { textAlign: 'center', marginTop: 8 }]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default QuickActionsModule