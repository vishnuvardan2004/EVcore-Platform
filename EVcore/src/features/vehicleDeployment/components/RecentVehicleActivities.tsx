
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, RefreshCw, History, ArrowUp, ArrowDown, User, Building2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { vehicleService } from '../../../services/database';
import { Deployment } from '../../../types/vehicle';

interface Activity {
  vehicleNumber: string;
  status: 'IN' | 'OUT';
  purpose: 'Office' | 'Pilot';
  timestamp: string;
  supervisorName: string;
  deploymentId: string;
  driverName?: string;
}

export const RecentVehicleActivities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      const deployments = await vehicleService.getDeploymentHistory();
      
      // Convert deployments to activities and sort by most recent
      const recentActivities: Activity[] = [];
      
      deployments.forEach((deployment: Deployment) => {
        // Add OUT activity
        if (deployment.outTimestamp) {
          recentActivities.push({
            vehicleNumber: deployment.vehicleNumber,
            status: 'OUT',
            purpose: deployment.purpose,
            timestamp: new Date(deployment.outTimestamp).toLocaleString(),
            supervisorName: deployment.outData?.supervisorName || 'Unknown',
            deploymentId: deployment.id,
            driverName: deployment.outData?.driverName || deployment.outData?.employeeName
          });
        }
        
        // Add IN activity if exists
        if (deployment.inTimestamp) {
          recentActivities.push({
            vehicleNumber: deployment.vehicleNumber,
            status: 'IN',
            purpose: deployment.purpose,
            timestamp: new Date(deployment.inTimestamp).toLocaleString(),
            supervisorName: deployment.inData?.inSupervisorName || 'Unknown',
            deploymentId: deployment.id
          });
        }
      });
      
      // Sort by timestamp (most recent first) and take last 10
      const sortedActivities = recentActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      
      setActivities(sortedActivities);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivities();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRecentActivities, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Recent Activities</h3>
              <p className="text-sm text-gray-600">Latest vehicle IN/OUT operations (max 10)</p>
            </div>
            {activities.length > 0 && (
              <Badge className="bg-blue-500 text-white">
                <Clock className="w-3 h-3 mr-1" />
                {activities.length} Recent
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
              onClick={fetchRecentActivities}
              disabled={loading}
              className="flex items-center gap-2 border-blue-200 hover:bg-blue-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Loading recent activities...</p>
                <p className="text-xs text-gray-500">Fetching latest operations</p>
              </div>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">No Recent Activities</p>
            <p className="text-sm text-gray-500">Deploy a vehicle to see activities here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-red-600">
                  {activities.filter(a => a.status === 'OUT').length}
                </div>
                <div className="text-xs text-gray-600">OUT Operations</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-green-600">
                  {activities.filter(a => a.status === 'IN').length}
                </div>
                <div className="text-xs text-gray-600">IN Operations</div>
              </div>
            </div>

            {/* Activities Table */}
            <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="font-semibold text-blue-800">Vehicle</TableHead>
                      <TableHead className="font-semibold text-blue-800">Status</TableHead>
                      <TableHead className="font-semibold text-blue-800">Purpose</TableHead>
                      <TableHead className="font-semibold text-blue-800">Time</TableHead>
                      <TableHead className="font-semibold text-blue-800">Person</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity, index) => (
                      <TableRow 
                        key={`${activity.deploymentId}-${activity.status}-${index}`}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              activity.status === 'OUT' ? 'bg-red-500' : 'bg-green-500'
                            }`}></div>
                            <Badge variant="outline" className="font-mono">
                              {activity.vehicleNumber}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${
                              activity.status === 'OUT' 
                                ? 'bg-red-100 text-red-700 border-red-200' 
                                : 'bg-green-100 text-green-700 border-green-200'
                            }`}
                          >
                            {activity.status === 'OUT' ? (
                              <ArrowUp className="w-3 h-3 mr-1" />
                            ) : (
                              <ArrowDown className="w-3 h-3 mr-1" />
                            )}
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`${
                              activity.purpose === 'Office' 
                                ? 'border-blue-200 bg-blue-50 text-blue-700' 
                                : 'border-orange-200 bg-orange-50 text-orange-700'
                            }`}
                          >
                            {activity.purpose === 'Office' ? (
                              <Building2 className="w-3 h-3 mr-1" />
                            ) : (
                              <Target className="w-3 h-3 mr-1" />
                            )}
                            {activity.purpose}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {activity.timestamp}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="font-medium text-gray-700">
                                {activity.supervisorName}
                              </span>
                            </div>
                            {activity.driverName && (
                              <div className="text-xs text-gray-500">
                                Driver: {activity.driverName}
                              </div>
                            )}
                          </div>
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
