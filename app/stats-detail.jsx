import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as SQLite from 'expo-sqlite'
import { POSColors } from './constants/POSColors'

const StatsDetail = () => {
  const router = useRouter()
  const [detailedStats, setDetailedStats] = useState({
    todaySales: 0,
    yesterdaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    hourlyBreakdown: []
  })

  useEffect(() => {
    loadDetailedStats()
  }, [])

  const loadDetailedStats = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('pos_db.db')
      
      // Load comprehensive stats here
      // This is where you'd implement detailed analytics
      
      setDetailedStats({
        todaySales: 1250.50,
        yesterdaySales: 980.25,
        weekSales: 8750.75,
        monthSales: 37520.25,
        totalTransactions: 156,
        averageTransaction: 45.67,
        hourlyBreakdown: [
          { hour: '9 AM', sales: 120.50 },
          { hour: '10 AM', sales: 185.75 },
          { hour: '11 AM', sales: 298.25 },
          // ... more hourly data
        ]
      })
    } catch (error) {
      console.error('Error loading detailed stats:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={POSColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detailed Statistics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Overview</Text>
          
          <View style={styles.cardGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(detailedStats.todaySales)}</Text>
              <Text style={styles.statLabel}>Today</Text>
              <View style={styles.changeIndicator}>
                <Ionicons name="trending-up" size={16} color={POSColors.success} />
                <Text style={[styles.changeText, { color: POSColors.success }]}>+12.5%</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(detailedStats.weekSales)}</Text>
              <Text style={styles.statLabel}>This Week</Text>
              <View style={styles.changeIndicator}>
                <Ionicons name="trending-up" size={16} color={POSColors.success} />
                <Text style={[styles.changeText, { color: POSColors.success }]}>+8.3%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hourly Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hourly Sales Today</Text>
          <View style={styles.hourlyChart}>
            {detailedStats.hourlyBreakdown.map((item, index) => (
              <View key={index} style={styles.hourlyItem}>
                <Text style={styles.hourText}>{item.hour}</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: (item.sales / 300) * 50 }]} />
                </View>
                <Text style={styles.salesText}>{formatCurrency(item.sales)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: POSColors.background,
  },
  header: {
    backgroundColor: POSColors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: POSColors.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: POSColors.text,
    marginBottom: 15,
  },
  cardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: POSColors.surface,
    borderRadius: 12,
    padding: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: POSColors.text,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: POSColors.textSecondary,
    marginBottom: 10,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  hourlyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: POSColors.surface,
    padding: 20,
    borderRadius: 12,
  },
  hourlyItem: {
    alignItems: 'center',
  },
  hourText: {
    fontSize: 10,
    color: POSColors.textSecondary,
    marginBottom: 10,
  },
  barContainer: {
    height: 50,
    width: 20,
    backgroundColor: POSColors.card,
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  bar: {
    backgroundColor: POSColors.primary,
    borderRadius: 10,
    width: '100%',
  },
  salesText: {
    fontSize: 8,
    color: POSColors.textSecondary,
    textAlign: 'center',
  },
})

export default StatsDetail