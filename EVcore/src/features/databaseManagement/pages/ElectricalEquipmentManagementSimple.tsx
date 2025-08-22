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
import { Plus, Search, Zap, Calendar, MapPin, Settings, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { dbApi } from '../services/api';
import { ElectricalEquipment } from '../types';
import { useToast } from '@/hooks/use-toast';

const ElectricalEquipmentManagementSimple = () => {
  const [equipment, setEquipment] = useState<ElectricalEquipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
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
    fetchElectricalEquipment();
  }, []);

  const fetchElectricalEquipment = async () => {
    try {
      console.log('Loading electrical equipment from API...');
      const response = await dbApi.listElectricalEquipment();
      console.log('API Response:', response);
      
      // Backend returns { success: true, data: { documents, pagination } }
      if (response.success && response.data) {
        // The response.data should contain { documents: ElectricalEquipment[], pagination: {...} }
        const data = response.data as any;
        const documents = data.documents || [];
        
        // Transform data to ensure we have consistent ID fields
        const transformedDocuments = documents.map((item: any, index: number) => ({
          ...item,
          id: item._id || item.id || item.equipmentId || `electrical-${index}`, // Ensure we have an id field
        }));
        
        console.log('Transformed electrical equipment documents:', transformedDocuments);
        setEquipment(transformedDocuments);
      } else {
        setEquipment([]);
      }
    } catch (error) {
      console.error('Error loading electrical equipment:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to load electrical equipment. Please try again.";
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
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddEquipment = async () => {
    // Validate required fields according to backend schema
    if (!formData.equipmentId || !formData.equipmentName || !formData.category || !formData.makeModel) {
      toast({
        title: "Validation Error", 
        description: "Please fill in all required fields: Equipment ID, Name, Type, and Brand/Model",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Build payload matching backend ElectricEquipment schema
      const equipmentData: any = {
        equipmentId: formData.equipmentId,
        name: formData.equipmentName,
        type: formData.category, // Map category to type
        brand: formData.makeModel.split(' ')[0] || formData.makeModel, // Extract brand from makeModel
        model: formData.makeModel.split(' ').slice(1).join(' ') || formData.makeModel, // Extract model
        serialNumber: formData.serialNumber || undefined, // Optional field
        specifications: {
          voltage: parseFloat(formData.voltageRating) || undefined,
          current: parseFloat(formData.currentRating) || undefined, 
          power: parseFloat(formData.powerCapacityKVA) * 1000 || undefined, // Convert KVA to Watts
          efficiency: undefined // Not captured in form
        },
        status: formData.status || 'operational',
        location: {
          address: formData.locationId || undefined,
          facility: formData.locationType || undefined
        },
        installationDate: formData.installationDate ? new Date(formData.installationDate) : undefined,
        lastMaintenanceDate: formData.lastServiceDate ? new Date(formData.lastServiceDate) : undefined,
        nextMaintenanceDate: formData.nextMaintenanceDue ? new Date(formData.nextMaintenanceDue) : undefined,
        warranty: {
          endDate: formData.warrantyValidTill ? new Date(formData.warrantyValidTill) : undefined
        },
        isActive: formData.status !== 'inactive'
      };

      // Remove undefined fields to keep payload clean
      Object.keys(equipmentData).forEach(key => {
        if (equipmentData[key] === undefined) {
          delete equipmentData[key];
        } else if (typeof equipmentData[key] === 'object' && equipmentData[key] !== null) {
          // Clean nested objects
          Object.keys(equipmentData[key]).forEach(nestedKey => {
            if (equipmentData[key][nestedKey] === undefined) {
              delete equipmentData[key][nestedKey];
            }
          });
          // Remove empty objects
          if (Object.keys(equipmentData[key]).length === 0) {
            delete equipmentData[key];
          }
        }
      });

      console.log('Sending electrical equipment data to API (backend schema):', equipmentData);
      
      const response = await dbApi.createElectricalEquipment(equipmentData);
      console.log('Electrical equipment creation response:', response);
      
      if (response.success && response.data) {
        // The actual document is nested in response.data.document
        const createdEquipment = (response.data as any).document || response.data;
        
        // Check for both _id and id fields in response
        const createdId = createdEquipment._id || createdEquipment.id;
        if (!createdId) {
          console.warn('Warning: Created electrical equipment missing ID fields:', response.data);
          console.warn('Available response fields:', Object.keys(response.data));
          // Still show success since equipment was likely created
        }
        
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
        
        // Reload equipment list to show the new equipment
        await fetchElectricalEquipment();
      } else {
        throw new Error('Failed to create electrical equipment - invalid response');
      }
    } catch (error) {
      console.error('Error adding electrical equipment:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to add electrical equipment. Please try again.";
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

  const handleCardClick = (itemId: string) => {
    console.log('⚡ Card clicked for electrical equipment ID:', itemId);
    console.log('⚡ Current expandedCardId:', expandedCardId);
    const newExpandedId = expandedCardId === itemId ? null : itemId;
    console.log('⚡ Setting expandedCardId to:', newExpandedId);
    setExpandedCardId(newExpandedId);
  };

  const getUniqueId = (item: ElectricalEquipment, index: number) => {
    return item.id || item.equipmentId || `electrical-equipment-${index}`;
  };

  const renderDetailedView = (item: ElectricalEquipment) => {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Equipment Information</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Equipment ID:</span> {item.equipmentId || 'N/A'}</div>
              <div><span className="font-medium">Equipment Name:</span> {item.equipmentName || 'N/A'}</div>
              <div><span className="font-medium">Category:</span> {item.category || 'N/A'}</div>
              <div><span className="font-medium">Make & Model:</span> {item.makeModel || 'N/A'}</div>
              <div><span className="font-medium">Serial Number:</span> {item.serialNumber || 'N/A'}</div>
              <div><span className="font-medium">Status:</span> {item.status || 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Technical Specifications</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Power Capacity:</span> {item.powerCapacityKVA ? `${item.powerCapacityKVA} KVA` : 'N/A'}</div>
              <div><span className="font-medium">Phase Type:</span> {item.phaseType || 'N/A'}</div>
              <div><span className="font-medium">Voltage Rating:</span> {item.voltageRating || 'N/A'}</div>
              <div><span className="font-medium">Current Rating:</span> {item.currentRating || 'N/A'}</div>
              <div><span className="font-medium">Frequency:</span> {item.frequency || 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Location & Installation</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Location ID:</span> {item.locationId || 'N/A'}</div>
              <div><span className="font-medium">Location Type:</span> {item.locationType || 'N/A'}</div>
              <div><span className="font-medium">Installation Date:</span> {item.installationDate ? new Date(item.installationDate).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Ownership Status:</span> {item.ownershipStatus || 'N/A'}</div>
              <div><span className="font-medium">Installed By:</span> {item.installedBy || 'N/A'}</div>
              <div><span className="font-medium">Usage Purpose:</span> {item.usagePurpose || 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Maintenance Information</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Warranty Valid Till:</span> {item.warrantyValidTill ? new Date(item.warrantyValidTill).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">AMC Contract Status:</span> {item.amcContractStatus || 'N/A'}</div>
              <div><span className="font-medium">Last Service Date:</span> {item.lastServiceDate ? new Date(item.lastServiceDate).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Next Maintenance Due:</span> {item.nextMaintenanceDue ? new Date(item.nextMaintenanceDue).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Created:</span> {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}</div>
              <div><span className="font-medium">Last Updated:</span> {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    );
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
                    <Label htmlFor="category">Type *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="charger">Charger</SelectItem>
                        <SelectItem value="inverter">Inverter</SelectItem>
                        <SelectItem value="battery_pack">Battery Pack</SelectItem>
                        <SelectItem value="solar_panel">Solar Panel</SelectItem>
                        <SelectItem value="transformer">Transformer</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
                        <SelectItem value="cable">Cable</SelectItem>
                        <SelectItem value="connector">Connector</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="makeModel">Brand & Model *</Label>
                    <Input
                      id="makeModel"
                      placeholder="e.g., Tesla Model S Charger"
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
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="faulty">Faulty</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
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
        {filteredEquipment.map((item, index) => {
          const uniqueId = getUniqueId(item, index);
          const isExpanded = expandedCardId === uniqueId;
          return (
            <Card key={uniqueId} className="transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <div>
                        <div>{item.equipmentName || 'Unknown Equipment'}</div>
                        <p className="text-sm text-gray-500 font-normal">ID: {item.equipmentId}</p>
                      </div>
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(item.status || 'Unknown')}>
                      {item.status || 'Unknown'}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCardClick(uniqueId);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title={isExpanded ? "Hide details" : "Show details"}
                      type="button"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
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

                {/* Expandable Details Section */}
                {isExpanded && renderDetailedView(item)}
              </CardContent>
            </Card>
          );
        })}
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
