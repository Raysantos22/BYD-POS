import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { styles, theme } from '../components/DashboardLayout'

const QuickActionsModule = ({ userRole }) => {
  const router = useRouter()

  const getActions = () => {
    const baseActions = [
      { title: 'New Sale', icon: 'add-circle', color: theme.success, route: '/new-sale' },
      { title: 'Products', icon: 'cube', color: theme.primary, route: '/products' }
    ]

    if (userRole === 'manager' || userRole === 'super_admin') {
      return [
        ...baseActions,
        { title: 'Reports', icon: 'bar-chart', color: theme.warning, route: '/reports' },
        { title: 'Inventory', icon: 'grid', color: theme.accent, route: '/inventory' }
      ]
    }

    if (userRole === 'super_admin') {
      return [
        ...baseActions,
        { title: 'Users', icon: 'people', color: theme.error, route: '/users' },
        { title: 'Settings', icon: 'settings', color: theme.textSecondary, route: '/settings' }
      ]
    }

    return baseActions
  }

  return (
    <View style={styles.module}>
      <Text style={styles.moduleTitle}>Quick Actions</Text>
      
      <View style={styles.grid}>
        {getActions().map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, styles.gridItem2, { borderLeftColor: action.color, borderLeftWidth: 4 }]}
            onPress={() => {
              console.log(`Navigate to ${action.route}`)
              // router.push(action.route) // Uncomment when routes exist
            }}
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