import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('EVCORE app is starting...');
createRoot(document.getElementById("root")!).render(<App />);
