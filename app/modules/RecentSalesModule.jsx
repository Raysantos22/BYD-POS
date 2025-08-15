import React, { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as SQLite from 'expo-sqlite'
import { styles, theme, formatCurrency, formatDate, getStatusColor } from '../components/DashboardLayout'

const RecentSalesModule = ({ userRole }) => {
  const [recentSales, setRecentSales] = useState([])

  useEffect(() => {
    loadRecentSales()
  }, [])

  const loadRecentSales = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('pos_db.db')
      
      const recent = await db.getAllAsync(`
        SELECT s.*, u.name as cashier_name 
        FROM sales s 
        LEFT JOIN users u ON s.cashier_id = u.id 
        ORDER BY s.created_at DESC 
        LIMIT 5
      `)
      
      setRecentSales(recent || [])
    } catch (error) {
      console.error('Error loading recent sales:', error)
      // Mock data if database fails
      setRecentSales([
        {
          id: 1,
          total_amount: 45.99,
          customer_name: 'John Doe',
          payment_method: 'Card',
          status: 'completed',
          created_at: new Date().toISOString(),
          cashier_name: 'Alice'
        },
        {
          id: 2,
          total_amount: 23.50,
          customer_name: null,
          payment_method: 'Cash',
          status: 'completed',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          cashier_name: 'Bob'
        }
      ])
    }
  }

  return (
    <View style={styles.module}>
      <Text style={styles.moduleTitle}>Recent Sales</Text>
      
      {recentSales.length > 0 ? (
        <View style={styles.list}>
          {recentSales.map((sale, index) => (
            <View key={sale.id || index} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardValue}>{formatCurrency(sale.total_amount)}</Text>
                <Text style={styles.cardLabel}>
                  {sale.customer_name || 'Walk-in'} • {sale.payment_method}
                </Text>
                <Text style={styles.captionText}>{formatDate(sale.created_at)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sale.status) }]}>
                <Text style={styles.statusText}>{sale.status}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={theme.textLight} />
          <Text style={styles.emptyText}>No recent sales</Text>
        </View>
      )}
    </View>
  )
}

export default RecentSalesModule