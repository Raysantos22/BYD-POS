// app/_layout.jsx - Optimized layout with minimal loading states
import { StyleSheet, useColorScheme, View, Text, ActivityIndicator } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '../utils/authContext.js'
import { authInitializer } from '../services/authInitializer'

// Simple Colors object
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
  const router = useRouter()
  const segments = useSegments()
  const { isAuthenticated, isLoading, user, getDashboardRoute } = useAuth()

  useEffect(() => {
    // Quick navigation - no extended loading checks
    if (isLoading) return

    const currentRoute = segments[0] || 'index'
    const inAuthFlow = ['login', 'register', 'forgot-password', 'index'].includes(currentRoute)
    
    if (!isAuthenticated && !inAuthFlow) {
      router.replace('/login')
    } else if (isAuthenticated && inAuthFlow) {
      const dashboardRoute = getDashboardRoute()
      router.replace(dashboardRoute)
    }

  }, [isAuthenticated, isLoading, segments, user])

  // Minimal loading state
  if (isLoading) {
    return (
      <View style={styles.quickLoading}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.quickLoadingText}>Loading...</Text>
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
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="dashboard-manager" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="dashboard-admin" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="cashier" options={{ headerShown: false }} />
        <Stack.Screen name="products" options={{ headerShown: false }} />
        <Stack.Screen name="inventory" options={{ headerShown: false }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
        <Stack.Screen name="customers" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="user-management" options={{ headerShown: false }} />
        <Stack.Screen name="system" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}

// Simplified App Initializer - Quick setup only
const AppInitializer = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // Quick initialization - no extended setup
      await authInitializer.initialize()
    } catch (error) {
      console.error('Init error:', error)
      // Don't block app - continue anyway
    } finally {
      // Quick init - 500ms max
      setTimeout(() => {
        setIsInitializing(false)
      }, 500)
    }
  }

  if (isInitializing) {
    return (
      <View style={styles.quickInit}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.quickInitText}>Starting...</Text>
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
  quickLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  quickLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  quickInit: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  quickInitText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
})