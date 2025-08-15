// components/DatabaseInspector.jsx - Add this to see your database
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { databaseService } from '../../services/database'

const DatabaseInspector = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)

  const inspectDatabase = async () => {
    setLoading(true)
    try {
      const db = databaseService.getDatabase()
      
      // Get all tables
      const tables = await db.getAllAsync(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `)
      
      const dbData = {
        tables: tables,
        tableData: {}
      }
      
      // Get data from each table
      for (const table of tables) {
        const tableName = table.name
        const tableData = await db.getAllAsync(`SELECT * FROM ${tableName} LIMIT 20`)
        const count = await db.getFirstAsync(`SELECT COUNT(*) as count FROM ${tableName}`)
        
        dbData.tableData[tableName] = {
          data: tableData,
          count: count.count
        }
      }
      
      setData(dbData)
      console.log('📊 Database inspection complete:', Object.keys(dbData.tableData))
    } catch (error) {
      console.error('Database inspection error:', error)
      Alert.alert('Error', 'Failed to inspect database')
    } finally {
      setLoading(false)
    }
  }

  const exportDatabaseInfo = () => {
    if (!data) return
    
    const info = Object.keys(data.tableData).map(tableName => {
      const tableInfo = data.tableData[tableName]
      return `\n=== ${tableName.toUpperCase()} (${tableInfo.count} records) ===\n${JSON.stringify(tableInfo.data, null, 2)}`
    }).join('\n')
    
    console.log('📋 DATABASE EXPORT:', info)
    Alert.alert('Database Export', 'Database info has been logged to console. Check your development tools.')
  }

  const clearDatabase = async () => {
    Alert.alert(
      'Clear Database',
      'Are you sure you want to clear all data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = databaseService.getDatabase()
              
              // Get all tables
              const tables = await db.getAllAsync(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
              `)
              
              // Delete all data from each table
              for (const table of tables) {
                await db.runAsync(`DELETE FROM ${table.name}`)
              }
              
              Alert.alert('Success', 'Database cleared successfully')
              setData(null)
            } catch (error) {
              console.error('Clear database error:', error)
              Alert.alert('Error', 'Failed to clear database')
            }
          }
        }
      ]
    )
  }

  const reseedDatabase = async () => {
    try {
      await databaseService.seedInitialData()
      Alert.alert('Success', 'Database reseeded successfully')
      await inspectDatabase() // Refresh data
    } catch (error) {
      console.error('Reseed error:', error)
      Alert.alert('Error', 'Failed to reseed database')
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Database Inspector</Text>
      
      {/* Control Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={inspectDatabase}
          disabled={loading}
        >
          <Ionicons name="search" size={20} color="white" />
          <Text style={styles.buttonText}>Inspect DB</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={exportDatabaseInfo}
          disabled={!data}
        >
          <Ionicons name="download" size={20} color="white" />
          <Text style={styles.buttonText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={clearDatabase}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.buttonText}>Clear DB</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.successButton]} 
          onPress={reseedDatabase}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.buttonText}>Reseed</Text>
        </TouchableOpacity>
      </View>

      {/* Database Info */}
      {data && (
        <>
          <Text style={styles.sectionTitle}>
            Database Tables ({data.tables.length})
          </Text>
          
          {data.tables.map((table, index) => {
            const tableName = table.name
            const tableInfo = data.tableData[tableName]
            
            return (
              <View key={index} style={styles.tableCard}>
                <TouchableOpacity 
                  style={styles.tableHeader}
                  onPress={() => setSelectedTable(selectedTable === tableName ? null : tableName)}
                >
                  <Text style={styles.tableName}>{tableName}</Text>
                  <Text style={styles.tableCount}>{tableInfo.count} records</Text>
                  <Ionicons 
                    name={selectedTable === tableName ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                {selectedTable === tableName && (
                  <View style={styles.tableData}>
                    <ScrollView horizontal>
                      <View>
                        {tableInfo.data.map((row, rowIndex) => (
                          <View key={rowIndex} style={styles.row}>
                            <Text style={styles.rowIndex}>{rowIndex + 1}.</Text>
                            <Text style={styles.rowData}>
                              {JSON.stringify(row, null, 2)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            )
          })}
        </>
      )}

      {loading && (
        <View style={styles.loading}>
          <Text>Inspecting database...</Text>
        </View>
      )}
    </ScrollView>
  )
}

export default DatabaseInspector

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
    backgroundColor: '#FF3B30',
  },
  successButton: {
    backgroundColor: '#32D74B',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  tableCount: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  tableData: {
    padding: 15,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowIndex: {
    fontWeight: 'bold',
    marginRight: 10,
    color: '#666',
  },
  rowData: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  loading: {
    padding: 20,
    alignItems: 'center',
  },
})