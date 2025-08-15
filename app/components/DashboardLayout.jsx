import React from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { POSColors } from '../constants/POSColors'
import HamburgerMenu from './HamburgerMenu' // Import the hamburger menu

const DashboardLayout = ({ 
  user, 
  title, 
  headerColor = POSColors.primary, 
  onLogout, 
  children,
  currentRoute = 'dashboard' // Add currentRoute prop
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <View style={styles.headerLeft}>
          {/* Replace the old header content with hamburger menu */}
          <HamburgerMenu currentRoute={currentRoute} />
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Hello, {user?.name}</Text>
            <Text style={styles.role}>{title}</Text>
            {user?.store_name && (
              <Text style={styles.store}>{user.store_name}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  )
}

// Loading Screen Component
const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  )
}

// Export theme object for use in other components
export const theme = {
  primary: POSColors.primary,
  secondary: POSColors.secondary,
  accent: POSColors.accent,
  success: POSColors.success,
  warning: POSColors.warning,
  error: POSColors.error,
  info: POSColors.info,
  background: POSColors.background,
  surface: POSColors.surface,
  card: POSColors.card,
  textPrimary: POSColors.text,
  textSecondary: POSColors.textSecondary,
  textLight: POSColors.textLight,
  white: POSColors.white,
  border: POSColors.border,
  borderLight: POSColors.borderLight,
  cashier: POSColors.cashier,
  manager: POSColors.manager,
  admin: POSColors.admin,
}

// Utility Functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0)
}

export const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return theme.success
    case 'pending': return theme.warning
    case 'cancelled': 
    case 'refunded': return theme.error
    default: return theme.textSecondary
  }
}

// Updated Styles
const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: POSColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: POSColors.background,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  clickIndicator: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: POSColors.borderLight,
  },
  clickIndicatorText: {
    fontSize: 12,
    color: POSColors.textLight,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: POSColors.textSecondary,
    fontWeight: '500',
  },
  
  // Updated Header Styles
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: POSColors.white,
  },
  role: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  store: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Content
  content: {
    flex: 1,
    padding: 15,
  },
  
  // Module Styles
  module: {
    backgroundColor: POSColors.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: POSColors.text,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: POSColors.text,
    marginTop: 15,
    marginBottom: 10,
  },
  
  // Card Styles
  card: {
    backgroundColor: POSColors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: POSColors.text,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: POSColors.text,
  },
  cardLabel: {
    fontSize: 12,
    color: POSColors.textSecondary,
    marginTop: 2,
  },
  
  // Grid Styles
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem2: {
    width: '48%',
  },
  gridItem3: {
    width: '32%',
  },
  gridItem4: {
    width: '23%',
  },
  
  // Button Styles
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: POSColors.primary,
    borderRadius: 8,
    marginTop: 15,
  },
  primaryButtonText: {
    fontSize: 14,
    color: POSColors.white,
    fontWeight: '600',
    marginRight: 5,
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: POSColors.primary,
    fontWeight: '500',
    marginRight: 5,
  },
  
  // List Styles
  list: {
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: POSColors.borderLight,
  },
  
  // Status Styles
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 10,
    color: POSColors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: POSColors.textSecondary,
    marginTop: 10,
  },
  
  // Text Styles
  captionText: {
    fontSize: 12,
    color: POSColors.textSecondary,
  },
})

export { LoadingScreen, styles }
export default DashboardLayout