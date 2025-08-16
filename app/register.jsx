// Updated register.jsx - Fixed to redirect to login after successful registration
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, StatusBar, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import authService from '../services/authService' // Direct import instead of useAuth
import { validateRegistration } from '../utils/validation'

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'cashier' // Default role
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const router = useRouter()

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const handleRegister = async () => {
    // Clear previous errors
    setErrors({})

    // Validate form
    const validation = validateRegistration(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      Alert.alert('Validation Error', 'Please fix the errors in the form')
      return
    }

    setLoading(true)

    try {
      // Prepare registration data in the format expected by the server
      const registrationData = {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim() || null,
        password: formData.password,
        role: formData.role || 'cashier'
      }

      console.log('🔄 Sending registration data:', {
        ...registrationData,
        password: '[HIDDEN]'
      })

      // Register with auth service directly (don't use useAuth to avoid auto-login)
      const response = await authService.register(registrationData)

      // Show success message and redirect to login
      Alert.alert(
        'Account Created Successfully!',
        `Your ${formData.role} account has been created. Please sign in to continue.`,
        [
          {
            text: 'Sign In Now',
            onPress: () => {
              // Navigate to login page with the email pre-filled
              router.replace({
                pathname: '/login',
                params: { email: formData.email }
              })
            }
          }
        ]
      )

    } catch (error) {
      console.error('❌ Registration error:', error)
      
      let errorMessage = 'Registration failed. Please try again.'
      
      // Handle specific error types
      if (error.message?.includes('email already exists')) {
        errorMessage = 'An account with this email already exists. Please use a different email or try signing in.'
        setErrors({ email: 'Email already exists' })
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.'
        setErrors({ email: 'Invalid email format' })
      } else if (error.message?.includes('password')) {
        errorMessage = 'Password requirements not met. Please use at least 6 characters.'
        setErrors({ password: 'Password too weak' })
      } else if (error.message?.includes('Cannot connect')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.'
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      Alert.alert('Registration Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const navigateToLogin = () => {
    router.push('/login')
  }

  // Quick fill demo data for testing
  const fillDemoData = () => {
    setFormData({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'cashier'
    })
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.secondary} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={24} color={theme.white} />
        </TouchableOpacity>
        
        {/* Demo Data Button (Development Only) */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.demoButton} 
            onPress={fillDemoData}
            disabled={loading}
          >
            <Ionicons name="flash" size={16} color={theme.white} />
          </TouchableOpacity>
        )}
        
        <View style={styles.logoContainer}>
          <Ionicons name="person-add" size={60} color={theme.white} />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join our POS system</Text>
      </View>

      {/* Form Section */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
          {/* Name Section */}
          <View style={styles.nameRow}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>First Name *</Text>
              <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color={theme.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor={theme.gray}
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  editable={!loading}
                  autoCapitalize="words"
                />
              </View>
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>
            
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Last Name *</Text>
              <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color={theme.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor={theme.gray}
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  editable={!loading}
                  autoCapitalize="words"
                />
              </View>
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color={theme.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={theme.gray}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
              <Ionicons name="call-outline" size={20} color={theme.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.gray}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!loading}
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Role Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleContainer}>
              {[
                { key: 'cashier', label: 'Cashier', icon: 'card-outline' },
                { key: 'manager', label: 'Manager', icon: 'briefcase-outline' },
                { key: 'super_admin', label: 'Admin', icon: 'shield-outline' }
              ].map((role) => (
                <TouchableOpacity
                  key={role.key}
                  style={[
                    styles.roleButton,
                    formData.role === role.key && styles.roleButtonActive
                  ]}
                  onPress={() => handleInputChange('role', role.key)}
                  disabled={loading}
                >
                  <Ionicons 
                    name={role.icon} 
                    size={18} 
                    color={formData.role === role.key ? theme.white : theme.gray} 
                  />
                  <Text style={[
                    styles.roleButtonText,
                    formData.role === role.key && styles.roleButtonTextActive
                  ]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor={theme.gray}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
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
            <Text style={styles.passwordHint}>Minimum 6 characters</Text>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={theme.gray}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                editable={!loading}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={theme.gray} 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.white} size="small" />
                <Text style={styles.loadingText}>Creating Account...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.registerButtonText}>Create Account</Text>
                <Ionicons name="checkmark" size={20} color={theme.white} style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin} disabled={loading}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// POS Theme Colors (matching login page)
const theme = {
  primary: '#2563eb',      // Modern blue
  primaryDark: '#1d4ed8',  // Darker blue for pressed states
  secondary: '#10b981',    // Green for success
  accent: '#f59e0b',       // Amber for highlights
  background: '#f8fafc',   // Light gray background
  surface: '#ffffff',      // White for cards/surfaces
  text: '#1e293b',         // Dark gray for text
  textSecondary: '#64748b', // Medium gray for secondary text
  gray: '#9ca3af',         // Light gray for placeholders
  white: '#ffffff',
  shadow: '#00000015',     // Light shadow
  border: '#e2e8f0',       // Border color
  error: '#ef4444',        // Red for errors
  success: '#10b981',      // Green for success
  warning: '#f59e0b',      // Orange for warnings
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.secondary,
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  demoButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 40,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  passwordHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  roleButtonActive: {
    backgroundColor: theme.secondary,
    borderColor: theme.secondary,
  },
  roleButtonText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: theme.white,
  },
  termsContainer: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  termsText: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  termsLink: {
    color: theme.secondary,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: theme.secondary,
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.secondary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 32,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  registerButtonText: {
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
    marginBottom: 24,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
})