
import React from 'react';
import { RecentVehicleActivities } from '../features/vehicleDeployment/components/RecentVehicleActivities';
import { LiveDeploymentStatus } from '../features/vehicleDeployment/components/LiveDeploymentStatus';
import { AlertsWarnings } from '../features/vehicleDeployment/components/AlertsWarnings';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Two-column grid for Recent Activities and Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentVehicleActivities />
        <LiveDeploymentStatus />
      </div>
      
      {/* Full-width Alerts & Warnings */}
      <AlertsWarnings />
    </div>
  );
};
