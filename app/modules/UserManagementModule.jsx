import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as SQLite from 'expo-sqlite'
import { styles, theme } from '../components/DashboardLayout'

const UserManagementModule = ({ userRole }) => {
  const [users, setUsers] = useState([])

  useEffect(() => {
    // Only load for super admins
    if (userRole === 'super_admin') {
      loadUsers()
    }
  }, [userRole])

  const loadUsers = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('pos_db.db')
      
      const userList = await db.getAllAsync(`
        SELECT u.*, c.name as company_name, s.name as store_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.is_active = 1
        ORDER BY u.created_at DESC
        LIMIT 5
      `)
      
      setUsers(userList || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  // 🚫 ONLY FOR SUPER ADMINS
  if (userRole !== 'super_admin') {
    return null
  }

  return (
    <View style={styles.module}>
      <Text style={styles.moduleTitle}>User Management</Text>
      
      {users.length > 0 ? (
        <View style={styles.list}>
          {users.map((user, index) => (
            <View key={user.id || index} style={styles.listItem}>
              <View style={[styles.card, { 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: theme.card,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
                padding: 0
              }]}>
                <Text style={[styles.cardTitle, { margin: 0 }]}>
                  {user.name?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{user.name}</Text>
                <Text style={styles.cardLabel}>{user.role.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.captionText}>{user.store_name || 'No Store'}</Text>
              </View>
              <View style={[styles.statusBadge, { 
                backgroundColor: user.is_active ? theme.success : theme.error 
              }]}>
                <Text style={styles.statusText}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={theme.textLight} />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Manage All Users</Text>
        <Ionicons name="arrow-forward" size={16} color={theme.white} />
      </TouchableOpacity>
    </View>
  )
}

export default UserManagementModule