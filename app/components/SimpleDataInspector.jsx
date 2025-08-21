// components/SimpleDataInspector.jsx - Updated for simplified users-only system
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import databaseService from '../../services/database';
import authService from '../../services/authService';

const SimpleDataInspector = ({ visible, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncInfo, setSyncInfo] = useState(null);
  const [dbStats, setDbStats] = useState({});

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get users from SQLite
      const sqliteUsers = await databaseService.getAllUsers();
      setUsers(sqliteUsers);

      // Get sync info
      const syncStatus = await authService.getDetailedSyncStatus();
      setSyncInfo(syncStatus);

      // Get database stats
      const stats = await databaseService.getDatabaseStats();
      setDbStats(stats);

      console.log('📊 Inspector data loaded:', {
        users: sqliteUsers.length,
        lastSync: syncStatus.lastSyncTime,
        isOffline: syncStatus.isOfflineMode
      });

    } catch (error) {
      console.error('Failed to load inspector data:', error);
      Alert.alert('Error', 'Failed to load database data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSyncFromSupabase = async () => {
    try {
      Alert.alert(
        'Sync from Supabase',
        'This will fetch latest users from Supabase and save them to local SQLite. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sync',
            onPress: async () => {
              try {
                setLoading(true);
                const result = await authService.forcSync();
                
                if (result.synced) {
                  Alert.alert(
                    'Sync Successful',
                    `✅ Synced ${result.counts.users} users from Supabase to local database.\n\n` +
                    `Total: ${result.counts.total}\n` +
                    `Success: ${result.counts.users}\n` +
                    `Failed: ${result.counts.failed}\n\n` +
                    `Details: ${result.details || 'Sync completed successfully'}`,
                    [{ text: 'OK', onPress: loadData }]
                  );
                } else {
                  Alert.alert('Sync Info', result.reason || 'Sync completed but no new data');
                }
              } catch (error) {
                console.error('Sync error:', error);
                Alert.alert(
                  'Sync Failed', 
                  `❌ ${error.message}\n\nCheck:\n• Server is running\n• Internet connection\n• Supabase has users data`
                );
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleClearLocalData = async () => {
    Alert.alert(
      'Clear Local Data',
      '⚠️ This will delete all users from local SQLite database.\n\nThis action cannot be undone!\n\nDemo users will be recreated when you restart the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Users',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await databaseService.clearAllUsers();
              await loadData();
              Alert.alert(
                'Data Cleared', 
                '✅ Local user data cleared successfully.\n\nDemo users will be recreated when you restart the app.'
              );
            } catch (error) {
              Alert.alert('Error', '❌ Failed to clear local data: ' + error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleTestDatabaseHealth = async () => {
    try {
      setLoading(true);
      const healthResult = await databaseService.checkDatabaseHealth();
      
      Alert.alert(
        'Database Health Check',
        `Status: ${healthResult.healthy ? '✅ Healthy' : '❌ Unhealthy'}\n` +
        `SQLite Version: ${healthResult.version || 'Unknown'}\n` +
        `User Count: ${healthResult.userCount || 0}\n` +
        `${healthResult.error ? `\nError: ${healthResult.error}` : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Health Check Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.roleBadge, getRoleColor(item.role)]}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
          <View style={[styles.statusBadge, item.is_active ? styles.activeStatus : styles.inactiveStatus]}>
            <Text style={[styles.statusText, item.is_active ? styles.activeText : styles.inactiveText]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <Text style={styles.userDate}>ID: {item.id}</Text>
        <Text style={styles.userDate}>Created: {formatDate(item.created_at)}</Text>
        {item.last_login && (
          <Text style={styles.userDate}>Last Login: {formatDate(item.last_login)}</Text>
        )}
        {item.phone && (
          <Text style={styles.userDate}>Phone: {item.phone}</Text>
        )}
      </View>
      <Ionicons 
        name={item.is_active ? "checkmark-circle" : "close-circle"} 
        size={24} 
        color={item.is_active ? "#10b981" : "#ef4444"} 
      />
    </View>
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return { backgroundColor: '#dc2626' };
      case 'manager': return { backgroundColor: '#ea580c' };
      case 'cashier': return { backgroundColor: '#0891b2' };
      default: return { backgroundColor: '#6b7280' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Users Database Inspector</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{dbStats.users || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statSubtext}>
              {dbStats.activeUsers || 0} active
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name={syncInfo?.isOfflineMode ? "phone-portrait" : "cloud-done"}
              size={24}
              color={syncInfo?.isOfflineMode ? "#f59e0b" : "#10b981"}
            />
            <Text style={styles.statLabel}>
              {syncInfo?.isOfflineMode ? 'Offline Mode' : 'Cloud Sync'}
            </Text>
            <Text style={styles.statSubtext}>
              {syncInfo?.lastSyncTime 
                ? `Last: ${formatDate(syncInfo.lastSyncTime)}` 
                : 'Never synced'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="server" size={24} color="#8b5cf6" />
            <Text style={styles.statLabel}>Database</Text>
            <Text style={styles.statSubtext}>SQLite Local</Text>
            <TouchableOpacity 
              style={styles.miniButton}
              onPress={handleTestDatabaseHealth}
            >
              <Text style={styles.miniButtonText}>Health Check</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.syncButton]}
            onPress={handleSyncFromSupabase}
            disabled={loading}
          >
            <Ionicons name="cloud-download" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Sync from Supabase</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearLocalData}
            disabled={loading}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Clear Local Users</Text>
          </TouchableOpacity>
        </View>

        {/* Users List */}
        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Local SQLite Users ({users.length})</Text>
            {dbStats.error && (
              <Text style={styles.errorText}>⚠️ {dbStats.error}</Text>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>
                {refreshing ? 'Refreshing data...' : 'Loading users...'}
              </Text>
            </View>
          ) : users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No users found in local database</Text>
              <Text style={styles.emptySubtext}>
                Try syncing from Supabase or restart the app to create demo users
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={handleSyncFromSupabase}
              >
                <Text style={styles.emptyButtonText}>Sync from Supabase</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 This inspector shows users from your local SQLite database. 
            Sync with Supabase to get the latest cloud data.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  miniButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  miniButtonText: {
    fontSize: 10,
    color: '#4b5563',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  syncButton: {
    backgroundColor: '#3b82f6',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeStatus: {
    backgroundColor: '#dcfce7',
  },
  inactiveStatus: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: '#166534',
  },
  inactiveText: {
    color: '#dc2626',
  },
  userDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  footer: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default SimpleDataInspector;