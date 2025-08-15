// app/login.jsx - Using unified auth context
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/authContext'
import { databaseService } from '../services/database'
import { validateLogin } from '../utils/validation'

const Login = () => {
  const [email, setEmail] = useState('admin@techcorp.com') // Pre-fill for testing
  const [password, setPassword] = useState('password123') // Pre-fill for testing
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [errors, setErrors] = useState({})
  const router = useRouter()
  
  // Use auth context instead of separate auth checks
  const { login, isAuthenticated, getDashboardRoute } = useAuth()

  useEffect(() => {
    initializeDatabase()
  }, [])

  // Check if already authenticated and redirect
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
      
      // Only initialize database here, auth is handled by context
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
    // Clear previous errors
    setErrors({})

    // Validate form
    const validation = validateLogin(email, password)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)

    try {
      console.log('🔐 Attempting login with context...')
      
      // Use context login method
      const user = await login(email.trim(), password)
      
      console.log('✅ Login successful via context!')
      
      // Navigation will be handled by layout automatically
      
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
          <Ionicons name="storefront" size={80} color={theme.primary} />
        </View>
        <ActivityIndicator size="large" color={theme.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Initializing Database...</Text>
        <Text style={styles.loadingSubtext}>Setting up your POS system</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="storefront" size={60} color={theme.white} />
        </View>
        <Text style={styles.title}>POS System</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      {/* Demo Accounts Info */}
      <View style={styles.demoInfo}>
        <Text style={styles.demoTitle}>Demo Accounts:</Text>
        <Text style={styles.demoText}>• Super Admin: admin@techcorp.com</Text>
        <Text style={styles.demoText}>• Manager: manager@techcorp.com</Text>
        <Text style={styles.demoText}>• Cashier: cashier@techcorp.com</Text>
        <Text style={styles.demoText}>• Password: password123</Text>
      </View>

      {/* Form Section */}
      <View style={styles.formContainer}>
        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputContainer, errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={20} color={theme.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={theme.gray}
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
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputContainer, errors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={theme.gray}
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
              style={styles.eyeIcon}
              disabled={loading}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={theme.gray} 
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {/* Forgot Password */}
        <TouchableOpacity 
          style={styles.forgotPassword} 
          onPress={navigateToForgotPassword}
          disabled={loading}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.white} size="small" />
          ) : (
            <>
              <Text style={styles.loginButtonText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={20} color={theme.white} style={styles.buttonIcon} />
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={navigateToRegister} disabled={loading}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// POS Theme Colors
const theme = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#10b981',
  accent: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  gray: '#9ca3af',
  white: '#ffffff',
  shadow: '#00000015',
  border: '#e2e8f0',
  error: '#ef4444',
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
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
  header: {
    backgroundColor: theme.primary,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  demoInfo: {
    backgroundColor: theme.surface,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.accent,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputError: {
    borderColor: theme.error,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: theme.error,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 32,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    color: theme.textSecondary,
    fontSize: 14,
    marginHorizontal: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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