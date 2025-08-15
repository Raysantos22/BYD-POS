import { View } from 'react-native'
import React from 'react'
import { POSColors } from '../constants/POSColors'

// Use POSColors instead of undefined theme
const theme = POSColors

export function ThemedView({ style, children, ...props }) {
  return (
    <View style={[{ backgroundColor: theme.background || '#f5f5f5' }, style]} {...props}>
      {children}
    </View>
  )
}
