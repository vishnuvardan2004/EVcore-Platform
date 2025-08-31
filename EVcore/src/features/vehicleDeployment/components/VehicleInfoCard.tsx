
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, User, Clock, MapPin, Battery, Fuel } from 'lucide-react';

interface VehicleInfoCardProps {
  vehicleNumber: string;
  pilotId: string;
  vehicleType?: string;
  batteryLevel?: number;
  fuelLevel?: number;
  location?: string;
  lastUpdated?: string;
}

export const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({ 
  vehicleNumber, 
  pilotId,
  vehicleType = 'Electric Vehicle',
  batteryLevel = 85,
  fuelLevel,
  location = 'Hub Station A',
  lastUpdated = 'Just now'
}) => {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <Car className="w-4 h-4 text-indigo-600" />
          </div>
          Vehicle Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle and Pilot Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Registration Number</span>
              <Badge variant="outline" className="font-mono text-sm">
                {vehicleNumber}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vehicle Type</span>
              <span className="text-sm font-medium text-gray-800">{vehicleType}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pilot ID</span>
              <Badge variant="secondary" className="font-mono text-sm">
                <User className="w-3 h-3 mr-1" />
                {pilotId}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Location</span>
              <div className="flex items-center gap-1 text-sm font-medium text-gray-800">
                <MapPin className="w-3 h-3 text-gray-500" />
                {location}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Status */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
          {/* Battery Level */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Battery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    batteryLevel > 60 ? 'bg-green-500' : 
                    batteryLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${batteryLevel}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-gray-800">{batteryLevel}%</span>
            </div>
          </div>

          {/* Fuel Level (if applicable) */}
          {fuelLevel !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Fuel</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      fuelLevel > 60 ? 'bg-blue-500' : 
                      fuelLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${fuelLevel}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-800">{fuelLevel}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">Last updated: {lastUpdated}</span>
        </div>
      </CardContent>
    </Card>
  );
};
