import React, { useMemo, useState } from 'react';
import { config } from '../../../config/environment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, 
  FileText, 
  File, 
  Calendar as CalendarIcon,
  Filter,
  CheckCircle,
  Clock,
  Users,
  Car,
  TrendingUp,
  Settings
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface ExportFilter {
  dateRange: { from?: Date; to?: Date };
  rideTypes: string[];
  paymentStatus: string[];
  vehicleNumbers: string[];
  exportFields: string[];
  format: 'csv' | 'excel' | 'pdf';
}

export const ExportBookings: React.FC = () => {
  const [filters, setFilters] = useState<ExportFilter>({
    dateRange: { 
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    },
    rideTypes: ['airport', 'rental', 'subscription'],
    paymentStatus: ['paid', 'pending', 'partial'],
    vehicleNumbers: [],
    exportFields: [
      'bookingId',
      'customerName',
      'customerPhone',
      'pickupLocation',
      'dropLocation',
      'scheduledDateTime',
      'actualDateTime',
      'vehicleNumber',
      'driverName',
      'fare',
      'distance',
      'rideType',
      'paymentMethod',
      'paymentStatus'
    ],
    format: 'excel'
  });

  const [isExporting, setIsExporting] = useState(false);

  const exportOptions = [
    {
      id: 'scheduled',
      title: 'Scheduled Rides Export',
      description: 'Export all future scheduled bookings',
      icon: Clock,
      color: 'bg-orange-100 text-orange-800',
      count: config.IS_DEVELOPMENT ? 24 : undefined
    },
    {
      id: 'completed',
      title: 'Completed Rides Export',
      description: 'Export historical ride data',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      count: config.IS_DEVELOPMENT ? 156 : undefined
    },
    {
      id: 'customers',
      title: 'Customer Database',
      description: 'Export customer information and booking history',
      icon: Users,
      color: 'bg-blue-100 text-blue-800',
      count: config.IS_DEVELOPMENT ? 89 : undefined
    },
    {
      id: 'vehicles',
      title: 'Vehicle Performance',
      description: 'Export vehicle utilization and performance data',
      icon: Car,
      color: 'bg-purple-100 text-purple-800',
      count: config.IS_DEVELOPMENT ? 12 : undefined
    },
    {
      id: 'revenue',
      title: 'Revenue Report',
      description: 'Export financial and revenue analytics',
      icon: TrendingUp,
      color: 'bg-emerald-100 text-emerald-800',
      count: config.IS_DEVELOPMENT ? 1 : undefined
    }
  ];

  const availableFields = [
    { id: 'bookingId', label: 'Booking ID', category: 'Basic' },
    { id: 'customerName', label: 'Customer Name', category: 'Customer' },
    { id: 'customerPhone', label: 'Customer Phone', category: 'Customer' },
    { id: 'customerEmail', label: 'Customer Email', category: 'Customer' },
    { id: 'pickupLocation', label: 'Pickup Location', category: 'Route' },
    { id: 'dropLocation', label: 'Drop Location', category: 'Route' },
    { id: 'scheduledDateTime', label: 'Scheduled Date/Time', category: 'Timing' },
    { id: 'actualDateTime', label: 'Actual Date/Time', category: 'Timing' },
    { id: 'duration', label: 'Ride Duration', category: 'Timing' },
    { id: 'vehicleNumber', label: 'Vehicle Number', category: 'Vehicle' },
    { id: 'driverName', label: 'Driver Name', category: 'Vehicle' },
    { id: 'fare', label: 'Fare Amount', category: 'Payment' },
    { id: 'distance', label: 'Distance Covered', category: 'Route' },
    { id: 'rideType', label: 'Ride Type', category: 'Basic' },
    { id: 'paymentMethod', label: 'Payment Method', category: 'Payment' },
    { id: 'paymentStatus', label: 'Payment Status', category: 'Payment' },
    { id: 'rating', label: 'Customer Rating', category: 'Feedback' },
    { id: 'feedback', label: 'Customer Feedback', category: 'Feedback' }
  ];

  const fieldCategories = Array.from(new Set(availableFields.map(field => field.category)));

  const handleExport = async (exportType: string) => {
    setIsExporting(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create and download file
    const filename = `${exportType}_export_${format(new Date(), 'yyyy-MM-dd')}.${filters.format}`;
    
    // In a real app, this would make an API call to generate and download the file
    console.log('Exporting:', {
      type: exportType,
      filters,
      filename
    });
    
    setIsExporting(false);
  };

  const toggleField = (fieldId: string) => {
    setFilters(prev => ({
      ...prev,
      exportFields: prev.exportFields.includes(fieldId)
        ? prev.exportFields.filter(f => f !== fieldId)
        : [...prev.exportFields, fieldId]
    }));
  };

  const toggleRideType = (rideType: string) => {
    setFilters(prev => ({
      ...prev,
      rideTypes: prev.rideTypes.includes(rideType)
        ? prev.rideTypes.filter(t => t !== rideType)
        : [...prev.rideTypes, rideType]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Export Bookings</h2>
          <p className="text-gray-600">Download booking data in various formats</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {filters.exportFields.length} fields selected
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Quick Export Options
              </CardTitle>
              <CardDescription>
                Choose from predefined export templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{option.title}</h3>
                        <p className="text-sm text-gray-500">{option.description}</p>
                        <Badge className={`${option.color} text-xs mt-1`}>
                          {option.count} records
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleExport(option.id)}
                      disabled={isExporting}
                      className="gap-2"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Export
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Custom Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Custom Export
              </CardTitle>
              <CardDescription>
                Configure custom export with specific filters and fields
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {filters.dateRange.from 
                          ? `${format(filters.dateRange.from, 'MMM dd')} - ${format(filters.dateRange.to || new Date(), 'MMM dd')}`
                          : 'Select date range'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={filters.dateRange.from && filters.dateRange.to ? {from: filters.dateRange.from, to: filters.dateRange.to} : undefined}
                        onSelect={(range) => setFilters(prev => ({ ...prev, dateRange: range || {} }))}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Ride Types */}
              <div>
                <label className="text-sm font-medium mb-2 block">Ride Types</label>
                <div className="flex gap-2">
                  {['airport', 'rental', 'subscription'].map(type => (
                    <label key={type} className="flex items-center gap-2">
                      <Checkbox 
                        checked={filters.rideTypes.includes(type)}
                        onCheckedChange={() => toggleRideType(type)}
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Format */}
              <div>
                <label className="text-sm font-medium mb-2 block">Export Format</label>
                <Select 
                  value={filters.format} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, format: value as any }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="pdf">PDF Report (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => handleExport('custom')}
                disabled={isExporting}
                className="w-full gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generate Custom Export
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Field Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Fields</CardTitle>
              <CardDescription>
                Select which data fields to include in the export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {fieldCategories.map(category => (
                <div key={category}>
                  <h4 className="font-medium text-sm text-gray-900 mb-2">{category}</h4>
                  <div className="space-y-2 pl-2">
                    {availableFields
                      .filter(field => field.category === category)
                      .map(field => (
                        <label key={field.id} className="flex items-center gap-2">
                          <Checkbox 
                            checked={filters.exportFields.includes(field.id)}
                            onCheckedChange={() => toggleField(field.id)}
                          />
                          <span className="text-sm">{field.label}</span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Exports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">Completed Rides</p>
                    <p className="text-gray-500">Today, 2:30 PM</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">Revenue Report</p>
                    <p className="text-gray-500">Yesterday, 5:45 PM</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExportBookings;
