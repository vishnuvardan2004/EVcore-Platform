
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  BarChart, 
  Users, 
  Car, 
  Battery, 
  FileCheck,
  Calendar as CalendarIcon,
  Filter,
  DollarSign,
  UserCheck,
  Database,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface FilterState {
  vehicleNumber: string;
  pilotName: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  purpose: string;
  reportType: string;
}

const GlobalReports = () => {
  const [filters, setFilters] = useState<FilterState>({
    vehicleNumber: '',
    pilotName: '',
    dateFrom: undefined,
    dateTo: undefined,
    purpose: '',
    reportType: ''
  });

  const [showDatePicker, setShowDatePicker] = useState({ from: false, to: false });

  const reportSections = [
    {
      id: 'vehicle-deployment',
      title: 'Vehicle Deployment Tracker',
      description: 'Complete vehicle deployment and trip analytics',
      icon: Car,
      color: 'blue',
      reports: [
        { name: 'Vehicle Trip Summary', format: 'CSV, PDF' },
        { name: 'Driver Performance Report', format: 'CSV, PDF' }
      ],
      stats: { total: '1,234', today: '45', active: '89%' }
    },
    {
      id: 'driver-trips',
      title: 'Driver Trip Details',
      description: 'Shift summaries and earnings breakdown',
      icon: Users,
      color: 'green',
      reports: [
        { name: 'Shift Summary', format: 'CSV, PDF' },
        { name: 'Earnings Breakdown', format: 'CSV, PDF, Excel' }
      ],
      stats: { total: '567', today: '23', active: '92%' }
    },
    {
      id: 'offline-bookings',
      title: 'Offline Bookings',
      description: 'Airport, rental, and subscription booking reports',
      icon: FileText,
      color: 'purple',
      reports: [
        { name: 'Airport Booking Summary', format: 'CSV, PDF' },
        { name: 'Rental Package Report', format: 'CSV, PDF' },
        { name: 'Subscription Summary', format: 'CSV, PDF' }
      ],
      stats: { total: '890', today: '34', active: '87%' }
    },
    {
      id: 'charging-tracker',
      title: 'Vehicle Charging Tracker',
      description: 'Charging history and cost analysis',
      icon: Battery,
      color: 'yellow',
      reports: [
        { name: 'Charging History', format: 'CSV, PDF' },
        { name: 'Cost & Unit Report', format: 'CSV, PDF, Excel' }
      ],
      stats: { total: '2,345', today: '67', active: '94%' }
    },
    {
      id: 'driver-induction',
      title: 'Driver Induction',
      description: 'New pilot onboarding and profile summaries',
      icon: UserCheck,
      color: 'indigo',
      reports: [
        { name: 'New Pilot Onboard Summary', format: 'CSV, PDF' }
      ],
      stats: { total: '78', today: '3', active: '100%' }
    },
    {
      id: 'attendance',
      title: 'Attendance',
      description: 'Pilot and staff attendance tracking',
      icon: Activity,
      color: 'pink',
      reports: [
        { name: 'Pilot Attendance Report', format: 'CSV, PDF' },
        { name: 'Staff Attendance Report', format: 'CSV, PDF' }
      ],
      stats: { total: '156', today: '12', active: '96%' }
    },
    {
      id: 'database',
      title: 'Database Summary',
      description: 'Staff and pilot database overview',
      icon: Database,
      color: 'cyan',
      reports: [
        { name: 'Staff Summary Table', format: 'CSV, PDF, Excel' },
        { name: 'Pilot Summary Table', format: 'CSV, PDF, Excel' }
      ],
      stats: { total: '234', today: '8', active: '98%' }
    },
    {
      id: 'system-activity',
      title: 'System Activity & Financial',
      description: 'Audit logs and financial summaries',
      icon: BarChart,
      color: 'orange',
      reports: [
        { name: 'Audit Logs Report', format: 'CSV, PDF' },
        { name: 'Financial Summary', format: 'CSV, PDF, Excel' }
      ],
      stats: { total: '3,456', today: '89', active: '91%' }
    }
  ];

  const purposeOptions = ['Office', 'Pilot', 'Rental', 'Airport', 'Subscription', 'Maintenance'];
  const reportTypeOptions = ['All Reports', 'Vehicle Reports', 'Driver Reports', 'Financial Reports', 'System Reports'];

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    // Filter logic will be implemented here
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      pink: 'text-pink-600 bg-pink-50 border-pink-200',
      cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Reports Dashboard</h1>
          <p className="text-gray-600">Comprehensive reporting across all EVCORE platform modules</p>
        </div>

        {/* Global Filter Bar - Sticky */}
        <div className="sticky top-0 z-10 bg-white rounded-lg shadow-sm border mb-8 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Global Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
            {/* Vehicle Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Vehicle Number</label>
              <Select value={filters.vehicleNumber} onValueChange={(value) => setFilters({...filters, vehicleNumber: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KA-01-AB-1234">KA-01-AB-1234</SelectItem>
                  <SelectItem value="KA-01-AB-5678">KA-01-AB-5678</SelectItem>
                  <SelectItem value="KA-01-CD-9012">KA-01-CD-9012</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pilot Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pilot Name/ID</label>
              <Select value={filters.pilotName} onValueChange={(value) => setFilters({...filters, pilotName: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pilot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DR001">John Doe (DR001)</SelectItem>
                  <SelectItem value="DR002">Jane Smith (DR002)</SelectItem>
                  <SelectItem value="DR003">Mike Wilson (DR003)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date From</label>
              <Popover open={showDatePicker.from} onOpenChange={(open) => setShowDatePicker({...showDatePicker, from: open})}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => {
                      setFilters({...filters, dateFrom: date});
                      setShowDatePicker({...showDatePicker, from: false});
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date To</label>
              <Popover open={showDatePicker.to} onOpenChange={(open) => setShowDatePicker({...showDatePicker, to: open})}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => {
                      setFilters({...filters, dateTo: date});
                      setShowDatePicker({...showDatePicker, to: false});
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Purpose/Trip Type</label>
              <Select value={filters.purpose} onValueChange={(value) => setFilters({...filters, purpose: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {purposeOptions.map((purpose) => (
                    <SelectItem key={purpose} value={purpose.toLowerCase()}>{purpose}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Report Type</label>
              <Select value={filters.reportType} onValueChange={(value) => setFilters({...filters, reportType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All reports" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypeOptions.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase().replace(' ', '-')}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={() => setFilters({
              vehicleNumber: '', pilotName: '', dateFrom: undefined, dateTo: undefined, purpose: '', reportType: ''
            })}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Report Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reportSections.map((section) => (
            <Card key={section.id} className={`hover:shadow-lg transition-all duration-200 border-l-4 ${getColorClasses(section.color)}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getColorClasses(section.color)}`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{section.stats.total}</div>
                    <div className="text-xs text-gray-600">Total Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{section.stats.today}</div>
                    <div className="text-xs text-gray-600">Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{section.stats.active}</div>
                    <div className="text-xs text-gray-600">Accuracy</div>
                  </div>
                </div>

                {/* Report List */}
                <div className="space-y-3">
                  {section.reports.map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-gray-900">{report.name}</div>
                        <div className="text-sm text-gray-600">Format: {report.format}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          CSV
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        {report.format.includes('Excel') && (
                          <Button size="sm" variant="outline">
                            <BarChart className="w-4 h-4 mr-1" />
                            Excel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Statistics */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-blue-600" />
                Global Platform Statistics
              </CardTitle>
              <CardDescription>Overall performance metrics across all modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">8,957</div>
                  <div className="text-sm text-blue-700">Total Reports</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">281</div>
                  <div className="text-sm text-green-700">Today's Activity</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">45</div>
                  <div className="text-sm text-purple-700">Active Drivers</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">156</div>
                  <div className="text-sm text-yellow-700">Vehicles</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">92%</div>
                  <div className="text-sm text-indigo-700">System Uptime</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">₹2.4L</div>
                  <div className="text-sm text-pink-700">Monthly Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GlobalReports;
