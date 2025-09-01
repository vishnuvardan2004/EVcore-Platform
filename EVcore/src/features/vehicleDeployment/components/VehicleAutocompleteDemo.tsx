import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Info, Zap } from 'lucide-react';
import { VehicleScanner } from '../components/VehicleScannerWithAutocomplete';

export const VehicleAutocompleteDemo: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVehicleDetected = (vehicleNumber: string) => {
    setSelectedVehicle(vehicleNumber);
    setHistory(prev => [vehicleNumber, ...prev.slice(0, 4)]); // Keep last 5
    
    // Simulate processing
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Zap className="h-6 w-6" />
            Vehicle Registration Autocomplete Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700">
            Experience the new autocomplete feature for vehicle registration selection. 
            Search by registration number, brand, or model name.
          </p>
        </CardContent>
      </Card>

      {/* Main Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Autocomplete Component */}
        <div>
          <VehicleScanner
            onVehicleDetected={handleVehicleDetected}
            isProcessing={isProcessing}
          />
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {/* Current Selection */}
          {selectedVehicle && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800 text-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  Selected Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white text-green-700 border-green-300">
                    {selectedVehicle}
                  </Badge>
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      Processing...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selection History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Recent Selections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((vehicle, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <span className="font-medium">{vehicle}</span>
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Info */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-amber-800">
                ✨ New Features
              </CardTitle>
            </CardHeader>
            <CardContent className="text-amber-700 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Smart Search:</strong> Type registration numbers, vehicle brands, or models</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Real-time Results:</strong> Instant suggestions from Database Management</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Security First:</strong> Only verified vehicles can be deployed</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Performance Optimized:</strong> Debounced search with smart caching</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Instructions */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-blue-700">
          <strong>How to use:</strong> Click the search box above, then start typing a registration number (like "234" or "KA01"), 
          vehicle brand (like "Tata" or "Mahindra"), or model name. Select from the dropdown or enter manually.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VehicleAutocompleteDemo;
