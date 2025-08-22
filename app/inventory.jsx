// app/inventory.jsx - Simple Inventory Management Screen
import React, { useState, useEffect } from 'react'
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
  Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../utils/authContext'
import productService from '../services/productService'

const InventoryScreen = () => {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('products') // 'products' or 'movements'
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [newStock, setNewStock] = useState('')
  const [adjustmentNotes, setAdjustmentNotes] = useState('')

  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'products') {
        await loadProducts()
      } else {
        await loadMovements()
      }
    } catch (error) {
      console.error('Failed to load inventory data:', error)
      Alert.alert('Error', 'Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts(user, { 
        includeStock: true,
        sortBy: 'stock_quantity' 
      })
      setProducts(productsData)
      console.log('📦 Inventory products loaded:', productsData.length)
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
    }
  }

  const loadMovements = async () => {
    try {
      const movementsData = await productService.getInventoryMovements(user, { limit: 50 })
      setMovements(movementsData)
      console.log('📊 Inventory movements loaded:', movementsData.length)
    } catch (error) {
      console.error('Error loading movements:', error)
      setMovements([])
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleStockAdjustment = (product) => {
    setSelectedProduct(product)
    setNewStock(product.stock_quantity.toString())
    setAdjustmentNotes('')
    setShowStockModal(true)
  }

  const handleUpdateStock = async () => {
    try {
      if (!newStock || isNaN(newStock)) {
        Alert.alert('Invalid Input', 'Please enter a valid stock quantity')
        return
      }

      const quantity = parseInt(newStock)
      if (quantity < 0) {
        Alert.alert('Invalid Input', 'Stock quantity cannot be negative')
        return
      }

      setLoading(true)

      await productService.updateStock(
        selectedProduct.id,
        quantity,
        'adjustment',
        adjustmentNotes,
        user
      )

      Alert.alert(
        'Success',
        `Stock updated for ${selectedProduct.name}: ${selectedProduct.stock_quantity} → ${quantity}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowStockModal(false)
              setSelectedProduct(null)
              loadProducts()
            }
          }
        ]
      )

    } catch (error) {
      console.error('Update stock error:', error)
      Alert.alert('Error', error.message || 'Failed to update stock')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return 'Invalid Date'
    }
  }

  const getStockStatus = (stock, minLevel) => {
    if (stock === 0) return { text: 'Out of Stock', color: '#ef4444', icon: 'alert-circle' }
    if (stock <= minLevel) return { text: 'Low Stock', color: '#f59e0b', icon: 'warning' }
    return { text: 'In Stock', color: '#10b981', icon: 'checkmark-circle' }
  }

  const getMovementTypeIcon = (type) => {
    switch (type) {
      case 'in': return 'arrow-down'
      case 'out': return 'arrow-up'
      case 'adjustment': return 'create'
      case 'transfer': return 'swap-horizontal'
      default: return 'help'
    }
  }

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'in': return '#10b981'
      case 'out': return '#ef4444'
      case 'adjustment': return '#3b82f6'
      case 'transfer': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const renderProductItem = ({ item }) => {
    const stockStatus = getStockStatus(item.stock_quantity, item.min_stock_level)
    
    return (
      <View style={styles.inventoryItem}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSku}>SKU: {item.sku || 'N/A'}</Text>
            {item.category_name && (
              <Text style={styles.itemCategory}>{item.category_name}</Text>
            )}
          </View>
          
          {(user?.role === 'super_admin' || user?.role === 'manager') && (
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleStockAdjustment(item)}
            >
              <Ionicons name="create-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.stockInfo}>
          <View style={styles.stockRow}>
            <View style={styles.stockDetails}>
              <Text style={styles.stockLabel}>Current Stock</Text>
              <Text style={styles.stockValue}>{item.stock_quantity} {item.unit}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: stockStatus.color + '20' }]}>
              <Ionicons name={stockStatus.icon} size={14} color={stockStatus.color} />
              <Text style={[styles.statusText, { color: stockStatus.color }]}>
                {stockStatus.text}
              </Text>
            </View>
          </View>
          
          <View style={styles.stockLevels}>
            <Text style={styles.levelText}>Min: {item.min_stock_level}</Text>
            <Text style={styles.levelText}>Max: {item.max_stock_level}</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderMovementItem = ({ item }) => {
    const typeColor = getMovementTypeColor(item.movement_type)
    const typeIcon = getMovementTypeIcon(item.movement_type)
    
    return (
      <View style={styles.movementItem}>
        <View style={styles.movementHeader}>
          <View style={[styles.movementIcon, { backgroundColor: typeColor + '20' }]}>
            <Ionicons name={typeIcon} size={20} color={typeColor} />
          </View>
          <View style={styles.movementInfo}>
            <Text style={styles.movementProduct}>{item.product_name || 'Unknown Product'}</Text>
            <Text style={styles.movementType}>
              {item.movement_type.charAt(0).toUpperCase() + item.movement_type.slice(1)}
            </Text>
          </View>
          <View style={styles.movementQuantity}>
            <Text style={[styles.quantityText, { color: typeColor }]}>
              {item.quantity > 0 ? '+' : ''}{item.quantity}
            </Text>
          </View>
        </View>
        
        <View style={styles.movementDetails}>
          <Text style={styles.movementStock}>
            Stock: {item.previous_stock} → {item.new_stock}
          </Text>
          <Text style={styles.movementDate}>{formatDate(item.created_at)}</Text>
        </View>
        
        {item.notes && (
          <Text style={styles.movementNotes}>{item.notes}</Text>
        )}
      </View>
    )
  }

  // Role-based access control
  if (user?.role !== 'super_admin' && user?.role !== 'manager') {
    return (
      <View style={styles.container}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color="#ef4444" />
          <Text style={styles.accessTitle}>Access Restricted</Text>
          <Text style={styles.accessText}>
            You don't have permission to access inventory management.
          </Text>
        </View>
      </View>
    )
  }

  if (loading && (products.length === 0 && movements.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading inventory data...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <Text style={styles.headerSubtitle}>
          {user?.store_id ? `Store: ${user.store_id}` : 'Manage stock levels'}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Ionicons 
            name="cube" 
            size={20} 
            color={activeTab === 'products' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'products' && styles.activeTabText
          ]}>
            Products ({products.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'movements' && styles.activeTab]}
          onPress={() => setActiveTab('movements')}
        >
          <Ionicons 
            name="swap-horizontal" 
            size={20} 
            color={activeTab === 'movements' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'movements' && styles.activeTabText
          ]}>
            Movements ({movements.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.listContainer}>
        {activeTab === 'products' ? (
          products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptyText}>
                No products available for inventory management.
              </Text>
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
          )
        ) : (
          movements.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="swap-horizontal-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Movements Found</Text>
              <Text style={styles.emptyText}>
                No inventory movements recorded yet.
              </Text>
            </View>
          ) : (
            <FlatList
              data={movements}
              renderItem={renderMovementItem}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )
        )}
      </View>

      {/* Stock Adjustment Modal */}
      <Modal
        visible={showStockModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowStockModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStockModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Adjust Stock</Text>
            <TouchableOpacity 
              onPress={handleUpdateStock}
              disabled={loading}
            >
              <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
                {loading ? 'Updating...' : 'Update'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {selectedProduct && (
            <View style={styles.modalContent}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{selectedProduct.name}</Text>
                <Text style={styles.productSku}>SKU: {selectedProduct.sku || 'N/A'}</Text>
                <Text style={styles.currentStock}>
                  Current Stock: {selectedProduct.stock_quantity} {selectedProduct.unit}
                </Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>New Stock Quantity</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter new stock quantity"
                  value={newStock}
                  onChangeText={setNewStock}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Reason for adjustment..."
                  value={adjustmentNotes}
                  onChangeText={setAdjustmentNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  inventoryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#8b5cf6',
  },
  adjustButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  stockInfo: {
    gap: 8,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockDetails: {
    flex: 1,
  },
  stockLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  stockLevels: {
    flexDirection: 'row',
    gap: 16,
  },
  levelText: {
    fontSize: 12,
    color: '#64748b',
  },
  movementItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  movementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  movementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movementInfo: {
    flex: 1,
  },
  movementProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  movementType: {
    fontSize: 12,
    color: '#64748b',
  },
  movementQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  movementDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  movementStock: {
    fontSize: 12,
    color: '#64748b',
  },
  movementDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  movementNotes: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  accessTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  accessText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalSave: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: '#9ca3af',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  productInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  currentStock: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
})

export default InventoryScreen