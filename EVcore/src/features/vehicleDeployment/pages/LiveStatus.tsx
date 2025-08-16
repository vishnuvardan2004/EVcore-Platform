
import React, { useState, useEffect } from 'react';
import { VehicleTrackerLayout } from '../components/VehicleTrackerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { vehicleService } from '../../../services/database';
import { Deployment } from '../../../types/vehicle';
import { useToast } from '../../../hooks/use-toast';

interface LiveDeploymentData {
  id: string;
  vehicleNumber: string;
  outTime: string;
  supervisor: string;
  purpose: 'Office' | 'Pilot';
  duration: string;
  status: 'active' | 'overdue';
  driverName?: string;
}

const LiveStatus = () => {
  const [liveDeployments, setLiveDeployments] = useState<LiveDeploymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();

  const calculateDuration = (outTimeString: string): string => {
    const now = new Date();
    const outTime = new Date(outTimeString);
    const diffMs = now.getTime() - outTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const fetchLiveDeployments = async () => {
    try {
      setLoading(true);
      const deployments = await vehicleService.getDeploymentHistory();
      
      // Filter for active deployments (OUT but no IN)
      const activeDeployments = deployments.filter((deployment: Deployment) => 
        deployment.outTimestamp && !deployment.inTimestamp
      );
      
      // Convert to LiveDeploymentData format
      const liveData: LiveDeploymentData[] = activeDeployments.map((deployment: Deployment) => {
        const duration = calculateDuration(deployment.outTimestamp!);
        const outTime = new Date(deployment.outTimestamp!);
        const now = new Date();
        const hoursOut = (now.getTime() - outTime.getTime()) / (1000 * 60 * 60);
        
        return {
          id: deployment.id,
          vehicleNumber: deployment.vehicleNumber,
          outTime: new Date(deployment.outTimestamp!).toLocaleString(),
          supervisor: deployment.outData?.supervisorName || 'Unknown',
          purpose: deployment.purpose,
          duration,
          status: hoursOut > 8 ? 'overdue' : 'active', // Mark as overdue if out for more than 8 hours
          driverName: deployment.outData?.driverName || deployment.outData?.employeeName
        };
      });
      
      // Sort by most recent OUT time and limit to 10
      const sortedDeployments = liveData
        .sort((a, b) => new Date(b.outTime).getTime() - new Date(a.outTime).getTime())
        .slice(0, 10);
      
      setLiveDeployments(sortedDeployments);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching live deployments:', error);
      toast({
        title: "Error",
        description: "Failed to load live deployment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDeployments();
    
    // Auto-refresh every 15 seconds for real-time updates
    const interval = setInterval(fetchLiveDeployments, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchLiveDeployments();
    toast({
      title: "Refreshed",
      description: "Live deployment data updated",
    });
  };

  return (
    <VehicleTrackerLayout 
      title="🟢 Live Deployment Status" 
      subtitle="Real-time tracking of currently deployed vehicles"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="font-medium">
                {loading ? 'Loading...' : `${liveDeployments.length} vehicles currently deployed`}
              </span>
            </div>
            {lastRefresh && (
              <div className="text-xs text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Live Status</h3>
              <p className="text-gray-600">Fetching current deployment data...</p>
            </CardContent>
          </Card>
        ) : liveDeployments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Deployments</h3>
              <p className="text-gray-600">All vehicles are currently checked in.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{liveDeployments.length}</div>
                  <div className="text-xs text-gray-600">Active Vehicles</div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {liveDeployments.filter(d => d.purpose === 'Office').length}
                  </div>
                  <div className="text-xs text-gray-600">Office Deployments</div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {liveDeployments.filter(d => d.purpose === 'Pilot').length}
                  </div>
                  <div className="text-xs text-gray-600">Pilot Deployments</div>
                </CardContent>
              </Card>
            </div>

            {/* Alert for overdue vehicles */}
            {liveDeployments.some(d => d.status === 'overdue') && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-red-800 font-medium">Overdue Alert</p>
                      <p className="text-red-700 text-sm">
                        {liveDeployments.filter(d => d.status === 'overdue').length} vehicles have been out for more than 8 hours
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deployments Grid */}
            <div className="grid gap-4">
              {liveDeployments.map((deployment) => (
                <Card key={deployment.id} className={`hover:shadow-md transition-shadow ${
                  deployment.status === 'overdue' ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {deployment.vehicleNumber}
                            {deployment.status === 'overdue' && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </h3>
                          <div className="text-sm text-gray-600">
                            <p>Supervisor: {deployment.supervisor}</p>
                            {deployment.driverName && (
                              <p>Driver: {deployment.driverName}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Out since {new Date(deployment.outTime).toLocaleTimeString()}</span>
                        </div>
                        
                        <div>
                          <Badge variant={deployment.purpose === 'Pilot' ? 'default' : 'secondary'}>
                            {deployment.purpose}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{deployment.duration}</p>
                          <p className="text-xs text-gray-500">Duration</p>
                        </div>
                        
                        <Badge 
                          variant={deployment.status === 'overdue' ? 'destructive' : 'default'}
                          className={deployment.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {deployment.status === 'overdue' ? '⚠️ Overdue' : '🟢 Active'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </VehicleTrackerLayout>
  );
};

export default LiveStatus;
