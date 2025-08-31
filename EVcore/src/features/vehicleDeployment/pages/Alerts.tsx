import React, { useState, useEffect } from 'react';
import { VehicleTrackerLayout } from '../components/VehicleTrackerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Eye, 
  Clock, 
  CheckSquare, 
  XSquare, 
  ArrowRightLeft, 
  RefreshCw,
  Calendar,
  User,
  Car,
  Search,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { vehicleService, alertService } from '../../../services/database';
import { Deployment, DriverChecklist, VehicleChecklist } from '../../../types/vehicle';
import { useToast } from '../../../hooks/use-toast';

export interface AlertData {
  id: string;
  vehicleNumber: string;
  timestamp: string;
  type: 'checklist_unchecked' | 'checklist_mismatch' | 'overdue_return';
  category: 'driver_checklist' | 'vehicle_checklist' | 'deployment_issue';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  details: string;
  affectedItems?: string[];
  status: 'resolved' | 'acknowledged' | 'unresolved';
  deploymentId: string;
  supervisorName?: string;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingAlerts, setUpdatingAlerts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Helper function to analyze driver checklist
  const analyzeDriverChecklist = (checklist: DriverChecklist | undefined, deployment: Deployment): AlertData[] => {
    const alerts: AlertData[] = [];
    
    if (!checklist) return alerts;

    const checklistItems = [
      { key: 'idCard', label: 'ID Card', required: true },
      { key: 'uniform', label: 'Proper Uniform', required: true },
      { key: 'shoes', label: 'Proper Shoes', required: true },
      { key: 'groomed', label: 'Well Groomed', required: true }
    ];

    checklistItems.forEach(item => {
      if (!checklist[item.key as keyof DriverChecklist]) {
        alerts.push({
          id: `${deployment.id}-driver-${item.key}`,
          vehicleNumber: deployment.vehicleNumber,
          timestamp: deployment.outTimestamp || new Date().toISOString(),
          type: 'checklist_unchecked',
          category: 'driver_checklist',
          severity: item.required ? 'high' : 'medium',
          title: `Driver Checklist: ${item.label} Unchecked`,
          description: `Supervisor did not check ${item.label.toLowerCase()} for the driver`,
          details: `The supervisor ${deployment.outData?.supervisorName || 'Unknown'} did not mark ${item.label} as checked during vehicle OUT process. This could indicate the driver was not properly prepared.`,
          affectedItems: [item.label],
          status: 'unresolved',
          deploymentId: deployment.id,
          supervisorName: deployment.outData?.supervisorName
        });
      }
    });

    return alerts;
  };

  // Helper function to analyze vehicle checklist
  const analyzeVehicleChecklist = (outChecklist: VehicleChecklist | undefined, inChecklist: VehicleChecklist | undefined, deployment: Deployment): AlertData[] => {
    const alerts: AlertData[] = [];

    if (!outChecklist || !inChecklist) return alerts;

    const checklistItems = [
      { key: 'fireExtinguisher', label: 'Fire Extinguisher' },
      { key: 'stepney', label: 'Stepney' },
      { key: 'carFreshener', label: 'Car Freshener' },
      { key: 'cleaningCloth', label: 'Cleaning Cloth' },
      { key: 'umbrella', label: 'Umbrella' },
      { key: 'torch', label: 'Torch' }
    ];

    checklistItems.forEach(item => {
      const outValue = outChecklist[item.key as keyof VehicleChecklist];
      const inValue = inChecklist[item.key as keyof VehicleChecklist];
      
      if (outValue !== inValue) {
        alerts.push({
          id: `${deployment.id}-vehicle-${item.key}`,
          vehicleNumber: deployment.vehicleNumber,
          timestamp: deployment.inTimestamp || new Date().toISOString(),
          type: 'checklist_mismatch',
          category: 'vehicle_checklist',
          severity: 'medium',
          title: `Vehicle Checklist: ${item.label} Mismatch`,
          description: `${item.label} status changed between OUT and IN`,
          details: `${item.label} was ${outValue ? 'present' : 'missing'} during OUT but ${inValue ? 'present' : 'missing'} during IN. This could indicate loss or damage during deployment.`,
          affectedItems: [item.label],
          status: 'unresolved',
          deploymentId: deployment.id,
          supervisorName: deployment.inData?.inSupervisorName
        });
      }
    });

    return alerts;
  };

