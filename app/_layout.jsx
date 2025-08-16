// app/_layout.jsx - Updated with Supabase integration
import { StyleSheet, useColorScheme, View, Text, ActivityIndicator } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '../utils/authContext.js'
import { authInitializer } from '../services/authInitializer'

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
        <ActivityIndicator size="large" color="#10b981" />
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

// App Initializer Component
const AppInitializer = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState(null)
  const [activeService, setActiveService] = useState(null)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      console.log('Starting app initialization...')
      
      // Initialize authentication services
      const service = await authInitializer.initialize()
      setActiveService(service)
      
      console.log(`App initialized successfully with ${service}`)
      
    } catch (error) {
      console.error('App initialization failed:', error)
      setInitError(error.message)
    } finally {
      setIsInitializing(false)
    }
  }

  if (isInitializing) {
    return (
      <View style={styles.initContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.initTitle}>Initializing POS System</Text>
        <Text style={styles.initSubtitle}>
          {activeService === 'supabase' 
            ? 'Connecting to cloud database...'
            : activeService === 'local'
            ? 'Setting up local database...'
            : 'Testing database connections...'}
        </Text>
        
        {activeService && (
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: activeService === 'supabase' ? '#10b981' : '#f59e0b' }
            ]} />
            <Text style={styles.statusText}>
              {activeService === 'supabase' ? 'Cloud Mode' : 'Offline Mode'}
            </Text>
          </View>
        )}
      </View>
    )
  }

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorText}>{initError}</Text>
        <Text style={styles.errorSubtext}>Please restart the application</Text>
      </View>
    )
  }

  return children
}

const RootLayout = () => {
  return (
    <AppInitializer>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </AppInitializer>
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
  },
  initContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 30,
  },
  initTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#064e3b',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  initSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#064e3b',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#7f1d1d',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#a21caf',
    textAlign: 'center',
  },
})