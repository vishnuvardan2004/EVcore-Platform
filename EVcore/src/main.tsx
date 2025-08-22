import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('EVCORE app is starting...');

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