  // Helper function to check overdue returns
  const checkOverdueReturns = (deployment: Deployment): AlertData[] => {
    const alerts: AlertData[] = [];
    
    if (deployment.direction === 'OUT' && !deployment.inTimestamp) {
      const outTime = new Date(deployment.outTimestamp || '');
      const now = new Date();
      const hoursOut = (now.getTime() - outTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursOut > 8) { // Consider overdue after 8 hours
        alerts.push({
          id: `${deployment.id}-overdue`,
          vehicleNumber: deployment.vehicleNumber,
          timestamp: deployment.outTimestamp || new Date().toISOString(),
          type: 'overdue_return',
          category: 'deployment_issue',
          severity: hoursOut > 12 ? 'high' : 'medium',
          title: 'Vehicle Overdue for Return',
          description: `Vehicle has been out for ${Math.round(hoursOut)} hours`,
          details: `Vehicle ${deployment.vehicleNumber} was deployed ${Math.round(hoursOut)} hours ago and has not been returned. Expected return time has been exceeded.`,
          affectedItems: [`${Math.round(hoursOut)} hours overdue`],
          status: 'unresolved',
          deploymentId: deployment.id,
          supervisorName: deployment.outData?.supervisorName
        });
      }
    }

    return alerts;
  };

  // Fetch alerts from deployments
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const deployments = await vehicleService.getDeploymentHistory();
      const allAlerts: AlertData[] = [];

      deployments.forEach(deployment => {
        // Analyze driver checklist
        if (deployment.outData?.driverChecklist) {
          allAlerts.push(...analyzeDriverChecklist(deployment.outData.driverChecklist, deployment));
        }

        // Analyze vehicle checklist mismatches
        if (deployment.outData?.vehicleChecklist && deployment.inData?.vehicleChecklist) {
          allAlerts.push(...analyzeVehicleChecklist(deployment.outData.vehicleChecklist, deployment.inData.vehicleChecklist, deployment));
        }

        // Check for overdue returns
        allAlerts.push(...checkOverdueReturns(deployment));
      });

      // Load persisted alert statuses and apply them
      const alertStatuses = await alertService.getAllAlertStatuses();
      const statusMap = new Map(alertStatuses.map(status => [status.alertId, status.status]));

      // Apply persisted statuses to alerts
      allAlerts.forEach(alert => {
        const persistedStatus = statusMap.get(alert.id);
        if (persistedStatus) {
          alert.status = persistedStatus;
        }
      });

