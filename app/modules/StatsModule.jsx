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
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadStats()
  }, [userRole])

  const initializeDatabase = async (db) => {
    try {
      // Create sales table if it doesn't exist
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total_amount REAL NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER,
          status TEXT DEFAULT 'completed'
        );
      `)
      
      // Create users table if it doesn't exist (for active users count)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)
      
      console.log('Database tables initialized successfully')
    } catch (error) {
      console.error('Error initializing database:', error)
    }
  }

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const db = await SQLite.openDatabaseAsync('pos_db.db')
      
      // Initialize database tables first
      await initializeDatabase(db)
      
      const today = new Date().toISOString().split('T')[0]

      // Check if sales table exists and has data
      let todayStats = null
      let activeUsersCount = 0

      try {
        todayStats = await db.getFirstAsync(
          'SELECT COUNT(*) as transactions, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(created_at) = ?',
          [today]
        )
        
        // Get active users count for super_admin
        if (userRole === 'super_admin') {
          const usersResult = await db.getFirstAsync(
            'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
          )
          activeUsersCount = usersResult?.count || 0
        }
      } catch (queryError) {
        console.warn('Query error (using fallback data):', queryError)
        // Use fallback data if query fails
        todayStats = { transactions: 0, total: 0 }
      }
      
      setStats({
        todaySales: todayStats?.total || 0,
        totalTransactions: todayStats?.transactions || 0,
        monthlyRevenue: (todayStats?.total || 0) * 30, // Simple estimation
        activeUsers: userRole === 'super_admin' ? (activeUsersCount || 0) : 0
      })
      
    } catch (error) {
      console.error('Error loading stats:', error)
      // Fallback to demo data when database is not accessible
      setStats({
        todaySales: 0, // Start with 0 for new system
        totalTransactions: 0,
        monthlyRevenue: 0,
        activeUsers: userRole === 'super_admin' ? 0 : 0
      })
    } finally {
      setIsLoading(false)
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
          <Text style={styles.cardValue}>
            {isLoading ? '...' : formatCurrency(stats.todaySales)}
          </Text>
          <Text style={styles.cardLabel}>Sales</Text>
        </View>
        
        <View style={[styles.card, styles.gridItem2]}>
          <Ionicons name="receipt" size={24} color={theme.primary} />
          <Text style={styles.cardValue}>
            {isLoading ? '...' : stats.totalTransactions}
          </Text>
          <Text style={styles.cardLabel}>Transactions</Text>
        </View>
        
        {userRole === 'super_admin' && (
          <>
            <View style={[styles.card, styles.gridItem2]}>
              <Ionicons name="card" size={24} color={theme.warning} />
              <Text style={styles.cardValue}>
                {isLoading ? '...' : formatCurrency(stats.monthlyRevenue)}
              </Text>
              <Text style={styles.cardLabel}>Monthly Est.</Text>
            </View>
            
            <View style={[styles.card, styles.gridItem2]}>
              <Ionicons name="people" size={24} color={theme.accent} />
              <Text style={styles.cardValue}>
                {isLoading ? '...' : stats.activeUsers}
              </Text>
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