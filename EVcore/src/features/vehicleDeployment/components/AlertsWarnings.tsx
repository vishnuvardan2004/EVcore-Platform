
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { vehicleService } from '../../../services/database';
import { Deployment } from '../../../types/vehicle';

interface ChecklistAlert {
  vehicleNumber: string;
  inDate: string;
  issues: string[];
  inSupervisor: string;
}

export const AlertsWarnings: React.FC = () => {
  const [alerts, setAlerts] = useState<ChecklistAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const deployments = await vehicleService.getDeploymentHistory();
      
      // Filter for deployments with checklist mismatches
      const alertDeployments = deployments.filter((deployment: Deployment) => 
        deployment.inData?.checklistMismatches && 
        deployment.inData.checklistMismatches.length > 0
      );
      
      // Convert to alert format
      const alertData: ChecklistAlert[] = alertDeployments.map((deployment: Deployment) => ({
        vehicleNumber: deployment.vehicleNumber,
        inDate: deployment.inTimestamp ? new Date(deployment.inTimestamp).toLocaleString() : 'Unknown',
        issues: deployment.inData?.checklistMismatches || [],
        inSupervisor: deployment.inData?.inSupervisorName || 'Unknown'
      }));
      
      // Sort by most recent
      const sortedAlerts = alertData.sort((a, b) => 
        new Date(b.inDate).getTime() - new Date(a.inDate).getTime()
      );
      
      setAlerts(sortedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Alerts & Warnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-700">
              🔄 Loading recent alerts...
            </AlertDescription>
          </Alert>
        ) : alerts.length === 0 ? (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">
              ✅ All recent vehicles passed checklist verification.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <Alert key={index} variant="destructive" className="border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold">Vehicle {alert.vehicleNumber}</span>
                        <span className="text-sm text-gray-600 ml-2">({alert.inDate})</span>
                      </div>
                      <span className="text-sm text-gray-600">IN Supervisor: {alert.inSupervisor}</span>
                    </div>
                    <div className="pl-4">
                      <p className="font-medium text-red-700 mb-1">Checklist Issues:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {alert.issues.map((issue, issueIndex) => (
                          <li key={issueIndex} className="text-red-600 text-sm">
                            ⚠️ {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