      // Sort alerts by timestamp (newest first)
      allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Filter alerts based on current filters
  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSeverity && matchesStatus && matchesSearch;
  });

  // Helper functions for UI
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'checklist_unchecked': return <XSquare className="w-4 h-4 text-red-500" />;
      case 'checklist_mismatch': return <ArrowRightLeft className="w-4 h-4 text-orange-500" />;
      case 'overdue_return': return <Clock className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      checklist_unchecked: { label: 'Unchecked', color: 'bg-red-100 text-red-800' },
      checklist_mismatch: { label: 'Mismatch', color: 'bg-orange-100 text-orange-800' },
      overdue_return: { label: 'Overdue', color: 'bg-red-100 text-red-800' }
    };
    
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={`${typeInfo.color} text-xs`}>{typeInfo.label}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const severityMap = {
      high: { label: 'High', color: 'bg-red-100 text-red-800' },
      medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Low', color: 'bg-blue-100 text-blue-800' }
    };
    
    const severityInfo = severityMap[severity as keyof typeof severityMap] || { label: severity, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={`${severityInfo.color} text-xs`}>{severityInfo.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      unresolved: { label: 'Unresolved', color: 'bg-red-100 text-red-800' },
      acknowledged: { label: 'Acknowledged', color: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={`${statusInfo.color} text-xs`}>{statusInfo.label}</Badge>;
  };

  // Alert action handlers
  const handleViewDetails = (alertId: string) => {
    console.log('View details for alert:', alertId);
    // Implementation for viewing alert details
  };

  const handleMarkAcknowledged = async (alertId: string) => {
    setUpdatingAlerts(prev => new Set(prev).add(alertId));
    try {
      // Update in database first
      await alertService.updateAlertStatus(alertId, 'acknowledged', 'Current User');
      
      // Then update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'acknowledged' as const }
          : alert
      ));

      toast({
        title: "Alert Acknowledged",
        description: "Alert has been marked as acknowledged successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const handleMarkResolved = async (alertId: string) => {
    setUpdatingAlerts(prev => new Set(prev).add(alertId));
    try {
      // Update in database first
      await alertService.updateAlertStatus(alertId, 'resolved', 'Current User');
      
      // Then update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved' as const }
          : alert
      ));

      toast({
        title: "Alert Resolved",
        description: "Alert has been marked as resolved successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  return (
    <VehicleTrackerLayout 
      title="🚨 Deployment Alerts" 
      subtitle="Monitor checklist issues, overdue returns, and deployment warnings"
    >
      <div className="space-y-6">
        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-red-600 text-sm font-medium">Unresolved Alerts</p>
                  <p className="text-2xl font-bold text-red-900">
                    {loading ? '...' : filteredAlerts.filter(a => a.status === 'unresolved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-green-600 text-sm font-medium">Resolved</p>
                  <p className="text-2xl font-bold text-green-900">
                    {loading ? '...' : filteredAlerts.filter(a => a.status === 'resolved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Alerts</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {loading ? '...' : filteredAlerts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-64">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="checklist_unchecked">Unchecked</SelectItem>
                  <SelectItem value="checklist_mismatch">Mismatch</SelectItem>
                  <SelectItem value="overdue_return">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterType('all');
                  setFilterSeverity('all');
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2"
              >
                Clear Filters
              </Button>

              <Button 
                onClick={fetchAlerts}
                variant="outline"
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Active Alerts
                </CardTitle>
                <CardDescription>
                  {filteredAlerts.length} alerts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getTypeIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">{alert.title}</h3>
                            {getTypeBadge(alert.type)}
                            {getSeverityBadge(alert.severity)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              {alert.vehicleNumber}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(alert.timestamp).toLocaleDateString()}
                            </div>
                            {alert.supervisorName && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {alert.supervisorName}
                              </div>
                            )}
                          </div>
                          {alert.affectedItems && alert.affectedItems.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Affected Items:</p>
                              <div className="flex flex-wrap gap-1">
                                {alert.affectedItems.map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(alert.status)}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleViewDetails(alert.id)}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          {alert.status === 'unresolved' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 bg-yellow-50 hover:bg-yellow-100"
                                onClick={() => handleMarkAcknowledged(alert.id)}
                                disabled={updatingAlerts.has(alert.id)}
                              >
                                <CheckSquare className="w-3 h-3" />
                                {updatingAlerts.has(alert.id) ? 'Acknowledging...' : 'Acknowledge'}
                              </Button>
                              <Button
                                size="sm"
                                className="gap-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleMarkResolved(alert.id)}
                                disabled={updatingAlerts.has(alert.id)}
                              >
                                <CheckSquare className="w-3 h-3" />
                                {updatingAlerts.has(alert.id) ? 'Resolving...' : 'Resolve'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {filteredAlerts.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckSquare className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
              <p className="text-gray-600">
                {filterType !== 'all' || filterSeverity !== 'all' 
                  ? 'No alerts match your current filters.' 
                  : 'All deployments are running smoothly with no checklist issues.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </VehicleTrackerLayout>
  );
};

export default Alerts;
