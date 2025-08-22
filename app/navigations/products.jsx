// app/products.jsx - Enhanced Products Management with Manager Company Access
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../utils/authContext'
import productService from '../../services/productService'
import { useRouter, useLocalSearchParams } from 'expo-router'

// Enhanced Custom Picker Component
const CustomPicker = ({ selectedValue, onValueChange, items, placeholder, multiple = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedItems = multiple ? 
    items.filter(item => selectedValue?.includes(item.value)) :
    items.find(item => item.value === selectedValue);
  
  const displayText = multiple ?
    selectedItems?.length > 0 ? 
      selectedItems.length === 1 ? selectedItems[0].label : `${selectedItems.length} selected` :
      placeholder :
    selectedItems ? selectedItems.label : placeholder;
  
  return (
    <View style={styles.pickerContainer}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.pickerText, !selectedItems && styles.placeholderText]}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Text style={styles.pickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>
              {multiple ? 'Select Stores' : 'Select Option'}
            </Text>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Text style={styles.pickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {items.map((item) => {
              const isSelected = multiple ? 
                selectedValue?.includes(item.value) :
                selectedValue === item.value;
                
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.pickerItem,
                    isSelected && styles.selectedPickerItem
                  ]}
                  onPress={() => {
                    if (multiple) {
                      const newSelection = selectedValue?.includes(item.value) ?
                        selectedValue.filter(v => v !== item.value) :
                        [...(selectedValue || []), item.value];
                      onValueChange(newSelection);
                    } else {
                      onValueChange(item.value);
                      setIsOpen(false);
                    }
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    isSelected && styles.selectedPickerItemText
                  ]}>
                    {item.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const ProductsScreen = () => {
  // State management
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [currentTab, setCurrentTab] = useState('products')
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  })

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category_id: '',
    default_price: '',
    manila_price: '',
    delivery_price: '',
    wholesale_price: '',
    stock_quantity: '0',
    min_stock_level: '5',
    max_stock_level: '100',
    unit: 'pcs',
    available_in_stores: [],
    store_specific_prices: {},
    store_specific_stock: {}
  })

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'cube-outline'
  })

  const { user } = useAuth()
  const router = useRouter()
  const params = useLocalSearchParams()

  // Memoize user context to prevent unnecessary re-renders
  const userContext = useMemo(() => ({
    role: user?.role,
    store_id: user?.store_id,
    company_id: user?.company_id
  }), [user?.role, user?.store_id, user?.company_id])

  // Get user's company stores - managers can see all stores in their company
  const userCompanyStores = useMemo(() => {
    if (user?.role === 'super_admin') {
      return stores
    } else if (user?.role === 'manager' && user?.company_id) {
      return stores.filter(store => store.company_id === user.company_id)
    } else if (user?.store_id) {
      return stores.filter(store => store.id === user.store_id)
    }
    return []
  }, [stores, user?.role, user?.company_id, user?.store_id])

  // Memoize search options to prevent unnecessary API calls
  const searchOptions = useMemo(() => ({
    categoryId: selectedCategory || undefined,
    search: searchQuery || undefined,
    storeId: (selectedStore && selectedStore !== 'all') ? selectedStore : undefined,
    // For managers, pass company_id to filter stores
    companyId: user?.role === 'manager' ? user?.company_id : undefined
  }), [selectedCategory, searchQuery, selectedStore, user?.role, user?.company_id])

  // Load functions with useCallback to prevent infinite loops
  const loadProducts = useCallback(async () => {
    if (!userContext.role) return
    
    try {
      const productsData = await productService.getProducts(userContext, searchOptions)
      setProducts(productsData)
      console.log('📦 Products loaded:', productsData.length)
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
    }
  }, [userContext, searchOptions])

  const loadCategories = useCallback(async () => {
    if (!userContext.role) return
    
    try {
      const categoriesData = await productService.getCategories(userContext)
      setCategories(categoriesData)
      console.log('📂 Categories loaded:', categoriesData.length)
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories([])
    }
  }, [userContext])

  const loadStats = useCallback(async () => {
    if (!userContext.role) return
    
    try {
      const statsData = await productService.getProductStats(userContext)
      setStats(statsData)
      console.log('📊 Product stats loaded:', statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [userContext])

  const loadStores = useCallback(async () => {
    try {
      // For managers, load stores from their company
      const storesData = await productService.getStores(userContext)
      setStores(storesData)
      
      // Set default store selection based on user role
      if (!selectedStore) {
        if (user?.role === 'manager' && user?.company_id) {
          // Managers can see all company stores, set to 'all' initially
          setSelectedStore('all')
        } else if (user?.store_id) {
          // Staff/cashiers see only their store
          setSelectedStore(user.store_id)
        }
      }
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }, [user?.role, user?.company_id, user?.store_id, selectedStore, userContext])

  const loadCompanies = useCallback(async () => {
    if (user?.role === 'super_admin') {
      try {
        const companiesData = await productService.getCompanies()
        setCompanies(companiesData)
      } catch (error) {
        console.error('Error loading companies:', error)
      }
    }
  }, [user?.role])

  // Combined data loading function
  const loadData = useCallback(async () => {
    if (!user?.role) return
    
    setLoading(true)
    try {
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadStats()
      ])
    } catch (error) {
      console.error('Failed to load products data:', error)
      Alert.alert('Error', 'Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [loadProducts, loadCategories, loadStats, user?.role])

  // Initial load effect - only runs when user changes
  useEffect(() => {
    if (!user?.role) return

    let mounted = true
    
    const initializeData = async () => {
      if (!mounted) return
      
      await Promise.all([
        loadStores(),
        loadCompanies(),
        loadData()
      ])
      
      // Handle URL parameters only once
      if (params.action === 'create') {
        setShowCreateProduct(true)
      }
      if (params.store) {
        setSelectedStore(params.store)
      }
      if (params.tab) {
        setCurrentTab(params.tab)
      }
    }
    
    initializeData()
    
    return () => {
      mounted = false
    }
  }, [user?.role]) // Only depend on user role change

  // Separate effect for data that depends on filters
  useEffect(() => {
    if (!user?.role || loading) return
    
    let mounted = true
    
    const reloadProducts = async () => {
      if (!mounted) return
      await loadProducts()
    }
    
    reloadProducts()
    
    return () => {
      mounted = false
    }
  }, [selectedCategory, selectedStore, searchQuery]) // Only reload when filters change

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  const handleCategoryFilter = useCallback((categoryId) => {
    setSelectedCategory(categoryId)
  }, [])

  const handleStoreFilter = useCallback((storeId) => {
    setSelectedStore(storeId)
  }, [])

  const handleCreateProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.default_price) {
        Alert.alert('Validation Error', 'Product name and default price are required')
        return
      }

      setLoading(true)

      const productData = {
        ...newProduct,
        default_price: parseFloat(newProduct.default_price),
        manila_price: newProduct.manila_price ? parseFloat(newProduct.manila_price) : null,
        delivery_price: newProduct.delivery_price ? parseFloat(newProduct.delivery_price) : null,
        wholesale_price: newProduct.wholesale_price ? parseFloat(newProduct.wholesale_price) : null,
        stock_quantity: parseInt(newProduct.stock_quantity),
        min_stock_level: parseInt(newProduct.min_stock_level),
        max_stock_level: parseInt(newProduct.max_stock_level),
      }

      // Handle multi-store creation for super admins and managers
      if ((user.role === 'super_admin' || user.role === 'manager') && newProduct.available_in_stores.length > 0) {
        // Validate store selection
        if (user.role === 'manager') {
          // Ensure manager only selects stores from their company
          const invalidStores = newProduct.available_in_stores.filter(storeId => 
            !userCompanyStores.some(store => store.id === storeId)
          )
          
          if (invalidStores.length > 0) {
            Alert.alert('Error', 'You can only create products in stores from your company')
            return
          }
        }

        // Create product in multiple stores
        const createdProducts = []
        
        for (const storeId of newProduct.available_in_stores) {
          const storeProductData = {
            ...productData,
            store_id: storeId,
            stock_quantity: newProduct.store_specific_stock[storeId] || productData.stock_quantity,
            store_price: newProduct.store_specific_prices[storeId] || null
          }
          
          const createdProduct = await productService.createProduct(storeProductData, user)
          createdProducts.push(createdProduct)
        }

        Alert.alert(
          'Success',
          `Product "${newProduct.name}" created in ${createdProducts.length} stores!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowCreateProduct(false)
                resetProductForm()
                loadData()
              }
            }
          ]
        )
      } else {
        // Single store creation
        if (user.role === 'manager') {
          // For managers, ensure they select a store from their company
          if (!newProduct.available_in_stores.length) {
            Alert.alert('Validation Error', 'Please select at least one store from your company')
            return
          }
          productData.store_id = newProduct.available_in_stores[0]
        } else {
          productData.store_id = user.store_id || selectedStore
        }
        
        const createdProduct = await productService.createProduct(productData, user)

        Alert.alert(
          'Success',
          `Product "${createdProduct.name}" created successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowCreateProduct(false)
                resetProductForm()
                loadData()
              }
            }
          ]
        )
      }

    } catch (error) {
      console.error('Create product error:', error)
      Alert.alert('Error', error.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      if (!newCategory.name) {
        Alert.alert('Validation Error', 'Category name is required')
        return
      }

      setLoading(true)

      const categoryData = {
        ...newCategory,
        store_id: user.role === 'super_admin' ? selectedStore : 
                 user.role === 'manager' ? (userCompanyStores[0]?.id || user.store_id) :
                 user.store_id
      }

      const createdCategory = await productService.createCategory(categoryData, user)

      Alert.alert(
        'Success',
        `Category "${createdCategory.name}" created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCreateCategory(false)
              resetCategoryForm()
              loadData()
            }
          }
        ]
      )

    } catch (error) {
      console.error('Create category error:', error)
      Alert.alert('Error', error.message || 'Failed to create category')
    } finally {
      setLoading(false)
    }
  }

  const resetProductForm = () => {
    setNewProduct({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      category_id: '',
      default_price: '',
      manila_price: '',
      delivery_price: '',
      wholesale_price: '',
      stock_quantity: '0',
      min_stock_level: '5',
      max_stock_level: '100',
      unit: 'pcs',
      available_in_stores: [],
      store_specific_prices: {},
      store_specific_stock: {}
    })
  }

  const resetCategoryForm = () => {
    setNewCategory({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: 'cube-outline'
    })
  }

  const formatPrice = (price) => {
    return `₱${parseFloat(price || 0).toFixed(2)}`
  }

  const getStockStatus = (stock, minLevel) => {
    if (stock === 0) return { text: 'Out of Stock', color: '#ef4444' }
    if (stock <= minLevel) return { text: 'Low Stock', color: '#f59e0b' }
    return { text: 'In Stock', color: '#10b981' }
  }

  const getUserCompanyInfo = () => {
    if (user?.role === 'super_admin') {
      return 'All Companies'
    } else if (user?.role === 'manager' && user?.company_id) {
      const company = companies.find(c => c.id === user.company_id)
      return company?.name || 'Company Manager'
    } else if (user?.store_id) {
      const store = stores.find(s => s.id === user.store_id)
      return store?.name || user.store_id
    }
    return 'Product management'
  }

  const renderProductItem = ({ item }) => {
    const stockStatus = getStockStatus(item.stock_quantity, item.min_stock_level)
    
    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productSku}>SKU: {item.sku || 'N/A'}</Text>
            {item.category_name && (
              <View style={[styles.categoryBadge, { backgroundColor: item.category_color || '#3b82f6' }]}>
                <Text style={styles.categoryText}>{item.category_name}</Text>
              </View>
            )}
            {(user.role === 'super_admin' || user.role === 'manager') && item.store_id && (
              <View style={styles.storeBadge}>
                <Ionicons name="storefront" size={12} color="#6b7280" />
                <Text style={styles.storeText}>
                  {stores.find(s => s.id === item.store_id)?.name || item.store_id}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.productActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="create-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.productDescription}>{item.description}</Text>
        
        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Default</Text>
            <Text style={styles.priceValue}>{formatPrice(item.default_price)}</Text>
          </View>
          {item.manila_price && (
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Manila</Text>
              <Text style={styles.priceValue}>{formatPrice(item.manila_price)}</Text>
            </View>
          )}
          {item.delivery_price && (
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Delivery</Text>
              <Text style={styles.priceValue}>{formatPrice(item.delivery_price)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.stockRow}>
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Stock: {item.stock_quantity} {item.unit}</Text>
            <View style={[styles.stockStatus, { backgroundColor: stockStatus.color + '20' }]}>
              <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
                {stockStatus.text}
              </Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const renderStoreFilter = () => {
    // Show store filters for super admin and managers
    if (user.role === 'cashier') return null;
    
    const availableStores = user.role === 'manager' ? userCompanyStores : stores;
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.storeFilters}
        contentContainerStyle={styles.storeFiltersContent}
      >
        <TouchableOpacity
          style={[styles.storeFilter, selectedStore === 'all' && styles.storeFilterActive]}
          onPress={() => handleStoreFilter('all')}
        >
          <Ionicons name="business" size={16} color={selectedStore === 'all' ? '#fff' : '#3b82f6'} />
          <Text style={[styles.storeFilterText, selectedStore === 'all' && styles.storeFilterTextActive]}>
            All Stores
          </Text>
        </TouchableOpacity>
        
        {availableStores.map((store) => (
          <TouchableOpacity
            key={store.id}
            style={[styles.storeFilter, selectedStore === store.id && styles.storeFilterActive]}
            onPress={() => handleStoreFilter(store.id)}
          >
            <Ionicons name="storefront" size={14} color={selectedStore === store.id ? '#fff' : '#6b7280'} />
            <Text style={[styles.storeFilterText, selectedStore === store.id && styles.storeFilterTextActive]}>
              {store.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )
  }

  const renderCategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilters}
      contentContainerStyle={styles.categoryFiltersContent}
    >
      <TouchableOpacity
        style={[styles.categoryFilter, !selectedCategory && styles.categoryFilterActive]}
        onPress={() => handleCategoryFilter('')}
      >
        <Text style={[styles.categoryFilterText, !selectedCategory && styles.categoryFilterTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryFilter,
            selectedCategory === category.id && styles.categoryFilterActive,
            { borderColor: category.color }
          ]}
          onPress={() => handleCategoryFilter(category.id)}
        >
          <Ionicons 
            name={category.icon} 
            size={16} 
            color={selectedCategory === category.id ? '#fff' : category.color}
            style={styles.categoryFilterIcon}
          />
          <Text style={[
            styles.categoryFilterText,
            selectedCategory === category.id && styles.categoryFilterTextActive
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      <TouchableOpacity
        style={[styles.tab, currentTab === 'products' && styles.activeTab]}
        onPress={() => setCurrentTab('products')}
      >
        <Ionicons 
          name="cube" 
          size={16} 
          color={currentTab === 'products' ? '#fff' : '#3b82f6'} 
        />
        <Text style={[styles.tabText, currentTab === 'products' && styles.activeTabText]}>
          Products
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, currentTab === 'categories' && styles.activeTab]}
        onPress={() => setCurrentTab('categories')}
      >
        <Ionicons 
          name="folder" 
          size={16} 
          color={currentTab === 'categories' ? '#fff' : '#3b82f6'} 
        />
        <Text style={[styles.tabText, currentTab === 'categories' && styles.activeTabText]}>
          Categories
        </Text>
      </TouchableOpacity>

      {(user.role === 'super_admin' || user.role === 'manager') && (
        <TouchableOpacity
          style={[styles.tab, currentTab === 'availability' && styles.activeTab]}
          onPress={() => setCurrentTab('availability')}
        >
          <Ionicons 
            name="storefront" 
            size={16} 
            color={currentTab === 'availability' ? '#fff' : '#3b82f6'} 
          />
          <Text style={[styles.tabText, currentTab === 'availability' && styles.activeTabText]}>
            {user.role === 'manager' ? 'Company Stores' : 'Multi-Store'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )

  // Role-based access control
  if (user?.role !== 'super_admin' && user?.role !== 'manager' && user?.role !== 'cashier') {
    return (
      <View style={styles.container}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color="#ef4444" />
          <Text style={styles.accessTitle}>Access Restricted</Text>
          <Text style={styles.accessText}>
            You don't have permission to access product management.
          </Text>
        </View>
      </View>
    )
  }

  if (loading && products.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <Text style={styles.headerSubtitle}>
          {getUserCompanyInfo()}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="cube" size={24} color="#3b82f6" />
          <Text style={styles.statNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="folder" size={24} color="#10b981" />
          <Text style={styles.statNumber}>{stats.totalCategories}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="warning" size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>{stats.lowStockProducts}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
          <Text style={styles.statNumber}>{stats.outOfStockProducts}</Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Tab Selector */}
      {renderTabSelector()}

      {/* Search and Actions */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        
        {(user?.role === 'super_admin' || user?.role === 'manager') && (
          <View style={styles.actionButtons}>
            {currentTab === 'categories' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={() => setShowCreateCategory(true)}
              >
                <Ionicons name="folder-outline" size={16} color="#3b82f6" />
              </TouchableOpacity>
            )}
            {currentTab === 'products' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => setShowCreateProduct(true)}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Store Filters */}
      {renderStoreFilter()}

      {/* Category Filters */}
      {currentTab === 'products' && renderCategoryFilter()}

      {/* Content based on current tab */}
      <View style={styles.listContainer}>
        {currentTab === 'products' && (
          <>
            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No Products Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No products match your search.' : 'No products available in this store.'}
                </Text>
                {(user?.role === 'super_admin' || user?.role === 'manager') && (
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setShowCreateProduct(true)}
                  >
                    <Text style={styles.emptyButtonText}>Add First Product</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            )}
          </>
        )}

        {currentTab === 'categories' && (
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'availability' && (user.role === 'super_admin' || user.role === 'manager') && (
          <View style={styles.availabilityContainer}>
            <Text style={styles.availabilityTitle}>
              {user.role === 'manager' ? 'Company Store Management' : 'Multi-Store Product Management'}
            </Text>
            <Text style={styles.availabilitySubtitle}>
              {user.role === 'manager' ? 
                'Manage product availability across your company stores' :
                'Manage product availability across different stores and companies'
              }
            </Text>
            
            {user.role === 'manager' && userCompanyStores.length > 0 && (
              <View style={styles.companyStoresInfo}>
                <Text style={styles.companyStoresTitle}>Your Company Stores:</Text>
                {userCompanyStores.map((store) => (
                  <View key={store.id} style={styles.companyStoreItem}>
                    <Ionicons name="storefront" size={16} color="#3b82f6" />
                    <Text style={styles.companyStoreName}>{store.name}</Text>
                    <Text style={styles.companyStoreAddress}>{store.address}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.comingSoon}>
              <Ionicons name="construct" size={48} color="#9ca3af" />
              <Text style={styles.comingSoonText}>
                {user.role === 'manager' ? 'Company Store Analytics' : 'Multi-Store Management'}
              </Text>
              <Text style={styles.comingSoonSubtext}>Advanced features coming soon...</Text>
            </View>
          </View>
        )}
      </View>

      {/* Create Product Modal */}
      <Modal
        visible={showCreateProduct}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowCreateProduct(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateProduct(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Product</Text>
            <TouchableOpacity 
              onPress={handleCreateProduct}
              disabled={loading}
            >
              <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
                {loading ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Basic Product Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Product Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter product name"
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({...newProduct, name: text})}
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Product description"
                  value={newProduct.description}
                  onChangeText={(text) => setNewProduct({...newProduct, description: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>SKU</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Product SKU"
                    value={newProduct.sku}
                    onChangeText={(text) => setNewProduct({...newProduct, sku: text})}
                  />
                </View>
                
                <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>Barcode</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Product barcode"
                    value={newProduct.barcode}
                    onChangeText={(text) => setNewProduct({...newProduct, barcode: text})}
                  />
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Category</Text>
                <CustomPicker
                  selectedValue={newProduct.category_id}
                  onValueChange={(value) => setNewProduct({...newProduct, category_id: value})}
                  items={categories.map(cat => ({ label: cat.name, value: cat.id }))}
                  placeholder="Select category"
                />
              </View>
            </View>

            {/* Store Selection - Enhanced for Managers */}
            {(user.role === 'super_admin' || user.role === 'manager') && (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Store Availability</Text>
                <Text style={styles.sectionSubtitle}>
                  {user.role === 'manager' ? 
                    'Select which stores in your company will carry this product' :
                    'Select which stores will carry this product'
                  }
                </Text>
                
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Available in Stores *</Text>
                  <CustomPicker
                    selectedValue={newProduct.available_in_stores}
                    onValueChange={(value) => setNewProduct({...newProduct, available_in_stores: value})}
                    items={userCompanyStores.map(store => ({ 
                      label: `${store.name}${store.address ? ` (${store.address})` : ''}`, 
                      value: store.id 
                    }))}
                    placeholder="Select stores"
                    multiple={true}
                  />
                </View>

                {/* Store-specific stock settings */}
                {newProduct.available_in_stores.length > 0 && (
                  <View style={styles.storeSpecificSettings}>
                    <Text style={styles.fieldLabel}>Store-specific Stock Levels</Text>
                    {newProduct.available_in_stores.map((storeId) => {
                      const store = userCompanyStores.find(s => s.id === storeId)
                      return (
                        <View key={storeId} style={styles.storeStockRow}>
                          <Text style={styles.storeStockLabel}>{store?.name}</Text>
                          <TextInput
                            style={styles.storeStockInput}
                            placeholder="Stock qty"
                            value={newProduct.store_specific_stock[storeId]?.toString() || ''}
                            onChangeText={(text) => setNewProduct({
                              ...newProduct,
                              store_specific_stock: {
                                ...newProduct.store_specific_stock,
                                [storeId]: parseInt(text) || 0
                              }
                            })}
                            keyboardType="numeric"
                          />
                        </View>
                      )
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Pricing */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Pricing</Text>
              
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Default Price *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    value={newProduct.default_price}
                    onChangeText={(text) => setNewProduct({...newProduct, default_price: text})}
                    keyboardType="decimal-pad"
                  />
                </View>
                
                <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>Manila Price</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    value={newProduct.manila_price}
                    onChangeText={(text) => setNewProduct({...newProduct, manila_price: text})}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Delivery Price</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    value={newProduct.delivery_price}
                    onChangeText={(text) => setNewProduct({...newProduct, delivery_price: text})}
                    keyboardType="decimal-pad"
                  />
                </View>
                
                <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>Wholesale Price</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    value={newProduct.wholesale_price}
                    onChangeText={(text) => setNewProduct({...newProduct, wholesale_price: text})}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* Inventory (only for single store or when not multi-store) */}
            {((user.role !== 'super_admin' && user.role !== 'manager') || newProduct.available_in_stores.length <= 1) && (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Inventory</Text>
                
                <View style={styles.formRow}>
                  <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.fieldLabel}>Initial Stock</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0"
                      value={newProduct.stock_quantity}
                      onChangeText={(text) => setNewProduct({...newProduct, stock_quantity: text})}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.fieldLabel}>Unit</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="pcs"
                      value={newProduct.unit}
                      onChangeText={(text) => setNewProduct({...newProduct, unit: text})}
                    />
                  </View>
                </View>
                
                <View style={styles.formRow}>
                  <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.fieldLabel}>Min Stock Level</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="5"
                      value={newProduct.min_stock_level}
                      onChangeText={(text) => setNewProduct({...newProduct, min_stock_level: text})}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.fieldLabel}>Max Stock Level</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="100"
                      value={newProduct.max_stock_level}
                      onChangeText={(text) => setNewProduct({...newProduct, max_stock_level: text})}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        visible={showCreateCategory}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowCreateCategory(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateCategory(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Category</Text>
            <TouchableOpacity 
              onPress={handleCreateCategory}
              disabled={loading}
            >
              <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
                {loading ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Category Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter category name"
                  value={newCategory.name}
                  onChangeText={(text) => setNewCategory({...newCategory, name: text})}
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Category description"
                  value={newCategory.description}
                  onChangeText={(text) => setNewCategory({...newCategory, description: text})}
                  multiline
                  numberOfLines={2}
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Color</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="#3b82f6"
                    value={newCategory.color}
                    onChangeText={(text) => setNewCategory({...newCategory, color: text})}
                  />
                </View>
                
                <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>Icon</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="cube-outline"
                    value={newCategory.icon}
                    onChangeText={(text) => setNewCategory({...newCategory, icon: text})}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  primaryAction: {
    backgroundColor: '#3b82f6',
  },
  secondaryAction: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  storeFilters: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  storeFiltersContent: {
    paddingRight: 16,
  },
  storeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  storeFilterActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  storeFilterText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  storeFilterTextActive: {
    color: '#fff',
  },
  companyHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  companyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  categoryFilters: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryFiltersContent: {
    paddingRight: 16,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryFilterActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryFilterIcon: {
    marginRight: 6,
  },
  categoryFilterText: {
    fontSize: 14,
    // color: '#6b7280',
  },
  categoryFilterTextActive: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  storeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  priceItem: {
    flex: 1,
    marginRight: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stockLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 12,
  },
  stockStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  availabilityContainer: {
    padding: 20,
    alignItems: 'center',
  },
  availabilityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  availabilitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  comingSoon: {
    alignItems: 'center',
    padding: 32,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginTop: 16,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  accessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  accessText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  modalSaveDisabled: {
    color: '#9ca3af',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  storeSpecificSettings: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  storeStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeStockLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  storeStockInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#fff',
    width: 80,
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  pickerModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  pickerList: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedPickerItem: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectedPickerItemText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
})

export default ProductsScreen