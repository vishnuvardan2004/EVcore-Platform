
import React, { useState, useEffect } from 'react';
import { VehicleTrackerLayout } from '../components/VehicleTrackerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Eye, 
  Clock, 
  CheckSquare, 
  XSquare, 
  ArrowRightLeft, 
  Filter,
  RefreshCw,
  Calendar,
  User,
  Car
} from 'lucide-react';
import { vehicleService } from '../../../services/database';
import { Deployment, DriverChecklist, VehicleChecklist } from '../../../types/vehicle';

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

    if (!outChecklist) return alerts;

    const vehicleItems = [
      { key: 'fireExtinguisher', label: 'Fire Extinguisher', critical: true },
      { key: 'stepney', label: 'Stepney Tire', critical: true },
      { key: 'carFreshener', label: 'Car Freshener', critical: false },
      { key: 'cleaningCloth', label: 'Cleaning Cloth', critical: false },
      { key: 'umbrella', label: 'Umbrella', critical: false },
      { key: 'torch', label: 'Torch', critical: true },
      { key: 'toolkit', label: 'Toolkit', critical: true },
      { key: 'spanner', label: 'Spanner', critical: true },
      { key: 'medicalKit', label: 'Medical Kit', critical: true },
      { key: 'carCharger', label: 'Car Charger', critical: true },
      { key: 'jack', label: 'Jack', critical: true },
      { key: 'lightsWorking', label: 'Lights Working', critical: true },
      { key: 'tyrePressure', label: 'Tire Pressure', critical: true },
      { key: 'wheelCaps', label: 'Wheel Caps', critical: false },
      { key: 'wiperWater', label: 'Wiper Water', critical: false },
      { key: 'cleanliness', label: 'Vehicle Cleanliness', critical: false },
      { key: 'antenna', label: 'Antenna', critical: false },
      { key: 'acWorking', label: 'AC Working', critical: true },
      { key: 'mobileCable', label: 'Mobile Cable', critical: false },
      { key: 'mobileAdapter', label: 'Mobile Adapter', critical: false },
      { key: 'phoneStand', label: 'Phone Stand', critical: false },
      { key: 'hornWorking', label: 'Horn Working', critical: true }
    ];

    // Check for unchecked items during OUT
    vehicleItems.forEach(item => {
      if (!outChecklist[item.key as keyof VehicleChecklist]) {
        alerts.push({
          id: `${deployment.id}-vehicle-out-${item.key}`,
          vehicleNumber: deployment.vehicleNumber,
          timestamp: deployment.outTimestamp || new Date().toISOString(),
          type: 'checklist_unchecked',
          category: 'vehicle_checklist',
          severity: item.critical ? 'high' : 'medium',
          title: `Vehicle OUT: ${item.label} Unchecked`,
          description: `${item.label} was not checked during vehicle OUT process`,
          details: `The supervisor ${deployment.outData?.supervisorName || 'Unknown'} did not verify ${item.label.toLowerCase()} before allowing the vehicle to go out. This could compromise safety or functionality.`,
          affectedItems: [item.label],
          status: 'unresolved',
          deploymentId: deployment.id,
          supervisorName: deployment.outData?.supervisorName
        });
      }
    });

    // Check for mismatches between OUT and IN checklists
    if (inChecklist && deployment.inTimestamp) {
      const mismatches: string[] = [];
      
      vehicleItems.forEach(item => {
        const outValue = outChecklist[item.key as keyof VehicleChecklist];
        const inValue = inChecklist[item.key as keyof VehicleChecklist];
        
        if (outValue && !inValue) {
          mismatches.push(item.label);
        }
      });

      if (mismatches.length > 0) {
        alerts.push({
          id: `${deployment.id}-mismatch`,
          vehicleNumber: deployment.vehicleNumber,
          timestamp: deployment.inTimestamp,
          type: 'checklist_mismatch',
          category: 'vehicle_checklist',
          severity: 'high',
          title: `Checklist Mismatch: Items Missing on Return`,
          description: `${mismatches.length} items present during OUT but missing during IN`,
          details: `The following items were marked as present during vehicle OUT but are missing during IN: ${mismatches.join(', ')}. This indicates potential loss or damage during deployment.`,
          affectedItems: mismatches,
          status: 'unresolved',
          deploymentId: deployment.id,
          supervisorName: deployment.inData?.inSupervisorName
        });
      }
    }

    return alerts;
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const deployments = await vehicleService.getDeploymentHistory();
      
      const alertData: AlertData[] = [];
      
      deployments.forEach((deployment: Deployment) => {
        // Analyze driver checklist for unchecked items
        if (deployment.outData?.driverChecklist) {
          const driverAlerts = analyzeDriverChecklist(deployment.outData.driverChecklist, deployment);
          alertData.push(...driverAlerts);
        }

        // Analyze vehicle checklist for unchecked items and mismatches
        if (deployment.outData?.vehicleChecklist) {
          const vehicleAlerts = analyzeVehicleChecklist(
            deployment.outData.vehicleChecklist,
            deployment.inData?.vehicleChecklist,
            deployment
          );
          alertData.push(...vehicleAlerts);
        }

        // Check for overdue vehicles (still out for more than 8 hours)
        if (deployment.outTimestamp && !deployment.inTimestamp) {
          const outTime = new Date(deployment.outTimestamp);
          const now = new Date();
          const hoursOut = (now.getTime() - outTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursOut > 8) {
            alertData.push({
              id: `${deployment.id}-overdue`,
              vehicleNumber: deployment.vehicleNumber,
              timestamp: deployment.outTimestamp,
              type: 'overdue_return',
              category: 'deployment_issue',
              severity: 'high',
              title: `Vehicle Overdue for Return`,
              description: `Vehicle has been out for ${Math.floor(hoursOut)} hours`,
              details: `Vehicle ${deployment.vehicleNumber} has been deployed for ${Math.floor(hoursOut)} hours, which exceeds the standard 8-hour limit. Immediate attention required.`,
              affectedItems: [],
              status: 'unresolved',
              deploymentId: deployment.id,
              supervisorName: deployment.outData?.supervisorName
            });
          }
        }
      });
      
      // Sort by most recent timestamp
      const sortedAlerts = alertData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setAlerts(sortedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter alerts based on type and severity
  const filteredAlerts = alerts.filter(alert => {
    const typeMatch = filterType === 'all' || alert.type === filterType;
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
    return typeMatch && severityMatch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'checklist_unchecked':
        return <XSquare className="w-5 h-5 text-red-600" />;
      case 'checklist_mismatch':
        return <ArrowRightLeft className="w-5 h-5 text-orange-600" />;
      case 'overdue_return':
        return <Clock className="w-5 h-5 text-purple-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'checklist_unchecked':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Unchecked</Badge>;
      case 'checklist_mismatch':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Mismatch</Badge>;
      case 'overdue_return':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Other</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">🔴 High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🟡 Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">� Low</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">✅ Resolved</Badge>;
      case 'acknowledged':
        return <Badge variant="outline">👁️ Acknowledged</Badge>;
      default:
        return <Badge variant="destructive">⚠️ Unresolved</Badge>;
    }
  };

  const handleViewDetails = (alertId: string) => {
    console.log('Viewing alert details:', alertId);
    // Navigate to detailed view
  };

  const handleMarkResolved = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
      )
    );
  };

  const handleMarkAcknowledged = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged' as const } : alert
      )
    );
  };

  return (
    <VehicleTrackerLayout 
      title="⚠️ Alerts & Mismatches" 
      subtitle="Monitor checklist discrepancies and deployment issues"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-200 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-800">
                    {loading ? '...' : filteredAlerts.filter(a => a.status === 'unresolved').length}
                  </p>
                  <p className="text-sm text-red-700">Unresolved Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-200 rounded-lg">
                  <Eye className="w-6 h-6 text-yellow-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-800">
                    {loading ? '...' : filteredAlerts.filter(a => a.status === 'acknowledged').length}
                  </p>
                  <p className="text-sm text-yellow-700">Acknowledged</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-200 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-800">
                    {loading ? '...' : filteredAlerts.filter(a => a.status === 'resolved').length}
                  </p>
                  <p className="text-sm text-green-700">Resolved Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-200 rounded-lg">
                  <Filter className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-800">
                    {loading ? '...' : filteredAlerts.length}
                  </p>
                  <p className="text-sm text-blue-700">Total Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="checklist_unchecked">Unchecked Items</SelectItem>
                  <SelectItem value="checklist_mismatch">Checklist Mismatches</SelectItem>
                  <SelectItem value="overdue_return">Overdue Returns</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={fetchAlerts} 
                variant="outline" 
                className="ml-auto gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Alerts List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Recent Alerts
                  <Badge variant="outline" className="ml-2">
                    {filteredAlerts.length} alerts
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Checklist discrepancies, unchecked items, and deployment issues requiring attention
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-red-400 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">
                          {getTypeIcon(alert.type)}
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-gray-500" />
                              <span className="font-bold text-lg">{alert.vehicleNumber}</span>
                            </div>
                            {getTypeBadge(alert.type)}
                            {getSeverityBadge(alert.severity)}
                          </div>

                          {/* Alert Title and Description */}
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{alert.title}</h3>
                            <p className="text-gray-700 mb-2">{alert.description}</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{alert.details}</p>
                          </div>

                          {/* Affected Items */}
                          {alert.affectedItems && alert.affectedItems.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-1">Affected Items:</p>
                              <div className="flex flex-wrap gap-1">
                                {alert.affectedItems.map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(alert.timestamp).toLocaleString()}
                            </div>
                            {alert.supervisorName && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Supervisor: {alert.supervisorName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col items-end gap-3 ml-4">
                        {getStatusBadge(alert.status)}
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(alert.id)}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          
                          {alert.status === 'unresolved' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleMarkAcknowledged(alert.id)}
                                className="gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                Acknowledge
                              </Button>
                              <Button 
                                size="sm" 
                                className="gap-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleMarkResolved(alert.id)}
                              >
                                <CheckSquare className="w-3 h-3" />
                                Resolve
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
