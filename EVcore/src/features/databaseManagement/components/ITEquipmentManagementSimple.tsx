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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Monitor, Calendar, MapPin, User, Package } from 'lucide-react';
import { databaseService } from '../services/databaseSimple';
import { ITEquipment } from '../types';
import { useToast } from '@/hooks/use-toast';

const ITEquipmentManagementSimple = () => {
  const [equipment, setEquipment] = useState<ITEquipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form state for new IT equipment
  const [formData, setFormData] = useState({
    assetId: '',
    assetType: '',
    makeModel: '',
    serialNumber: '',
    imeiNumber: '',
    assetStatus: '',
    purchaseDate: '',
    purchaseInvoiceNo: '',
    vendorName: '',
    warrantyValidTill: '',
    assignedToId: '',
    assignedDate: '',
    returnDate: '',
    accessoriesProvided: '',
    conditionNotes: '',
    assetLocation: '',
    complianceTag: false
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await databaseService.getITEquipment();
      setEquipment(data);
    } catch (error) {
      console.error('Error loading IT equipment:', error);
      toast({
        title: "Error",
        description: "Failed to load IT equipment data",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddEquipment = async () => {
    if (!formData.assetId || !formData.assetType || !formData.makeModel) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Asset ID, Type, Make & Model)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const equipmentData = {
        assetId: formData.assetId,
        assetType: formData.assetType as any,
        makeModel: formData.makeModel,
        serialNumber: formData.serialNumber,
        imeiNumber: formData.imeiNumber,
        assetStatus: formData.assetStatus as any,
        purchaseDate: formData.purchaseDate,
        purchaseInvoiceNo: formData.purchaseInvoiceNo,
        vendorName: formData.vendorName,
        warrantyValidTill: formData.warrantyValidTill,
        assignedToId: formData.assignedToId,
        assignedDate: formData.assignedDate,
        returnDate: formData.returnDate,
        accessoriesProvided: formData.accessoriesProvided,
        conditionNotes: formData.conditionNotes,
        assetLocation: formData.assetLocation,
        complianceTag: formData.complianceTag
      };

      await databaseService.createITEquipment(equipmentData, 'admin');
      
      toast({
        title: "Success",
        description: "IT equipment added successfully"
      });

      // Reset form and close dialog
      setFormData({
        assetId: '',
        assetType: '',
        makeModel: '',
        serialNumber: '',
        imeiNumber: '',
        assetStatus: '',
        purchaseDate: '',
        purchaseInvoiceNo: '',
        vendorName: '',
        warrantyValidTill: '',
        assignedToId: '',
        assignedDate: '',
        returnDate: '',
        accessoriesProvided: '',
        conditionNotes: '',
        assetLocation: '',
        complianceTag: false
      });
      setIsAddDialogOpen(false);
      
      // Reload equipment list
      await loadEquipment();
    } catch (error) {
      console.error('Error adding IT equipment:', error);
      toast({
        title: "Error",
        description: "Failed to add IT equipment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.assetId?.toLowerCase().includes(searchLower) ||
      item.assetType?.toLowerCase().includes(searchLower) ||
      item.makeModel?.toLowerCase().includes(searchLower) ||
      item.serialNumber?.toLowerCase().includes(searchLower) ||
      item.assignedToId?.toLowerCase().includes(searchLower) ||
      item.assetLocation?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Use': return 'bg-green-100 text-green-800';
      case 'Available': return 'bg-blue-100 text-blue-800';
      case 'Repair': return 'bg-yellow-100 text-yellow-800';
      case 'Retired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'Tablet': return '📱';
      case 'Laptop': return '💻';
      case 'Desktop': return '🖥️';
      case 'Phone': return '📞';
      case 'Server': return '🖥️';
      case 'Printer': return '🖨️';
      default: return '💻';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">IT Equipment Management</h1>
          <p className="text-gray-600 mt-2">Manage IT assets and device assignments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add IT Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Add New IT Equipment
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="purchase">Purchase</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assetId">Asset ID *</Label>
                    <Input
                      id="assetId"
                      placeholder="e.g., IT-TAB-001"
                      value={formData.assetId}
                      onChange={(e) => handleInputChange('assetId', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assetType">Asset Type *</Label>
                    <Select value={formData.assetType} onValueChange={(value) => handleInputChange('assetType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tablet">Tablet</SelectItem>
                        <SelectItem value="Laptop">Laptop</SelectItem>
                        <SelectItem value="Desktop">Desktop</SelectItem>
                        <SelectItem value="Server">Server</SelectItem>
                        <SelectItem value="Network">Network</SelectItem>
                        <SelectItem value="Printer">Printer</SelectItem>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="Monitor">Monitor</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="makeModel">Make & Model *</Label>
                    <Input
                      id="makeModel"
                      placeholder="Manufacturer info"
                      value={formData.makeModel}
                      onChange={(e) => handleInputChange('makeModel', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      placeholder="Device ID"
                      value={formData.serialNumber}
                      onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="imeiNumber">IMEI Number</Label>
                    <Input
                      id="imeiNumber"
                      placeholder="For phones/tablets"
                      value={formData.imeiNumber}
                      onChange={(e) => handleInputChange('imeiNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assetStatus">Asset Status</Label>
                    <Select value={formData.assetStatus} onValueChange={(value) => handleInputChange('assetStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In Use">In Use</SelectItem>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Repair">Repair</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Purchase Information Tab */}
              <TabsContent value="purchase" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchaseInvoiceNo">Purchase Invoice No</Label>
                    <Input
                      id="purchaseInvoiceNo"
                      placeholder="Reference invoice"
                      value={formData.purchaseInvoiceNo}
                      onChange={(e) => handleInputChange('purchaseInvoiceNo', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendorName">Vendor Name</Label>
                    <Input
                      id="vendorName"
                      placeholder="Supplier name"
                      value={formData.vendorName}
                      onChange={(e) => handleInputChange('vendorName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="warrantyValidTill">Warranty Valid Till</Label>
                    <Input
                      id="warrantyValidTill"
                      type="date"
                      value={formData.warrantyValidTill}
                      onChange={(e) => handleInputChange('warrantyValidTill', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Assignment Tab */}
              <TabsContent value="assignment" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assignedToId">Assigned To (Employee/Pilot ID)</Label>
                    <Input
                      id="assignedToId"
                      placeholder="Employee or pilot ID"
                      value={formData.assignedToId}
                      onChange={(e) => handleInputChange('assignedToId', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignedDate">Assigned Date</Label>
                    <Input
                      id="assignedDate"
                      type="date"
                      value={formData.assignedDate}
                      onChange={(e) => handleInputChange('assignedDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="returnDate">Return Date</Label>
                    <Input
                      id="returnDate"
                      type="date"
                      placeholder="Optional"
                      value={formData.returnDate}
                      onChange={(e) => handleInputChange('returnDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assetLocation">Asset Location</Label>
                    <Input
                      id="assetLocation"
                      placeholder="Office/hub"
                      value={formData.assetLocation}
                      onChange={(e) => handleInputChange('assetLocation', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="accessoriesProvided">Accessories Provided</Label>
                    <Textarea
                      id="accessoriesProvided"
                      placeholder="e.g., Charger, Stylus, Case"
                      value={formData.accessoriesProvided}
                      onChange={(e) => handleInputChange('accessoriesProvided', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="conditionNotes">Condition Notes</Label>
                    <Textarea
                      id="conditionNotes"
                      placeholder="Asset remarks and condition details"
                      value={formData.conditionNotes}
                      onChange={(e) => handleInputChange('conditionNotes', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="complianceTag"
                      checked={formData.complianceTag}
                      onCheckedChange={(checked) => handleInputChange('complianceTag', checked)}
                    />
                    <Label htmlFor="complianceTag">Compliance Tag (Yes/No)</Label>
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
            placeholder="Search by Asset ID, type, model, or assigned user..."
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
                    <span className="text-2xl">{getAssetTypeIcon(item.assetType || 'Other')}</span>
                    <div>
                      <div>{item.assetType || 'Unknown Type'}</div>
                      <p className="text-sm text-gray-500 font-normal">ID: {item.assetId}</p>
                    </div>
                  </CardTitle>
                </div>
                <Badge className={getStatusColor(item.assetStatus || 'Unknown')}>
                  {item.assetStatus || 'Unknown'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Make & Model</p>
                  <p>{item.makeModel || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Serial Number</p>
                  <p>{item.serialNumber || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-600">Assigned To</p>
                    <p>{item.assignedToId || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-600">Location</p>
                    <p>{item.assetLocation || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {(item.warrantyValidTill || item.assignedDate || item.accessoriesProvided) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {item.warrantyValidTill && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600">Warranty Till:</span>
                        <span>{new Date(item.warrantyValidTill).toLocaleDateString()}</span>
                      </div>
                    )}
                    {item.assignedDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Assigned:</span>
                        <span>{new Date(item.assignedDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {item.accessoriesProvided && (
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-purple-500" />
                        <span className="text-gray-600">Accessories:</span>
                        <span className="truncate">{item.accessoriesProvided}</span>
                      </div>
                    )}
                  </div>
                  
                  {item.complianceTag && (
                    <div className="mt-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        ✓ Compliance Tagged
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-8">
          <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No IT equipment found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first IT equipment'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ITEquipmentManagementSimple;
