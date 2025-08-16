
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EndChargingData {
  chargePercent: string;
  range: string;
  cost: string;
  paymentMode: 'UPI' | 'Cash';
  units: string;
}

interface EndChargingFormProps {
  vehicleNumber: string;
  pilotId: string;
  endData: EndChargingData;
  onEndDataChange: (data: EndChargingData) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const EndChargingForm: React.FC<EndChargingFormProps> = ({
  vehicleNumber,
  pilotId,
  endData,
  onEndDataChange,
  onSubmit,
  onBack
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>End Charging Session</CardTitle>
        <p className="text-sm text-gray-600">Vehicle: {vehicleNumber} | Pilot: {pilotId}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chargePercent">Final Charge %</Label>
            <Input
              id="chargePercent"
              placeholder="Enter percentage"
              value={endData.chargePercent}
              onChange={(e) => onEndDataChange({ ...endData, chargePercent: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="range">Final Range (km)</Label>
            <Input
              id="range"
              placeholder="Enter range"
              value={endData.range}
              onChange={(e) => onEndDataChange({ ...endData, range: e.target.value })}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cost">Cost (₹)</Label>
            <Input
              id="cost"
              placeholder="Enter cost"
              value={endData.cost}
              onChange={(e) => onEndDataChange({ ...endData, cost: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="units">Units (kWh)</Label>
            <Input
              id="units"
              placeholder="Enter units"
              value={endData.units}
              onChange={(e) => onEndDataChange({ ...endData, units: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Payment Mode</Label>
          <Select value={endData.paymentMode} onValueChange={(value: 'UPI' | 'Cash') => onEndDataChange({ ...endData, paymentMode: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4">
          <Button onClick={onBack} variant="outline" className="flex-1">Back</Button>
          <Button onClick={onSubmit} className="flex-1">End Charging</Button>
        </div>
      </CardContent>
    </Card>
  );
};
