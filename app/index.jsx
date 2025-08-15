import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator, Text, StyleSheet, Image, Animated } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const Index = () => {
  const router = useRouter()
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))
  const [pulseAnim] = useState(new Animated.Value(1))

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

    // Auth check with delay
    const timer = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token')
        const userData = await AsyncStorage.getItem('user_data')
        
        if (token && userData) {
          const user = JSON.parse(userData)
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
    }, 5000) // 3 second splash

    return () => {
      clearTimeout(timer)
      pulseAnimation.stop()
    }
  }, [])

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
            // styles.logoContainer,
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
        {/* <Text style={styles.title}>POS System</Text>
        <Text style={styles.subtitle}>Point of Sale Management</Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View> 
      </Animated.View>

      {/* Floating particles */}
      <View style={styles.particle1} />
      <View style={styles.particle2} />
      <View style={styles.particle3} />
    </View>
  )
}

const theme = {
  primary: '#10b981',
  background: '#f0fdf4',
  surface: '#ffffff',
  text: '#064e3b',
  textSecondary: '#6b7280',
}

export default Index

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
    backgroundColor: `linear-gradient(135deg, ${theme.primary}10 0%, ${theme.background} 100%)`,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    position: 'relative',
  },
  logoShadow: {
    // position: 'absolute',
    // width: 140,
    // height: 140,
    // // borderRadius: 70,
    // backgroundColor: theme.primary,
    // opacity: 0.1,
    // top: 5,
    // left: 5,
  },
  logo: {
    width: 140,
    height: 140,
    // borderRadius: 70,
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
})