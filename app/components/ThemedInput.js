// import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native'
// import React, { useState } from 'react'
// import { Ionicons } from '@expo/vector-icons'
// import { theme } from '../constants/POSColors'

// export const ThemedInput = ({
//   label,
//   placeholder,
//   value,
//   onChangeText,
//   error,
//   icon,
//   secureTextEntry,
//   keyboardType = 'default',
//   autoCapitalize = 'sentences',
//   style,
//   inputStyle,
//   ...props
// }) => {
//   const [showPassword, setShowPassword] = useState(false)
//   const [isFocused, setIsFocused] = useState(false)

//   return (
//     <View style={[styles.inputGroup, style]}>
//       {label && <Text style={styles.label}>{label}</Text>}
//       <View style={[
//         styles.inputContainer, 
//         isFocused && styles.inputContainerFocused,
//         error && styles.inputContainerError
//       ]}>
//         {icon && (
//           <Ionicons 
//             name={icon} 
//             size={20} 
//             color={error ? theme.error : isFocused ? theme.primary : theme.gray} 
//             style={styles.inputIcon} 
//           />
//         )}
//         <TextInput
//           style={[styles.input, inputStyle]}
//           placeholder={placeholder}
//           placeholderTextColor={theme.gray}
//           value={value}
//           onChangeText={onChangeText}
//           secureTextEntry={secureTextEntry && !showPassword}
//           keyboardType={keyboardType}
//           autoCapitalize={autoCapitalize}
//           onFocus={() => setIsFocused(true)}
//           onBlur={() => setIsFocused(false)}
//           {...props}
//         />
//         {secureTextEntry && (
//           <TouchableOpacity 
//             onPress={() => setShowPassword(!showPassword)}
//             style={styles.eyeIcon}
//           >
//             <Ionicons 
//               name={showPassword ? "eye-outline" : "eye-off-outline"} 
//               size={20} 
//               color={theme.gray} 
//             />
//           </TouchableOpacity>
//         )}
//       </View>
//       {error && <Text style={styles.errorText}>{error}</Text>}
//     </View>
//   )
// }