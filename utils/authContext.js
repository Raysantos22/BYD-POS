// utils/authContext.js - Unified Auth Context for Production POS System
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import authInitializer from '../services/authInitializer';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Only true during initial app load
  error: null,
  source: null, // 'supabase' or 'local'
  originalUser: null, // For user switching functionality
  isSwitched: false // Track if current user is a switched account
};

// Action types
const AUTH_ACTIONS = {
  INIT_COMPLETE: 'INIT_COMPLETE',
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_SOURCE: 'SET_SOURCE',
  // User switching actions
  SWITCH_USER: 'SWITCH_USER',
  SWITCH_BACK: 'SWITCH_BACK'
};

// Reducer function
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.INIT_COMPLETE:
      return {
        ...state,
        isLoading: false,
        user: action.payload?.user || null,
        token: action.payload?.token || null,
        source: action.payload?.source || null,
        isAuthenticated: !!action.payload?.user,
        originalUser: action.payload?.originalUser || null,
        isSwitched: action.payload?.isSwitched || false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        source: action.payload.source,
        isAuthenticated: true,
        isLoading: false,
        originalUser: null, // Reset on new login
        isSwitched: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        source: state.source,
        isAuthenticated: false,
        isLoading: false,
        originalUser: null,
        isSwitched: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        source: state.source,
        isAuthenticated: false,
        isLoading: false,
        originalUser: null,
        isSwitched: false,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      };

    // User switching actions
    case AUTH_ACTIONS.SWITCH_USER:
      return {
        ...state,
        originalUser: state.originalUser || state.user, // Store original if not already stored
        user: action.payload.user,
        isSwitched: true,
        error: null
      };

    case AUTH_ACTIONS.SWITCH_BACK:
      return {
        ...state,
        user: state.originalUser,
        originalUser: null,
        isSwitched: false,
        error: null
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_SOURCE:
      return {
        ...state,
        source: action.payload
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext(null);

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔄 Starting auth initialization...');
      
      // Check for switched user data
      const switchedUserData = await AsyncStorage.getItem('switchedUser');
      const originalUserData = await AsyncStorage.getItem('originalUser');
      
      // Initialize the authentication system
      const activeService = await authInitializer.initialize();
      dispatch({ type: AUTH_ACTIONS.SET_SOURCE, payload: activeService });
      
      if (activeService === 'supabase') {
        // Try to restore authentication from storage
        const authData = await authService.initialize();
        
        if (authData) {
          let initPayload = {
            user: authData.user,
            token: authData.token,
            source: 'supabase'
          };

          // Restore switched user state if exists
          if (switchedUserData && originalUserData) {
            const switchedUser = JSON.parse(switchedUserData);
            const originalUser = JSON.parse(originalUserData);
            
            initPayload = {
              user: switchedUser,
              token: authData.token,
              source: 'supabase',
              originalUser: originalUser,
              isSwitched: true
            };
          }
          
          dispatch({
            type: AUTH_ACTIONS.INIT_COMPLETE,
            payload: initPayload
          });
          
          console.log('✅ Authentication restored from storage');
          return;
        }
      }
      
      // No valid authentication found - complete initialization
      dispatch({ type: AUTH_ACTIONS.INIT_COMPLETE });
      console.log('ℹ️ No authentication data found - user needs to login');
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      dispatch({ type: AUTH_ACTIONS.INIT_COMPLETE });
    }
  };

  // Set user function with switching support
  const setUser = async (userData) => {
    try {
      if (userData) {
        // If this is a switch operation (userData has original_user)
        if (userData.original_user) {
          dispatch({
            type: AUTH_ACTIONS.SWITCH_USER,
            payload: { user: userData }
          });
          
          // Store switched user data
          await AsyncStorage.setItem('switchedUser', JSON.stringify(userData));
          await AsyncStorage.setItem('originalUser', JSON.stringify(userData.original_user));
        } else {
          // Normal user set
          dispatch({
            type: AUTH_ACTIONS.UPDATE_USER,
            payload: userData
          });
        }
        
        console.log('✅ User set:', userData.name, userData.role, userData.is_staff_account ? '(Staff Account)' : '');
      } else {
        // Clear user
        await logout();
      }
    } catch (error) {
      console.error('Error setting user:', error);
    }
  };

  // Switch back to original user
  const switchBackToOriginal = async () => {
    try {
      if (state.originalUser) {
        dispatch({ type: AUTH_ACTIONS.SWITCH_BACK });
        
        // Clear switched user data
        await AsyncStorage.multiRemove(['switchedUser', 'originalUser']);
        
        console.log('✅ Switched back to:', state.originalUser.name);
        return state.originalUser;
      }
      return null;
    } catch (error) {
      console.error('Error switching back to original user:', error);
      return null;
    }
  };

  // Login function - streamlined
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Use the appropriate login method based on active service
      const result = await authInitializer.handleLogin(email, password);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: result
      });

      console.log(`✅ Login successful via ${result.source}`);
      return result;

    } catch (error) {
      console.error('❌ Login failed:', error);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_ERROR,
        payload: error.message
      });
      
      throw error;
    }
  };

  // Register function - streamlined
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const result = await authInitializer.handleRegister(userData);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: result
      });

      console.log(`✅ Registration successful via ${result.source}`);
      return result;

    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_ERROR,
        payload: error.message
      });
      
      throw error;
    }
  };

  // Logout function with switching cleanup
  const logout = async () => {
    try {
      if (state.source === 'supabase') {
        await authService.logout();
      }

      // Clear switched user data
      await AsyncStorage.multiRemove(['switchedUser', 'originalUser']);

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      console.log('✅ Logout successful');

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still logout locally even if server call fails
      await AsyncStorage.multiRemove(['switchedUser', 'originalUser']);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      if (state.source === 'supabase') {
        const updatedUser = await authService.updateProfile(profileData);
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: updatedUser
        });
        return updatedUser;
      } else {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: profileData
        });
        return { ...state.user, ...profileData };
      }
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (state.source === 'supabase') {
        return await authService.changePassword(currentPassword, newPassword);
      } else {
        return { message: 'Password changed successfully (demo mode)' };
      }
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw error;
    }
  };

  // Get fresh profile data
  const refreshProfile = async () => {
    try {
      if (state.source === 'supabase' && state.isAuthenticated) {
        const updatedUser = await authService.getProfile();
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: updatedUser
        });
        return updatedUser;
      }
      return state.user;
    } catch (error) {
      console.error('❌ Profile refresh failed:', error);
      throw error;
    }
  };

  // Check service health
  const checkServiceHealth = async () => {
    try {
      return await authInitializer.checkHealth();
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  };

  // Get service status
  const getServiceStatus = () => {
    return authInitializer.getStatus();
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // UNIFIED: Get dashboard route - ONE DASHBOARD FOR ALL
  const getDashboardRoute = () => {
    if (!state.user) return '/login';
    
    // ALL USERS GO TO THE SAME UNIFIED DASHBOARD
    return '/dashboard';
  };

  // Check if user has required role
  const hasRole = (requiredRole) => {
    if (!state.user) return false;
    
    const roleHierarchy = {
      'staff': 1,
      'cashier': 2,
      'supervisor': 3,
      'manager': 4,
      'super_admin': 5
    };
    
    const userLevel = roleHierarchy[state.user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  // Check if user has any of the required roles
  const hasAnyRole = (requiredRoles) => {
    if (!state.user) return false;
    return requiredRoles.includes(state.user.role);
  };

  // User switching utility functions
  const isSwitchedAccount = () => {
    return state.isSwitched;
  };

  const getOriginalUser = () => {
    return state.originalUser;
  };

  const canSwitchUsers = () => {
    return state.user && (state.user.role === 'super_admin' || state.user.role === 'manager');
  };

  // PRODUCTION: Role-based permissions for features
  const canAccessFeature = (feature) => {
    if (!state.user) return false;

    const permissions = {
      user_switching: ['super_admin', 'manager'],
      user_management: ['super_admin', 'manager'],
      company_overview: ['super_admin', 'manager'],
      system_settings: ['super_admin'],
      detailed_reports: ['super_admin', 'manager'],
      basic_reports: ['super_admin', 'manager', 'supervisor'],
      product_management: ['super_admin', 'manager'],
      inventory_management: ['super_admin', 'manager'],
      cashier_operations: ['super_admin', 'manager', 'supervisor', 'cashier'],
      staff_operations: ['super_admin', 'manager', 'supervisor', 'cashier', 'staff']
    };

    const allowedRoles = permissions[feature] || [];
    return allowedRoles.includes(state.user.role);
  };

  // Get user display info
  const getUserDisplayInfo = () => {
    if (!state.user) return null;

    return {
      name: state.user.name,
      role: state.user.role,
      roleDisplay: state.user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: state.user.email,
      storeId: state.user.store_id,
      companyId: state.user.company_id,
      isSwitched: state.isSwitched,
      originalUser: state.originalUser
    };
  };

  // Get user permissions summary
  const getUserPermissions = () => {
    if (!state.user) return {};

    const role = state.user.role;
    
    return {
      canManageUsers: ['super_admin', 'manager'].includes(role),
      canSwitchUsers: ['super_admin', 'manager'].includes(role),
      canViewReports: ['super_admin', 'manager', 'supervisor'].includes(role),
      canManageProducts: ['super_admin', 'manager'].includes(role),
      canProcessSales: ['super_admin', 'manager', 'supervisor', 'cashier'].includes(role),
      canViewAnalytics: ['super_admin', 'manager'].includes(role),
      canManageSettings: ['super_admin'].includes(role),
      canViewAllStores: role === 'super_admin',
      canViewCompanyData: ['super_admin', 'manager'].includes(role)
    };
  };

  // Context value
  const contextValue = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    source: state.source,
    
    // User switching state
    originalUser: state.originalUser,
    isSwitched: state.isSwitched,
    
    // Core authentication actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshProfile,
    clearError,
    
    // User switching functions
    setUser,
    switchBackToOriginal,
    isSwitchedAccount,
    getOriginalUser,
    canSwitchUsers,
    
    // Service methods
    checkServiceHealth,
    getServiceStatus,
    
    // UNIFIED: Navigation and permissions
    getDashboardRoute,
    hasRole,
    hasAnyRole,
    canAccessFeature,
    getUserDisplayInfo,
    getUserPermissions,
    
    // Status helpers
    isOnline: state.source === 'supabase',
    isOffline: state.source === 'local'
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;