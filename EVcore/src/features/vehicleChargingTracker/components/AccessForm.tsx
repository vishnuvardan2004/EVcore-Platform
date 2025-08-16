
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface AccessData {
  vehicleNumber: string;
  pilotId: string;
}

interface AccessFormProps {
  accessData: AccessData;
  onAccessDataChange: (data: AccessData) => void;
  onSubmit: () => void;
  onStartFlow: () => void;
  onEndFlow: () => void;
}

export const AccessForm: React.FC<AccessFormProps> = ({
  accessData,
  onAccessDataChange,
  onSubmit,
  onStartFlow,
  onEndFlow
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">Vehicle Number</Label>
            <Input
              id="vehicleNumber"
              placeholder="Enter vehicle number"
              value={accessData.vehicleNumber}
              onChange={(e) => onAccessDataChange({ ...accessData, vehicleNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pilotId">Pilot ID</Label>
            <Input
              id="pilotId"
              placeholder="Enter pilot ID"
              value={accessData.pilotId}
              onChange={(e) => onAccessDataChange({ ...accessData, pilotId: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={onSubmit} className="flex-1">Verify Access</Button>
          <Button onClick={onStartFlow} variant="outline" className="flex-1">Start Charging</Button>
          <Button onClick={onEndFlow} variant="outline" className="flex-1">End Charging</Button>
        </div>
      </CardContent>
    </Card>
  );
};
