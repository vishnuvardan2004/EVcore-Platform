import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { 
  Plus, MapPin, Filter, Search, Clock, TrendingUp, 
  Car, DollarSign, Timer, Activity, BarChart3,
  Eye, Edit, Trash2, Play, Pause, Square
} from 'lucide-react';
import { useTripDetails } from '../contexts/EnhancedTripDetailsContext';
import { EnhancedTripEntryForm, EnhancedTripCard, TripFilters } from './index';
import { format } from 'date-fns';

export const EnhancedActiveShiftSection: React.FC = () => {
  const { state, endShift, setView } = useTripDetails();
  const [showTripForm, setShowTripForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShiftActive, setIsShiftActive] = useState(true);
  const [shiftTimer, setShiftTimer] = useState('');

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.shiftData.startTime) {
        const elapsed = new Date().getTime() - state.shiftData.startTime.getTime();
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
        setShiftTimer(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.shiftData.startTime]);

  const handleEndShift = () => {
    if (confirm('Are you sure you want to end your shift? This will take you to the analytics dashboard.')) {
      endShift({
        endTime: new Date(),
        odometerEnd: (state.shiftData.odometerStart || 0) + Math.floor(Math.random() * 200) + 50,
        batteryLevel: Math.max(20, (state.shiftData.batteryLevel || 100) - Math.floor(Math.random() * 40))
      });
    }
  };

  const toggleShiftStatus = () => {
    setIsShiftActive(!isShiftActive);
  };

  // Filter trips based on search query
  const filteredTrips = state.trips.filter(trip =>
    trip.mode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.paymentMode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (trip.startLocation?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (trip.endLocation?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const progressPercentage = Math.min((state.trips.length / Math.max(state.shiftData.totalTripsPlanned, 1)) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Active Shift Header */}
      <Card className="border-2 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`relative p-3 rounded-full ${isShiftActive ? 'bg-green-500' : 'bg-yellow-500'}`}>
                <Car className="w-6 h-6 text-white" />
                {isShiftActive && (
                  <div className="absolute -inset-1 bg-green-500 rounded-full animate-pulse opacity-30"></div>
                )}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                  {isShiftActive ? '🟢 Active Shift' : '⏸️ Shift Paused'}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleShiftStatus}
                    className="ml-2"
                  >
                    {isShiftActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </h2>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>Started: {format(state.shiftData.startTime, 'HH:mm')}</span>
                  <span>•</span>
                  <span>Vehicle: {state.shiftData.vehicleNumber}</span>
                  <span>•</span>
                  <span>Duration: {shiftTimer}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                ₹{state.analytics.totalEarnings.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                {state.trips.length} of {state.shiftData.totalTripsPlanned} trips
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Trip Progress</span>
              <span>{progressPercentage.toFixed(1)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center bg-blue-50 border-blue-200">
          <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-700">₹{state.analytics.averageTrip.toFixed(0)}</div>
          <div className="text-xs text-blue-600">Avg per Trip</div>
        </Card>
        
        <Card className="p-4 text-center bg-purple-50 border-purple-200">
          <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-700">₹{state.analytics.efficiency.earningsPerHour.toFixed(0)}</div>
          <div className="text-xs text-purple-600">Per Hour</div>
        </Card>
        
        <Card className="p-4 text-center bg-orange-50 border-orange-200">
          <Timer className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-700">{state.analytics.efficiency.tripsPerHour.toFixed(1)}</div>
          <div className="text-xs text-orange-600">Trips/Hour</div>
        </Card>
        
        <Card className="p-4 text-center bg-green-50 border-green-200">
          <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-700">{state.analytics.efficiency.utilizationRate.toFixed(0)}%</div>
          <div className="text-xs text-green-600">Efficiency</div>
        </Card>
      </div>

      {/* View Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={state.view === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('list')}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Trip List
            </Button>
            
            <Button
              variant={state.view === 'analytics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('analytics')}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Live Analytics
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
          
          <Button 
            onClick={() => setShowTripForm(!showTripForm)}
            variant={showTripForm ? "outline" : "default"}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            disabled={!isShiftActive}
          >
            <Plus className="w-4 h-4" />
            {showTripForm ? 'Hide Form' : 'Add Trip'}
          </Button>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <TripFilters />
          </div>
        )}
      </Card>

      {/* Trip Entry Form */}
      {showTripForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Add New Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedTripEntryForm onSubmit={() => setShowTripForm(false)} />
          </CardContent>
        </Card>
      )}

      {/* Trip List or Analytics View */}
      {state.view === 'list' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trip History ({filteredTrips.length})</CardTitle>
              {state.trips.length > 0 && (
                <Badge variant="secondary">
                  Total Earned: ₹{state.analytics.totalEarnings.toLocaleString()}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredTrips.length > 0 ? (
              <div className="space-y-4">
                {filteredTrips.map((trip) => (
                  <EnhancedTripCard key={trip.id} trip={trip} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">
                  {state.trips.length === 0 ? 'No trips recorded yet' : 'No trips match your search'}
                </h3>
                <p className="text-gray-400 mb-4">
                  {state.trips.length === 0 
                    ? 'Start your first trip to see analytics and tracking data' 
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {state.trips.length === 0 && (
                  <Button 
                    onClick={() => setShowTripForm(true)}
                    className="gap-2"
                    disabled={!isShiftActive}
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Trip
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Analytics view will be rendered by switching the main view
        <div className="text-center py-8">
          <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Live analytics view - switch to analytics tab for detailed view</p>
        </div>
      )}

      {/* End Shift Button */}
      {state.trips.length > 0 && (
        <Card className="border-2 border-red-100 bg-red-50">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-red-700 mb-4">Ready to End Your Shift?</h3>
            <p className="text-gray-600 mb-6">
              You've completed {state.trips.length} trips and earned ₹{state.analytics.totalEarnings.toLocaleString()}
            </p>
            <Button 
              onClick={handleEndShift}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <Square className="w-5 h-5" />
              End Shift & View Analytics
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
