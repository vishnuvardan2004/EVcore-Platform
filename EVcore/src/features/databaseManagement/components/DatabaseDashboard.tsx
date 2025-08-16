import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Users,
  UserCheck,
  RefreshCw,
  Clock,
  Plus,
  Edit,
  Trash2,
  Activity
} from 'lucide-react';
import { databaseService } from '../services/database';
import { pilotService } from '../../../services/database';
import { config } from '../../../config/environment';

interface DatabaseStats {
  vehicles: number;
  pilots: number;
  employees: number;
  chargingEquipment: number;
  itEquipment: number;
  totalAssets: number;
  totalResources: number;
}

interface RecentActivity {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  module: string;
  description: string;
  timestamp: string;
  user: string;
}

// Simple Info Card Component
const InfoCard: React.FC<{ 
  title: string; 
  count: number; 
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, count, icon: Icon, color }) => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{count}</p>
        </div>
        <div className={`p-3 rounded-full border-2 ${getColorClasses(color)}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

export const DatabaseDashboard: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Get stats from database service
      const dbStats = await databaseService.getDatabaseStats();
      // Get pilot count from our integrated pilot service 
      const pilotCount = await pilotService.getPilotCount();
      
      const combinedStats: DatabaseStats = {
        vehicles: dbStats.vehicles,
        pilots: pilotCount, // Use the actual pilot count from our induction system
        employees: dbStats.employees,
        chargingEquipment: dbStats.chargingEquipment || 0,
        itEquipment: dbStats.itEquipment || 0,
        totalAssets: dbStats.totalAssets,
        totalResources: dbStats.totalResources
      };
      
      setStats(combinedStats);
      
      // Fetch recent activities (dev-only mock for now)
      if (config.IS_DEVELOPMENT) {
        setRecentActivities(generateMockActivities());
      } else {
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockActivities = (): RecentActivity[] => {
    return [
      {
        id: '1',
        action: 'created',
        module: 'Pilots',
        description: 'New pilot EVZIP-3 inducted',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        user: 'Admin'
      },
      {
        id: '2',
        action: 'updated',
        module: 'Vehicles',
        description: 'Vehicle KA01AB1234 status updated',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: 'Manager'
      },
      {
        id: '3',
        action: 'created',
        module: 'Pilots',
        description: 'New pilot EVZIP-2 inducted',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        user: 'HR Team'
      },
      {
        id: '4',
        action: 'deleted',
        module: 'Employees',
        description: 'Employee record removed',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        user: 'Admin'
      },
      {
        id: '5',
        action: 'created',
        module: 'Vehicles',
        description: 'New vehicle KA01XY5678 added',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        user: 'Fleet Manager'
      }
    ];
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'updated':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'updated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Information</h1>
            <p className="text-gray-600">Overview of system data</p>
          </div>
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate total staff (employees who are not pilots)
  const totalStaff = (stats?.employees || 0) - (stats?.pilots || 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Information</h1>
          <p className="text-gray-600">Overview of system data</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard
          title="Total Vehicles"
          count={stats?.vehicles || 0}
          icon={Car}
          color="blue"
        />
        <InfoCard
          title="Total Pilots"
          count={stats?.pilots || 0}
          icon={UserCheck}
          color="green"
        />
        <InfoCard
          title="Total Staff"
          count={totalStaff}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Asset Information Cards */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Changes Made to Database
            </CardTitle>
            <CardDescription>Latest database activities and modifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent activities found</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {getActionIcon(activity.action)}
                      <div>
                        <p className="font-medium text-gray-900">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${getActionColor(activity.action)}`}>
                            {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                          </Badge>
                          <span className="text-xs text-gray-500">in {activity.module}</span>
                          <span className="text-xs text-gray-500">by {activity.user}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentActivities.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all activity logs →
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseDashboard;
