// utils/validation.js - Enhanced validation with better registration support
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  // Check for common email issues
  const trimmedEmail = email.trim();
  if (trimmedEmail.includes('..') || trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true, error: null };
};

export const validatePassword = (password, minLength = 6) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters long` };
  }
  
  // Additional password strength checks
  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long (max 128 characters)' };
  }
  
  return { isValid: true, error: null };
};

export const validateName = (name, fieldName = 'Name') => {
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: `${fieldName} is too long (max 50 characters)` };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes, dots)
  const nameRegex = /^[a-zA-Z\s\-'.]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: `${fieldName} contains invalid characters` };
  }
  
  // Check for excessive spaces
  if (trimmedName.includes('  ')) {
    return { isValid: false, error: `${fieldName} contains excessive spaces` };
  }
  
  return { isValid: true, error: null };
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    // Phone is optional, so empty is valid
    return { isValid: true, error: null };
  }
  
  const trimmedPhone = phone.trim();
  
  // Remove all non-digit characters for validation (except +)
  const cleanPhone = trimmedPhone.replace(/[^\d+]/g, '');
  
  // Check if it starts with + (international format)
  const hasCountryCode = cleanPhone.startsWith('+');
  const phoneNumbers = hasCountryCode ? cleanPhone.substring(1) : cleanPhone;
  
  // Check if it's a valid length (10-15 digits is common for international numbers)
  if (phoneNumbers.length < 10 || phoneNumbers.length > 15) {
    return { isValid: false, error: 'Phone number must be 10-15 digits long' };
  }
  
  // Check if all characters after + are digits
  if (!/^\d+$/.test(phoneNumbers)) {
    return { isValid: false, error: 'Phone number contains invalid characters' };
  }
  
  return { isValid: true, error: null };
};

export const validateRole = (role) => {
  const validRoles = ['super_admin', 'manager', 'cashier'];
  
  if (!role) {
    return { isValid: true, error: null }; // Role is optional, defaults to cashier
  }
  
  if (!validRoles.includes(role)) {
    return { 
      isValid: false, 
      error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
    };
  }
  
  return { isValid: true, error: null };
};

export const validateLogin = (email, password) => {
  const errors = {};
  let isValid = true;
  
  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
    isValid = false;
  }
  
  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
    isValid = false;
  }
  
  return { isValid, errors };
};

export const validateRegistration = (userData) => {
  const errors = {};
  let isValid = true;
  
  // Validate first name
  if (userData.firstName !== undefined) {
    const firstNameValidation = validateName(userData.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.error;
      isValid = false;
    }
  }
  
  // Validate last name
  if (userData.lastName !== undefined) {
    const lastNameValidation = validateName(userData.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.error;
      isValid = false;
    }
  }
  
  // Validate combined name (for server compatibility)
  if (userData.name !== undefined) {
    const nameValidation = validateName(userData.name, 'Name');
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error;
      isValid = false;
    }
  }
  
  // If we have firstName and lastName but no name, validate the combination
  if (userData.firstName && userData.lastName && !userData.name) {
    const fullName = `${userData.firstName.trim()} ${userData.lastName.trim()}`;
    const nameValidation = validateName(fullName, 'Full name');
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error;
      isValid = false;
    }
  }
  
  // Validate email
  const emailValidation = validateEmail(userData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
    isValid = false;
  }
  
  // Validate phone (optional)
  if (userData.phone !== undefined) {
    const phoneValidation = validatePhone(userData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
      isValid = false;
    }
  }
  
  // Validate password
  const passwordValidation = validatePassword(userData.password, 6);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
    isValid = false;
  }
  
  // Validate confirm password
  if (userData.confirmPassword !== undefined) {
    if (!userData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
  }
  
  // Validate role (optional)
  if (userData.role !== undefined) {
    const roleValidation = validateRole(userData.role);
    if (!roleValidation.isValid) {
      errors.role = roleValidation.error;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

export const validateChangePassword = (currentPassword, newPassword, confirmPassword) => {
  const errors = {};
  let isValid = true;
  
  // Validate current password
  if (!currentPassword) {
    errors.currentPassword = 'Current password is required';
    isValid = false;
  }
  
  // Validate new password
  const passwordValidation = validatePassword(newPassword, 6);
  if (!passwordValidation.isValid) {
    errors.newPassword = passwordValidation.error;
    isValid = false;
  }
  
  // Validate confirm password
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password';
    isValid = false;
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
    isValid = false;
  }
  
  // Check if new password is different from current
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = 'New password must be different from current password';
    isValid = false;
  }
  
  return { isValid, errors };
};

export const validateProfileUpdate = (profileData) => {
  const errors = {};
  let isValid = true;
  
  // Validate name
  if (profileData.name !== undefined) {
    const nameValidation = validateName(profileData.name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error;
      isValid = false;
    }
  }
  
  // Email validation (if being updated)
  if (profileData.email !== undefined) {
    const emailValidation = validateEmail(profileData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
      isValid = false;
    }
  }
  
  // Phone validation (if being updated)
  if (profileData.phone !== undefined) {
    const phoneValidation = validatePhone(profileData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
      isValid = false;
    }
  }
  
  // Role validation (if being updated)
  if (profileData.role !== undefined) {
    const roleValidation = validateRole(profileData.role);
    if (!roleValidation.isValid) {
      errors.role = roleValidation.error;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

// Utility functions
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim();
};

export const sanitizeEmail = (email) => {
  if (!email) return email;
  return email.toLowerCase().trim();
};

export const sanitizeName = (name) => {
  if (!name) return name;
  // Trim and capitalize first letter of each word
  return name.trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const sanitizePhone = (phone) => {
  if (!phone) return phone;
  // Keep digits and + sign, remove everything else
  return phone.replace(/[^\d+]/g, '');
};

export const formatValidationErrors = (errors) => {
  return Object.values(errors).filter(Boolean).join(', ');
};

export const hasValidationErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

// Helper function to prepare registration data with proper sanitization
export const prepareRegistrationData = (formData) => {
  return {
    name: sanitizeName(`${formData.firstName} ${formData.lastName}`),
    email: sanitizeEmail(formData.email),
    phone: formData.phone ? sanitizePhone(formData.phone) : null,
    password: formData.password,
    role: formData.role || 'cashier'
  };
};

// Helper to validate all required fields are present
export const validateRequiredFields = (data, requiredFields) => {
  const errors = {};
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      isValid = false;
    }
  });
  
  return { isValid, errors };
};

// Helper to clean and validate registration form data
export const processRegistrationData = (formData) => {
  // First sanitize the data
  const sanitizedData = {
    firstName: sanitizeName(formData.firstName),
    lastName: sanitizeName(formData.lastName),
    email: sanitizeEmail(formData.email),
    phone: formData.phone ? sanitizePhone(formData.phone) : '',
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    role: formData.role || 'cashier'
  };
  
  // Then validate
  const validation = validateRegistration(sanitizedData);
  
  // If valid, prepare for API submission
  if (validation.isValid) {
    const apiData = prepareRegistrationData(sanitizedData);
    return {
      isValid: true,
      data: apiData,
      errors: {}
    };
  }
  
  return {
    isValid: false,
    data: null,
    errors: validation.errors
  };
};