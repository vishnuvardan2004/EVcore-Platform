import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Zap, Calendar, MapPin, Settings } from 'lucide-react';
import { databaseService } from '../services/databaseSimple';
import { ElectricalEquipment } from '../types';
import { useToast } from '@/hooks/use-toast';

const ElectricalEquipmentManagementSimple = () => {
  const [equipment, setEquipment] = useState<ElectricalEquipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form state for new electrical equipment
  const [formData, setFormData] = useState({
    equipmentId: '',
    equipmentName: '',
    category: '',
    makeModel: '',
    serialNumber: '',
    powerCapacityKVA: '',
    phaseType: '',
    voltageRating: '',
    currentRating: '',
    frequency: '',
    locationId: '',
    locationType: '',
    installationDate: '',
    ownershipStatus: '',
    installedBy: '',
    usagePurpose: '',
    status: '',
    warrantyValidTill: '',
    amcContractStatus: '',
    lastServiceDate: '',
    nextMaintenanceDue: ''
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await databaseService.getElectricalEquipment();
      setEquipment(data);
    } catch (error) {
      console.error('Error loading electrical equipment:', error);
      toast({
        title: "Error",
        description: "Failed to load electrical equipment data",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddEquipment = async () => {
    if (!formData.equipmentId || !formData.equipmentName || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Equipment ID, Name, Category)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const equipmentData = {
        equipmentId: formData.equipmentId,
        equipmentName: formData.equipmentName,
        category: formData.category as any,
        makeModel: formData.makeModel,
        serialNumber: formData.serialNumber,
        powerCapacityKVA: parseFloat(formData.powerCapacityKVA) || 0,
        phaseType: formData.phaseType as any,
        voltageRating: formData.voltageRating,
        currentRating: formData.currentRating,
        frequency: parseFloat(formData.frequency) || 50,
        locationId: formData.locationId,
        locationType: formData.locationType as any,
        installationDate: formData.installationDate,
        ownershipStatus: formData.ownershipStatus as any,
        installedBy: formData.installedBy,
        usagePurpose: formData.usagePurpose,
        status: formData.status as any,
        warrantyValidTill: formData.warrantyValidTill,
        amcContractStatus: formData.amcContractStatus as any,
        lastServiceDate: formData.lastServiceDate,
        nextMaintenanceDue: formData.nextMaintenanceDue
      };

      await databaseService.createElectricalEquipment(equipmentData, 'admin');
      
      toast({
        title: "Success",
        description: "Electrical equipment added successfully"
      });

      // Reset form and close dialog
      setFormData({
        equipmentId: '',
        equipmentName: '',
        category: '',
        makeModel: '',
        serialNumber: '',
        powerCapacityKVA: '',
        phaseType: '',
        voltageRating: '',
        currentRating: '',
        frequency: '',
        locationId: '',
        locationType: '',
        installationDate: '',
        ownershipStatus: '',
        installedBy: '',
        usagePurpose: '',
        status: '',
        warrantyValidTill: '',
        amcContractStatus: '',
        lastServiceDate: '',
        nextMaintenanceDue: ''
      });
      setIsAddDialogOpen(false);
      
      // Reload equipment list
      await loadEquipment();
    } catch (error) {
      console.error('Error adding electrical equipment:', error);
      toast({
        title: "Error",
        description: "Failed to add electrical equipment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.equipmentName?.toLowerCase().includes(searchLower) ||
      item.equipmentId?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.makeModel?.toLowerCase().includes(searchLower) ||
      item.locationId?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Retired': return 'bg-red-100 text-red-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Electrical Equipment Management</h1>
          <p className="text-gray-600 mt-2">Manage electrical infrastructure and equipment</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Add New Electrical Equipment
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>
              
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equipmentId">Equipment ID *</Label>
                    <Input
                      id="equipmentId"
                      placeholder="e.g., EQ-HUB-001"
                      value={formData.equipmentId}
                      onChange={(e) => handleInputChange('equipmentId', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipmentName">Equipment Name *</Label>
                    <Input
                      id="equipmentName"
                      placeholder="e.g., Transformer"
                      value={formData.equipmentName}
                      onChange={(e) => handleInputChange('equipmentName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Transformer">Transformer</SelectItem>
                        <SelectItem value="Panel Board">Panel Board</SelectItem>
                        <SelectItem value="UPS">UPS</SelectItem>
                        <SelectItem value="Generator">Generator</SelectItem>
                        <SelectItem value="Switch Gear">Switch Gear</SelectItem>
                        <SelectItem value="Cable">Cable</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="makeModel">Make & Model</Label>
                    <Input
                      id="makeModel"
                      placeholder="Manufacturer & model"
                      value={formData.makeModel}
                      onChange={(e) => handleInputChange('makeModel', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      placeholder="As per label"
                      value={formData.serialNumber}
                      onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                        <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Technical Specifications Tab */}
              <TabsContent value="technical" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="powerCapacityKVA">Power Capacity (kVA/kW)</Label>
                    <Input
                      id="powerCapacityKVA"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 100.5"
                      value={formData.powerCapacityKVA}
                      onChange={(e) => handleInputChange('powerCapacityKVA', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phaseType">Phase Type</Label>
                    <Select value={formData.phaseType} onValueChange={(value) => handleInputChange('phaseType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select phase type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Three">Three</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="voltageRating">Voltage Rating</Label>
                    <Input
                      id="voltageRating"
                      placeholder="e.g., 415V"
                      value={formData.voltageRating}
                      onChange={(e) => handleInputChange('voltageRating', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentRating">Current Rating</Label>
                    <Input
                      id="currentRating"
                      placeholder="e.g., 100A"
                      value={formData.currentRating}
                      onChange={(e) => handleInputChange('currentRating', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency (Hz)</Label>
                    <Input
                      id="frequency"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 50"
                      value={formData.frequency}
                      onChange={(e) => handleInputChange('frequency', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownershipStatus">Ownership Status</Label>
                    <Select value={formData.ownershipStatus} onValueChange={(value) => handleInputChange('ownershipStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ownership" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owned">Owned</SelectItem>
                        <SelectItem value="Leased">Leased</SelectItem>
                        <SelectItem value="Rented">Rented</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="usagePurpose">Usage Purpose</Label>
                  <Textarea
                    id="usagePurpose"
                    placeholder="Describe the purpose and usage of this equipment"
                    value={formData.usagePurpose}
                    onChange={(e) => handleInputChange('usagePurpose', e.target.value)}
                  />
                </div>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="locationId">Location ID</Label>
                    <Input
                      id="locationId"
                      placeholder="e.g., BLR-HUB-001"
                      value={formData.locationId}
                      onChange={(e) => handleInputChange('locationId', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationType">Location Type</Label>
                    <Select value={formData.locationType} onValueChange={(value) => handleInputChange('locationType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hub">Hub</SelectItem>
                        <SelectItem value="Depot">Depot</SelectItem>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="installationDate">Installation Date</Label>
                    <Input
                      id="installationDate"
                      type="date"
                      value={formData.installationDate}
                      onChange={(e) => handleInputChange('installationDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="installedBy">Installed By</Label>
                    <Input
                      id="installedBy"
                      placeholder="Vendor/Installer information"
                      value={formData.installedBy}
                      onChange={(e) => handleInputChange('installedBy', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Maintenance Tab */}
              <TabsContent value="maintenance" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="warrantyValidTill">Warranty Valid Till</Label>
                    <Input
                      id="warrantyValidTill"
                      type="date"
                      value={formData.warrantyValidTill}
                      onChange={(e) => handleInputChange('warrantyValidTill', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amcContractStatus">AMC Contract Status</Label>
                    <Select value={formData.amcContractStatus} onValueChange={(value) => handleInputChange('amcContractStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select AMC status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                        <SelectItem value="NA">NA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="lastServiceDate">Last Service Date</Label>
                    <Input
                      id="lastServiceDate"
                      type="date"
                      value={formData.lastServiceDate}
                      onChange={(e) => handleInputChange('lastServiceDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextMaintenanceDue">Next Maintenance Due</Label>
                    <Input
                      id="nextMaintenanceDue"
                      type="date"
                      value={formData.nextMaintenanceDue}
                      onChange={(e) => handleInputChange('nextMaintenanceDue', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEquipment} disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Equipment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, ID, category, or location..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Badge variant="secondary">
          {filteredEquipment.length} equipment found
        </Badge>
      </div>

      {/* Equipment List */}
      <div className="grid gap-4">
        {filteredEquipment.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    {item.equipmentName || 'Unknown Equipment'}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">ID: {item.equipmentId}</p>
                </div>
                <Badge className={getStatusColor(item.status || 'Unknown')}>
                  {item.status || 'Unknown'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Category</p>
                  <p>{item.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Make & Model</p>
                  <p>{item.makeModel || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Power Capacity</p>
                  <p>{item.powerCapacityKVA ? `${item.powerCapacityKVA} kVA` : 'N/A'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-600">Location</p>
                    <p>{item.locationId || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {(item.nextMaintenanceDue || item.warrantyValidTill) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm">
                    {item.nextMaintenanceDue && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-600">Next Maintenance:</span>
                        <span>{new Date(item.nextMaintenanceDue).toLocaleDateString()}</span>
                      </div>
                    )}
                    {item.warrantyValidTill && (
                      <div className="flex items-center gap-1">
                        <Settings className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600">Warranty Till:</span>
                        <span>{new Date(item.warrantyValidTill).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-8">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No equipment found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first electrical equipment'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ElectricalEquipmentManagementSimple;
