import { Text, StyleSheet } from 'react-native'
import React from 'react'
import { POSColors } from '../constants/POSColors'

export function ThemedText({ style, children, type = 'default', ...props }) {
  return (
    <Text style={[styles[type], style]} {...props}>
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    color: POSColors.text,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: POSColors.text,
  },
})