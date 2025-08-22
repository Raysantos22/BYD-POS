// modules/ProductStatsModule.jsx - Simplified Product Statistics Dashboard Module
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import productService from '../../services/productService'
import { styles, theme } from '../components/DashboardLayout'

const ProductStatsModule = ({ userRole, userStoreId }) => {
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
    store_id: userStoreId
  }), [userRole, userStoreId])

  // Load data function with useCallback to prevent infinite loops
  const loadData = useCallback(async () => {
    if (!userRole) return
    
    try {
      console.log('📊 Loading dashboard data for user:', userRole, userStoreId)
      
      // Load all data in parallel
      const [statsData, productsData] = await Promise.all([
        productService.getProductStats(userContext),
        productService.getProducts(userContext, { limit: 5 })
      ])
      
      setStats(statsData)
      setRecentProducts(productsData.slice(0, 5))
      
      console.log('✅ Dashboard data loaded:', {
        stats: statsData,
        productsCount: productsData.length
      })
      
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error)
      // Don't show alert for every error, just log it
    } finally {
      setLoading(false)
    }
  }, [userRole, userStoreId, userContext])

  // Load stores for super admin (simplified)
  const loadStores = useCallback(async () => {
    if (userRole !== 'super_admin') return
    
    try {
      // Mock stores data - replace with actual API call later
      const mockStores = [
        { id: 'store-001', name: 'Main Branch', company: 'TechCorp' },
        { id: 'store-002', name: 'Mall Branch', company: 'TechCorp' },
        { id: 'store-003', name: 'City Center', company: 'TechCorp' }
      ]
      setStores(mockStores)
      
      // Set default store for managers
      if (!selectedStore && userStoreId) {
        setSelectedStore(userStoreId)
      }
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }, [userRole, userStoreId, selectedStore])

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

  const handleQuickAction = (action) => {
    switch (action) {
      case 'view_products':
        if (userRole === 'super_admin' && selectedStore !== 'all') {
          router.push(`/products?store=${selectedStore}`)
        } else {
          router.push('/products')
        }
        break
        
      case 'add_product':
        if (userRole === 'super_admin' || userRole === 'manager') {
          const params = userRole === 'super_admin' && selectedStore !== 'all' 
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
          : '?filter=low_stock'
        router.push(`/products${lowStockParams}`)
        break
        
      case 'categories':
        const categoryParams = userRole === 'super_admin' && selectedStore !== 'all'
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
    // Reload data for new store
    setLoading(true)
    loadData()
  }, [loadData])

  const formatPrice = (price) => {
    return `₱${parseFloat(price || 0).toFixed(2)}`
  }

  const getStockStatus = (stock, minLevel) => {
    if (stock === 0) return { text: 'Out', color: theme.error }
    if (stock <= minLevel) return { text: 'Low', color: theme.warning }
    return { text: 'Good', color: theme.success }
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

      {/* Store Selector for Super Admin */}
      {userRole === 'super_admin' && stores.length > 0 && (
        <View style={styles.storeSelector}>
          <Text style={styles.storeSelectorLabel}>Store View:</Text>
          <View style={styles.storeOptions}>
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
            {stores.map((store) => (
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
          </View>
        </View>
      )}

      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Products</Text>
          <Text style={styles.statSubtext}>
            {selectedStore === 'all' ? 'Company-wide' : 'In inventory'}
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
              userRole === 'super_admin' || userRole === 'manager' ? 
                'Start by adding your first product' :
                `No products available in this store`
            }
          </Text>
        </View>
      )}

      {/* Quick Actions */}
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

        {/* Multi-Store Management Button for Super Admin */}
        {userRole === 'super_admin' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.tertiaryAction]}
            onPress={() => handleQuickAction('manage_availability')}
          >
            <Ionicons name="storefront" size={16} color={theme.primary} />
            <Text style={styles.tertiaryActionText}>Multi-Store</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default ProductStatsModule