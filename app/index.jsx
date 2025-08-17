// app/index.js - Updated with better auth flow and no redirect on failed auth
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator, Text, StyleSheet, Image, Animated, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import authService from '../services/authService'

const Index = () => {
  const router = useRouter()
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))
  const [pulseAnim] = useState(new Animated.Value(1))
  const [loadingText, setLoadingText] = useState('Initializing...')
  const [syncStatus, setSyncStatus] = useState(null)

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    // Pulse animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )
    pulseAnimation.start()

    // Enhanced auth check
    const timer = setTimeout(async () => {
      await handleAuthCheck()
    }, 2000) // 2 second splash minimum

    return () => {
      clearTimeout(timer)
      pulseAnimation.stop()
    }
  }, [])

  const handleAuthCheck = async () => {
    try {
      setLoadingText('Checking authentication...')
      
      // Initialize auth service (this also initializes SQLite and attempts sync)
      const authData = await authService.initialize()
      
      if (authData && authData.user) {
        setLoadingText('Welcome back!')
        
        // Get sync status
        const status = authService.getSyncStatus()
        setSyncStatus(status)
        
        // Show sync info in development mode
        if (__DEV__ && status.lastSyncTime) {
          console.log('📊 Sync Status:', status)
          setLoadingText(`Last sync: ${new Date(status.lastSyncTime).toLocaleTimeString()}`)
        }
        
        // Small delay to show welcome message
        setTimeout(() => {
          // Route user based on role
          switch (authData.user.role) {
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
        }, 1000)
      } else {
        // No authentication found - go to login
        setLoadingText('Ready to sign in')
        setTimeout(() => {
          router.replace('/login')
        }, 500)
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error)
      
      // Still show error but don't crash - just go to login
      setLoadingText('Authentication error')
      
      if (__DEV__) {
        Alert.alert(
          'Auth Check Failed',
          error.message,
          [{ text: 'Continue to Login', onPress: () => router.replace('/login') }]
        )
      } else {
        setTimeout(() => {
          router.replace('/login')
        }, 1500)
      }
    }
  }

  // Get status color based on sync status
  const getStatusColor = () => {
    if (!syncStatus) return theme.textSecondary
    if (syncStatus.isOfflineMode) return theme.warning
    if (syncStatus.hasSyncedData) return theme.primary
    return theme.textSecondary
  }

  const getStatusText = () => {
    if (!syncStatus) return ''
    if (syncStatus.isOfflineMode) return 'Offline Mode'
    if (syncStatus.hasSyncedData) return 'Synced'
    return 'No Sync'
  }

  return (
    <View style={styles.container}>
      {/* Background gradient overlay */}
      <View style={styles.gradientOverlay} />

      {/* Animated main content */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Logo with effects */}
        <Animated.View 
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <View style={styles.logoShadow} />
          <Image
            source={require('../assets/img/intro.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App title */}
        <Text style={styles.title}>POS System</Text>
        <Text style={styles.subtitle}>Point of Sale Management</Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{loadingText}</Text>
          
          {/* Sync status indicator (Development mode) */}
          {__DEV__ && syncStatus && (
            <View style={styles.syncStatusContainer}>
              <View style={[styles.syncStatusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.syncStatusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Floating particles */}
      <View style={styles.particle1} />
      <View style={styles.particle2} />
      <View style={styles.particle3} />
      
      {/* Development info panel */}
      {__DEV__ && syncStatus && (
        <View style={styles.devInfoPanel}>
          <Text style={styles.devInfoTitle}>Debug Info</Text>
          <Text style={styles.devInfoText}>Mode: {syncStatus.isOfflineMode ? 'Offline' : 'Online'}</Text>
          <Text style={styles.devInfoText}>
            Last Sync: {syncStatus.lastSyncTime ? 
              new Date(syncStatus.lastSyncTime).toLocaleString() : 'Never'
            }
          </Text>
          <Text style={styles.devInfoText}>
            Data: {syncStatus.hasSyncedData ? 'Available' : 'None'}
          </Text>
        </View>
      )}
    </View>
  )
}

const theme = {
  primary: '#10b981',
  background: '#f0fdf4',
  surface: '#ffffff',
  text: '#064e3b',
  textSecondary: '#6b7280',
  warning: '#f59e0b',
  error: '#ef4444',
  success: '#10b981',
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${theme.primary}10`,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoWrapper: {
    marginBottom: 40,
    position: 'relative',
  },
  logoShadow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.primary,
    opacity: 0.1,
    top: 5,
    left: 5,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 60,
    fontWeight: '400',
  },
  loadingContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  syncStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  particle1: {
    position: 'absolute',
    top: 100,
    left: 50,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary + '40',
  },
  particle2: {
    position: 'absolute',
    top: 200,
    right: 80,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary + '30',
  },
  particle3: {
    position: 'absolute',
    bottom: 150,
    left: 100,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.primary + '20',
  },
  devInfoPanel: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
  },
  devInfoTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  devInfoText: {
    color: '#cccccc',
    fontSize: 10,
    lineHeight: 14,
  },
})

export default Index