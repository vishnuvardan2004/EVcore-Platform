
import React from 'react';
import { Card } from '@/components/ui/card';
import { Deployment } from '../../../types/vehicle';
import { VehiclePhotosGrid } from './VehiclePhotosGrid';

interface OutDataCardProps {
  deployment: Deployment;
}

export const OutDataCard: React.FC<OutDataCardProps> = ({ deployment }) => {
  if (!deployment.outData) {
    return null;
  }

  const { outData } = deployment;

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-4">OUT Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          {deployment.purpose === 'Pilot' && outData.driverName && (
            <div><span className="font-medium">Driver Name:</span> {outData.driverName}</div>
          )}
          {deployment.purpose === 'Office' && outData.employeeName && (
            <div><span className="font-medium">Employee Name:</span> {outData.employeeName}</div>
          )}
          {outData.pilotId && (
            <div><span className="font-medium">Pilot ID:</span> {outData.pilotId}</div>
          )}
          {outData.location && (
            <div><span className="font-medium">Location:</span> {outData.location}</div>
          )}
        </div>
        <div className="space-y-2">
          <div><span className="font-medium">Odometer:</span> {outData.odometer} km</div>
          <div><span className="font-medium">Battery Charge:</span> {outData.batteryCharge}%</div>
          <div><span className="font-medium">Range:</span> {outData.range} km</div>
          {outData.notes && (
            <div><span className="font-medium">Notes:</span> {outData.notes}</div>
          )}
        </div>
      </div>
      
      <VehiclePhotosGrid 
        photos={outData.vehiclePhotos || []} 
        title="OUT Vehicle Photos" 
      />
    </Card>
  );
};
