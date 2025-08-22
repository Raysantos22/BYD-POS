// modules/ProductStatsModule.jsx - Enhanced Product Statistics Dashboard Module with Manager Company Access
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import productService from '../../services/productService'
import { styles, theme } from '../components/DashboardLayout'

const ProductStatsModule = ({ userRole, userStoreId, userCompanyId, companyInfo }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  })
  const [recentProducts, setRecentProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState('all')
  
  const router = useRouter()

  // Memoize the user context to prevent unnecessary re-renders
  const userContext = React.useMemo(() => ({
    role: userRole,
    store_id: userStoreId,
    company_id: userCompanyId
  }), [userRole, userStoreId, userCompanyId])

  // ENHANCED: Get available stores based on user role
  const getAvailableStores = useCallback(() => {
    if (userRole === 'super_admin') {
      return stores // All stores
    } else if (userRole === 'manager' && userCompanyId) {
      // ENHANCED: Manager can see all stores in their company
      return stores.filter(store => store.company_id === userCompanyId)
    } else if (userStoreId) {
      // Other roles only see their assigned store
      return stores.filter(store => store.id === userStoreId)
    }
    return []
  }, [userRole, userCompanyId, userStoreId, stores])

  // ENHANCED: Load data function with company support
  const loadData = useCallback(async () => {
    if (!userRole) return
    
    try {
      console.log('📊 Loading dashboard data for user:', userRole, userStoreId, userCompanyId)
      
      // ENHANCED: Determine stats options based on role and selection
      let statsOptions = {}
      let productsOptions = { limit: 5 }
      
      if (userRole === 'super_admin') {
        if (selectedStore !== 'all') {
          statsOptions.storeId = selectedStore
          productsOptions.storeId = selectedStore
        }
      } else if (userRole === 'manager') {
        if (userCompanyId) {
          if (selectedStore === 'company' || selectedStore === 'all') {
            // Company-wide stats
            statsOptions.companyId = userCompanyId
            productsOptions.companyId = userCompanyId
          } else if (selectedStore !== 'all') {
            // Specific store stats
            statsOptions.storeId = selectedStore
            productsOptions.storeId = selectedStore
          }
        } else if (userStoreId) {
          // Fallback to manager's assigned store
          statsOptions.storeId = userStoreId
          productsOptions.storeId = userStoreId
        }
      } else if (userStoreId) {
        // Other roles use their assigned store
        statsOptions.storeId = userStoreId
        productsOptions.storeId = userStoreId
      }
      
      // Load all data in parallel
      const [statsData, productsData] = await Promise.all([
        productService.getProductStats(userContext, statsOptions),
        productService.getProducts(userContext, productsOptions)
      ])
      
      setStats(statsData)
      setRecentProducts(productsData.slice(0, 5))
      
      console.log('✅ Dashboard data loaded:', {
        stats: statsData,
        productsCount: productsData.length,
        selectedStore,
        userRole,
        companyId: userCompanyId
      })
      
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error)
      // Don't show alert for every error, just log it
    } finally {
      setLoading(false)
    }
  }, [userRole, userStoreId, userCompanyId, userContext, selectedStore])

  // ENHANCED: Load stores with company information
  const loadStores = useCallback(async () => {
    if (userRole === 'cashier' && userStoreId) {
      // Cashiers don't need store selection
      return
    }
    
    try {
      // ENHANCED: Mock stores data with company information
      const mockStores = [
        { id: 'store-001', name: 'Main Branch', company_id: 'company-1', company_name: 'TechCorp' },
        { id: 'store-002', name: 'Mall Branch', company_id: 'company-1', company_name: 'TechCorp' },
        { id: 'store-003', name: 'City Center', company_id: 'company-1', company_name: 'TechCorp' },
        { id: 'store-004', name: 'Downtown', company_id: 'company-2', company_name: 'RetailCorp' },
        { id: 'store-005', name: 'Suburb Plaza', company_id: 'company-2', company_name: 'RetailCorp' }
      ]
      setStores(mockStores)
      
      // ENHANCED: Set default store selection based on role
      if (userRole === 'manager' && userCompanyId && !selectedStore) {
        // Start with company view for managers
        setSelectedStore('company')
      } else if (!selectedStore && userStoreId && userRole !== 'super_admin') {
        setSelectedStore(userStoreId)
      }
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }, [userRole, userCompanyId, userStoreId, selectedStore])

  // Load data on mount and when user changes
  useEffect(() => {
    let mounted = true
    
    const loadInitialData = async () => {
      if (!mounted) return
      
      setLoading(true)
      await Promise.all([
        loadData(),
        loadStores()
      ])
    }
    
    loadInitialData()
    
    return () => {
      mounted = false
    }
  }, [loadData, loadStores])

  // ENHANCED: Reload data when store selection changes
  useEffect(() => {
    if (userRole && selectedStore) {
      loadData()
    }
  }, [selectedStore, loadData, userRole])

  const handleQuickAction = (action) => {
    switch (action) {
      case 'view_products':
        if (userRole === 'super_admin' && selectedStore !== 'all') {
          router.push(`/products?store=${selectedStore}`)
        } else if (userRole === 'manager' && selectedStore === 'company') {
          router.push(`/products?store=company`)
        } else if (userRole === 'manager' && selectedStore !== 'all') {
          router.push(`/products?store=${selectedStore}`)
        } else {
          router.push('/products')
        }
        break
        
      case 'add_product':
        if (userRole === 'super_admin' || userRole === 'manager') {
          const params = userRole === 'super_admin' && selectedStore !== 'all' 
            ? `?action=create&store=${selectedStore}`
            : userRole === 'manager' && selectedStore !== 'company'
            ? `?action=create&store=${selectedStore}`
            : '?action=create'
          router.push(`/products${params}`)
        } else {
          Alert.alert('Access Denied', 'Only managers and admins can add products')
        }
        break
        
      case 'low_stock':
        const lowStockParams = userRole === 'super_admin' && selectedStore !== 'all'
          ? `?filter=low_stock&store=${selectedStore}`
          : userRole === 'manager' && selectedStore !== 'company'
          ? `?filter=low_stock&store=${selectedStore}`
          : '?filter=low_stock'
        router.push(`/products${lowStockParams}`)
        break
        
      case 'categories':
        const categoryParams = userRole === 'super_admin' && selectedStore !== 'all'
          ? `?tab=categories&store=${selectedStore}`
          : userRole === 'manager' && selectedStore !== 'company'
          ? `?tab=categories&store=${selectedStore}`
          : '?tab=categories'
        router.push(`/products${categoryParams}`)
        break

      case 'manage_availability':
        if (userRole === 'super_admin' || userRole === 'manager') {
          router.push(`/products?tab=availability&store=${selectedStore}`)
        }
        break
    }
  }

  const handleStoreChange = useCallback((storeId) => {
    setSelectedStore(storeId)
  }, [])

  const formatPrice = (price) => {
    return `₱${parseFloat(price || 0).toFixed(2)}`
  }

  const getStockStatus = (stock, minLevel) => {
    if (stock === 0) return { text: 'Out', color: theme.error }
    if (stock <= minLevel) return { text: 'Low', color: theme.warning }
    return { text: 'Good', color: theme.success }
  }

  // ENHANCED: Get display text for current selection
  const getSelectionDisplayText = () => {
    if (userRole === 'super_admin') {
      return selectedStore === 'all' ? 'All Stores' : 
             stores.find(s => s.id === selectedStore)?.name || 'Unknown Store'
    } else if (userRole === 'manager') {
      if (selectedStore === 'company') {
        return companyInfo ? `All ${companyInfo.name} Stores` : 'All Company Stores'
      } else {
        return stores.find(s => s.id === selectedStore)?.name || 'Store'
      }
    } else {
      return stores.find(s => s.id === userStoreId)?.name || `Store: ${userStoreId}`
    }
  }

  if (loading) {
    return (
      <View style={styles.module}>
        <View style={styles.moduleHeader}>
          <View style={styles.moduleHeaderLeft}>
            <Ionicons name="cube" size={20} color={theme.primary} />
            <Text style={styles.moduleTitle}>Product Management</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.module}>
      {/* Module Header */}
      <View style={styles.moduleHeader}>
        <View style={styles.moduleHeaderLeft}>
          <Ionicons name="cube" size={20} color={theme.primary} />
          <Text style={styles.moduleTitle}>Product Management</Text>
        </View>
        <TouchableOpacity 
          style={styles.moduleAction}
          onPress={() => handleQuickAction('view_products')}
        >
          <Ionicons name="arrow-forward" size={16} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* ENHANCED: Store Selector for Super Admin and Managers */}
      {(userRole === 'super_admin' || (userRole === 'manager' && getAvailableStores().length > 1)) && (
        <View style={styles.storeSelector}>
          <Text style={styles.storeSelectorLabel}>
            {userRole === 'manager' ? 'Company View:' : 'Store View:'}
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.storeOptions}
          >
            {/* All Stores Option for Super Admin */}
            {userRole === 'super_admin' && (
              <TouchableOpacity
                style={[
                  styles.storeOption,
                  selectedStore === 'all' && styles.storeOptionActive
                ]}
                onPress={() => handleStoreChange('all')}
              >
                <Text style={[
                  styles.storeOptionText,
                  selectedStore === 'all' && styles.storeOptionTextActive
                ]}>
                  All Stores
                </Text>
              </TouchableOpacity>
            )}

            {/* ENHANCED: Company View for Managers */}
            {userRole === 'manager' && userCompanyId && (
              <TouchableOpacity
                style={[
                  styles.storeOption,
                  selectedStore === 'company' && styles.storeOptionActive
                ]}
                onPress={() => handleStoreChange('company')}
              >
                <Text style={[
                  styles.storeOptionText,
                  selectedStore === 'company' && styles.storeOptionTextActive
                ]}>
                  All {companyInfo?.name || 'Company'} Stores
                </Text>
              </TouchableOpacity>
            )}

            {/* Individual Stores */}
            {getAvailableStores().map((store) => (
              <TouchableOpacity
                key={store.id}
                style={[
                  styles.storeOption,
                  selectedStore === store.id && styles.storeOptionActive
                ]}
                onPress={() => handleStoreChange(store.id)}
              >
                <Text style={[
                  styles.storeOptionText,
                  selectedStore === store.id && styles.storeOptionTextActive
                ]}>
                  {store.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Context Display */}
      <View style={styles.contextDisplay}>
        <Ionicons 
          name={userRole === 'manager' && selectedStore === 'company' ? 'business' : 'storefront'} 
          size={14} 
          color={theme.textSecondary} 
        />
        <Text style={styles.contextText}>
          {getSelectionDisplayText()}
        </Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Products</Text>
          <Text style={styles.statSubtext}>
            {selectedStore === 'all' ? 'System-wide' : 
             selectedStore === 'company' ? 'Company-wide' : 'In inventory'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalCategories}</Text>
          <Text style={styles.statLabel}>Categories</Text>
          <Text style={styles.statSubtext}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.warning }]}>
            {stats.lowStockProducts}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
          <Text style={styles.statSubtext}>Need reorder</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.error }]}>
            {stats.outOfStockProducts}
          </Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
          <Text style={styles.statSubtext}>Urgent</Text>
        </View>
      </View>

      {/* Alert Section for Low/Out of Stock */}
      {(stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) && (
        <View style={styles.alertSection}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={16} color={theme.warning} />
            <Text style={styles.alertTitle}>Stock Alerts</Text>
          </View>
          <Text style={styles.alertText}>
            {stats.outOfStockProducts > 0 && `${stats.outOfStockProducts} products out of stock. `}
            {stats.lowStockProducts > 0 && `${stats.lowStockProducts} products running low.`}
            {userRole === 'manager' && selectedStore === 'company' && 
              ` Across ${companyInfo?.storeCount || 'multiple'} stores.`}
          </Text>
          <TouchableOpacity 
            style={styles.alertButton}
            onPress={() => handleQuickAction('low_stock')}
          >
            <Text style={styles.alertButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Products List */}
      {recentProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Products</Text>
          <View style={styles.list}>
            {recentProducts.map((product, index) => {
              const stockStatus = getStockStatus(product.stock_quantity, product.min_stock_level)
              
              return (
                <View key={product.id || index} style={styles.listItem}>
                  <View style={styles.productIcon}>
                    <Ionicons name="cube-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{product.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {product.sku ? `SKU: ${product.sku}` : 'No SKU'} • {formatPrice(product.default_price)}
                    </Text>
                    <Text style={styles.captionText}>
                      Stock: {product.stock_quantity} {product.unit}
                      {product.category_name && ` • ${product.category_name}`}
                      {/* ENHANCED: Show store name for multi-store views */}
                      {(selectedStore === 'all' || selectedStore === 'company') && product.store_id && 
                        ` • ${stores.find(s => s.id === product.store_id)?.name || product.store_id}`}
                    </Text>
                  </View>
                  <View style={[styles.stockBadge, { backgroundColor: stockStatus.color + '20' }]}>
                    <Text style={[styles.stockText, { color: stockStatus.color }]}>
                      {stockStatus.text}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* Empty State */}
      {recentProducts.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={48} color={theme.textLight} />
          <Text style={styles.emptyText}>No Products Found</Text>
          <Text style={styles.emptySubtext}>
            {selectedStore === 'all' ? 
              'No products available in the system' :
              selectedStore === 'company' ?
                `No products available in ${companyInfo?.name || 'company'} stores` :
              userRole === 'super_admin' || userRole === 'manager' ? 
                'Start by adding your first product' :
                `No products available in this store`
            }
          </Text>
        </View>
      )}

      {/* ENHANCED: Quick Actions */}
      <View style={styles.moduleActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => handleQuickAction('view_products')}
        >
          <Ionicons name="cube" size={16} color={theme.white} />
          <Text style={styles.primaryActionText}>View All</Text>
        </TouchableOpacity>
        
        {(userRole === 'super_admin' || userRole === 'manager') && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => handleQuickAction('add_product')}
          >
            <Ionicons name="add" size={16} color={theme.primary} />
            <Text style={styles.secondaryActionText}>Add Product</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={() => handleQuickAction('categories')}
        >
          <Ionicons name="folder" size={16} color={theme.primary} />
          <Text style={styles.secondaryActionText}>Categories</Text>
        </TouchableOpacity>

        {/* ENHANCED: Multi-Store Management Button for Super Admin and Managers */}
        {(userRole === 'super_admin' || (userRole === 'manager' && getAvailableStores().length > 1)) && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.tertiaryAction]}
            onPress={() => handleQuickAction('manage_availability')}
          >
            <Ionicons name="storefront" size={16} color={theme.primary} />
            <Text style={styles.tertiaryActionText}>
              {userRole === 'manager' ? 'Multi-Store' : 'Availability'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// Enhanced styles for the new components
const enhancedStyles = {
  storeSelector: {
    marginBottom: 16,
  },
  storeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  storeOptions: {
    flexDirection: 'row',
  },
  storeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.backgroundLight,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  storeOptionActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  storeOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  storeOptionTextActive: {
    color: theme.white,
  },
  contextDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.backgroundLight,
    borderRadius: 8,
  },
  contextText: {
    fontSize: 13,
    color: theme.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 10,
    color: theme.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.border,
    marginHorizontal: 8,
  },
  alertSection: {
    backgroundColor: theme.warning + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.warning,
    marginLeft: 6,
  },
  alertText: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  alertButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.warning,
    borderRadius: 6,
  },
  alertButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.white,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.backgroundLight,
    borderRadius: 8,
    gap: 12,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  captionText: {
    fontSize: 11,
    color: theme.textLight,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: theme.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  moduleActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  primaryAction: {
    backgroundColor: theme.primary,
    flex: 1,
    justifyContent: 'center',
  },
  secondaryAction: {
    backgroundColor: theme.backgroundLight,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tertiaryAction: {
    backgroundColor: theme.success + '10',
    borderWidth: 1,
    borderColor: theme.success + '30',
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.white,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  tertiaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.success,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 12,
  },
}

// Merge with existing styles
Object.assign(styles, enhancedStyles)

export default ProductStatsModule