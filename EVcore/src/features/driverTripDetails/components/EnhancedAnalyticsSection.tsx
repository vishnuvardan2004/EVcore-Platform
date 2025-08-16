import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  BarChart3, TrendingUp, DollarSign, Clock, Target, 
  Download, Share, Eye, Award, Zap, MapPin,
  Calendar, Users, CreditCard, Fuel
} from 'lucide-react';
import { useTripDetails } from '../contexts/EnhancedTripDetailsContext';
import { EnhancedTripCard } from './index';
import { format } from 'date-fns';

export const EnhancedAnalyticsSection: React.FC = () => {
  const { state, resetState, navigateToStep } = useTripDetails();
  const [selectedMetric, setSelectedMetric] = useState<'earnings' | 'trips' | 'efficiency'>('earnings');
  
  const { analytics, shiftData, trips } = state;
  const shiftDuration = shiftData.endTime 
    ? (shiftData.endTime.getTime() - shiftData.startTime.getTime()) / (1000 * 60 * 60)
    : 0;

  const exportAnalytics = () => {
    const data = {
      summary: {
        employeeId: state.employeeId,
        shiftStarted: shiftData.startTime,
        shiftEnded: shiftData.endTime,
        totalDuration: `${shiftDuration.toFixed(1)} hours`,
        totalTrips: analytics.totalTrips,
        totalEarnings: analytics.totalEarnings,
        efficiency: analytics.efficiency,
      },
      trips: trips,
      analytics: analytics,
      vehicle: {
        number: shiftData.vehicleNumber,
        category: shiftData.vehicleCategory,
        odometerStart: shiftData.odometerStart,
        odometerEnd: shiftData.odometerEnd,
        batteryStart: 100, // Assuming full battery at start
        batteryEnd: shiftData.batteryLevel,
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift-analytics-${state.employeeId}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareAnalytics = async () => {
    const shareData = {
      title: `Shift Analytics - ${state.employeeId}`,
      text: `💰 Earned ₹${analytics.totalEarnings} in ${analytics.totalTrips} trips\n⚡ ${analytics.efficiency.tripsPerHour.toFixed(1)} trips/hour\n🎯 ${analytics.efficiency.utilizationRate.toFixed(0)}% efficiency`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareData.text);
      alert('Analytics copied to clipboard!');
    }
  };

  const getEfficiencyGrade = (rate: number) => {
    if (rate >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (rate >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (rate >= 70) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (rate >= 60) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (rate >= 50) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const efficiencyGrade = getEfficiencyGrade(analytics.efficiency.utilizationRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Award className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-green-700 mb-2">
            Shift Completed! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6 text-lg">
            Great work! Here's your performance summary for today.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(shiftData.startTime, 'PPP')}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{shiftDuration.toFixed(1)} hours</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{state.employeeId}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-blue-700 mb-1">
              {analytics.totalTrips}
            </div>
            <div className="text-sm text-blue-600 mb-2">Total Trips</div>
            <div className="text-xs text-blue-500">
              of {shiftData.totalTripsPlanned} planned
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-green-700 mb-1">
              ₹{analytics.totalEarnings.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 mb-2">Total Earnings</div>
            <div className="text-xs text-green-500">
              ₹{analytics.averageTrip.toFixed(0)} avg per trip
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-purple-700 mb-1">
              ₹{analytics.efficiency.earningsPerHour.toFixed(0)}
            </div>
            <div className="text-sm text-purple-600 mb-2">Per Hour</div>
            <div className="text-xs text-purple-500">
              {analytics.efficiency.tripsPerHour.toFixed(1)} trips/hour
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${efficiencyGrade.bg} border-2`}>
          <CardContent className="p-6 text-center">
            <div className={`w-12 h-12 ${efficiencyGrade.color.replace('text-', 'bg-').replace('-600', '-500')} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className={`text-3xl font-bold ${efficiencyGrade.color} mb-1`}>
              {efficiencyGrade.grade}
            </div>
            <div className={`text-sm ${efficiencyGrade.color} mb-2`}>Efficiency Grade</div>
            <div className={`text-xs ${efficiencyGrade.color}`}>
              {analytics.efficiency.utilizationRate.toFixed(0)}% utilization
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.paymentBreakdown).map(([mode, amount]) => {
                const percentage = (amount / analytics.totalEarnings) * 100;
                return (
                  <div key={mode} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="capitalize font-medium">{mode}</span>
                      <span className="font-bold">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          mode === 'cash' ? 'bg-green-500' : 
                          mode === 'digital' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Trip Mode Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Trip Mode Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.tripModeStats.slice(0, 5).map((stat) => (
                <div key={stat.mode} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{stat.mode}</span>
                    <span className="font-bold">{stat.count} trips</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{stat.percentage.toFixed(1)}%</span>
                    <span>₹{stat.earnings.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Vehicle Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {shiftData.vehicleNumber}
              </div>
              <div className="text-sm text-gray-600">Vehicle Number</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {((shiftData.odometerEnd || 0) - (shiftData.odometerStart || 0)).toFixed(0)} km
              </div>
              <div className="text-sm text-gray-600">Distance Covered</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.efficiency.earningsPerKm > 0 ? `₹${analytics.efficiency.earningsPerKm.toFixed(0)}` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Earnings per KM</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                (shiftData.batteryLevel || 0) > 50 ? 'text-green-600' : 
                (shiftData.batteryLevel || 0) > 20 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {shiftData.batteryLevel || 0}%
              </div>
              <div className="text-sm text-gray-600">Battery Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Trips */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Highest Earning Trips
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToStep('active-shift')}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              View All Trips
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {trips.length > 0 ? (
            <div className="space-y-4">
              {trips
                .sort((a, b) => (b.amount + b.tip) - (a.amount + a.tip))
                .slice(0, 3)
                .map((trip) => (
                  <EnhancedTripCard key={trip.id} trip={trip} showActions={false} />
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No trips recorded for this shift.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={exportAnalytics}
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Download className="w-4 h-4" />
          Export Report
        </Button>
        
        <Button
          onClick={shareAnalytics}
          variant="outline"
          className="gap-2"
        >
          <Share className="w-4 h-4" />
          Share Results
        </Button>
        
        <Button
          onClick={() => {
            if (confirm('Start a new shift? This will reset all current data.')) {
              resetState();
            }
          }}
          variant="outline"
          className="gap-2 text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
        >
          <Zap className="w-4 h-4" />
          Start New Shift
        </Button>
      </div>

      {/* Achievement Badges */}
      {analytics.totalTrips > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Award className="w-5 h-5" />
              Today's Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.totalTrips >= 10 && (
                <Badge className="bg-blue-500">🏆 Trip Master (10+ trips)</Badge>
              )}
              {analytics.efficiency.utilizationRate >= 90 && (
                <Badge className="bg-green-500">⚡ Efficiency Expert (90%+)</Badge>
              )}
              {analytics.totalEarnings >= 2000 && (
                <Badge className="bg-purple-500">💰 High Earner (₹2000+)</Badge>
              )}
              {analytics.efficiency.tripsPerHour >= 2 && (
                <Badge className="bg-orange-500">🚀 Speed Demon (2+ trips/hour)</Badge>
              )}
              {shiftDuration >= 8 && (
                <Badge className="bg-indigo-500">🕐 Marathon Shift (8+ hours)</Badge>
              )}
              {analytics.tripModeStats.length >= 3 && (
                <Badge className="bg-pink-500">🎯 Versatile Driver (3+ modes)</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
