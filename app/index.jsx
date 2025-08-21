// app/index.js - Optimized splash with quick auth check
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator, Text, StyleSheet, Image, Animated } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import authService from '../services/authService'

const Index = () => {
  const router = useRouter()
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.9))

  useEffect(() => {
    // Quick entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    // Quick auth check - no extended splash
    const timer = setTimeout(async () => {
      await handleAuthCheck()
    }, 1000) // Only 1 second splash

    return () => clearTimeout(timer)
  }, [])

  const handleAuthCheck = async () => {
    try {
      // Quick auth check without extensive initialization
      const authData = await authService.initialize()
      
      if (authData && authData.user) {
        // User is logged in - route immediately
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
      } else {
        // No auth found - go to login immediately
        router.replace('/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      // On error, just go to login - no extended error handling
      router.replace('/login')
    }
  }

  return (
    <View style={styles.container}>
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
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assets/img/intro.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App title */}
        <Text style={styles.title}>POS System</Text>
        <Text style={styles.subtitle}>Point of Sale Management</Text>

        {/* Simple loading indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Animated.View>

      {/* Simple background decoration */}
      <View style={styles.backgroundDecor} />
    </View>
  )
}

const theme = {
  primary: '#10b981',
  background: '#f0fdf4',
  text: '#064e3b',
  textSecondary: '#6b7280',
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundDecor: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.primary + '10',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoWrapper: {
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
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
    marginBottom: 40,
    fontWeight: '400',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
})

export default Index