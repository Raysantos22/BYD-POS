// app/cashier.jsx
import React from 'react'
import { View, Text } from 'react-native'
import DashboardLayout from './components/DashboardLayout'
import { useAuth } from '../utils/authContext'

const CashierScreen = () => {
  const { user } = useAuth()
  
  return (
    <DashboardLayout
      user={user}
      title="POS Terminal"
      currentRoute="cashier"
      onLogout={() => {/* logout logic */}}
    >
      <View>
        <Text>Main POS Interface - Under Development</Text>
      </View>
    </DashboardLayout>
  )
}

export default CashierScreen