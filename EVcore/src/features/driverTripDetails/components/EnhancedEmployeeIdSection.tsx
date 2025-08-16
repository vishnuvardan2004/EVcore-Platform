import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { User, CheckCircle, AlertCircle, Scan } from 'lucide-react';
import { useTripDetails } from '../contexts/EnhancedTripDetailsContext';

export const EnhancedEmployeeIdSection: React.FC = () => {
  const { setEmployeeId, state, clearEmployeeSession } = useTripDetails();
  const [employeeId, setLocalEmployeeId] = useState(state.employeeId || '');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    driverName?: string;
    vehicleAssigned?: string;
    shiftHistory?: number;
  } | null>(null);

  const validateEmployeeId = async (id: string) => {
    setIsValidating(true);
    setError('');
    
    // Simulate API validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation logic
    if (id.length < 4) {
      setError('Employee ID must be at least 4 characters');
      setValidationResult(null);
      setIsValidating(false);
      return false;
    }
    
    if (!/^[A-Za-z0-9]+$/.test(id)) {
      setError('Employee ID can only contain letters and numbers');
      setValidationResult(null);
      setIsValidating(false);
      return false;
    }

    // Mock successful validation
    setValidationResult({
      isValid: true,
      driverName: `Driver ${id.substring(0, 3).toUpperCase()}`,
      vehicleAssigned: `KA${Math.floor(Math.random() * 100).toString().padStart(2, '0')}AB${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      shiftHistory: Math.floor(Math.random() * 100) + 50,
    });
    
    setIsValidating(false);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId.trim()) {
      setError('Employee ID is required');
      return;
    }
    
    const isValid = await validateEmployeeId(employeeId.trim());
    if (isValid) {
      setEmployeeId(employeeId.trim());
    }
  };

  const handleScanBarcode = () => {
    // Mock barcode scanning
    const mockBarcode = `DRV${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    setLocalEmployeeId(mockBarcode);
    validateEmployeeId(mockBarcode);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-2 border-blue-100">
        <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Driver Authentication
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Enter your employee ID to start your shift tracking session
          </p>
          
          {/* Session restoration indicator */}
          {state.employeeId && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-center text-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  Welcome back! Restoring your session...
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Employee ID: {state.employeeId}
              </p>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="employeeId" className="text-lg font-medium">
                Employee ID <span className="text-red-500">*</span>
              </Label>
              
              <div className="relative">
                <Input
                  id="employeeId"
                  placeholder="Enter your employee ID (e.g., DRV001)"
                  value={employeeId}
                  onChange={(e) => setLocalEmployeeId(e.target.value.toUpperCase())}
                  className={`text-lg h-14 pr-12 ${
                    error ? 'border-red-500 focus:ring-red-500' : 
                    validationResult?.isValid ? 'border-green-500 focus:ring-green-500' : ''
                  }`}
                  disabled={isValidating}
                />
                
                {validationResult?.isValid && (
                  <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-green-500" />
                )}
                
                {error && (
                  <AlertCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-red-500" />
                )}
              </div>
              
              {error && <p className="text-red-500 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>}
            </div>

            {/* Validation Result */}
            {validationResult?.isValid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Driver Verified</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{validationResult.driverName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="ml-2 font-medium">{validationResult.vehicleAssigned}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Shift History:</span>
                    <Badge variant="secondary" className="ml-2">
                      {validationResult.shiftHistory} completed shifts
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1 h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isValidating || !employeeId.trim()}
              >
                {isValidating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  'Continue to Shift Setup'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="h-14 px-6"
                onClick={handleScanBarcode}
                disabled={isValidating}
              >
                <Scan className="w-5 h-5" />
              </Button>
            </div>
          </form>
          
          {/* Clear session option for testing */}
          {state.employeeId && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Need to use a different employee ID?
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearEmployeeSession();
                    setLocalEmployeeId('');
                    setValidationResult(null);
                    setError('');
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear Session & Start Fresh
                </Button>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>🔒 Your data is encrypted and stored securely</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
