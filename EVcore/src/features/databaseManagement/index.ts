// Database Management Feature - Main Export File

// Legacy Components (maintained for compatibility)
export { DatabaseLayout } from './components/DatabaseLayout';
export { DatabaseDashboard } from './components/DatabaseDashboard';
export { EmployeeManagement } from './components/EmployeeManagement';
export { PilotManagement } from './components/PilotManagement';
export { CustomerManagement } from './components/CustomerManagement';
export { DataAnalytics } from './components/DataAnalytics';

// New Comprehensive Database Management Components
export { default as DatabaseManagementDashboard } from './components/DatabaseManagementDashboard';
export { default as ModuleManagementPage } from './components/ModuleManagementPage';
export { default as DocumentDetailView } from './components/DocumentDetailView';
export { default as DocumentForm } from './components/DocumentForm';
export { default as ImportExportPage } from './components/ImportExportPage';

// Services
export { databaseService } from './services/databaseSimple';
export { databaseService as databaseManagementService } from './services/databaseService';

// Types
export type * from './types';
