import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Clock, Car, MapPin, Battery, Gauge, Sun, Moon, Cloud } from 'lucide-react';
import { useTripDetails } from '../contexts/EnhancedTripDetailsContext';
import { ShiftData } from '../types';

export const EnhancedStartShiftSection: React.FC = () => {
  const { state, startShift } = useTripDetails();
  const [formData, setFormData] = useState<Partial<ShiftData>>({
    vehicleNumber: '',
    shiftType: 'day',
    vehicleCategory: '4W',
    startTime: new Date(),
    totalTripsPlanned: 8,
    fuelLevel: 100,
    batteryLevel: 100,
    odometerStart: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentLocation, setCurrentLocation] = useState<string>('Detecting location...');
  const [weather, setWeather] = useState<{ condition: string; temp: number }>({
    condition: 'Clear',
    temp: 25
  });

  useEffect(() => {
    // Mock location detection
    setTimeout(() => {
      setCurrentLocation('Koramangala, Bangalore');
    }, 2000);

    // Mock weather data
    const conditions = ['Clear', 'Cloudy', 'Rainy', 'Sunny'];
    setWeather({
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      temp: Math.floor(Math.random() * 15) + 20
    });
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.vehicleNumber?.trim()) newErrors.vehicleNumber = 'Vehicle number is required';
    if (!formData.shiftType) newErrors.shiftType = 'Shift type is required';
    if (!formData.vehicleCategory) newErrors.vehicleCategory = 'Vehicle category is required';
    if (!formData.totalTripsPlanned || formData.totalTripsPlanned < 1) newErrors.totalTripsPlanned = 'Planned trips must be at least 1';
    if (formData.odometerStart === undefined || formData.odometerStart < 0) newErrors.odometerStart = 'Starting odometer reading is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const shiftData: ShiftData = {
        vehicleNumber: formData.vehicleNumber!,
        shiftType: formData.shiftType!,
        vehicleCategory: formData.vehicleCategory!,
        startTime: new Date(),
        totalTripsPlanned: formData.totalTripsPlanned!,
        fuelLevel: formData.fuelLevel,
        batteryLevel: formData.batteryLevel,
        odometerStart: formData.odometerStart,
        location: {
          latitude: 12.9352,
          longitude: 77.6245,
          address: currentLocation,
          city: 'Bangalore',
          state: 'Karnataka'
        },
        weather: {
          condition: weather.condition,
          temperature: weather.temp,
          humidity: 65
        }
      };
      
      startShift(shiftData);
    }
  };

  const getShiftIcon = (type: string) => {
    switch (type) {
      case 'day': return Sun;
      case 'night': return Moon;
      case 'evening': return Cloud;
      default: return Clock;
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return '☀️';
      case 'cloudy':
        return '⛅';
      case 'rainy':
        return '🌧️';
      default:
        return '🌤️';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-green-100">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-green-700 flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                Start Your Shift
              </CardTitle>
              <p className="text-gray-600 mt-1">Employee: {state.employeeId}</p>
            </div>
            
            <div className="text-right">
              <Badge variant="secondary" className="text-lg py-2 px-4">
                {new Date().toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Environment Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Current Location</p>
              <p className="font-medium">{currentLocation}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getWeatherIcon(weather.condition)}</span>
            <div>
              <p className="text-sm text-gray-600">Weather</p>
              <p className="font-medium">{weather.condition}, {weather.temp}°C</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Shift Duration</p>
              <p className="font-medium">8-10 hours (estimated)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Shift Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Vehicle & Shift Details
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Number */}
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className="text-base font-medium">
                  Vehicle Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g., KA01AB1234"
                  value={formData.vehicleNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                  className={`h-12 text-lg ${errors.vehicleNumber ? 'border-red-500' : ''}`}
                />
                {errors.vehicleNumber && <p className="text-sm text-red-500">{errors.vehicleNumber}</p>}
              </div>

              {/* Vehicle Category */}
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Vehicle Category <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.vehicleCategory} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleCategory: value as any }))}
                >
                  <SelectTrigger className={`h-12 ${errors.vehicleCategory ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select vehicle category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2W">🏍️ 2 Wheeler (Bike/Scooter)</SelectItem>
                    <SelectItem value="3W">🛺 3 Wheeler (Auto/E-Rickshaw)</SelectItem>
                    <SelectItem value="4W">🚗 4 Wheeler (Car/Sedan)</SelectItem>
                    <SelectItem value="6W">🚐 6 Wheeler (Tempo/Van)</SelectItem>
                    <SelectItem value="heavy">🚛 Heavy Vehicle</SelectItem>
                    <SelectItem value="electric">⚡ Electric Vehicle</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vehicleCategory && <p className="text-sm text-red-500">{errors.vehicleCategory}</p>}
              </div>

              {/* Shift Type */}
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Shift Type <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.shiftType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, shiftType: value as any }))}
                >
                  <SelectTrigger className={`h-12 ${errors.shiftType ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select shift type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">☀️ Day Shift (6 AM - 6 PM)</SelectItem>
                    <SelectItem value="night">🌙 Night Shift (6 PM - 6 AM)</SelectItem>
                    <SelectItem value="evening">🌆 Evening Shift (2 PM - 10 PM)</SelectItem>
                    <SelectItem value="split">⏰ Split Shift</SelectItem>
                    <SelectItem value="on-demand">📱 On-Demand</SelectItem>
                  </SelectContent>
                </Select>
                {errors.shiftType && <p className="text-sm text-red-500">{errors.shiftType}</p>}
              </div>

              {/* Planned Trips */}
              <div className="space-y-2">
                <Label htmlFor="totalTripsPlanned" className="text-base font-medium">
                  Planned Trips Today <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="totalTripsPlanned"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="8"
                  value={formData.totalTripsPlanned || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalTripsPlanned: parseInt(e.target.value) || 0 }))}
                  className={`h-12 text-lg ${errors.totalTripsPlanned ? 'border-red-500' : ''}`}
                />
                {errors.totalTripsPlanned && <p className="text-sm text-red-500">{errors.totalTripsPlanned}</p>}
              </div>

              {/* Odometer Reading */}
              <div className="space-y-2">
                <Label htmlFor="odometerStart" className="text-base font-medium flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Starting Odometer (km) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="odometerStart"
                  type="number"
                  min="0"
                  placeholder="12345"
                  value={formData.odometerStart || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, odometerStart: parseInt(e.target.value) || 0 }))}
                  className={`h-12 text-lg ${errors.odometerStart ? 'border-red-500' : ''}`}
                />
                {errors.odometerStart && <p className="text-sm text-red-500">{errors.odometerStart}</p>}
              </div>

              {/* Fuel/Battery Level */}
              <div className="space-y-2">
                <Label htmlFor="batteryLevel" className="text-base font-medium flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  {formData.vehicleCategory === 'electric' ? 'Battery Level (%)' : 'Fuel Level (%)'}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="batteryLevel"
                    type="range"
                    min="0"
                    max="100"
                    value={formData.batteryLevel || 100}
                    onChange={(e) => setFormData(prev => ({ ...prev, batteryLevel: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="min-w-[60px] text-center">
                    {formData.batteryLevel || 100}%
                  </Badge>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              🚀 Start Shift & Begin Trip Tracking
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
