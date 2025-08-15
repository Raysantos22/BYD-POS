// app/login.jsx - Enhanced visual appeal with intro.png
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, Animated } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/authContext'
import { databaseService } from '../services/database'
import { validateLogin } from '../utils/validation'

const Login = () => {
  const [email, setEmail] = useState('admin@techcorp.com')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [errors, setErrors] = useState({})
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))
  const router = useRouter()
  
  const { login, isAuthenticated, getDashboardRoute } = useAuth()

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    initializeDatabase()
  }, [])

  useEffect(() => {
    if (isAuthenticated && !initializing) {
      console.log('✅ User already authenticated, redirecting...')
      const dashboardRoute = getDashboardRoute()
      router.replace(dashboardRoute)
    }
  }, [isAuthenticated, initializing])

  const initializeDatabase = async () => {
    try {
      console.log('🚀 Initializing Database Only...')
      await databaseService.initializeDatabase()
      setInitializing(false)
      console.log('✅ Database initialized successfully')
    } catch (error) {
      console.error('❌ Database initialization failed:', error)
      setInitializing(false)
      Alert.alert('Database Error', 'Failed to initialize the database. Please restart the app.')
    }
  }

  const handleLogin = async () => {
    setErrors({})
    const validation = validateLogin(email, password)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    try {
      console.log('🔐 Attempting login with context...')
      const user = await login(email.trim(), password)
      console.log('✅ Login successful via context!')
    } catch (error) {
      console.error('❌ Login failed:', error)
      Alert.alert('Login Failed', error.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const navigateToRegister = () => {
    router.push('/register')
  }

  const navigateToForgotPassword = () => {
    router.push('/forgot-password')
  }

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/img/intro.png')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
        </View>
        <ActivityIndicator size="large" color={theme.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Initializing Database...</Text>
        <Text style={styles.loadingSubtext}>Setting up your POS system</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Background decorative elements */}
      <View style={styles.backgroundDecor1} />
      <View style={styles.backgroundDecor2} />
      <View style={styles.backgroundDecor3} />
      <View style={styles.backgroundDecor4} />
      <View style={styles.backgroundDecor5} />
      
      {/* Header Section - Just spacing */}
      <View style={styles.headerSpacer} />

      {/* Form Section */}
      <Animated.View 
        style={[
          styles.formSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Demo Info Card */}
        {/* <View style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Ionicons name="information-circle" size={18} color={theme.primary} />
            <Text style={styles.demoTitle}>Demo Accounts</Text>
          </View>
          <Text style={styles.demoText}>• Admin: admin@techcorp.com</Text>
          <Text style={styles.demoText}>• Manager: manager@techcorp.com</Text>
          <Text style={styles.demoText}>• Cashier: cashier@techcorp.com</Text>
          <Text style={styles.demoPassword}>Password: password123</Text>
        </View> */}

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Form Title */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to your account</Text>
          </View>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color={theme.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor={theme.placeholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  if (errors.email) setErrors({...errors, email: null})
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor={theme.placeholder}
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (errors.password) setErrors({...errors, password: null})
                }}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!loading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={theme.inputIcon} 
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={styles.forgotPasswordButton} 
            onPress={navigateToForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity 
            style={[styles.signInButton, loading && styles.signInButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.white} size="small" />
            ) : (
              <>
                <Text style={styles.signInButtonText}>Sign In</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="arrow-forward" size={18} color={theme.white} />
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToRegister} disabled={loading}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

// Enhanced green theme
const theme = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryLight: '#34d399',
  secondary: '#6ee7b7',
  background: '#f0fdf4',
  surface: '#ffffff',
  text: '#064e3b',
  textSecondary: '#6b7280',
  placeholder: '#9ca3af',
  inputIcon: '#6b7280',
  white: '#ffffff',
  error: '#ef4444',
  border: '#d1fae5',
  shadow: '#00000010',
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  backgroundDecor1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: theme.primary + '15',
  },
  backgroundDecor2: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: theme.secondary + '20',
  },
  backgroundDecor3: {
    position: 'absolute',
    top: 150,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.primary + '08',
  },
  backgroundDecor4: {
    position: 'absolute',
    bottom: 200,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.secondary + '12',
  },
  backgroundDecor5: {
    position: 'absolute',
    top: 300,
    right: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary + '10',
  },
  headerSpacer: {
    height: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 30,
  },
  loadingLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoContainer: {
    marginBottom: 30,
  },
  spinner: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 30,
  },
  logoShadow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: theme.primary,
    opacity: 0.1,
    top: 3,
    left: 3,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.primary,
    opacity: 0.05,
    top: -5,
    left: -5,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '400',
  },
  formSection: {
    flex: 1,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 40,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 20,
  },
  demoCard: {
    backgroundColor: theme.primary + '08',
    padding: 16,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: theme.border,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  demoText: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
    marginBottom: 2,
  },
  demoPassword: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '400',
  },
  formContainer: {
    flex: 1,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: theme.error,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    marginLeft: 12,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: theme.error,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: theme.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 32,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonArrow: {
    backgroundColor: theme.primaryDark,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  registerText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
})