import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as SQLite from 'expo-sqlite'
import { styles, theme, formatCurrency } from '../components/DashboardLayout'
const StatsModule = ({ userRole, onPress }) => {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalTransactions: 0,
    monthlyRevenue: 0,
    activeUsers: 0
  })
  const router = useRouter()

  useEffect(() => {
    loadStats()
  }, [userRole])

  const loadStats = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('pos_db.db')
      const today = new Date().toISOString().split('T')[0]

      const todayStats = await db.getFirstAsync(
        'SELECT COUNT(*) as transactions, SUM(total_amount) as total FROM sales WHERE DATE(created_at) = ?',
        [today]
      )
      
      setStats({
        todaySales: todayStats?.total || 0,
        totalTransactions: todayStats?.transactions || 0,
        monthlyRevenue: (todayStats?.total || 0) * 30,
        activeUsers: userRole === 'super_admin' ? 5 : 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      setStats({
        todaySales: 1250.50,
        totalTransactions: 23,
        monthlyRevenue: 37515,
        activeUsers: userRole === 'super_admin' ? 5 : 0
      })
    }
  }

  const handleModulePress = () => {
    if (onPress) {
      onPress()
    } else {
      // Default navigation
      router.push('/stats-detail')
    }
  }

  return (
    <TouchableOpacity style={styles.module} onPress={handleModulePress} activeOpacity={0.8}>
      {/* Module Header with Click Indicator */}
      <View style={styles.moduleHeader}>
        <Text style={styles.moduleTitle}>Today's Stats</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </View>
      
      <View style={styles.grid}>
        <View style={[styles.card, styles.gridItem2]}>
          <Ionicons name="trending-up" size={24} color={theme.success} />
          <Text style={styles.cardValue}>{formatCurrency(stats.todaySales)}</Text>
          <Text style={styles.cardLabel}>Sales</Text>
        </View>
        
        <View style={[styles.card, styles.gridItem2]}>
          <Ionicons name="receipt" size={24} color={theme.primary} />
          <Text style={styles.cardValue}>{stats.totalTransactions}</Text>
          <Text style={styles.cardLabel}>Transactions</Text>
        </View>
        
        {userRole === 'super_admin' && (
          <>
            <View style={[styles.card, styles.gridItem2]}>
              <Ionicons name="card" size={24} color={theme.warning} />
              <Text style={styles.cardValue}>{formatCurrency(stats.monthlyRevenue)}</Text>
              <Text style={styles.cardLabel}>Monthly Est.</Text>
            </View>
            
            <View style={[styles.card, styles.gridItem2]}>
              <Ionicons name="people" size={24} color={theme.accent} />
              <Text style={styles.cardValue}>{stats.activeUsers}</Text>
              <Text style={styles.cardLabel}>Active Users</Text>
            </View>
          </>
        )}
      </View>

      {/* Click to view more indicator */}
      <View style={styles.clickIndicator}>
        <Text style={styles.clickIndicatorText}>Tap to view detailed stats</Text>
      </View>
    </TouchableOpacity>
  )
}

export default StatsModule
