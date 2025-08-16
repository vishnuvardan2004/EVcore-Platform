
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, ArrowLeft, AlertTriangle, Car, Compass } from 'lucide-react';

interface DirectionSelectorProps {
  vehicleNumber: string;
  canGoOut: boolean;
  canComeIn: boolean;
  onDirectionSelected: (direction: 'OUT' | 'IN') => void;
}

export const DirectionSelector: React.FC<DirectionSelectorProps> = ({
  vehicleNumber,
  canGoOut,
  canComeIn,
  onDirectionSelected
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Compass className="w-5 h-5 text-blue-600" />
            </div>
            <Badge variant="outline" className="text-lg font-mono px-4 py-1">
              {vehicleNumber}
            </Badge>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Choose Vehicle Direction
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Select the direction for vehicle movement
          </p>
        </CardHeader>
      </Card>

      {/* Direction Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* OUT Direction */}
        <Card className={`border-2 transition-all duration-300 hover:shadow-lg ${
          canGoOut 
            ? 'border-green-200 hover:border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  canGoOut ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <ArrowRight className={`w-8 h-8 ${canGoOut ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                {canGoOut && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Car className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className={`text-xl font-bold ${canGoOut ? 'text-green-700' : 'text-gray-500'}`}>
                  OUT
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Vehicle departing from hub
                </p>
              </div>

              <div className="space-y-2">
                {canGoOut && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Available
                  </Badge>
                )}
                
                <Button
                  onClick={() => onDirectionSelected('OUT')}
                  disabled={!canGoOut}
                  className={`w-full py-3 ${
                    canGoOut 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  variant={canGoOut ? 'default' : 'secondary'}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {canGoOut ? 'Select OUT' : 'Vehicle Already OUT'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IN Direction */}
        <Card className={`border-2 transition-all duration-300 hover:shadow-lg ${
          canComeIn 
            ? 'border-blue-200 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  canComeIn ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <ArrowLeft className={`w-8 h-8 ${canComeIn ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                {canComeIn && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Car className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className={`text-xl font-bold ${canComeIn ? 'text-blue-700' : 'text-gray-500'}`}>
                  IN
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Vehicle returning to hub
                </p>
              </div>

              <div className="space-y-2">
                {canComeIn && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Available
                  </Badge>
                )}
                
                <Button
                  onClick={() => onDirectionSelected('IN')}
                  disabled={!canComeIn}
                  className={`w-full py-3 ${
                    canComeIn 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  variant={canComeIn ? 'default' : 'secondary'}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {canComeIn ? 'Select IN' : 'Vehicle Not OUT Yet'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning Alert */}
      {!canGoOut && !canComeIn && (
        <Alert variant="destructive" className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Vehicle Status Issue:</strong> Unable to determine valid direction. 
            Please check the vehicle's current deployment status or contact support.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
