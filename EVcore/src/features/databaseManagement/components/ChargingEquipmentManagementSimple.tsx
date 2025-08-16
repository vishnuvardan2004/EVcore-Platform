import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Power
} from 'lucide-react';
import { databaseService } from '../services/databaseSimple';
import { ChargingEquipment } from '../types';

export const ChargingEquipmentManagementSimple: React.FC = () => {
  const [equipment, setEquipment] = useState<ChargingEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ChargingEquipment>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getChargingEquipment();
      console.log('Fetched charging equipment:', data);
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching charging equipment:', error);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(item => 
    item.chargerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.chargerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.manufacturerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.locationId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Active': 'bg-green-100 text-green-800',
      'Repair': 'bg-yellow-100 text-yellow-800',
      'Retired': 'bg-red-100 text-red-800'
    };
    const color = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
    return <Badge className={color}>{status}</Badge>;
  };

  const resetForm = () => {
    setFormData({});
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Ensure required fields are present for creation
      const equipmentData = {
        ...formData,
        chargerId: formData.chargerId || `CHG${Date.now()}`,
        serialNumber: formData.serialNumber || '',
        chargerName: formData.chargerName || '',
        chargerType: formData.chargerType || 'AC Slow',
        chargerStatus: formData.chargerStatus || 'Active',
        ownershipType: formData.ownershipType || 'EVZIP'
      } as Omit<ChargingEquipment, 'id' | 'createdAt' | 'updatedAt'>;
      
      await databaseService.createChargingEquipment(equipmentData, 'system');
      console.log('Charging equipment created successfully');
      setIsAddDialogOpen(false);
      resetForm();
      fetchEquipment();
    } catch (error) {
      console.error('Error creating charging equipment:', error);
    } finally {
      setSaving(false);
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
              {filteredEquipment.map((item) => (
                <Card key={item.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{item.chargerId}</h3>
                        <p className="text-gray-600">{item.chargerName}</p>
                      </div>
                      {item.chargerStatus && getStatusBadge(item.chargerStatus)}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Power className="w-4 h-4" />
                        <span>Type: {item.chargerType || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Power: {item.powerRatingKW || 'N/A'} kW</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span>Ports: {item.noOfPorts || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{item.locationId || 'N/A'} ({item.locationType || 'N/A'})</span>
                      </div>
                      {item.dateOfInstallation && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Installed: {new Date(item.dateOfInstallation).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>Owner: {item.ownershipType || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chargerId">Charger ID *</Label>
                  <Input
                    id="chargerId"
                    value={formData.chargerId || ''}
                    onChange={(e) => setFormData({...formData, chargerId: e.target.value})}
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
                  <Label htmlFor="chargerName">Charger Name</Label>
                  <Input
                    id="chargerName"
                    value={formData.chargerName || ''}
                    onChange={(e) => setFormData({...formData, chargerName: e.target.value})}
                    placeholder="Label/model name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturerName">Manufacturer Name</Label>
                  <Input
                    id="manufacturerName"
                    value={formData.manufacturerName || ''}
                    onChange={(e) => setFormData({...formData, manufacturerName: e.target.value})}
                    placeholder="OEM info"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chargerType">Charger Type</Label>
                  <Select value={formData.chargerType || ''} onValueChange={(value) => setFormData({...formData, chargerType: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select charger type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC Slow">AC Slow</SelectItem>
                      <SelectItem value="DC Fast">DC Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chargerStatus">Charger Status</Label>
                  <Select value={formData.chargerStatus || ''} onValueChange={(value) => setFormData({...formData, chargerStatus: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownershipType">Ownership Type</Label>
                  <Select value={formData.ownershipType || ''} onValueChange={(value) => setFormData({...formData, ownershipType: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ownership" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EVZIP">EVZIP</SelectItem>
                      <SelectItem value="Leased">Leased</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Technical Specifications Tab */}
            <TabsContent value="technical" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="portType">Port Type</Label>
                  <Input
                    id="portType"
                    value={formData.portType || ''}
                    onChange={(e) => setFormData({...formData, portType: e.target.value})}
                    placeholder="CCS2, Type 2, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="noOfPorts">Number of Ports</Label>
                  <Input
                    id="noOfPorts"
                    type="number"
                    value={formData.noOfPorts || ''}
                    onChange={(e) => setFormData({...formData, noOfPorts: parseInt(e.target.value)})}
                    placeholder="Simultaneous ports"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="powerRatingKW">Power Rating (kW)</Label>
                  <Input
                    id="powerRatingKW"
                    type="number"
                    step="0.1"
                    value={formData.powerRatingKW || ''}
                    onChange={(e) => setFormData({...formData, powerRatingKW: parseFloat(e.target.value)})}
                    placeholder="Charger capacity"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compatibleVehicleTypes">Compatible Vehicle Types</Label>
                  <Input
                    id="compatibleVehicleTypes"
                    value={formData.compatibleVehicleTypes || ''}
                    onChange={(e) => setFormData({...formData, compatibleVehicleTypes: e.target.value})}
                    placeholder="E2W, E4W, Shuttle"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locationType">Location Type</Label>
                  <Select value={formData.locationType || ''} onValueChange={(value) => setFormData({...formData, locationType: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hub">Hub</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationId">Location ID</Label>
                  <Input
                    id="locationId"
                    value={formData.locationId || ''}
                    onChange={(e) => setFormData({...formData, locationId: e.target.value})}
                    placeholder="Assigned location ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedToId">Assigned To ID</Label>
                  <Input
                    id="assignedToId"
                    value={formData.assignedToId || ''}
                    onChange={(e) => setFormData({...formData, assignedToId: e.target.value})}
                    placeholder="Vehicle or pilot (optional)"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfInstallation">Date of Installation</Label>
                  <Input
                    id="dateOfInstallation"
                    type="date"
                    value={formData.dateOfInstallation ? new Date(formData.dateOfInstallation).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, dateOfInstallation: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyValidTill">Warranty Valid Till</Label>
                  <Input
                    id="warrantyValidTill"
                    type="date"
                    value={formData.warrantyValidTill ? new Date(formData.warrantyValidTill).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, warrantyValidTill: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastServiceDate">Last Service Date</Label>
                  <Input
                    id="lastServiceDate"
                    type="date"
                    value={formData.lastServiceDate ? new Date(formData.lastServiceDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, lastServiceDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextMaintenanceDue">Next Maintenance Due</Label>
                  <Input
                    id="nextMaintenanceDue"
                    type="date"
                    value={formData.nextMaintenanceDue ? new Date(formData.nextMaintenanceDue).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, nextMaintenanceDue: e.target.value})}
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
