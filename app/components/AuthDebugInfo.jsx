// // components/AuthDebugInfo.jsx - Simple debug component
// import React from 'react'
// import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
// import { Ionicons } from '@expo/vector-icons'
// import { useAuth } from '../utils/authContext'
// import { authInitializer } from '../services/authInitializer'

// const AuthDebugInfo = ({ onClose }) => {
//   const { user, isAuthenticated } = useAuth()

//   const getDebugInfo = () => {
//     const authStatus = authInitializer.getStatus()
    
//     return {
//       timestamp: new Date().toISOString(),
//       authentication: {
//         isAuthenticated,
//         user: user ? {
//           id: user.id,
//           email: user.email,
//           name: user.name,
//           role: user.role,
//           source: user.source
//         } : null
//       },
//       services: {
//         activeService: authStatus.activeService,
//         isInitialized: authStatus.isInitialized
//       }
//     }
//   }

//   const debugInfo = getDebugInfo()

//   return (
//     <View style={styles.overlay}>
//       <View style={styles.container}>
//         <View style={styles.header}>
//           <Text style={styles.title}>Auth Debug Info</Text>
//           <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//             <Ionicons name="close" size={24} color="#6b7280" />
//           </TouchableOpacity>
//         </View>
        
//         <ScrollView style={styles.content}>
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Authentication Status</Text>
//             <Text style={styles.debugText}>
//               Authenticated: {debugInfo.authentication.isAuthenticated ? 'Yes' : 'No'}
//             </Text>
//             {debugInfo.authentication.user && (
//               <>
//                 <Text style={styles.debugText}>
//                   User: {debugInfo.authentication.user.name} ({debugInfo.authentication.user.email})
//                 </Text>
//                 <Text style={styles.debugText}>
//                   Role: {debugInfo.authentication.user.role}
//                 </Text>
//                 <Text style={styles.debugText}>
//                   Source: {debugInfo.authentication.user.source}
//                 </Text>
//               </>
//             )}
//           </View>
          
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Service Status</Text>
//             <Text style={styles.debugText}>
//               Active Service: {debugInfo.services.activeService || 'None'}
//             </Text>
//             <Text style={styles.debugText}>
//               Initialized: {debugInfo.services.isInitialized ? 'Yes' : 'No'}
//             </Text>
//           </View>
          
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Timestamp</Text>
//             <Text style={styles.debugText}>
//               {debugInfo.timestamp}
//             </Text>
//           </View>
//         </ScrollView>
//       </View>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   overlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     zIndex: 1000,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   container: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     margin: 20,
//     maxHeight: '80%',
//     width: '90%',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1f2937',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   content: {
//     padding: 20,
//   },
//   section: {
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#374151',
//     marginBottom: 8,
//   },
//   debugText: {
//     fontSize: 12,
//     color: '#6b7280',
//     fontFamily: 'monospace',
//     marginBottom: 4,
//   },
// })

// export default AuthDebugInfo