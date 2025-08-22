
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileCheck, Search, Download, User, Settings, FileText, LogIn, LogOut } from 'lucide-react';

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const auditLogs = [
    {
      id: 1,
      timestamp: '2024-01-15 14:30:25',
      user: 'admin@evcore.com',
      action: 'LOGIN',
      description: 'User logged into the system',
      ipAddress: '192.168.1.100',
      module: 'Authentication',
      severity: 'info',
      icon: LogIn
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:32:10',
      user: 'admin@evcore.com',
      action: 'DRIVER_CREATED',
      description: 'New driver profile created: John Doe (ID: DR001)',
      ipAddress: '192.168.1.100',
      module: 'Driver Induction',
      severity: 'success',
      icon: User
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:45:18',
      user: 'supervisor@evcore.com',
      action: 'VEHICLE_DEPLOYED',
      description: 'Vehicle KA-01-AB-1234 deployed for trip',
      ipAddress: '192.168.1.105',
      module: 'Vehicle Tracker',
      severity: 'info',
      icon: FileText
    },
    {
      id: 4,
      timestamp: '2024-01-15 15:20:33',
      user: 'admin@evcore.com',
      action: 'REPORT_EXPORTED',
      description: 'Global trip report exported (CSV format)',
      ipAddress: '192.168.1.100',
      module: 'Reports',
      severity: 'info',
      icon: Download
    },
    {
      id: 5,
      timestamp: '2024-01-15 15:45:22',
      user: 'admin@evcore.com',
      action: 'SETTINGS_MODIFIED',
      description: 'Module visibility settings updated',
      ipAddress: '192.168.1.100',
      module: 'Admin Panel',
      severity: 'warning',
      icon: Settings
    },
    {
      id: 6,
      timestamp: '2024-01-15 16:10:45',
      user: 'supervisor@evcore.com',
      action: 'LOGOUT',
      description: 'User logged out of the system',
      ipAddress: '192.168.1.105',
      module: 'Authentication',
      severity: 'info',
      icon: LogOut
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredLogs = auditLogs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
          <p className="text-gray-600">System activity logs including logins, submissions, edits, and exports</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Monitor all system activities and user actions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search logs by user, action, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">156</div>
                <div className="text-sm text-blue-700">Total Actions Today</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-sm text-green-700">Active Users</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <div className="text-sm text-yellow-700">Warning Events</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">0</div>
                <div className="text-sm text-red-700">Error Events</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Timestamp</th>
                    <th className="text-left p-4 font-medium text-gray-900">User</th>
                    <th className="text-left p-4 font-medium text-gray-900">Action</th>
                    <th className="text-left p-4 font-medium text-gray-900">Description</th>
                    <th className="text-left p-4 font-medium text-gray-900">Module</th>
                    <th className="text-left p-4 font-medium text-gray-900">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{log.timestamp}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">{log.user}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <log.icon className="w-4 h-4 text-gray-600" />
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.action}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{log.description}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {log.module}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-mono">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No logs found matching your search criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditLogs;
