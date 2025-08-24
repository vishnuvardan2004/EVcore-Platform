import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Plus, 
  Search, 
  RefreshCw,
  MapPin,
  Calendar,
  Settings,
  Activity,
  Power,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { dbApi } from '../services/api';
import { ChargingEquipment } from '../types';
import { useToast } from '@/hooks/use-toast';

// Legacy form interface for backward compatibility
interface ChargingEquipmentForm {
  chargingEquipmentId?: string;
  name?: string;
  type?: 'ac_charger' | 'dc_fast_charger' | 'ultra_fast_charger' | 'wireless_charger' | 'portable_charger';
  brand?: string;
  model?: string;
  serialNumber?: string;
  powerRating?: number;
  connectorTypes?: string[];
  numberOfPorts?: number;
  status?: 'available' | 'occupied' | 'offline' | 'maintenance' | 'error';
  pricing?: {
    pricePerKwh?: number;
  };
}

export const ChargingEquipmentManagementSimple: React.FC = () => {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<ChargingEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ChargingEquipmentForm>({});
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      console.log('Loading charging equipment from API...');
      const response = await dbApi.listChargingEquipment();
      console.log('API Response:', response);
      
      // Backend returns { success: true, data: { documents, pagination } }
      if (response.success && response.data) {
        // The response.data should contain { documents: ChargingEquipment[], pagination: {...} }
        const data = response.data as any;
        setEquipment(data.documents || []);
      } else {
        setEquipment([]);
      }
    } catch (error) {
      console.error('Error fetching charging equipment:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to load charging equipment. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && (error as any).message) {
        errorMessage = (error as any).message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(item => 
    item.chargingEquipmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'available': 'bg-green-100 text-green-800',
      'occupied': 'bg-blue-100 text-blue-800',
      'offline': 'bg-red-100 text-red-800',
      'maintenance': 'bg-yellow-100 text-yellow-800',
      'error': 'bg-red-100 text-red-800'
    };
    const color = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
    return <Badge className={color}>{status}</Badge>;
  };

  const resetForm = () => {
    setFormData({});
  };

  const handleCardClick = (itemId: string) => {
    console.log('🔍 Card clicked for equipment ID:', itemId);
    setExpandedCardId(expandedCardId === itemId ? null : itemId);
  };

  const renderDetailedView = (item: ChargingEquipment) => {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Basic Information</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Equipment ID:</span> {item.chargingEquipmentId || 'N/A'}</div>
              <div><span className="font-medium">Name:</span> {item.name || 'N/A'}</div>
              <div><span className="font-medium">Type:</span> {item.type || 'N/A'}</div>
              <div><span className="font-medium">Brand:</span> {item.brand || 'N/A'}</div>
              <div><span className="font-medium">Model:</span> {item.model || 'N/A'}</div>
              <div><span className="font-medium">Serial Number:</span> {item.serialNumber || 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Technical Specifications</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Power Rating:</span> {item.powerRating || 'N/A'} kW</div>
              <div><span className="font-medium">Number of Ports:</span> {item.numberOfPorts || 'N/A'}</div>
              <div><span className="font-medium">Connector Types:</span> {item.connectorTypes?.join(', ') || 'N/A'}</div>
              <div><span className="font-medium">Status:</span> {item.status || 'N/A'}</div>
              <div><span className="font-medium">Network Connected:</span> {item.networkConnected ? 'Yes' : 'No'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Location Information</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Address:</span> {item.location?.address || 'N/A'}</div>
              <div><span className="font-medium">Facility:</span> {item.location?.facility || 'N/A'}</div>
              <div><span className="font-medium">Coordinates:</span> {item.location?.lat && item.location?.lng ? `${item.location.lat}, ${item.location.lng}` : 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Additional Details</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Installation Date:</span> {item.installationDate ? new Date(item.installationDate).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Price per kWh:</span> {item.pricing?.pricePerKwh ? `$${item.pricing.pricePerKwh}` : 'N/A'}</div>
              <div><span className="font-medium">Payment Methods:</span> {item.paymentMethods?.join(', ') || 'N/A'}</div>
              <div><span className="font-medium">Created:</span> {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}</div>
              <div><span className="font-medium">Last Updated:</span> {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Convert form data to proper ChargingEquipment format
      const equipmentData: Omit<ChargingEquipment, '_id' | 'createdAt' | 'updatedAt'> = {
        chargingEquipmentId: formData.chargingEquipmentId || `CHG${Date.now()}`,
        name: formData.name || '',
        type: formData.type || 'ac_charger',
        brand: formData.brand || '',
        model: formData.model || '',
        serialNumber: formData.serialNumber || '',
        powerRating: formData.powerRating || 7.4,
        connectorTypes: (formData.connectorTypes || ['Type2']) as ('Type1' | 'Type2' | 'CCS' | 'CHAdeMO' | 'Tesla')[],
        numberOfPorts: formData.numberOfPorts || 1,
        specifications: {
          inputVoltage: 240,
          outputVoltage: 240,
          maxCurrent: 32,
          efficiency: 94
        },
        status: formData.status || 'available',
        operatingHours: {
          startTime: '00:00',
          endTime: '24:00'
        },
        pricing: formData.pricing || { pricePerKwh: 10.0 },
        networkConnected: true,
        paymentMethods: ['mobile_app']
      };
      
      console.log('Sending charging equipment data to API:', equipmentData);
      
      const response = await dbApi.createChargingEquipment(equipmentData);
      console.log('Charging equipment creation response:', response);
      
      if (response.success && response.data) {
        // The actual document is nested in response.data.document
        const createdEquipment = (response.data as any).document || response.data;
        
        // Defensive check to ensure the created equipment has an _id
        if (!createdEquipment._id) {
          console.warn('Warning: Created charging equipment does not have _id:', response.data);
          console.warn('Full response structure:', response);
          throw new Error(`Server did not return a valid equipment ID. Response structure: ${JSON.stringify(Object.keys(response.data))}`);
        }
        
        toast({
          title: "Success",
          description: "Charging equipment added successfully!",
        });
        
        // Refresh the equipment list
        await fetchEquipment();
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        throw new Error('Failed to create charging equipment - invalid response');
      }
    } catch (error) {
      console.error('Error creating charging equipment:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to create charging equipment. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && (error as any).message) {
        errorMessage = (error as any).message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (equipmentId: string) => {
    setDeleteLoading(true);
    try {
      const response = await dbApi.deleteChargingEquipment(equipmentId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Charging equipment deleted successfully"
        });
        
        // Refresh the equipment list
        await fetchEquipment();
      } else {
        throw new Error('Failed to delete charging equipment');
      }
    } catch (error) {
      console.error('Error deleting charging equipment:', error);
      toast({
        title: "Error",
        description: "Failed to delete charging equipment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-600" />
            Charging Equipment Management
          </h1>
          <p className="text-gray-600 mt-1">Manage EV charging infrastructure and equipment</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchEquipment} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Charging Equipment
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search charging equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle>Charging Equipment ({filteredEquipment.length})</CardTitle>
          <CardDescription>EV charging infrastructure inventory and status tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
              <span className="ml-2">Loading charging equipment...</span>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {equipment.length === 0 ? 'No charging equipment found in database' : 'No equipment matches your search'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map((item) => {
                const isExpanded = expandedCardId === item._id;
                return (
                  <Card key={item._id} className="border hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      {/* Main Card Content - Always Visible */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{item.chargingEquipmentId}</h3>
                          <p className="text-gray-600">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status && getStatusBadge(item.status)}
                          <button
                            onClick={() => handleCardClick(item._id!)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            title={isExpanded ? "Hide details" : "Show details"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Power className="w-4 h-4" />
                          <span>Type: {item.type || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          <span>Power: {item.powerRating || 'N/A'} kW</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          <span>Ports: {item.numberOfPorts || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{item.location?.address || 'N/A'} ({item.location?.facility || 'N/A'})</span>
                        </div>
                        {item.installationDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Installed: {new Date(item.installationDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span>Brand: {item.brand || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Expandable Details Section */}
                      {isExpanded && renderDetailedView(item)}

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-2 pt-3 border-t">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deleteLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Charging Equipment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.chargingEquipmentId} - {item.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item._id!)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteLoading}
                              >
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Charging Equipment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Charging Equipment</DialogTitle>
            <DialogDescription>
              Enter charging equipment details to add to the database
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chargingEquipmentId">Charger ID *</Label>
                  <Input
                    id="chargingEquipmentId"
                    value={formData.chargingEquipmentId || ''}
                    onChange={(e) => setFormData({...formData, chargingEquipmentId: e.target.value})}
                    placeholder="Unique charger ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber || ''}
                    onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                    placeholder="Manufacturer serial no."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Charger Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Label/model name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="Manufacturer brand"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="Equipment model"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Charger Type</Label>
                  <Select value={formData.type || ''} onValueChange={(value) => setFormData({...formData, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select charger type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ac_charger">AC Charger</SelectItem>
                      <SelectItem value="dc_fast_charger">DC Fast Charger</SelectItem>
                      <SelectItem value="ultra_fast_charger">Ultra Fast Charger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status || ''} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Technical Specifications Tab */}
            <TabsContent value="technical" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="powerRating">Power Rating (kW)</Label>
                  <Input
                    id="powerRating"
                    type="number"
                    step="0.1"
                    value={formData.powerRating || ''}
                    onChange={(e) => setFormData({...formData, powerRating: parseFloat(e.target.value)})}
                    placeholder="Charger capacity"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfPorts">Number of Ports</Label>
                  <Input
                    id="numberOfPorts"
                    type="number"
                    value={formData.numberOfPorts || ''}
                    onChange={(e) => setFormData({...formData, numberOfPorts: parseInt(e.target.value)})}
                    placeholder="Simultaneous ports"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Adding...' : 'Add Charging Equipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChargingEquipmentManagementSimple;
