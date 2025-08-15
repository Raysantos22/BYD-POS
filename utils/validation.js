// utils/validation.js

/**
 * Simple validation functions for POS system
 */

export const validateLogin = (email, password) => {
  const errors = {}

  // Email validation
  if (!email || email.trim() === '') {
    errors.email = 'Email is required'
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }

  // Password validation
  if (!password || password.trim() === '') {
    errors.password = 'Password is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateRegistration = (data) => {
  const errors = {}

  // First name validation
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters'
  }

  // Last name validation
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters'
  }

  // Email validation
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required'
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  // Password validation
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }

  // Confirm password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export default {
  validateLogin,
  validateRegistration,
  isValidEmail,
  isValidPhone
}