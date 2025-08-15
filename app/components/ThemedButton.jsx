import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import POSColors from '../constants/POSColors'

export const ThemedButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props 
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`${variant}Button`], styles[`${size}Button`]]
    if (disabled) baseStyle.push(styles.disabledButton)
    return baseStyle
  }

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`${variant}Text`], styles[`${size}Text`]]
    if (disabled) baseStyle.push(styles.disabledText)
    return baseStyle
  }

  const iconColor = variant === 'outline' ? theme.primary : theme.white

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={size === 'small' ? 16 : 20} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={size === 'small' ? 16 : 20} color={iconColor} style={styles.iconRight} />
          )}
        </>
      )}
    </TouchableOpacity>
  )
}