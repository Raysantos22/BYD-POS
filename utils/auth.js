
// utils/auth.js - Export auth service for backward compatibility
export { authService } from '../services/authService';
export { authInitializer } from '../services/authInitializer';
export { useAuth } from './authContext';

// Re-export everything from authService for backward compatibility
import authService from '../services/authService';
export default authService;