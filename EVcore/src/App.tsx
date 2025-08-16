import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// EVCORE Platform - Main Application Entry Point
import Dashboard from './pages/Dashboard';
import Database from './pages/Database';
import VehicleTracker from './features/vehicleDeployment/pages/VehicleTracker';
import VehicleDamagesPage from './pages/VehicleDamages';
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
  DatabaseDashboard,
  PilotManagement, 
  CustomerManagement, 
  EmployeeManagement,
  DataAnalytics,
  ModuleManagementPage,
  DocumentDetailView,
  DocumentForm,
  ImportExportPage
} from './features/databaseManagement';
import VehicleManagementSimple from './features/databaseManagement/components/VehicleManagementSimple';
import ChargingEquipmentManagementSimple from './features/databaseManagement/components/ChargingEquipmentManagementSimple';
import ElectricalEquipmentManagementSimple from './features/databaseManagement/components/ElectricalEquipmentManagementSimple';
import ITEquipmentManagementSimple from './features/databaseManagement/components/ITEquipmentManagementSimple';
import InfraFurnitureManagementSimple from './features/databaseManagement/components/InfraFurnitureManagementSimple';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NavigationSidebar } from './components/NavigationSidebar';
import { MainLayout } from './components/MainLayout';
import SmartWidgetsDashboard from './pages/SmartWidgetsDashboard';
import GlobalReports from './pages/GlobalReports';
import AdminModuleToggle from './pages/AdminModuleToggle';
import LanguageSelector from './pages/LanguageSelector';
import AuditLogs from './pages/AuditLogs';

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show main application if authenticated
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <NavigationSidebar />
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/smart-widgets" element={<SmartWidgetsDashboard />} />
            <Route path="/global-reports" element={<GlobalReports />} />
            <Route path="/admin-toggle" element={<AdminModuleToggle />} />
            <Route path="/language" element={<LanguageSelector />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/vehicle-tracker" element={<VehicleTracker />} />
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
            <Route path="/database-management" element={<Database />} />
            <Route path="/database-management/:module" element={<ModuleManagementPage />} />
            <Route path="/database-management/:module/create" element={<DocumentForm />} />
            <Route path="/database-management/:module/import" element={<ImportExportPage />} />
            <Route path="/database-management/:module/:id" element={<DocumentDetailView />} />
            <Route path="/database-management/:module/:id/edit" element={<DocumentForm />} />
            
            {/* Legacy Database Management Routes with Sidebar Layout */}
            <Route path="/database/*" element={<DatabaseLayout />}>
              <Route index element={<DatabaseDashboard />} />
              <Route path="vehicles" element={<VehicleManagementSimple />} />
              <Route path="charging-equipment" element={<ChargingEquipmentManagementSimple />} />
              <Route path="electrical-equipment" element={<ElectricalEquipmentManagementSimple />} />
              <Route path="it-equipment" element={<ITEquipmentManagementSimple />} />
              <Route path="infra-furniture" element={<InfraFurnitureManagementSimple />} />
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="pilots" element={<PilotManagement />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="analytics" element={<DataAnalytics />} />
            </Route>
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
