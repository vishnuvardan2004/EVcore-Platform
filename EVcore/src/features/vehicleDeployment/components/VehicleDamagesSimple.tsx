import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export const VehicleDamagesSimple: React.FC = () => {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            Vehicle Damages
          </h1>
          <p className="text-gray-600 mt-1">Track and manage vehicle damage reports and repairs</p>
        </div>
      </div>

      {/* Simple Test Content */}
      <Card>
        <CardHeader>
          <CardTitle>Test Component</CardTitle>
        </CardHeader>
        <CardContent>
          <p>If you can see this, the damages component is working correctly!</p>
          <p>The route is properly configured and the component is loading.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleDamagesSimple;
