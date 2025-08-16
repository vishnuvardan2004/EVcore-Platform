
import React, { useEffect, useState } from 'react';
import { ChargingTrackerLayout } from '../components/ChargingTrackerLayout';
import { PageLayout } from '../../../components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download, FileText, Eye } from 'lucide-react';

interface ChargingSession {
  id: string;
  vehicleNumber: string;
  pilotId: string;
  startTime: string;
  endTime: string;
  startCharge: number;
  endCharge: number;
  startRange: number;
  endRange: number;
  units: number;
  cost: number;
  paymentMode: 'UPI' | 'Cash';
  location: 'HUB' | 'Outside';
  locationName?: string;
  brand?: string;
  hasReceipt: boolean;
}

const sampleSessions: ChargingSession[] = [
  { id: '1', vehicleNumber: 'KA01AB1234', pilotId: 'P001', startTime: '2024-01-15 09:30', endTime: '2024-01-15 11:45', startCharge: 25, endCharge: 85, startRange: 80, endRange: 280, units: 45.5, cost: 320, paymentMode: 'UPI', location: 'HUB', hasReceipt: true },
];

const ChargingHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sessions, setSessions] = useState<ChargingSession[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // TODO: replace with real endpoint: GET /api/v1/charging/sessions?filters
        const data = import.meta.env.MODE === 'development' ? sampleSessions : [];
        if (!cancelled) setSessions(data);
      } catch (_e) {
        if (!cancelled) setSessions([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.pilotId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'all' || session.location === locationFilter;
    const matchesPayment = paymentFilter === 'all' || session.paymentMode === paymentFilter;
    
    return matchesSearch && matchesLocation && matchesPayment;
  });

  const handleExportCSV = () => {
    const headers = [
      'Vehicle Number', 'Pilot ID', 'Start Time', 'End Time', 
      'Start Charge %', 'End Charge %', 'Start Range', 'End Range',
      'Units', 'Cost', 'Payment Mode', 'Location'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredSessions.map(session => [
        session.vehicleNumber,
        session.pilotId,
        session.startTime,
        session.endTime,
        session.startCharge,
        session.endCharge,
        session.startRange,
        session.endRange,
        session.units,
        session.cost,
        session.paymentMode,
        session.location
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'charging-history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewDetails = (session: ChargingSession) => {
    console.log('View details for session:', session);
    // TODO: Open detailed modal
  };

  return (
    <ChargingTrackerLayout 
      title="⚡ Charging History" 
      subtitle="View all completed charging sessions"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div></div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
            <CardDescription>Filter charging sessions by vehicle, pilot, or other criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Vehicle number or Pilot ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="HUB">🏢 HUB</SelectItem>
                    <SelectItem value="Outside">🌍 Outside</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All payment modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Modes</SelectItem>
                    <SelectItem value="UPI">📱 UPI</SelectItem>
                    <SelectItem value="Cash">💵 Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('all');
                    setPaymentFilter('all');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Charging Sessions ({filteredSessions.length})</CardTitle>
            <CardDescription>
              Click on any row to view detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Pilot ID</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Charge %</TableHead>
                    <TableHead>Range (km)</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow 
                      key={session.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewDetails(session)}
                    >
                      <TableCell className="font-medium">{session.vehicleNumber}</TableCell>
                      <TableCell>{session.pilotId}</TableCell>
                      <TableCell>{session.startTime}</TableCell>
                      <TableCell>{session.endTime}</TableCell>
                      <TableCell>{session.startCharge}% → {session.endCharge}%</TableCell>
                      <TableCell>{session.startRange} → {session.endRange}</TableCell>
                      <TableCell>{session.units} kWh</TableCell>
                      <TableCell>₹{session.cost}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.paymentMode === 'UPI' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {session.paymentMode === 'UPI' ? '📱' : '💵'} {session.paymentMode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.location === 'HUB' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {session.location === 'HUB' ? '🏢' : '🌍'} {session.location}
                        </span>
                      </TableCell>
                      <TableCell>
                        {session.hasReceipt ? (
                          <span className="text-green-600">📎</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(session);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredSessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No charging sessions found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ChargingTrackerLayout>
  );
};

export default ChargingHistory;
