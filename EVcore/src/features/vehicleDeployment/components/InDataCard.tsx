
import React from 'react';
import { Card } from '@/components/ui/card';
import { Deployment } from '../../../types/vehicle';
import { VehiclePhotosGrid } from './VehiclePhotosGrid';

interface InDataCardProps {
  deployment: Deployment;
}

export const InDataCard: React.FC<InDataCardProps> = ({ deployment }) => {
  if (!deployment.inData) {
    return null;
  }

  const { inData } = deployment;

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-4">IN Information</h3>
      <div className="space-y-2">
        <div><span className="font-medium">Return Odometer:</span> {inData.returnOdometer} km</div>
      </div>
      
      <VehiclePhotosGrid 
        photos={inData.vehiclePhotos || []} 
        title="IN Vehicle Photos" 
      />
    </Card>
  );
};
