import React, { useEffect, useState } from 'react';
import { ChargingTrackerLayout } from '../components/ChargingTrackerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, User, TrendingUp, MapPin } from 'lucide-react';

interface SummaryData {
  id: string;
  name: string;
  totalSessions: number;
  totalUnits: number;
  totalCost: number;
  averageCostPerUnit: number;
  mostUsedLocation: string;
}

// API placeholder; keep sample data only in development
const sampleVehicleSummary: SummaryData[] = [
  { id: 'KA01AB1234', name: 'KA01AB1234', totalSessions: 15, totalUnits: 682.5, totalCost: 4800, averageCostPerUnit: 7.03, mostUsedLocation: 'HUB' },
  { id: 'KA02CD5678', name: 'KA02CD5678', totalSessions: 8, totalUnits: 416.0, totalCost: 3600, averageCostPerUnit: 8.65, mostUsedLocation: 'Outside' },
];
const samplePilotSummary: SummaryData[] = [
  { id: 'P001', name: 'P001', totalSessions: 22, totalUnits: 978.5, totalCost: 6800, averageCostPerUnit: 6.95, mostUsedLocation: 'HUB' },
];

const ChargingSummary = () => {
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState<'vehicle' | 'pilot'>('vehicle');
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // TODO: replace with real endpoint: GET /api/v1/charging/summary?groupBy=
        const data = import.meta.env.MODE === 'development'
          ? (groupBy === 'vehicle' ? sampleVehicleSummary : samplePilotSummary)
          : [];
        if (!cancelled) setSummaryData(data);
      } catch (_e) {
        if (!cancelled) setSummaryData([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [groupBy]);
  
  const totalSessions = summaryData.reduce((sum, item) => sum + item.totalSessions, 0);
  const totalUnits = summaryData.reduce((sum, item) => sum + item.totalUnits, 0);
  const totalCost = summaryData.reduce((sum, item) => sum + item.totalCost, 0);
  const overallAverage = totalCost / totalUnits;

  return (
    <ChargingTrackerLayout 
      title="📈 Charging Summary" 
      subtitle="Aggregated charging data and analytics"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div></div>
          
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Group by:</label>
            <Select value={groupBy} onValueChange={(value: 'vehicle' | 'pilot') => setGroupBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vehicle">🚗 Vehicle</SelectItem>
                <SelectItem value="pilot">👨‍✈️ Pilot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{totalSessions}</p>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="text-2xl">⚡</div>
                <div>
                  <p className="text-2xl font-bold">{totalUnits.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Total kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="text-2xl">💰</div>
                <div>
                  <p className="text-2xl font-bold">₹{totalCost.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Cost</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="text-2xl">📊</div>
                <div>
                  <p className="text-2xl font-bold">₹{overallAverage.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Avg. Cost/kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Summary Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {groupBy === 'vehicle' ? <Car className="w-5 h-5" /> : <User className="w-5 h-5" />}
              Summary by {groupBy === 'vehicle' ? 'Vehicle' : 'Pilot'}
            </CardTitle>
            <CardDescription>
              Detailed breakdown of charging data for each {groupBy}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {summaryData.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {groupBy === 'vehicle' ? <Car className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Sessions</p>
                        <p className="font-semibold text-lg">{item.totalSessions}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Units</p>
                        <p className="font-semibold text-lg">{item.totalUnits.toFixed(1)} kWh</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Cost</p>
                        <p className="font-semibold text-lg">₹{item.totalCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg. Cost/kWh</p>
                        <p className="font-semibold text-lg">₹{item.averageCostPerUnit.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Most Used Location:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.mostUsedLocation === 'HUB' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.mostUsedLocation === 'HUB' ? '🏢' : '🌍'} {item.mostUsedLocation}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {summaryData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No summary data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ChargingTrackerLayout>
  );
};

export default ChargingSummary;
