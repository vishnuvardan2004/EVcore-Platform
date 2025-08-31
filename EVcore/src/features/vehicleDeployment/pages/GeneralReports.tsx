
import React, { useState } from 'react';
import { VehicleTrackerLayout } from '../components/VehicleTrackerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const handleGenerateReport = () => {
    console.log('Generating report:', { reportType, dateFrom, dateTo, selectedVehicle });
    // Report generation logic will be implemented here
  };

  return (
    <VehicleTrackerLayout 
      title="📄 General Reports" 
      subtitle="Generate trip summaries, duration reports, and export data"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generate Report
            </CardTitle>
            <CardDescription>
              Create detailed reports for vehicles, drivers, or date ranges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vehicle">Vehicle Summary</SelectItem>
                    <SelectItem value="driver">Driver Summary</SelectItem>
                    <SelectItem value="trips">All Trips</SelectItem>
                    <SelectItem value="duration">Duration Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle-select">Vehicle (Optional)</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VH001">VH001</SelectItem>
                    <SelectItem value="VH002">VH002</SelectItem>
                    <SelectItem value="VH003">VH003</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleGenerateReport} className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Generate PDF Report
              </Button>
              <Button variant="outline" onClick={handleGenerateReport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Vehicle VH001 Summary</p>
                  <p className="text-sm text-gray-600">Generated on Dec 20, 2025</p>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">All Trips - Last 7 Days</p>
                  <p className="text-sm text-gray-600">Generated on Dec 19, 2025</p>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </VehicleTrackerLayout>
  );
};

export default Reports;
