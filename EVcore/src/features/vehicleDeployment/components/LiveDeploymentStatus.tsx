
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, RefreshCw, Activity, Clock, User, Building2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { vehicleService } from '../../../services/database';
import { Deployment } from '../../../types/vehicle';

interface LiveDeployment {
  vehicleNumber: string;
  outTime: string;
  purpose: 'Office' | 'Pilot';
  driverName?: string;
  outSupervisor: string;
  deploymentId: string;
  duration: string;
}

export const LiveDeploymentStatus: React.FC = () => {
  const [liveDeployments, setLiveDeployments] = useState<LiveDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const calculateDuration = (outTimestamp: string): string => {
    const outTime = new Date(outTimestamp);
    const now = new Date();
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
      
      // Convert to LiveDeployment format
      const liveData: LiveDeployment[] = activeDeployments.map((deployment: Deployment) => ({
        vehicleNumber: deployment.vehicleNumber,
        outTime: new Date(deployment.outTimestamp!).toLocaleString(),
        purpose: deployment.purpose,
        driverName: deployment.outData?.driverName || undefined,
        outSupervisor: deployment.outData?.supervisorName || 'Unknown',
        deploymentId: deployment.id,
        duration: calculateDuration(deployment.outTimestamp!)
      }));
      
      // Sort by most recent OUT time and limit to 10
      const sortedDeployments = liveData
        .sort((a, b) => new Date(b.outTime).getTime() - new Date(a.outTime).getTime())
        .slice(0, 10);
      
      setLiveDeployments(sortedDeployments);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching live deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDeployments();
    
    // Auto-refresh every 15 seconds for more real-time updates
    const interval = setInterval(() => {
      fetchLiveDeployments();
      // Update durations without full refetch for better UX
      setLiveDeployments(prev => prev.map(deployment => ({
        ...deployment,
        duration: calculateDuration(new Date(deployment.outTime).toISOString())
      })));
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Live Deployments</h3>
              <p className="text-sm text-gray-600">Currently active vehicle deployments (max 10)</p>
            </div>
            {liveDeployments.length > 0 && (
              <Badge className="bg-green-500 text-white animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                {liveDeployments.length} Live
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-gray-500">Last updated</div>
              <div className="text-xs font-medium text-gray-700">
                {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLiveDeployments}
              disabled={loading}
              className="flex items-center gap-2 border-green-200 hover:bg-green-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : 'text-green-600'}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Loading live deployments...</p>
                <p className="text-xs text-gray-500">Fetching real-time data</p>
              </div>
            </div>
          </div>
        ) : liveDeployments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ArrowUp className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">No Active Deployments</p>
            <p className="text-sm text-gray-500">All vehicles are currently available for deployment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{liveDeployments.length}</div>
                <div className="text-xs text-gray-600">Active Vehicles</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {liveDeployments.filter(d => d.purpose === 'Office').length}
                </div>
                <div className="text-xs text-gray-600">Office Deployments</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {liveDeployments.filter(d => d.purpose === 'Pilot').length}
                </div>
                <div className="text-xs text-gray-600">Pilot Deployments</div>
              </div>
            </div>

            {/* Deployments Table */}
            <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50">
                      <TableHead className="font-semibold text-green-800">Vehicle</TableHead>
                      <TableHead className="font-semibold text-green-800">OUT Time</TableHead>
                      <TableHead className="font-semibold text-green-800">Duration</TableHead>
                      <TableHead className="font-semibold text-green-800">Purpose</TableHead>
                      <TableHead className="font-semibold text-green-800">Driver</TableHead>
                      <TableHead className="font-semibold text-green-800">Supervisor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveDeployments.map((deployment, index) => (
                      <TableRow 
                        key={`${deployment.deploymentId}-${index}`}
                        className="hover:bg-green-50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <Badge variant="outline" className="font-mono">
                              {deployment.vehicleNumber}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {deployment.outTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 font-mono">
                            {deployment.duration}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`${
                              deployment.purpose === 'Office' 
                                ? 'border-blue-200 bg-blue-50 text-blue-700' 
                                : 'border-orange-200 bg-orange-50 text-orange-700'
                            }`}
                          >
                            {deployment.purpose === 'Office' ? (
                              <Building2 className="w-3 h-3 mr-1" />
                            ) : (
                              <Target className="w-3 h-3 mr-1" />
                            )}
                            {deployment.purpose}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3 h-3 text-gray-400" />
                            {deployment.driverName || (
                              <span className="text-gray-400 italic">Not assigned</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-700">
                          {deployment.outSupervisor}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
