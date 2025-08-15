import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const Index = () => {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait for component to mount before checking auth
    const timer = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token')
        const userData = await AsyncStorage.getItem('user_data')
        
        if (token && userData) {
          const user = JSON.parse(userData)
          // Redirect based on role
          switch (user.role) {
            case 'super_admin':
              router.replace('/dashboard-admin')
              break
            case 'manager':
              router.replace('/dashboard-manager')
              break
            case 'cashier':
            default:
              router.replace('/dashboard')
              break
          }
        } else {
          router.replace('/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.replace('/login')
      }
    }, 500) // 500ms delay to ensure component is mounted

    return () => clearTimeout(timer)
  }, [])

  // Show loading screen while checking auth
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.text}>Loading POS System...</Text>
    </View>
  )
}

export default Index

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8fafc' 
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  }
})