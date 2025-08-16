import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { vehicleService } from '../../../services/database';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Camera, 
  FileText, 
  Calendar,
  Car,
  User,
  MapPin,
  Clock,
  Eye,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Upload,
  Paperclip
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DamageReportForm from './DamageReportForm';
import DamageAnalytics from './DamageAnalytics';
import deploymentsApi from '../services/api';

interface DamageReport {
  id: string;
  vehicleNumber: string;
  reportedBy: string;
  reportedDate: string;
  damageType: 'minor' | 'major' | 'critical';
  category: 'body' | 'mechanical' | 'electrical' | 'interior' | 'tire';
  location: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  status: 'reported' | 'inspecting' | 'approved' | 'repairing' | 'completed' | 'rejected';
  photos: string[];
  inspector?: string;
  inspectionDate?: string;
  repairDate?: string;
  completionDate?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const VehicleDamages: React.FC = () => {
  const [damages, setDamages] = useState<DamageReport[]>([]);
  const [filteredDamages, setFilteredDamages] = useState<DamageReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState<DamageReport | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Utility functions for damage categorization
  const getDamageCategory = (key: string): 'body' | 'mechanical' | 'electrical' | 'interior' | 'tire' => {
    if (key.includes('lights') || key.includes('signal')) return 'electrical';
    if (key.includes('tire') || key.includes('wheel')) return 'tire';
    if (key.includes('seat') || key.includes('dashboard')) return 'interior';
    if (key.includes('body') || key.includes('bumper') || key.includes('door')) return 'body';
    return 'mechanical';
  };

  const formatDamageLocation = (key: string): string => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const getEstimatedCost = (key: string): number => {
    const costMap: Record<string, number> = {
      headlights: 5000,
      taillights: 3000,
      turnSignals: 2000,
      hazardLights: 2500,
      tires: 8000,
      spareWheel: 10000,
      seatBelts: 4000,
      mirrors: 3500,
      dashboard: 15000,
      bodyCondition: 20000
    };
    return costMap[key] || 5000;
  };

  const getDamagePriority = (key: string): 'low' | 'medium' | 'high' | 'urgent' => {
    if (key.includes('lights') || key.includes('signal')) return 'high';
    if (key.includes('tire') || key.includes('seatBelts')) return 'urgent';
    if (key.includes('mirrors') || key.includes('dashboard')) return 'medium';
    return 'low';
  };

  const getVehicleDamageType = (key: string): 'minor' | 'major' | 'critical' => {
    if (key.includes('engine') || key.includes('transmission') || key.includes('brakes')) return 'critical';
    if (key.includes('body') || key.includes('electrical')) return 'major';
    return 'minor';
  };

  const getVehicleDamageCategory = (key: string): 'body' | 'mechanical' | 'electrical' | 'interior' | 'tire' => {
    if (key.includes('engine') || key.includes('transmission') || key.includes('brakes')) return 'mechanical';
    if (key.includes('electrical') || key.includes('lights')) return 'electrical';
    if (key.includes('body') || key.includes('paint')) return 'body';
    if (key.includes('tire') || key.includes('wheel')) return 'tire';
    return 'interior';
  };

  const getVehicleEstimatedCost = (key: string): number => {
    const costMap: Record<string, number> = {
      engineCondition: 50000,
      transmission: 40000,
      brakes: 25000,
      batteryLevel: 30000,
      electricalSystems: 15000,
      bodyCondition: 20000,
      paintCondition: 10000,
      tireCondition: 8000
    };
    return costMap[key] || 10000;
  };

  const getVehicleDamagePriority = (key: string): 'low' | 'medium' | 'high' | 'urgent' => {
    if (key.includes('engine') || key.includes('brakes') || key.includes('transmission')) return 'urgent';
    if (key.includes('electrical') || key.includes('battery')) return 'high';
    if (key.includes('body') || key.includes('tire')) return 'medium';
    return 'low';
  };

  // Load damage data (placeholder API-ready) and estimate via API when possible
  useEffect(() => {
    const loadDamageData = async () => {
      try {
        setLoading(true);
        
        // TODO: Replace with server API when available: GET /api/v1/deployments?include=checklists
        // Keep Dexie extraction for offline/dev mode
        const deployments = await vehicleService.getDeploymentHistory();
        const realDamages: DamageReport[] = [];
        
        deployments.forEach((deployment, index) => {
          // Extract damages from driver checklist
          if (deployment.outData?.driverChecklist) {
            const checklist = deployment.outData.driverChecklist;
            
            // Check for any failed items in driver checklist
            Object.entries(checklist).forEach(([key, value]) => {
              if (typeof value === 'boolean' && !value) {
                realDamages.push({
                  id: `driver-${deployment.id}-${key}`,
                  vehicleNumber: deployment.vehicleNumber,
                  reportedBy: deployment.outData.driverName || 'Unknown Driver',
                  reportedDate: deployment.outTimestamp || new Date().toISOString(),
                  damageType: 'minor',
                  category: getDamageCategory(key),
                  location: formatDamageLocation(key),
                  description: `Driver checklist failed: ${formatDamageLocation(key)}`,
                  estimatedCost: getEstimatedCost(key),
                  status: 'reported',
                  photos: [],
                  priority: getDamagePriority(key)
                });
              }
            });
          }
          
          // Extract damages from vehicle checklist
          if (deployment.outData?.vehicleChecklist) {
            const checklist = deployment.outData.vehicleChecklist;
            
            Object.entries(checklist).forEach(([key, value]) => {
              if (typeof value === 'boolean' && !value) {
                realDamages.push({
                  id: `vehicle-${deployment.id}-${key}`,
                  vehicleNumber: deployment.vehicleNumber,
                  reportedBy: deployment.outData.driverName || 'Unknown Driver',
                  reportedDate: deployment.outTimestamp || new Date().toISOString(),
                  damageType: getVehicleDamageType(key),
                  category: getVehicleDamageCategory(key),
                  location: formatDamageLocation(key),
                  description: `Vehicle checklist failed: ${formatDamageLocation(key)}`,
                  estimatedCost: getVehicleEstimatedCost(key),
                  status: 'reported',
                  photos: [],
                  priority: getVehicleDamagePriority(key)
                });
              }
            });
          }
        });
        
        // Try to enrich with server-side cost estimation when available
        const enriched = await Promise.all(
          realDamages.map(async (d) => {
            try {
              const res = await deploymentsApi.damageEstimate(d.description, d.category);
              if (res.success && res.data?.estimatedCost) {
                return { ...d, estimatedCost: res.data.estimatedCost };
              }
            } catch (_) {}
            return d;
          })
        );

        setDamages(enriched);
        setFilteredDamages(enriched);
      } catch (error) {
        console.error('Error loading damage data:', error);
        setDamages([]);
        setFilteredDamages([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadDamageData();
  }, []);

  // Filter damages based on search and filters
  useEffect(() => {
    let filtered = damages;

    if (searchTerm) {
      filtered = filtered.filter(damage =>
        damage.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        damage.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        damage.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        damage.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(damage => damage.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(damage => damage.priority === priorityFilter);
    }

    setFilteredDamages(filtered);
  }, [damages, searchTerm, statusFilter, priorityFilter]);

  const getStatusColor = (status: DamageReport['status']) => {
    const colors = {
      reported: 'bg-blue-100 text-blue-800 border-blue-200',
      inspecting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      repairing: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: DamageReport['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority];
  };

  const getDamageTypeColor = (type: DamageReport['damageType']) => {
    const colors = {
      minor: 'bg-green-100 text-green-800',
      major: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[type];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStats = () => {
    const total = damages.length;
    const pending = damages.filter(d => ['reported', 'inspecting', 'approved', 'repairing'].includes(d.status)).length;
    const completed = damages.filter(d => d.status === 'completed').length;
    const rejected = damages.filter(d => d.status === 'rejected').length;
    const totalCost = damages.reduce((sum, d) => sum + (d.actualCost || d.estimatedCost), 0);
    const urgent = damages.filter(d => d.priority === 'urgent').length;

    return { total, pending, completed, rejected, totalCost, urgent };
  };

  const stats = getStats();

  const DamageCard = ({ damage }: { damage: DamageReport }) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{damage.vehicleNumber}</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {damage.location} • {damage.category}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(damage.priority)}>
              {damage.priority.toUpperCase()}
            </Badge>
            <Badge className={getDamageTypeColor(damage.damageType)}>
              {damage.damageType.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700 line-clamp-2">{damage.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Reported by: {damage.reportedBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{formatDate(damage.reportedDate)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">
                Cost: ₹{(damage.actualCost || damage.estimatedCost).toLocaleString()}
              </span>
            </div>
            {damage.photos.length > 0 && (
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{damage.photos.length} photo(s)</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <Badge className={getStatusColor(damage.status)}>
            {damage.status.charAt(0).toUpperCase() + damage.status.slice(1)}
          </Badge>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSelectedDamage(damage)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              View
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            Vehicle Damages
          </h1>
          <p className="text-gray-600 mt-1">Track and manage vehicle damage reports and repairs</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
                <Plus className="w-4 h-4" />
                Report Damage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DamageReportForm 
                onSubmit={(data) => {
                  console.log('New damage report:', data);
                  setIsCreateDialogOpen(false);
                  // Here you would typically save to database
                }}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white">
            📋 Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white">
            📊 Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-white">
            📑 All Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Reports</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Urgent</p>
                <p className="text-2xl font-bold text-red-900">{stats.urgent}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Rejected</p>
                <p className="text-2xl font-bold text-purple-900">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Total Cost</p>
                <p className="text-2xl font-bold text-indigo-900">₹{stats.totalCost.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <DamageAnalytics damages={damages} />
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Filters and Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search by vehicle number, reporter, description, or location..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="reported">Reported</SelectItem>
                        <SelectItem value="inspecting">Inspecting</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="repairing">Repairing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Damages Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDamages.map((damage) => (
                  <DamageCard key={damage.id} damage={damage} />
                ))}
              </div>

              {filteredDamages.length === 0 && (
                <Card className="p-8">
                  <div className="text-center text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No damage reports found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

      {/* Damage Detail Dialog */}
      {selectedDamage && (
        <Dialog open={!!selectedDamage} onOpenChange={() => setSelectedDamage(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Car className="w-6 h-6 text-blue-600" />
                Damage Report - {selectedDamage.vehicleNumber}
              </DialogTitle>
              <DialogDescription>
                Detailed information about the damage report
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Status and Priority */}
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(selectedDamage.status)}>
                  {selectedDamage.status.toUpperCase()}
                </Badge>
                <Badge className={getPriorityColor(selectedDamage.priority)}>
                  {selectedDamage.priority.toUpperCase()} PRIORITY
                </Badge>
                <Badge className={getDamageTypeColor(selectedDamage.damageType)}>
                  {selectedDamage.damageType.toUpperCase()} DAMAGE
                </Badge>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Vehicle Number</Label>
                    <p className="text-lg font-semibold">{selectedDamage.vehicleNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Location</Label>
                    <p>{selectedDamage.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Category</Label>
                    <p className="capitalize">{selectedDamage.category}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Reported By</Label>
                    <p>{selectedDamage.reportedBy}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Reported Date</Label>
                    <p>{formatDate(selectedDamage.reportedDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Estimated Cost</Label>
                    <p className="text-lg font-semibold text-red-600">₹{selectedDamage.estimatedCost.toLocaleString()}</p>
                    {selectedDamage.actualCost && (
                      <p className="text-sm text-gray-600">Actual: ₹{selectedDamage.actualCost.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedDamage.description}</p>
              </div>

              {/* Timeline */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Timeline</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Reported</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedDamage.reportedDate)} by {selectedDamage.reportedBy}</p>
                    </div>
                  </div>
                  
                  {selectedDamage.inspectionDate && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-md">
                      <Eye className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Inspected</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedDamage.inspectionDate)} by {selectedDamage.inspector}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedDamage.repairDate && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-md">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Repair Started</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedDamage.repairDate)}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedDamage.completionDate && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Completed</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedDamage.completionDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Photos */}
              {selectedDamage.photos.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Photos ({selectedDamage.photos.length})</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {selectedDamage.photos.map((photo, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                        <span className="text-xs text-gray-500 ml-2">{photo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedDamage.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Notes</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedDamage.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDamage(null)}>
                Close
              </Button>
              <Button className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VehicleDamages;
