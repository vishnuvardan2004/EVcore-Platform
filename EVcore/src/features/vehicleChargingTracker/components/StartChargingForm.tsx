
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StartChargingData {
  odoReading: string;
  chargePercent: string;
  range: string;
  location: 'HUB' | 'Outside';
  brand: string;
  locationName: string;
}

interface StartChargingFormProps {
  vehicleNumber: string;
  pilotId: string;
  startData: StartChargingData;
  onStartDataChange: (data: StartChargingData) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const StartChargingForm: React.FC<StartChargingFormProps> = ({
  vehicleNumber,
  pilotId,
  startData,
  onStartDataChange,
  onSubmit,
  onBack
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start Charging Session</CardTitle>
        <p className="text-sm text-gray-600">Vehicle: {vehicleNumber} | Pilot: {pilotId}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="odoReading">Odometer Reading</Label>
            <Input
              id="odoReading"
              placeholder="Enter reading"
              value={startData.odoReading}
              onChange={(e) => onStartDataChange({ ...startData, odoReading: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chargePercent">Charge %</Label>
            <Input
              id="chargePercent"
              placeholder="Enter percentage"
              value={startData.chargePercent}
              onChange={(e) => onStartDataChange({ ...startData, chargePercent: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="range">Range (km)</Label>
            <Input
              id="range"
              placeholder="Enter range"
              value={startData.range}
              onChange={(e) => onStartDataChange({ ...startData, range: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Location</Label>
          <Select value={startData.location} onValueChange={(value: 'HUB' | 'Outside') => onStartDataChange({ ...startData, location: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HUB">HUB</SelectItem>
              <SelectItem value="Outside">Outside</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {startData.location === 'Outside' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="Enter brand"
                value={startData.brand}
                onChange={(e) => onStartDataChange({ ...startData, brand: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                placeholder="Enter location"
                value={startData.locationName}
                onChange={(e) => onStartDataChange({ ...startData, locationName: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={onBack} variant="outline" className="flex-1">Back</Button>
          <Button onClick={onSubmit} className="flex-1">Start Charging</Button>
        </div>
      </CardContent>
    </Card>
  );
};
