import React, { useState, Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Keyboard, AlertCircle, CheckCircle2, Car, Sparkles } from 'lucide-react';

// Lazy load the autocomplete component to avoid affecting classic mode performance
const VehicleScannerWithAutocomplete = lazy(() => import('./VehicleScannerWithAutocomplete'));

interface VehicleScannerProps {
  onVehicleDetected: (vehicleNumber: string) => void;
  isProcessing?: boolean;
  enableAutocomplete?: boolean; // New prop for enabling autocomplete
}

export const VehicleScanner: React.FC<VehicleScannerProps> = ({
  onVehicleDetected,
  isProcessing = false,
  enableAutocomplete = true // Enable by default for better UX
}) => {
  const [manualEntry, setManualEntry] = useState('');
  const [error, setError] = useState<string>('');
  const [useAutocomplete, setUseAutocomplete] = useState(enableAutocomplete);

  // If autocomplete is enabled and user wants to use it
  if (enableAutocomplete && useAutocomplete) {
    return (
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Smart Vehicle Scanner
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseAutocomplete(false)}
            className="gap-2"
          >
            <Keyboard className="w-4 h-4" />
            Classic Mode
          </Button>
        </div>
        
        <React.Suspense 
          fallback={
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Car className="h-5 w-5" />
                  Loading Smart Scanner...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </CardContent>
            </Card>
          }
        >
          <VehicleScannerWithAutocomplete
            onVehicleDetected={onVehicleDetected}
            isProcessing={isProcessing}
          />
        </React.Suspense>
      </div>
    );
  }

  const handleManualSubmit = () => {
    if (manualEntry.trim()) {
      onVehicleDetected(manualEntry.trim().toUpperCase());
      setManualEntry('');
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Car className="w-4 h-4 text-blue-600" />
                </div>
                Enter Registration Number
                {/* Classic Mode Badge */}
                <Badge variant="outline" className="text-xs bg-gray-100 border-gray-300">
                  Classic Mode
                </Badge>
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                Enter the vehicle registration number manually to proceed with deployment
              </p>
            </div>
            
            {/* Smart Mode Toggle */}
            {enableAutocomplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseAutocomplete(true)}
                className="gap-2 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                Smart Mode
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual Entry Mode */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Enter Registration Number
              </label>
              <Input
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                placeholder={import.meta.env.MODE === 'development' ? 'e.g., MH12AB1234 (dev sample)' : 'Enter registration number'}
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
