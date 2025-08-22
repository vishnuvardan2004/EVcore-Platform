// Database Management Feature - Main Export File

// Layout Components (reusable components)
export { DatabaseLayout } from './components/DatabaseLayout';

// Page Components (full page views)
export { EmployeeManagement } from './pages/EmployeeManagement';
export { PilotManagement } from './pages/PilotManagement';
export { DataAnalytics } from './pages/DataAnalytics';

// Comprehensive Database Management Pages
export { default as DatabaseManagementDashboard } from './pages/DatabaseManagementDashboard';
export { default as ModuleManagementPage } from './pages/ModuleManagementPage';
export { default as DocumentDetailView } from './pages/DocumentDetailView';
export { default as DocumentForm } from './pages/DocumentForm';
export { default as ImportExportPage } from './pages/ImportExportPage';

// Services
export { databaseService as databaseManagementService } from './services/databaseService';

// Types
export type * from './types';
