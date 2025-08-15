export const dashboardStyles = StyleSheet.create({
  // Layout Styles
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Header Styles
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
  
  // Content Styles
  content: {
    flex: 1,
    padding: 15,
  },
  
  // Module Styles (for consistency across all modules)
  module: {
    backgroundColor: '#fff',
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
    color: '#1f2937',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 15,
    marginBottom: 10,
  },
  
  // Card Styles
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardLabel: {
    fontSize: 12,
    color: '#6b7280',
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
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    marginTop: 15,
  },
  primaryButtonText: {
    fontSize: 14,
    color: '#fff',
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
    color: '#3b82f6',
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
    borderBottomColor: '#f3f4f6',
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
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  
  // Text Styles
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  bodyText: {
    fontSize: 14,
    color: '#374151',
  },
  captionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // Color Variants
  success: { color: '#10b981' },
  warning: { color: '#f59e0b' },
  error: { color: '#ef4444' },
  info: { color: '#3b82f6' },
  
  // Background Color Variants
  successBg: { backgroundColor: '#10b981' },
  warningBg: { backgroundColor: '#f59e0b' },
  errorBg: { backgroundColor: '#ef4444' },
  infoBg: { backgroundColor: '#3b82f6' },
})

// Theme Colors (consistent across the app)
export const theme = {
  // Main Colors
  primary: '#2563eb',
  secondary: '#10b981', 
  accent: '#8b5cf6',
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  
  // Background Colors
  background: '#f5f5f5',
  surface: '#ffffff',
  card: '#f9fafb',
  
  // Text Colors
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  white: '#ffffff',
  
  // Border Colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  
  // Role-specific Colors
  cashier: '#2563eb',    // Blue
  manager: '#10b981',    // Green
  admin: '#8b5cf6',      // Purple
}

// Utility Functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0)
}

export const formatDate = (dateString) => {
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

export const getRoleColor = (role) => {
  switch (role) {
    case 'super_admin': return theme.admin
    case 'manager': return theme.manager
    case 'cashier': 
    default: return theme.cashier
  }
}

// Export styles as default
const styles = dashboardStyles
export default DashboardLayout
export { LoadingScreen, styles }