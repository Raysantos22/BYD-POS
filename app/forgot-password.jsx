import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo purposes, show success message
      setEmailSent(true)
      
      setTimeout(() => {
        Alert.alert(
          'Success',
          'Password reset instructions have been sent to your email.',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        )
      }, 500)

    } catch (error) {
      console.error('Password reset failed:', error)
      Alert.alert('Error', 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const navigateToLogin = () => {
    router.back()
  }

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color={theme.success} />
          </View>
          <Text style={styles.successTitle}>Email Sent!</Text>
          <Text style={styles.successMessage}>
            We've sent password reset instructions to {email}
          </Text>
          <Text style={styles.successSubtext}>
            Please check your email and follow the instructions to reset your password.
          </Text>
          
          <TouchableOpacity style={styles.backButton} onPress={navigateToLogin}>
            <Ionicons name="arrow-back" size={20} color={theme.white} style={styles.buttonIcon} />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={navigateToLogin}>
          <Ionicons name="arrow-back" size={24} color={theme.white} />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Ionicons name="lock-closed" size={60} color={theme.white} />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Don't worry, we'll help you reset it</Text>
      </View>

      {/* Form Section */}
      <View style={styles.formContainer}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>Reset Your Password</Text>
          <Text style={styles.instructionText}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={theme.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={theme.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity 
          style={[styles.resetButton, loading && styles.resetButtonDisabled]} 
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.white} size="small" />
          ) : (
            <>
              <Text style={styles.resetButtonText}>Send Reset Email</Text>
              <Ionicons name="mail" size={20} color={theme.white} style={styles.buttonIcon} />
            </>
          )}
        </TouchableOpacity>

        {/* Help Section */}
        <View style={styles.helpContainer}>
          <View style={styles.helpItem}>
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={styles.helpText}>Email delivery may take a few minutes</Text>
          </View>
          
          <View style={styles.helpItem}>
            <Ionicons name="folder-outline" size={20} color={theme.primary} />
            <Text style={styles.helpText}>Check your spam folder if you don't see it</Text>
          </View>
          
          <View style={styles.helpItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            <Text style={styles.helpText}>Reset link expires in 24 hours for security</Text>
          </View>
        </View>

        {/* Alternative Options */}
        <View style={styles.alternativeContainer}>
          <Text style={styles.alternativeTitle}>Still having trouble?</Text>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="headset-outline" size={18} color={theme.primary} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Back to Login */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Remember your password? </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginLink}>Sign In</Text>
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
  success: '#10b981',
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

export default ForgotPassword

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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    position: 'relative',
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: 20,
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
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  instructionContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 32,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  resetButton: {
    backgroundColor: theme.secondary,
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 32,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  helpContainer: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  helpText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  alternativeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  alternativeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  contactButtonText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
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
  // Success state styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  successSubtext: {
    fontSize: 14,
    color: theme.gray,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  backButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})