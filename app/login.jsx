// app/login.jsx - Updated login component with empty form fields
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/authContext.js'
import { validateLogin } from '../utils/validation'
import authInitializer from '../services/authInitializer'

const Login = () => {
  // Empty form fields - user must enter their credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))
  const [connectionStatus, setConnectionStatus] = useState('checking...')
  const [showDebug, setShowDebug] = useState(__DEV__)
  
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

    // Check service status
    checkServiceStatus()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      const dashboardRoute = getDashboardRoute()
      router.replace(dashboardRoute)
    }
  }, [isAuthenticated])

  const checkServiceStatus = async () => {
    try {
      const status = authInitializer.getStatus()
      setConnectionStatus(status.activeService || 'unknown')
      
      // If not initialized, try to initialize
      if (!status.isInitialized) {
        await authInitializer.initialize()
        const newStatus = authInitializer.getStatus()
        setConnectionStatus(newStatus.activeService || 'unknown')
      }
    } catch (error) {
      console.error('Status check failed:', error)
      setConnectionStatus('error')
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
      const user = await login(email.trim(), password)
      
      // Show success message with data source info
      const sourceText = user.source === 'supabase' ? 'Supabase Cloud' : 'Local Database'
      Alert.alert(
        'Login Successful', 
        `Welcome ${user.name}!\nAuthenticated via ${sourceText}`,
        [{ text: 'Continue', onPress: () => {} }]
      )
    } catch (error) {
      // Handle specific error types
      let errorMessage = 'Invalid email or password'
      if (error.message?.includes('Cannot connect to server')) {
        errorMessage = 'Cannot connect to server. Please check if the server is running at http://10.151.5.198:3000'
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.'
      } else if (error.message?.includes('email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.message?.includes('password')) {
        errorMessage = 'Incorrect password. Please try again.'
      } else if (error.message?.includes('Server unavailable')) {
        errorMessage = 'Server unavailable. Using offline mode.'
      }
      
      Alert.alert('Authentication Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setConnectionStatus('testing...')
      await authInitializer.checkHealth()
      const status = authInitializer.getStatus()
      setConnectionStatus(status.activeService || 'unknown')
      
      Alert.alert(
        'Connection Test', 
        `Status: ${status.isHealthy ? 'Healthy' : 'Unhealthy'}\nService: ${status.activeService}\nLast Check: ${new Date(status.lastCheck).toLocaleTimeString()}`,
        [{ text: 'OK' }]
      )
    } catch (error) {
      setConnectionStatus('error')
      Alert.alert('Connection Error', error.message)
    }
  }

  const navigateToRegister = () => {
    router.push('/register')
  }

  const navigateToForgotPassword = () => {
    router.push('/forgot-password')
  }

  // Fill demo credentials function for testing
  const fillDemoCredentials = () => {
    setEmail('admin@techcorp.com')
    setPassword('password123')
    Alert.alert('Demo Credentials Filled', 'You can now click Sign In to test the connection.')
  }

  // Connection status colors
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'supabase': return theme.primary
      case 'local': return theme.warning
      case 'error': return theme.error
      default: return theme.textSecondary
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'supabase': return 'cloud-done'
      case 'local': return 'phone-portrait'
      case 'error': return 'alert-circle'
      default: return 'hourglass'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'supabase': return 'Connected to Supabase Cloud'
      case 'local': return 'Using Local Database'
      case 'error': return 'Connection Error'
      case 'checking...': return 'Checking Connection...'
      default: return 'Unknown Status'
    }
  }

  const getStatusDescription = () => {
    switch (connectionStatus) {
      case 'supabase': return 'Real-time cloud synchronization active'
      case 'local': return 'Offline mode - limited functionality'
      case 'error': return 'Please check your internet connection and server status'
      default: return 'Initializing...'
    }
  }

  // Simple debug info component
  const DebugInfo = () => {
    if (!showDebug) return null
    
    return (
      <View style={styles.debugOverlay}>
        <View style={styles.debugContainer}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <TouchableOpacity onPress={() => setShowDebug(false)}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.debugText}>Active Service: {connectionStatus}</Text>
          <Text style={styles.debugText}>Server URL: http://10.151.5.198:3000</Text>
          <Text style={styles.debugText}>Demo Email: admin@techcorp.com</Text>
          <Text style={styles.debugText}>Demo Password: password123</Text>
          <Text style={styles.debugText}>Mode: {__DEV__ ? 'Development' : 'Production'}</Text>
          
          <View style={styles.debugButtons}>
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={checkServiceStatus}
            >
              <Text style={styles.debugButtonText}>Refresh Status</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.testButton}
              onPress={handleTestConnection}
            >
              <Text style={styles.debugButtonText}>Test Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <DebugInfo />
      
      {/* Background decorative elements */}
      <View style={styles.backgroundDecor1} />
      <View style={styles.backgroundDecor2} />
      
      {/* Header Section */}
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
        {/* Connection Status Card */}
        <View style={[
          styles.statusCard, 
          connectionStatus === 'supabase' ? styles.statusSuccess : 
          connectionStatus === 'local' ? styles.statusWarning : 
          styles.statusError
        ]}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={getStatusIcon()} 
              size={18} 
              color={getStatusColor()} 
            />
            <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          <Text style={styles.statusText}>
            {getStatusDescription()}
          </Text>
        </View>

        {/* Demo Info Card - Only in Development */}
        {__DEV__ && (
          <View style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <Ionicons name="information-circle" size={18} color={theme.primary} />
              <Text style={styles.demoTitle}>Development Mode</Text>
            </View>
            <Text style={styles.demoText}>• Server: http://10.151.5.198:3000</Text>
            <Text style={styles.demoText}>• Primary: Node.js + Supabase</Text>
            <Text style={styles.demoText}>• Fallback: Local Demo Mode</Text>
            
            <View style={styles.demoButtons}>
              <TouchableOpacity 
                style={styles.debugToggle} 
                onPress={fillDemoCredentials}
              >
                <Text style={styles.debugToggleText}>Fill Demo Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.testButton} 
                onPress={handleTestConnection}
              >
                <Text style={styles.debugToggleText}>Test Server</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Form Title */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to your POS account</Text>
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
            disabled={loading || !email || !password}
          >
            {loading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator color={theme.white} size="small" />
                <Text style={styles.loadingButtonText}>Authenticating...</Text>
              </View>
            ) : (
              <>
                <View style={styles.buttonContent}>
                  <Ionicons 
                    name={connectionStatus === 'supabase' ? "cloud-done" : "phone-portrait"} 
                    size={18} 
                    color={theme.white} 
                    style={styles.buttonIcon} 
                  />
                  <Text style={styles.signInButtonText}>
                    Sign In {connectionStatus === 'supabase' ? 'with Cloud' : 'Offline'}
                  </Text>
                </View>
                <View style={styles.buttonArrow}>
                  <Ionicons name="arrow-forward" size={18} color={theme.white} />
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Connection Status Indicator */}
          <View style={styles.connectionIndicator}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.connectionText}>
              {connectionStatus === 'supabase' ? 'Connected to cloud database' :
               connectionStatus === 'local' ? 'Using offline database' : 
               connectionStatus === 'error' ? 'Connection failed - check server status' :
               'Checking connection...'}
            </Text>
          </View>

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

// Enhanced theme with warning colors
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
  warning: '#f59e0b',
  border: '#d1fae5',
  shadow: '#00000010',
}

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
  headerSpacer: {
    height: 60,
  },
  formSection: {
    flex: 1,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 30,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  statusCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: theme.primary + '08',
    borderColor: theme.primary + '20',
  },
  statusWarning: {
    backgroundColor: theme.warning + '08',
    borderColor: theme.warning + '20',
  },
  statusError: {
    backgroundColor: theme.error + '08',
    borderColor: theme.error + '20',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  demoCard: {
    backgroundColor: theme.primary + '08',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
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
  demoButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  debugToggle: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
  },
  debugToggleText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: theme.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  signInButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  buttonArrow: {
    backgroundColor: theme.primaryDark,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: theme.textSecondary,
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
  // Debug overlay styles
  debugOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugContainer: {
    backgroundColor: theme.surface,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  debugText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  debugButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  debugButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  debugButtonText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
})
export default Login