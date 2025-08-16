import React, { useState, useEffect } from 'react';
import { VehicleTrackerLayout } from '../components/VehicleTrackerLayout';
import { VehicleDeploymentForm } from '../components/VehicleDeploymentForm';
import { RecentVehicleActivities } from '../components/RecentVehicleActivities';
import { LiveDeploymentStatus } from '../components/LiveDeploymentStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  ArrowDown, 
  ArrowUp, 
  BarChart3, 
  Car, 
  Clock, 
  TrendingUp,
  Users,
  AlertTriangle
} from 'lucide-react';
import { vehicleService } from '../../../services/database';
import { useToast } from '../../../hooks/use-toast';
import { Button } from '@/components/ui/button';

const VehicleTracker = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeDeployments: 0,
    todayActivity: 0,
    avgDeploymentTime: '0h'
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const deployments = await vehicleService.getDeploymentHistory();
      
      // Calculate statistics
      const activeDeployments = deployments.filter(d => d.outTimestamp && !d.inTimestamp).length;
      const today = new Date().toDateString();
      const todayActivity = deployments.filter(d => 
        new Date(d.outTimestamp || '').toDateString() === today ||
        new Date(d.inTimestamp || '').toDateString() === today
      ).length;
      
      // Calculate average deployment time for completed trips
      const completedTrips = deployments.filter(d => d.outTimestamp && d.inTimestamp);
      let avgTime = 0;
      if (completedTrips.length > 0) {
        const totalTime = completedTrips.reduce((sum, trip) => {
          const outTime = new Date(trip.outTimestamp!).getTime();
          const inTime = new Date(trip.inTimestamp!).getTime();
          return sum + (inTime - outTime);
        }, 0);
        avgTime = totalTime / completedTrips.length;
      }
      
      const avgHours = Math.floor(avgTime / (1000 * 60 * 60));
      const avgMinutes = Math.floor((avgTime % (1000 * 60 * 60)) / (1000 * 60));
      
      setStats({
        totalVehicles: deployments.length,
        activeDeployments,
        todayActivity,
        avgDeploymentTime: avgTime > 0 ? `${avgHours}h ${avgMinutes}m` : '0h'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <VehicleTrackerLayout 
      title="🚗 Vehicle Deployment Tracker" 
      subtitle="Real-time vehicle tracking and deployment management"
    >
      <div className="space-y-6">
        {/* Main deployment form with enhanced styling */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25"></div>
          <div className="relative">
            <VehicleDeploymentForm />
          </div>
        </div>



        {/* Enhanced Statistics Dashboard - repositioned below vehicle entry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Vehicles</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {loading ? '...' : stats.totalVehicles}
                  </p>
                </div>
                <Car className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Deployments</p>
                  <p className="text-2xl font-bold text-green-900 flex items-center gap-2">
                    {loading ? '...' : stats.activeDeployments}
                    {stats.activeDeployments > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        LIVE
                      </Badge>
                    )}
                  </p>
                </div>
                <ArrowUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Today's Activity</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {loading ? '...' : stats.todayActivity}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Avg. Deployment Time</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {loading ? '...' : stats.avgDeploymentTime}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Enhanced two-column grid for Recent Activities and Live Status */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Badge variant="outline" className="text-xs">
                Last 10 entries
              </Badge>
            </div>
            <RecentVehicleActivities />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Live Status</h3>
              {stats.activeDeployments > 0 && (
                <Badge className="bg-green-500 text-white text-xs animate-pulse">
                  {stats.activeDeployments} Active
                </Badge>
              )}
            </div>
            <LiveDeploymentStatus />
          </div>
        </div>

        {/* Alert/Warning Section */}
        {stats.activeDeployments > 5 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-orange-800 font-medium">High Activity Alert</p>
                  <p className="text-orange-700 text-sm">
                    {stats.activeDeployments} vehicles are currently deployed. Monitor capacity levels.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </VehicleTrackerLayout>
  );
};

export default VehicleTracker;
