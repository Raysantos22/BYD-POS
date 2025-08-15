import { StyleSheet, useColorScheme, View, Text } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import { AuthProvider, useAuth } from '../utils/authContext'

// Simple Colors object to avoid import issues
const Colors = {
  light: {
    background: '#f8fafc',
    text: '#1f2937'
  },
  dark: {
    background: '#1f2937', 
    text: '#f8fafc'
  }
}

const MainLayout = () => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const router = useRouter()
  const segments = useSegments()
  const { isAuthenticated, isLoading, user, getDashboardRoute } = useAuth()

  useEffect(() => {
    if (isLoading) return

    const currentRoute = segments[0] || 'index'
    const inAuthFlow = ['login', 'register', 'forgot-password', 'index'].includes(currentRoute)
    
    console.log('Navigation Check:', { 
      currentRoute, 
      isAuthenticated, 
      inAuthFlow,
      userRole: user?.role
    })

    if (!isAuthenticated && !inAuthFlow) {
      console.log('Redirecting to login')
      router.replace('/login')
    } else if (isAuthenticated && inAuthFlow) {
      console.log('Redirecting to dashboard')
      const dashboardRoute = getDashboardRoute()
      router.replace(dashboardRoute)
    }

  }, [isAuthenticated, isLoading, segments, user])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading POS System...</Text>
      </View>
    )
  }

  return (
    <>
      <StatusBar style="auto"/>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f8fafc' },
        animation: 'slide_from_right',
      }}>
        <Stack.Screen name="index" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="register" options={{ headerShown: false, title: 'Create Account' }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false, title: 'Reset Password' }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false, title: 'Cashier Dashboard', gestureEnabled: false }} />
        <Stack.Screen name="dashboard-manager" options={{ headerShown: false, title: 'Manager Dashboard', gestureEnabled: false }} />
        <Stack.Screen name="dashboard-admin" options={{ headerShown: false, title: 'Admin Dashboard', gestureEnabled: false }} />
        <Stack.Screen name="cashier" options={{ headerShown: false, title: 'POS Terminal' }} />
<Stack.Screen name="products" options={{ headerShown: false, title: 'Products' }} />
<Stack.Screen name="inventory" options={{ headerShown: false, title: 'Inventory' }} />
<Stack.Screen name="reports" options={{ headerShown: false, title: 'Reports' }} />
<Stack.Screen name="customers" options={{ headerShown: false, title: 'Customers' }} />
<Stack.Screen name="settings" options={{ headerShown: false, title: 'Settings' }} />
<Stack.Screen name="user-management" options={{ headerShown: false, title: 'User Management' }} />
<Stack.Screen name="system" options={{ headerShown: false, title: 'System' }} />
      </Stack>
    </>
  )
}

const RootLayout = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  )
}

export default RootLayout

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  }
})