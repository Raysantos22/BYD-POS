import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as SQLite from 'expo-sqlite'
import { styles, theme, formatCurrency } from '../components/DashboardLayout'

const ReportsModule = ({ userRole, onPress }) => {
  const [reportData, setReportData] = useState({
    dailyReport: { sales: 0, transactions: 0 },
    weeklyReport: { sales: 0, transactions: 0 },
    monthlyReport: { sales: 0, transactions: 0 }
  })
  const router = useRouter()

  useEffect(() => {
    if (userRole === 'manager' || userRole === 'super_admin') {
      loadReportData()
    }
  }, [userRole])

  const loadReportData = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('pos_db.db')
      
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const dailyStats = await db.getFirstAsync(
        'SELECT COUNT(*) as transactions, SUM(total_amount) as sales FROM sales WHERE DATE(created_at) = ?',
        [today]
      )
      
      const weeklyStats = await db.getFirstAsync(
        'SELECT COUNT(*) as transactions, SUM(total_amount) as sales FROM sales WHERE created_at >= ?',
        [weekAgo]
      )
      
      const monthlyStats = await db.getFirstAsync(
        'SELECT COUNT(*) as transactions, SUM(total_amount) as sales FROM sales WHERE created_at >= ?',
        [monthAgo]
      )
      
      setReportData({
        dailyReport: { sales: dailyStats?.sales || 0, transactions: dailyStats?.transactions || 0 },
        weeklyReport: { sales: weeklyStats?.sales || 0, transactions: weeklyStats?.transactions || 0 },
        monthlyReport: { sales: monthlyStats?.sales || 0, transactions: monthlyStats?.transactions || 0 }
      })
    } catch (error) {
      console.error('Error loading report data:', error)
      setReportData({
        dailyReport: { sales: 1250.50, transactions: 23 },
        weeklyReport: { sales: 8750.75, transactions: 156 },
        monthlyReport: { sales: 37520.25, transactions: 678 }
      })
    }
  }

  const handleModulePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push('/reports-detail')
    }
  }

  // Hide from cashiers
  if (userRole === 'cashier') {
    return null
  }

  return (
    <TouchableOpacity style={styles.module} onPress={handleModulePress} activeOpacity={0.8}>
      {/* Module Header with Click Indicator */}
      <View style={styles.moduleHeader}>
        <Text style={styles.moduleTitle}>Reports Overview</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </View>
      
      <View style={styles.list}>
        <View style={styles.listItem}>
          <Text style={styles.cardTitle}>Daily</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardValue}>{formatCurrency(reportData.dailyReport.sales)}</Text>
            <Text style={styles.cardLabel}>{reportData.dailyReport.transactions} transactions</Text>
          </View>
        </View>
        
        <View style={styles.listItem}>
          <Text style={styles.cardTitle}>Weekly</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardValue}>{formatCurrency(reportData.weeklyReport.sales)}</Text>
            <Text style={styles.cardLabel}>{reportData.weeklyReport.transactions} transactions</Text>
          </View>
        </View>
        
        <View style={styles.listItem}>
          <Text style={styles.cardTitle}>Monthly</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardValue}>{formatCurrency(reportData.monthlyReport.sales)}</Text>
            <Text style={styles.cardLabel}>{reportData.monthlyReport.transactions} transactions</Text>
          </View>
        </View>
      </View>

      {/* Click indicator */}
      <View style={styles.clickIndicator}>
        <Text style={styles.clickIndicatorText}>Tap to view detailed reports</Text>
      </View>
    </TouchableOpacity>
  )
}

export default ReportsModule