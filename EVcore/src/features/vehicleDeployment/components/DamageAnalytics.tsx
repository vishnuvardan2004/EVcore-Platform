import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car
} from 'lucide-react';

interface DamageAnalyticsProps {
  damages: any[];
}

export const DamageAnalytics: React.FC<DamageAnalyticsProps> = ({ damages }) => {
  // Calculate analytics data
  const getTrendData = () => {
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth - 1;
    
    const currentMonthDamages = damages.filter(d => 
      new Date(d.reportedDate).getMonth() === currentMonth
    ).length;
    
    const lastMonthDamages = damages.filter(d => 
      new Date(d.reportedDate).getMonth() === lastMonth
    ).length;
    
    const trend = lastMonthDamages > 0 
      ? ((currentMonthDamages - lastMonthDamages) / lastMonthDamages * 100).toFixed(1)
      : 0;
    
    return {
      current: currentMonthDamages,
      previous: lastMonthDamages,
      trend: Number(trend),
      isIncrease: Number(trend) > 0
    };
  };

  const getCategoryBreakdown = () => {
    const categories = damages.reduce((acc, damage) => {
      acc[damage.category] = (acc[damage.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categories).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count: count as number,
      percentage: ((count as number) / damages.length * 100).toFixed(1)
    }));
  };

  const getSeverityBreakdown = () => {
    const severities = damages.reduce((acc, damage) => {
      acc[damage.damageType] = (acc[damage.damageType] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(severities).map(([severity, count]) => ({
      severity: severity.charAt(0).toUpperCase() + severity.slice(1),
      count: count as number,
      percentage: ((count as number) / damages.length * 100).toFixed(1)
    }));
  };

  const getTopVehicles = () => {
    const vehicles = damages.reduce((acc, damage) => {
      acc[damage.vehicleNumber] = (acc[damage.vehicleNumber] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(vehicles)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([vehicle, count]) => ({
        vehicle,
        count: count as number
      }));
  };

  const getResolutionTime = () => {
    const completedDamages = damages.filter(d => d.completionDate);
    if (completedDamages.length === 0) return 0;

    const totalTime = completedDamages.reduce((sum, damage) => {
      const start = new Date(damage.reportedDate);
      const end = new Date(damage.completionDate);
      return sum + (end.getTime() - start.getTime());
    }, 0);

    return Math.round(totalTime / completedDamages.length / (1000 * 60 * 60 * 24)); // Average days
  };

  const getTotalCost = () => {
    return damages.reduce((sum, damage) => sum + (damage.actualCost || damage.estimatedCost), 0);
  };

  const trend = getTrendData();
  const categoryBreakdown = getCategoryBreakdown();
  const severityBreakdown = getSeverityBreakdown();
  const topVehicles = getTopVehicles();
  const avgResolutionTime = getResolutionTime();
  const totalCost = getTotalCost();

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Body': '🚗',
      'Mechanical': '⚙️',
      'Electrical': '🔌',
      'Interior': '🪑',
      'Tire': '🛞'
    };
    return icons[category as keyof typeof icons] || '📋';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      'Minor': 'bg-green-100 text-green-800',
      'Major': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Damage Analytics</h2>
          <p className="text-gray-600">Insights and trends from damage reports</p>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">This Month</p>
                <p className="text-2xl font-bold text-blue-900">{trend.current}</p>
                <div className="flex items-center gap-1 mt-1">
                  {trend.isIncrease ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                  <span className={`text-xs font-medium ${trend.isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(trend.trend)}% vs last month
                  </span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Avg Resolution</p>
                <p className="text-2xl font-bold text-green-900">{avgResolutionTime}</p>
                <p className="text-xs text-green-600 mt-1">days to complete</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total Cost</p>
                <p className="text-2xl font-bold text-purple-900">₹{totalCost.toLocaleString()}</p>
                <p className="text-xs text-purple-600 mt-1">repair expenses</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Active Cases</p>
                <p className="text-2xl font-bold text-orange-900">
                  {damages.filter(d => !['completed', 'rejected'].includes(d.status)).length}
                </p>
                <p className="text-xs text-orange-600 mt-1">pending repairs</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Damage by Category
            </CardTitle>
            <CardDescription>Distribution of damage types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryBreakdown.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(item.category)}</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.count} cases</span>
                    <Badge variant="outline">{item.percentage}%</Badge>
                  </div>
                </div>
                <Progress value={Number(item.percentage)} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Damage by Severity
            </CardTitle>
            <CardDescription>Severity distribution analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {severityBreakdown.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.severity}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.count} cases</span>
                    <Badge className={getSeverityColor(item.severity)}>
                      {item.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={Number(item.percentage)} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Vehicles with Most Damages
          </CardTitle>
          <CardDescription>Top 5 vehicles requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topVehicles.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{item.vehicle}</p>
                    <p className="text-sm text-gray-600">{item.count} damage reports</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {item.count} damages
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Monthly Damage Trends
          </CardTitle>
          <CardDescription>Damage reports over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Chart visualization coming soon</p>
              <p className="text-sm">Interactive damage trend charts will be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DamageAnalytics;
