// app/login.jsx - Optimized login component with minimal loading states
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/authContext.js'
import { validateLogin } from '../utils/validation'
import authInitializer from '../services/authInitializer'
import SimpleDataInspector from './components/SimpleDataInspector';

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
  const [showInspector, setShowInspector] = useState(false);

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

    // Check service status quickly
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
      setConnectionStatus(status.activeService || 'local')
      
      // If not initialized, try to initialize quickly
      if (!status.isInitialized) {
        await authInitializer.initialize()
        const newStatus = authInitializer.getStatus()
        setConnectionStatus(newStatus.activeService || 'local')
      }
    } catch (error) {
      console.error('Status check failed:', error)
      setConnectionStatus('local') // Default to local mode
    }
  }

  const handleLogin = async () => {
    setErrors({})
    
    // Quick validation - no loading needed
    const validation = validateLogin(email, password)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    // Only show loading for actual authentication attempt
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      
      // Success - brief loading only
      const sourceText = user.source === 'supabase' ? 'Cloud' : 'Offline'
      Alert.alert(
        'Welcome!', 
        `Signed in successfully via ${sourceText}`,
        [{ text: 'Continue', onPress: () => {} }]
      )
    } catch (error) {
      // Quick error handling - no extended loading
      setLoading(false)
      
      let errorMessage = 'Invalid email or password'
      
      if (error.message?.includes('Cannot connect to server')) {
        errorMessage = 'Server unavailable. Check connection.'
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Check internet connection.'
      } else if (error.message?.includes('email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.message?.includes('password')) {
        errorMessage = 'Incorrect password.'
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email.'
      }
      
      // Show error immediately - no loading overlay
      Alert.alert('Sign In Failed', errorMessage)
      return
    }
    
    // Only keep loading briefly for successful auth
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  const handleTestConnection = async () => {
    try {
      setConnectionStatus('testing...')
      await authInitializer.checkHealth()
      const status = authInitializer.getStatus()
      setConnectionStatus(status.activeService || 'local')
      
      Alert.alert(
        'Connection Test', 
        `Status: ${status.isHealthy ? 'Connected' : 'Offline'}\nMode: ${status.activeService || 'local'}\nTime: ${new Date().toLocaleTimeString()}`,
        [{ text: 'OK' }]
      )
    } catch (error) {
      setConnectionStatus('local')
      Alert.alert('Connection Test', `Offline mode active\nError: ${error.message}`)
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
    Alert.alert('Demo Credentials', 'Demo data filled. Ready to sign in.')
  }

  // Connection status helpers
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
      default: return 'ellipse'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'supabase': return 'Cloud Connected'
      case 'local': return 'Offline Mode'
      case 'error': return 'Connection Error'
      case 'testing...': return 'Testing...'
      default: return 'Local Mode'
    }
  }

  const getStatusDescription = () => {
    switch (connectionStatus) {
      case 'supabase': return 'Real-time cloud sync active'
      case 'local': return 'Local database ready'
      case 'error': return 'Check server connection'
      default: return 'Ready to sign in'
    }
  }

  return (
    <View style={styles.container}>
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
              size={16} 
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

        {/* Data Inspector Button (Dev only) */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.inspectorButton}
            onPress={() => setShowInspector(true)}
          >
            <Ionicons name="analytics" size={16} color="#fff" />
            <Text style={styles.inspectorButtonText}>Data Inspector</Text>
          </TouchableOpacity>
        )}

        {/* Data Inspector Modal */}
        <SimpleDataInspector 
          visible={showInspector}
          onClose={() => setShowInspector(false)}
        />

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Form Title */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue</Text>
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

          {/* Quick Actions Row */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={styles.forgotPasswordButton} 
              onPress={navigateToForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {__DEV__ && (
              <TouchableOpacity 
                style={styles.demoButton} 
                onPress={fillDemoCredentials}
                disabled={loading}
              >
                <Text style={styles.demoButtonText}>Demo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sign In Button */}
          <TouchableOpacity 
            style={[styles.signInButton, loading && styles.signInButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password.trim()}
          >
            {loading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator color={theme.white} size="small" />
                <Text style={styles.loadingButtonText}>Signing In...</Text>
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
                    Sign In
                  </Text>
                </View>
                <View style={styles.buttonArrow}>
                  <Ionicons name="arrow-forward" size={16} color={theme.white} />
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Connection Status Footer */}
          <View style={styles.connectionFooter}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.connectionText}>
              {connectionStatus === 'supabase' ? 'Cloud database ready' :
               connectionStatus === 'local' ? 'Local database ready' : 
               'Ready for offline use'}
            </Text>
            {__DEV__ && (
              <TouchableOpacity onPress={handleTestConnection} style={styles.testLink}>
                <Text style={styles.testLinkText}>Test</Text>
              </TouchableOpacity>
            )}
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

// Theme
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
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
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusText: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  inspectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  inspectorButtonText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
    marginBottom: 20,
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
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  forgotPasswordButton: {
    flex: 1,
  },
  forgotPasswordText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: theme.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    visible: false,
    backfaceVisibility: 'hidden',

  },
  demoButtonText: {
    color: theme.primary,
    fontSize: 12,
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
  connectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  testLink: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  testLinkText: {
    fontSize: 11,
    color: theme.primary,
    fontWeight: '500',
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

export default Login