
import React, { useEffect } from 'react';
import { PageLayout } from '../features/shared/components/layout/PageLayout';
import { VehicleDeploymentForm } from '../features/vehicleDeployment/components/VehicleDeploymentForm';
import { DashboardLayout } from '../features/shared/components/layout/DashboardLayout';
import { AppFooter } from '../features/shared/components/layout/AppFooter';

const Index = () => {
  useEffect(() => {
    // Initialize database
    console.log('Vehicle Deployment Tracker initialized');
  }, []);

  return (
    <PageLayout 
      title="🚗 Vehicle Deployment Tracker" 
      subtitle="Track vehicle IN/OUT movements with comprehensive logging"
    >
      <div className="space-y-6">
        <VehicleDeploymentForm />
        <DashboardLayout />
        <AppFooter />
      </div>
    </PageLayout>
  );
};

export default Index;
