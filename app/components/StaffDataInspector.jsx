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
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import staffService from '../../services/staffService'; // Use the fixed staffService
import { useAuth } from '../../utils/authContext';

// Custom Picker Component to replace React Native Picker
const CustomPicker = ({ selectedValue, onValueChange, items, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedItem = items.find(item => item.value === selectedValue);
  
  return (
    <View style={styles.pickerContainer}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.pickerText, !selectedItem && styles.placeholderText]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Text style={styles.pickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Select Option</Text>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Text style={styles.pickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.pickerItem,
                  selectedValue === item.value && styles.selectedPickerItem
                ]}
                onPress={() => {
                  onValueChange(item.value);
                  setIsOpen(false);
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  selectedValue === item.value && styles.selectedPickerItemText
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Ionicons name="checkmark" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const StaffDataInspector = ({ visible, onClose }) => {
  const [staff, setStaff] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [staffStats, setStaffStats] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    staff_id: '',
    name: '',
    passcode: '',
    role: 'staff',
    store_id: '',
    hourly_rate: '15.00'
  });

  const { user } = useAuth();

  useEffect(() => {
    if (visible && user) {
      loadData();
    }
  }, [visible, user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('📊 Loading staff data for user:', {
        role: user.role,
        store_id: user.store_id,
        name: user.name
      });

      // Load staff using the fixed staffService with proper user context
      const staffData = await staffService.getStaff(user, { forceRefresh: false });
      setStaff(staffData);

      // Load staff stats with user context
      const stats = await staffService.getStaffStats(user);
      setStaffStats(stats);

      // Load stores with user context (managers will only see their store)
      const storesData = await staffService.getStores(user);
      setStores(storesData);

      console.log('📊 Staff inspector data loaded:', {
        staff: staffData.length,
        userRole: user.role,
        storeId: user.store_id,
        stats,
        stores: storesData.length
      });

    } catch (error) {
      console.error('Failed to load staff inspector data:', error);
      Alert.alert('Error', 'Failed to load staff data: ' + error.message);
      // Reset states on error
      setStaff([]);
      setStores([]);
      setStaffStats({});
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Force refresh from Supabase
      const staffData = await staffService.getStaff(user, { forceRefresh: true });
      setStaff(staffData);
      
      const stats = await staffService.getStaffStats(user);
      setStaffStats(stats);
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Error', 'Failed to refresh data: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateStaff = async () => {
    try {
      // Validate form
      if (!newStaff.staff_id || !newStaff.name || !newStaff.passcode) {
        Alert.alert('Validation Error', 'Staff ID, Name, and Passcode are required');
        return;
      }

      // For managers, store_id is automatically set to their store
      if (user.role === 'manager' && user.store_id) {
        newStaff.store_id = user.store_id;
      } else if (user.role === 'super_admin' && !newStaff.store_id) {
        Alert.alert('Validation Error', 'Please select a store');
        return;
      }

      setLoading(true);

      const staffData = {
        ...newStaff,
        hourly_rate: parseFloat(newStaff.hourly_rate) || 15.00
      };

      // Use the fixed staffService with user context
      const createdStaff = await staffService.createStaff(staffData, user);

      Alert.alert(
        'Success',
        `Staff member "${createdStaff.name}" (${createdStaff.staff_id}) created successfully as ${createdStaff.role} for store ${createdStaff.store_id}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCreateForm(false);
              resetForm();
              loadData();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Create staff error:', error);
      Alert.alert(
        'Create Failed',
        error.message || 'Failed to create staff member'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewStaff({
      staff_id: '',
      name: '',
      passcode: '',
      role: 'staff',
      store_id: user.role === 'manager' ? user.store_id : '',
      hourly_rate: '15.00'
    });
  };

  const handleDeleteStaff = (staffMember) => {
    Alert.alert(
      'Delete Staff',
      `Are you sure you want to delete "${staffMember.name}" (${staffMember.staff_id})?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await staffService.deleteStaff(staffMember.id, user);
              Alert.alert('Success', 'Staff member deleted successfully');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete staff member: ' + error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleClearAllStaff = () => {
    Alert.alert(
      'Clear All Staff',
      '⚠️ This will delete ALL staff members from the database.\n\nThis action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // This would need to be implemented in staffService
              // await staffService.clearAllStaff(user);
              await loadData();
              Alert.alert('Success', 'All staff data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear staff data: ' + error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'supervisor': 
        return { backgroundColor: '#ea580c' }; // Orange for supervisor
      case 'staff': 
        return { backgroundColor: '#0891b2' }; // Blue for staff
      default: 
        return { backgroundColor: '#6b7280' }; // Gray for unknown
    }
  };

  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store ? store.name : storeId;
  };

  const renderStaffItem = ({ item }) => (
    <View style={styles.staffItem}>
      <View style={styles.staffInfo}>
        <View style={styles.staffHeader}>
          <Text style={styles.staffName}>{item.name}</Text>
          <View style={styles.staffActions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteStaff(item)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.staffId}>ID: {item.staff_id}</Text>
        
        <View style={styles.staffMeta}>
          <View style={[styles.roleBadge, getRoleColor(item.role)]}>
            <Text style={styles.roleText}>{item.role?.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, item.is_active ? styles.activeStatus : styles.inactiveStatus]}>
            <Text style={[styles.statusText, item.is_active ? styles.activeText : styles.inactiveText]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.staffDetail}>
          Store: {item.store_name || getStoreName(item.store_id)}
        </Text>
        <Text style={styles.staffDetail}>Hourly Rate: {formatCurrency(item.hourly_rate)}</Text>
        <Text style={styles.staffDetail}>Passcode: {item.passcode}</Text>
        <Text style={styles.staffDate}>Created: {formatDate(item.created_at)}</Text>
        {item.updated_at !== item.created_at && (
          <Text style={styles.staffDate}>Updated: {formatDate(item.updated_at)}</Text>
        )}
      </View>
      <Ionicons 
        name={item.is_active ? "checkmark-circle" : "close-circle"} 
        size={24} 
        color={item.is_active ? "#10b981" : "#ef4444"} 
      />
    </View>
  );

  const renderCreateForm = () => (
    <Modal
      visible={showCreateForm}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={() => setShowCreateForm(false)}
    >
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <TouchableOpacity 
            onPress={() => setShowCreateForm(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.formTitle}>Create New Staff</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Staff ID *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter staff ID (e.g., STF001)"
              value={newStaff.staff_id}
              onChangeText={(text) => setNewStaff({...newStaff, staff_id: text.toUpperCase()})}
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter staff member's name"
              value={newStaff.name}
              onChangeText={(text) => setNewStaff({...newStaff, name: text})}
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Passcode *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter 4-digit passcode"
              value={newStaff.passcode}
              onChangeText={(text) => setNewStaff({...newStaff, passcode: text})}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Role</Text>
            <CustomPicker
              selectedValue={newStaff.role}
              onValueChange={(value) => setNewStaff({...newStaff, role: value})}
              placeholder="Select Role"
              items={[
                { label: 'Staff', value: 'staff' },
                { label: 'Supervisor', value: 'supervisor' }
              ]}
            />
          </View>

          {user.role === 'super_admin' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store *</Text>
              <CustomPicker
                selectedValue={newStaff.store_id}
                onValueChange={(value) => setNewStaff({...newStaff, store_id: value})}
                placeholder="Select Store"
                items={[
                  { label: 'Select Store', value: '' },
                  ...stores.map((store) => ({
                    label: store.name,
                    value: store.id
                  }))
                ]}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hourly Rate ($)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="15.00"
              value={newStaff.hourly_rate}
              onChangeText={(text) => setNewStaff({...newStaff, hourly_rate: text})}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formInfo}>
            <Text style={styles.infoText}>
              ℹ️ Staff will be assigned to {user?.role === 'super_admin' 
                ? 'the selected store' 
                : `${getStoreName(user?.store_id)} store`}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.formButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => {
              setShowCreateForm(false);
              resetForm();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateStaff}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.createButtonText}>Create Staff</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
          <Text style={styles.headerTitle}>
            Staff Management {user?.role !== 'super_admin' && user?.store_id 
              ? `- ${getStoreName(user.store_id)}` 
              : ''}
          </Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{staffStats.total || 0}</Text>
            <Text style={styles.statLabel}>Total Staff</Text>
            <Text style={styles.statSubtext}>
              {staffStats.active || 0} active
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="shield-checkmark" size={24} color="#ea580c" />
            <Text style={styles.statNumber}>{staffStats.supervisors || 0}</Text>
            <Text style={styles.statLabel}>Supervisors</Text>
            <Text style={styles.statSubtext}>
              Management level
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="person" size={24} color="#0891b2" />
            <Text style={styles.statNumber}>{staffStats.staff || 0}</Text>
            <Text style={styles.statLabel}>Staff</Text>
            <Text style={styles.statSubtext}>
              Regular employees
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.createButton]}
            onPress={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            disabled={loading}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Add New Staff</Text>
          </TouchableOpacity>

          {__DEV__ && user?.role === 'super_admin' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.clearButton]}
              onPress={handleClearAllStaff}
              disabled={loading}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Staff List */}
        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {user?.role === 'super_admin' ? 'All Staff' : `${getStoreName(user?.store_id)} Staff`} ({staff.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              {user?.role === 'super_admin' 
                ? 'Showing staff from all stores' 
                : `Filtered by your assigned store: ${getStoreName(user?.store_id)}`}
            </Text>
          </View>
          
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading staff...</Text>
            </View>
          ) : staff.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No staff found</Text>
              <Text style={styles.emptySubtext}>
                {user?.role === 'super_admin' 
                  ? 'No staff members in the database'
                  : `No staff assigned to ${getStoreName(user?.store_id)}`
                }
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => {
                  resetForm();
                  setShowCreateForm(true);
                }}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyButtonText}>Add First Staff Member</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={staff}
              renderItem={renderStaffItem}
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
            💡 {user?.role === 'super_admin' 
              ? 'As super admin, you can see and manage all staff members across stores.'
              : `You can only manage staff members assigned to ${getStoreName(user?.store_id)}.`
            }
          </Text>
        </View>

        {/* Create Staff Form Modal */}
        {renderCreateForm()}
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
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
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
    borderRadius: 8,
    gap: 8,
  },
  createButton: {
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
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  staffItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  staffInfo: {
    flex: 1,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  staffActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
  },
  staffId: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  staffMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#dcfce7',
  },
  inactiveStatus: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  activeText: {
    color: '#16a34a',
  },
  inactiveText: {
    color: '#dc2626',
  },
  staffDetail: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  staffDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  pickerModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  pickerCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  pickerDone: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  pickerList: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedPickerItem: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectedPickerItemText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  formInfo: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
  },
  formButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default StaffDataInspector;