// utils/authContext.js - Unified auth state management
import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authService } from './auth'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing unified auth...')
      
      // Initialize auth service
      await authService.initialize()
      
      // Get current user from auth service
      const currentUser = authService.getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
        setIsAuthenticated(true)
        console.log('✅ Auth initialized - user found:', currentUser.name)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        console.log('ℹ️ Auth initialized - no user found')
      }
    } catch (error) {
      console.error('❌ Auth initialization failed:', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('🔐 Context login starting...')
      
      // Use auth service to login
      const userData = await authService.login(email, password)
      
      // Update context state
      setUser(userData)
      setIsAuthenticated(true)
      
      console.log('✅ Context login successful:', userData.name)
      return userData
    } catch (error) {
      console.error('❌ Context login failed:', error)
      setUser(null)
      setIsAuthenticated(false)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Context logout starting...')
      
      // Use auth service to logout
      await authService.logout()
      
      // Update context state immediately
      setUser(null)
      setIsAuthenticated(false)
      
      console.log('✅ Context logout successful')
      return true
    } catch (error) {
      console.error('❌ Context logout failed:', error)
      
      // Force clear context state even if logout fails
      setUser(null)
      setIsAuthenticated(false)
      
      throw error
    }
  }

  const register = async (userData) => {
    try {
      console.log('📝 Context register starting...')
      
      // Use auth service to register (which auto-logs in)
      const newUser = await authService.register(userData)
      
      // Update context state
      setUser(newUser)
      setIsAuthenticated(true)
      
      console.log('✅ Context register successful:', newUser.name)
      return newUser
    } catch (error) {
      console.error('❌ Context register failed:', error)
      setUser(null)
      setIsAuthenticated(false)
      throw error
    }
  }

  const refreshAuth = async () => {
    try {
      const currentUser = await authService.refreshAuthState()
      
      if (currentUser) {
        setUser(currentUser)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
      
      return currentUser
    } catch (error) {
      console.error('Auth refresh failed:', error)
      setUser(null)
      setIsAuthenticated(false)
      return null
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    refreshAuth,
    // Helper functions
    isAdmin: () => user?.role === 'super_admin',
    isManager: () => ['manager', 'super_admin'].includes(user?.role),
    isCashier: () => ['cashier', 'manager', 'super_admin'].includes(user?.role),
    getDashboardRoute: () => {
      if (!user) return '/login'
      switch (user.role) {
        case 'super_admin': return '/dashboard-admin'
        case 'manager': return '/dashboard-manager'
        case 'cashier':
        default: return '/dashboard'
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}