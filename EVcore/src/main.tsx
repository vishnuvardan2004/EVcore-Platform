import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('EVCORE app is starting...');

// Clean up any invalid tokens on app startup
const cleanupInvalidTokens = () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      // Check if it's a valid JWT format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('🧹 Removing invalid token format on startup');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        return;
      }
      
      // Check if the token is expired
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && now >= payload.exp) {
        console.log('🧹 Removing expired token on startup');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.log('🧹 Removing malformed token on startup');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  }
};

// Clean up tokens before starting the app
cleanupInvalidTokens();

// Suppress browser extension communication errors
const originalError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || '';
  
  // Filter out known browser extension errors
  if (
    message.includes('message channel closed') ||
    message.includes('asynchronous response') ||
    message.includes('Extension context invalidated') ||
    message.includes('chrome-extension://')
  ) {
    // Silently ignore these errors as they're from browser extensions
    return;
  }
  
  // Log all other errors normally
  originalError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
