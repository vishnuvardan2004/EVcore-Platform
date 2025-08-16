
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Camera } from 'lucide-react';

interface OfficeFormProps {
  direction: 'OUT' | 'IN';
  onSubmit: (data: any) => void;
  onBack: () => void;
  previousData?: any;
}

export const OfficeForm: React.FC<OfficeFormProps> = ({ 
  direction, 
  onSubmit, 
  onBack,
  previousData 
}) => {
  const [formData, setFormData] = useState({
    driverName: previousData?.outData?.driverName || '',
    employeeName: previousData?.outData?.employeeName || '',
    odometer: previousData?.inData ? 0 : (previousData?.outData?.odometer || 0),
    returnOdometer: previousData?.outData?.odometer || 0,
    batteryCharge: previousData?.outData?.batteryCharge || 0,
    range: previousData?.outData?.range || 0,
    supervisorName: '',
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScanSupervisor = async () => {
    try {
      // In a real implementation, this would:
      // 1. Access device camera/barcode scanner
      // 2. Scan supervisor ID card/QR code
      // 3. Validate against employee database
      // 4. Return supervisor details
      
      // For now, prompt for manual entry
      const supervisorId = prompt('Enter Supervisor ID or scan QR code:');
      if (supervisorId) {
        // In production, validate this ID against your employee database
        const supervisorName = `Supervisor: ${supervisorId}`;
        setFormData(prev => ({ ...prev, supervisorName }));
      }
    } catch (error) {
      console.error('Error scanning supervisor ID:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (direction === 'OUT') {
      onSubmit({
        outData: {
          driverName: formData.driverName,
          employeeName: formData.employeeName,
          odometer: Number(formData.odometer),
          batteryCharge: Number(formData.batteryCharge),
          range: Number(formData.range),
          supervisorName: formData.supervisorName,
        }
      });
    } else {
      onSubmit({
        inData: {
          returnOdometer: Number(formData.returnOdometer),
          inSupervisorName: formData.supervisorName,
        }
      });
    }
  };

  const isFormValid = () => {
    if (direction === 'OUT') {
      return formData.driverName && formData.employeeName && 
             formData.odometer > 0 && formData.supervisorName;
    } else {
      return formData.returnOdometer > 0 && formData.supervisorName;
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold">
            Office Purpose - {direction} Form
          </h2>
        </div>

        {direction === 'OUT' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name *</Label>
              <Input
                id="driverName"
                value={formData.driverName}
                onChange={(e) => handleInputChange('driverName', e.target.value)}
                placeholder="Enter driver name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeName">Employee Name *</Label>
              <Input
                id="employeeName"
                value={formData.employeeName}
                onChange={(e) => handleInputChange('employeeName', e.target.value)}
                placeholder="Enter employee name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer Reading (ODO) *</Label>
              <Input
                id="odometer"
                type="number"
                value={formData.odometer}
                onChange={(e) => handleInputChange('odometer', Number(e.target.value))}
                placeholder="Enter odometer reading"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batteryCharge">Battery Charge % *</Label>
              <Input
                id="batteryCharge"
                type="number"
                min="0"
                max="100"
                value={formData.batteryCharge}
                onChange={(e) => handleInputChange('batteryCharge', Number(e.target.value))}
                placeholder="Enter battery percentage"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="range">Range (in KM) *</Label>
              <Input
                id="range"
                type="number"
                value={formData.range}
                onChange={(e) => handleInputChange('range', Number(e.target.value))}
                placeholder="Enter range in kilometers"
                required
              />
            </div>
          </>
        )}

        {direction === 'IN' && (
          <>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Previous OUT Data</h3>
              <p>Driver: {previousData?.outData?.driverName}</p>
              <p>Employee: {previousData?.outData?.employeeName}</p>
              <p>OUT Odometer: {previousData?.outData?.odometer} km</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnOdometer">Return Odometer Reading *</Label>
              <Input
                id="returnOdometer"
                type="number"
                value={formData.returnOdometer}
                onChange={(e) => handleInputChange('returnOdometer', Number(e.target.value))}
                placeholder="Enter return odometer reading"
                required
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="supervisorName">
            {direction === 'OUT' ? 'Supervised By' : 'IN Supervisor Name'} *
          </Label>
          <div className="flex gap-2">
            <Input
              id="supervisorName"
              value={formData.supervisorName}
              onChange={(e) => handleInputChange('supervisorName', e.target.value)}
              placeholder="Enter supervisor name/ID"
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleScanSupervisor}
              className="px-3"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" disabled={!isFormValid()} className="flex-1">
            Submit {direction}
          </Button>
        </div>
      </form>
    </Card>
  );
};
