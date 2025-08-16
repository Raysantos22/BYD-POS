// utils/authContext.js - React Context for authentication state management
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';
import authInitializer from '../services/authInitializer';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  source: null // 'supabase' or 'local'
};

// Action types
const AUTH_ACTIONS = {
  LOADING: 'LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_SOURCE: 'SET_SOURCE'
};

// Reducer function
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        source: action.payload.source,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        source: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        source: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
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
      dispatch({ type: AUTH_ACTIONS.LOADING, payload: true });
      
      // Initialize the authentication system
      const activeService = await authInitializer.initialize();
      dispatch({ type: AUTH_ACTIONS.SET_SOURCE, payload: activeService });
      
      if (activeService === 'supabase') {
        // Try to restore authentication from storage
        const authData = await authService.initialize();
        
        if (authData) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: authData.user,
              token: authData.token,
              source: 'supabase'
            }
          });
          console.log('✅ Authentication restored from storage');
          return;
        }
      }
      
      // No valid authentication found
      dispatch({ type: AUTH_ACTIONS.LOADING, payload: false });
      console.log('ℹ️ No authentication data found - user needs to login');
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_ERROR,
        payload: error.message
      });
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

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

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

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

  // Logout function
  const logout = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOADING, payload: true });

      if (state.source === 'supabase') {
        await authService.logout();
      }

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      console.log('✅ Logout successful');

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still logout locally even if server call fails
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
        // For local mode, just update the local state
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
        // For local mode, simulate password change
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

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    if (!state.user) return '/login';
    
    switch (state.user.role) {
      case 'super_admin':
        return '/dashboard-admin';
      case 'manager':
        return '/dashboard-manager';
      case 'cashier':
      default:
        return '/dashboard';
    }
  };

  // Check if user has required role
  const hasRole = (requiredRole) => {
    if (!state.user) return false;
    
    const roleHierarchy = {
      'cashier': 1,
      'manager': 2,
      'super_admin': 3
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

  // Context value
  const contextValue = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    source: state.source,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshProfile,
    clearError,
    
    // Service methods
    checkServiceHealth,
    getServiceStatus,
    
    // Utility methods
    getDashboardRoute,
    hasRole,
    hasAnyRole,
    
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