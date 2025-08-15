// app/modules/InventoryModule.jsx
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as SQLite from 'expo-sqlite'
import { styles, theme, formatCurrency } from '../components/DashboardLayout'

const InventoryModule = ({ userRole }) => {
  const [inventory, setInventory] = useState({
    lowStock: [],
    totalProducts: 0,
    outOfStock: 0,
    lowStockCount: 0
  })

  useEffect(() => {
    // Load for managers and admins
    if (userRole === 'manager' || userRole === 'super_admin') {
      loadInventory()
    }
  }, [userRole])

  const loadInventory = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('pos_db.db')
      
      const lowStockItems = await db.getAllAsync(`
        SELECT * FROM products 
        WHERE stock_quantity <= 10 AND is_active = 1 
        ORDER BY stock_quantity ASC 
        LIMIT 5
      `)
      
      const totalCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM products WHERE is_active = 1')
      const outOfStockCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM products WHERE stock_quantity = 0 AND is_active = 1')
      const lowStockCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= 10 AND stock_quantity > 0 AND is_active = 1')
      
      setInventory({
        lowStock: lowStockItems || [],
        totalProducts: totalCount?.count || 0,
        outOfStock: outOfStockCount?.count || 0,
        lowStockCount: lowStockCount?.count || 0
      })
    } catch (error) {
      console.error('Error loading inventory:', error)
    }
  }

  // 🚫 HIDE FROM CASHIERS
  if (userRole === 'cashier') {
    return null
  }

  return (
    <View style={styles.module}>
      <Text style={styles.moduleTitle}>Inventory Status</Text>
      
      <View style={styles.grid}>
        <View style={[styles.card, styles.gridItem3]}>
          <Text style={styles.cardValue}>{inventory.totalProducts}</Text>
          <Text style={styles.cardLabel}>Total Products</Text>
        </View>
        
        <View style={[styles.card, styles.gridItem3]}>
          <Text style={[styles.cardValue, { color: theme.error }]}>{inventory.outOfStock}</Text>
          <Text style={styles.cardLabel}>Out of Stock</Text>
        </View>
        
        <View style={[styles.card, styles.gridItem3]}>
          <Text style={[styles.cardValue, { color: theme.warning }]}>{inventory.lowStockCount}</Text>
          <Text style={styles.cardLabel}>Low Stock</Text>
        </View>
      </View>
      
      {inventory.lowStock.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Low Stock Items</Text>
          <View style={styles.list}>
            {inventory.lowStock.map((product, index) => (
              <View key={product.id || index} style={[styles.listItem, {
                backgroundColor: '#fef3c7',
                borderLeftColor: theme.warning,
                borderLeftWidth: 3,
                borderRadius: 6,
                marginBottom: 8,
                paddingHorizontal: 12,
                paddingVertical: 10
              }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.cardLabel}>{formatCurrency(product.price)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.cardValue, { 
                    color: product.stock_quantity === 0 ? theme.error : theme.warning,
                    marginRight: 5
                  }]}>
                    {product.stock_quantity} left
                  </Text>
                  <Ionicons 
                    name="warning" 
                    size={16} 
                    color={product.stock_quantity === 0 ? theme.error : theme.warning} 
                  />
                </View>
              </View>
            ))}
          </View>
        </>
      )}
      
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Manage Inventory</Text>
        <Ionicons name="arrow-forward" size={16} color={theme.white} />
      </TouchableOpacity>
    </View>
  )
}

export default InventoryModule