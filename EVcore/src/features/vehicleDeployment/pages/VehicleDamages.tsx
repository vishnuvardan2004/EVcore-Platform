import React from 'react';
import { VehicleTrackerLayout } from '../components/VehicleTrackerLayout';
import VehicleDamages from '../components/VehicleDamages';

const VehicleDamagesPage = () => {
  return (
    <VehicleTrackerLayout 
      title="🔧 Vehicle Damages" 
      subtitle="Report, track, and manage vehicle damage incidents and maintenance issues"
    >
      <VehicleDamages />
    </VehicleTrackerLayout>
  );
};

export default VehicleDamagesPage;
