import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as SQLite from 'expo-sqlite'
import { styles, theme } from '../components/DashboardLayout'

const SystemModule = ({ userRole }) => {
  const [systemStats, setSystemStats] = useState({
    totalStores: 0,
    totalUsers: 0,
    totalProducts: 0,
    systemHealth: 'Good'
  })

  useEffect(() => {
    // Only load for super admins
    if (userRole === 'super_admin') {
      loadSystemStats()
    }
  }, [userRole])

  const loadSystemStats = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('pos_db.db')
      
      const storeCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM stores')
      const userCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM users WHERE is_active = 1')
      const productCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM products WHERE is_active = 1')
      
      setSystemStats({
        totalStores: storeCount?.count || 0,
        totalUsers: userCount?.count || 0,
        totalProducts: productCount?.count || 0,
        systemHealth: 'Good'
      })
    } catch (error) {
      console.error('Error loading system stats:', error)
    }
  }

  // 🚫 ONLY FOR SUPER ADMINS
  if (userRole !== 'super_admin') {
    return null
  }

  return (
    <View style={styles.module}>
      <Text style={styles.moduleTitle}>System Overview</Text>
      
      <View style={styles.grid}>
        <View style={[styles.card, styles.gridItem2]}>
          <Ionicons name="storefront" size={24} color={theme.success} />
          <Text style={styles.cardValue}>{systemStats.totalStores}</Text>
          <Text style={styles.cardLabel}>Stores</Text>
        </View>
        
        <View style={[styles.card, styles.gridItem2]}>
          <Ionicons name="people" size={24} color={theme.primary} />
          <Text style={styles.cardValue}>{systemStats.totalUsers}</Text>
          <Text style={styles.cardLabel}>Users</Text>
        </View>
        
        <View style={[styles.card, styles.gridItem2]}>
          <Ionicons name="cube" size={24} color={theme.warning} />
          <Text style={styles.cardValue}>{systemStats.totalProducts}</Text>
          <Text style={styles.cardLabel}>Products</Text>
        </View>
        
        <View style={[styles.card, styles.gridItem2]}>
          <Ionicons name="checkmark-circle" size={24} color={theme.success} />
          <Text style={styles.cardValue}>{systemStats.systemHealth}</Text>
          <Text style={styles.cardLabel}>Health</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Manage System</Text>
        <Ionicons name="arrow-forward" size={16} color={theme.white} />
      </TouchableOpacity>
    </View>
  )
}

export default SystemModule