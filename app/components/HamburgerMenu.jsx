
import React, { useState } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  Animated, 
  Dimensions 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../../utils/authContext'
import { POSColors } from '../constants/POSColors'

const { width } = Dimensions.get('window')

const HamburgerMenu = ({ currentRoute = 'dashboard' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [slideAnim] = useState(new Animated.Value(-width))
  const router = useRouter()
  const { user } = useAuth()

  // Menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        id: 'home',
        title: 'Home',
        subtitle: 'Quick Access Dashboard',
        icon: 'home-outline',
        route: user?.role === 'super_admin' ? '/dashboard-admin' : 
               user?.role === 'manager' ? '/dashboard-manager' : '/dashboard',
        roles: ['cashier', 'manager', 'super_admin', 'supervisor','staff']
      },
      {
        id: 'cashier',
        title: 'Cashier',
        subtitle: 'Main POS Interface',
        icon: 'calculator-outline',
        route: '../navigations/cashier',
        roles: ['cashier', 'manager', 'super_admin', 'supervisor','staff']
      },
      {
        id: 'products',
        title: 'Products',
        subtitle: 'Product Browser',
        icon: 'cube-outline',
        route: '../navigations/products',
        roles: ['cashier', 'manager', 'super_admin', 'supervisor','staff']
      },
      {
        id: 'inventory',
        title: 'Inventory',
        subtitle: 'Stock Check & Updates',
        icon: 'library-outline',
        route: '../navigations/inventory',
        roles: ['cashier', 'manager', 'super_admin', 'supervisor','staff']
      },
      {
        id: 'reports',
        title: 'Reports',
        subtitle: 'Basic Sales Reports',
        icon: 'bar-chart-outline',
        route: '../navigations/reports',
        roles: ['cashier', 'manager', 'super_admin', 'supervisor','staff']
      },
      {
        id: 'customers',
        title: 'Customers',
        subtitle: 'Customer Management',
        icon: 'people-outline',
        route: '../navigations/customers',
        roles: ['cashier', 'manager', 'super_admin', 'supervisor','staff']
      },
      // ADD THIS: User Management for managers and admins
      {
        id: 'user-management',
        title: 'User Management',
        subtitle: user?.role === 'super_admin' ? 'Manage All Users & Staff' : 'Manage Store Staff',
        icon: 'person-add-outline',
        route: '../navigations/user-management',
        roles: ['cashier', 'manager', 'super_admin', 'supervisor','staff']
      },
      {
        id: 'settings',
        title: 'Settings',
        subtitle: 'App Configuration',
        icon: 'settings-outline',
        route: '../navigations/settings',
        roles: ['cashier', 'manager', 'super_admin', 'supervisor','staff']
      }
    ]

    // Admin-only items
    if (user?.role === 'super_admin') {
      baseItems.push(
        {
          id: 'system',
          title: 'System',
          subtitle: 'System Configuration',
          icon: 'cog-outline',
          route: '../navigations/system',
          roles: ['super_admin']
        }
      )
    }

    // Filter items based on user role
    return baseItems.filter(item => 
      item.roles.includes(user?.role || 'cashier')
    )
  }

  const openMenu = () => {
    setIsVisible(true)
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false)
    })
  }

  const handleMenuItemPress = (route) => {
    closeMenu()
    setTimeout(() => {
      router.push(route)
    }, 100)
  }

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity 
        style={styles.hamburgerButton} 
        onPress={openMenu}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="menu" size={24} color={POSColors.white} />
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          {/* Menu Panel */}
          <Animated.View 
            style={[
              styles.menuPanel,
              {
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            {/* Menu Header */}
            <View style={styles.menuHeader}>
              <View style={styles.menuHeaderContent}>
                <Text style={styles.menuTitle}>Navigation</Text>
                <Text style={styles.menuSubtitle}>
                  {user?.name} • {user?.role?.replace('_', ' ')}
                  {user?.store_id && (
                    <Text style={styles.storeInfo}> • Store: {user.store_id}</Text>
                  )}
                </Text>
              </View>
              <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={POSColors.white} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {getMenuItems().map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    currentRoute.includes(item.id) && styles.menuItemActive
                  ]}
                  onPress={() => handleMenuItemPress(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons 
                      name={item.icon} 
                      size={22} 
                      color={currentRoute.includes(item.id) ? POSColors.primary : POSColors.textSecondary} 
                    />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={[
                      styles.menuItemTitle,
                      currentRoute.includes(item.id) && styles.menuItemTitleActive
                    ]}>
                      {item.title}
                    </Text>
                    <Text style={styles.menuItemSubtitle}>
                      {item.subtitle}
                    </Text>
                  </View>
                  {currentRoute.includes(item.id) && (
                    <View style={styles.activeIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Menu Footer */}
            <View style={styles.menuFooter}>
              <Text style={styles.footerText}>
                POS System v1.0
              </Text>
              <Text style={styles.footerSubtext}>
                {user?.role === 'super_admin' ? 'Super Admin Access' : 
                 user?.role === 'manager' ? `Manager - Store ${user?.store_id}` :
                 `Cashier - Store ${user?.store_id}`}
              </Text>
            </View>
          </Animated.View>

          {/* Background Overlay */}
          <TouchableOpacity 
            style={styles.overlayBackground} 
            onPress={closeMenu}
            activeOpacity={1}
          />
        </View>
      </Modal>
    </>
  )
}
const styles = StyleSheet.create({
  hamburgerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 999, // Ensure button is on top
  },

  // Fixed modal container
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },

  // Menu panel positioned absolutely on the left
  menuPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: POSColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },

  // Lighter overlay background
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Lighter overlay
    zIndex: 999,
  },

  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: POSColors.primary,
  },
  menuHeaderContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: POSColors.white,
  },
  menuSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  menuItems: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: POSColors.borderLight,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  menuItemIcon: {
    width: 40,
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: POSColors.text,
  },
  menuItemTitleActive: {
    color: POSColors.primary,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: POSColors.textSecondary,
    marginTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: POSColors.primary,
  },

  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: POSColors.borderLight,
    backgroundColor: POSColors.background,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: POSColors.text,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    color: POSColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
})

export default HamburgerMenu