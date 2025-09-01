import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// EVCORE Platform - Main Application Entry Point
import Dashboard from './features/dashboard/pages/Dashboard';
import Database from './features/databaseManagement/pages/Database';
import { DatabaseWrapper } from './features/databaseManagement/components/DatabaseWrapper';
import VehicleTracker from './features/vehicleDeployment/pages/VehicleTracker';
import { VehicleTrackerWrapper } from './features/vehicleDeployment/pages/VehicleTrackerWrapper';
import VehicleDamagesPage from './features/vehicleDeployment/pages/VehicleDamages';
import RideHistory from './features/vehicleDeployment/pages/RideHistory';
import LiveStatus from './features/vehicleDeployment/pages/LiveStatus';
import Alerts from './features/vehicleDeployment/pages/Alerts';
import Reports from './features/vehicleDeployment/pages/Reports';
import { ChargingTracker, ChargingHistory, ChargingSummary } from './features/vehicleChargingTracker';
import { DriverInduction } from './features/driverInduction';
import { TripDetails } from './features/driverTripDetails';
import { OfflineBookings } from './features/offlineBookings';
import { 
  DatabaseLayout,
  DatabaseManagementDashboard,
  PilotManagement, 
  EmployeeManagement,
  DataAnalytics,
  ModuleManagementPage,
  DocumentDetailView,
  DocumentForm,
  ImportExportPage
} from './features/databaseManagement';
import VehicleManagementSimple from './features/databaseManagement/pages/VehicleManagementSimple';
import ChargingEquipmentManagementSimple from './features/databaseManagement/pages/ChargingEquipmentManagementSimple';
import ElectricalEquipmentManagementSimple from './features/databaseManagement/pages/ElectricalEquipmentManagementSimple';
import ITEquipmentManagementSimple from './features/databaseManagement/pages/ITEquipmentManagementSimple';
import InfraFurnitureManagementSimple from './features/databaseManagement/pages/InfraFurnitureManagementSimple';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './features/auth/pages/Login';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NavigationSidebar } from './features/shared/components/navigation/NavigationSidebar';
import { MainLayout } from './features/shared/components/layout/MainLayout';
import SmartWidgetsDashboard from './features/dashboard/pages/SmartWidgetsDashboard';
import GlobalReports from './features/reports/pages/GlobalReports';
import LanguageSelector from './features/admin/pages/LanguageSelector';
import AuditLogs from './features/admin/pages/AuditLogs';
import MyAccount from './pages/MyAccount';

const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logging for App.tsx routing decisions
  console.log('🚦 App.tsx State:', { 
    isAuthenticated, 
    isLoading, 
    user: user ? { email: user.email, role: user.role } : null 
  });
  console.log('🔐 isAuthenticated type and value:', typeof isAuthenticated, isAuthenticated);

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('⏳ Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Validating authentication...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    console.log('🔒 User not authenticated, showing login');
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // Show main application if authenticated
  console.log('✅ User authenticated, showing main app');
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <NavigationSidebar />
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/smart-widgets" element={<SmartWidgetsDashboard />} />
            <Route path="/global-reports" element={<GlobalReports />} />
            <Route path="/language" element={<LanguageSelector />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/vehicle-tracker" element={<VehicleTrackerWrapper />} />
            <Route path="/vehicle-damages" element={<VehicleDamagesPage />} />
            <Route path="/ride-history" element={<RideHistory />} />
            <Route path="/live-status" element={<LiveStatus />} />
            <Route path="/deployment-alerts" element={<Alerts />} />
            <Route path="/deployment-reports" element={<Reports />} />
            <Route path="/charging-tracker" element={<ChargingTracker />} />
            <Route path="/charging-history" element={<ChargingHistory />} />
            <Route path="/charging-summary" element={<ChargingSummary />} />
            <Route path="/trip-details" element={<TripDetails />} />
            <Route path="/offline-bookings" element={<OfflineBookings />} />
            <Route path="/driver-induction" element={<DriverInduction />} />
            
            {/* New Database Management System Routes */}
            <Route path="/database-management" element={<DatabaseWrapper />} />
            <Route path="/database-management/:module" element={<ModuleManagementPage />} />
            <Route path="/database-management/:module/create" element={<DocumentForm />} />
            <Route path="/database-management/:module/import" element={<ImportExportPage />} />
            <Route path="/database-management/:module/:id" element={<DocumentDetailView />} />
            <Route path="/database-management/:module/:id/edit" element={<DocumentForm />} />
            
            {/* Legacy Database Management Routes with Sidebar Layout */}
            <Route path="/database/*" element={<DatabaseLayout />}>
              <Route index element={<DatabaseManagementDashboard />} />
              <Route path="vehicles" element={<VehicleManagementSimple />} />
              <Route path="charging-equipment" element={<ChargingEquipmentManagementSimple />} />
              <Route path="electrical-equipment" element={<ElectricalEquipmentManagementSimple />} />
              <Route path="it-equipment" element={<ITEquipmentManagementSimple />} />
              <Route path="infra-furniture" element={<InfraFurnitureManagementSimple />} />
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="pilots" element={<PilotManagement />} />
              <Route path="analytics" element={<DataAnalytics />} />
            </Route>
            
            {/* Catch-all route - redirect any unknown path to dashboard */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </MainLayout>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
