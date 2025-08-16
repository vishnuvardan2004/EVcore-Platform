import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Keyboard, AlertCircle, CheckCircle2, Car } from 'lucide-react';

interface VehicleScannerProps {
  onVehicleDetected: (vehicleId: string) => void;
  isProcessing?: boolean;
}

export const VehicleScanner: React.FC<VehicleScannerProps> = ({
  onVehicleDetected,
  isProcessing = false
}) => {
  const [manualEntry, setManualEntry] = useState('');
  const [error, setError] = useState<string>('');

  const handleManualSubmit = () => {
    if (manualEntry.trim()) {
      onVehicleDetected(manualEntry.trim().toUpperCase());
      setManualEntry('');
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Car className="w-4 h-4 text-blue-600" />
            </div>
            Enter Vehicle Number
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Enter the vehicle ID manually to proceed with deployment
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual Entry Mode */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Enter Vehicle ID
              </label>
              <Input
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                placeholder={import.meta.env.MODE === 'development' ? 'e.g., VH-1234 (dev sample)' : 'Enter vehicle number'}
                className="text-center text-lg font-mono tracking-wider"
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
            </div>
            
            <Button 
              onClick={handleManualSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3" 
              disabled={!manualEntry.trim() || isProcessing}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Continue
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
  );
};

export default VehicleScanner;
