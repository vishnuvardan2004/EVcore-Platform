
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Deployment } from '../../../types/vehicle';
import { calculateDuration } from '../../../utils/reportGenerator';

interface TripOverviewCardProps {
  deployment: Deployment;
}

export const TripOverviewCard: React.FC<TripOverviewCardProps> = ({ deployment }) => {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-4">Trip Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="space-y-2">
            <div><span className="font-medium">Vehicle Number:</span> {deployment.vehicleNumber}</div>
            <div><span className="font-medium">Purpose:</span> 
              <Badge className="ml-2" variant={deployment.purpose === 'Pilot' ? 'default' : 'secondary'}>
                {deployment.purpose}
              </Badge>
            </div>
            <div><span className="font-medium">OUT Date & Time:</span> {deployment.outTimestamp ? new Date(deployment.outTimestamp).toLocaleString() : 'N/A'}</div>
            <div><span className="font-medium">IN Date & Time:</span> {deployment.inTimestamp ? new Date(deployment.inTimestamp).toLocaleString() : 'N/A'}</div>
          </div>
        </div>
        <div>
          <div className="space-y-2">
            <div><span className="font-medium">Total Duration:</span> {deployment.outTimestamp && deployment.inTimestamp ? calculateDuration(deployment.outTimestamp, deployment.inTimestamp) : 'N/A'}</div>
            <div><span className="font-medium">Total KMs:</span> {deployment.totalKms || 'N/A'} km</div>
            <div><span className="font-medium">OUT Supervisor:</span> {deployment.outData?.supervisorName || 'N/A'}</div>
            <div><span className="font-medium">IN Supervisor:</span> {deployment.inData?.inSupervisorName || 'N/A'}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
