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
import { Plus, Search, Building2, Calendar, MapPin, Package2, Home } from 'lucide-react';
import { databaseService } from '../services/databaseSimple';
import { InfraFurniture } from '../types';
import { useToast } from '@/hooks/use-toast';

const InfraFurnitureManagementSimple = () => {
  const [furniture, setFurniture] = useState<InfraFurniture[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form state for new infrastructure & furniture
  const [formData, setFormData] = useState({
    assetId: '',
    assetType: '',
    makeModel: '',
    materialType: '',
    color: '',
    quantity: '',
    purchaseDate: '',
    vendorName: '',
    assetStatus: '',
    ownershipType: '',
    locationId: '',
    roomAreaDescription: '',
    condition: '',
    lastInspectionDate: '',
    nextMaintenanceDue: '',
    amcContractStatus: ''
  });

  useEffect(() => {
    loadFurniture();
  }, []);

  const loadFurniture = async () => {
    try {
      const data = await databaseService.getInfraFurniture();
      setFurniture(data);
    } catch (error) {
      console.error('Error loading infrastructure & furniture:', error);
      toast({
        title: "Error",
        description: "Failed to load infrastructure & furniture data",
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

  const handleAddFurniture = async () => {
    if (!formData.assetId || !formData.assetType || !formData.quantity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Asset ID, Type, Quantity)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const furnitureData = {
        assetId: formData.assetId,
        assetType: formData.assetType as any,
        makeModel: formData.makeModel,
        materialType: formData.materialType,
        color: formData.color,
        quantity: parseInt(formData.quantity) || 1,
        purchaseDate: formData.purchaseDate,
        vendorName: formData.vendorName,
        assetStatus: formData.assetStatus as any,
        ownershipType: formData.ownershipType as any,
        locationId: formData.locationId,
        roomAreaDescription: formData.roomAreaDescription,
        condition: formData.condition as any,
        lastInspectionDate: formData.lastInspectionDate,
        nextMaintenanceDue: formData.nextMaintenanceDue,
        amcContractStatus: formData.amcContractStatus as any
      };

      await databaseService.createInfraFurniture(furnitureData, 'admin');
      
      toast({
        title: "Success",
        description: "Infrastructure & furniture added successfully"
      });

      // Reset form and close dialog
      setFormData({
        assetId: '',
        assetType: '',
        makeModel: '',
        materialType: '',
        color: '',
        quantity: '',
        purchaseDate: '',
        vendorName: '',
        assetStatus: '',
        ownershipType: '',
        locationId: '',
        roomAreaDescription: '',
        condition: '',
        lastInspectionDate: '',
        nextMaintenanceDue: '',
        amcContractStatus: ''
      });
      setIsAddDialogOpen(false);
      
      // Reload furniture list
      await loadFurniture();
    } catch (error) {
      console.error('Error adding infrastructure & furniture:', error);
      toast({
        title: "Error",
        description: "Failed to add infrastructure & furniture",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFurniture = furniture.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.assetId?.toLowerCase().includes(searchLower) ||
      item.assetType?.toLowerCase().includes(searchLower) ||
      item.makeModel?.toLowerCase().includes(searchLower) ||
      item.materialType?.toLowerCase().includes(searchLower) ||
      item.locationId?.toLowerCase().includes(searchLower) ||
      item.roomAreaDescription?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Use': return 'bg-green-100 text-green-800';
      case 'Available': return 'bg-blue-100 text-blue-800';
      case 'Damaged': return 'bg-red-100 text-red-800';
      case 'Retired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'bg-emerald-100 text-emerald-800';
      case 'Good': return 'bg-green-100 text-green-800';
      case 'Worn': return 'bg-yellow-100 text-yellow-800';
      case 'Damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'Chair': return '🪑';
      case 'Desk': return '🏢';
      case 'Table': return '📋';
      case 'Partition': return '🧱';
      case 'Cabinet': return '🗄️';
      case 'Sofa': return '🛋️';
      case 'Shelf': return '📚';
      case 'Rack': return '🗃️';
      default: return '🏢';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Infrastructure & Furniture Management</h1>
          <p className="text-gray-600 mt-2">Manage office furniture and infrastructure assets</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Furniture/Infrastructure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Add New Infrastructure & Furniture
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="purchase">Purchase</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>
              
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assetId">Asset ID *</Label>
                    <Input
                      id="assetId"
                      placeholder="e.g., INF-CHAIR-001"
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
                        <SelectItem value="Chair">Chair</SelectItem>
                        <SelectItem value="Desk">Desk</SelectItem>
                        <SelectItem value="Partition">Partition</SelectItem>
                        <SelectItem value="Cabinet">Cabinet</SelectItem>
                        <SelectItem value="Table">Table</SelectItem>
                        <SelectItem value="Sofa">Sofa</SelectItem>
                        <SelectItem value="Shelf">Shelf</SelectItem>
                        <SelectItem value="Rack">Rack</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="makeModel">Make/Model</Label>
                    <Input
                      id="makeModel"
                      placeholder="If applicable"
                      value={formData.makeModel}
                      onChange={(e) => handleInputChange('makeModel', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="materialType">Material Type</Label>
                    <Input
                      id="materialType"
                      placeholder="Wood, Steel, etc."
                      value={formData.materialType}
                      onChange={(e) => handleInputChange('materialType', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      placeholder="Optional"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="No. of units"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                    />
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
                    <Label htmlFor="vendorName">Vendor Name</Label>
                    <Input
                      id="vendorName"
                      placeholder="Supplier name"
                      value={formData.vendorName}
                      onChange={(e) => handleInputChange('vendorName', e.target.value)}
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
                        <SelectItem value="Damaged">Damaged</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ownershipType">Ownership Type</Label>
                    <Select value={formData.ownershipType} onValueChange={(value) => handleInputChange('ownershipType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ownership" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owned">Owned</SelectItem>
                        <SelectItem value="Rented">Rented</SelectItem>
                        <SelectItem value="Leased">Leased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="locationId">Location ID</Label>
                    <Input
                      id="locationId"
                      placeholder="Office/Hub/Kiosk"
                      value={formData.locationId}
                      onChange={(e) => handleInputChange('locationId', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="roomAreaDescription">Room/Area Description</Label>
                    <Input
                      id="roomAreaDescription"
                      placeholder="e.g., Control Room"
                      value={formData.roomAreaDescription}
                      onChange={(e) => handleInputChange('roomAreaDescription', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Worn">Worn</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Maintenance Tab */}
              <TabsContent value="maintenance" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastInspectionDate">Last Inspection Date</Label>
                    <Input
                      id="lastInspectionDate"
                      type="date"
                      value={formData.lastInspectionDate}
                      onChange={(e) => handleInputChange('lastInspectionDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextMaintenanceDue">Next Maintenance Due</Label>
                    <Input
                      id="nextMaintenanceDue"
                      type="date"
                      placeholder="If applicable"
                      value={formData.nextMaintenanceDue}
                      onChange={(e) => handleInputChange('nextMaintenanceDue', e.target.value)}
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
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFurniture} disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Item'}
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
            placeholder="Search by Asset ID, type, material, location, or room..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Badge variant="secondary">
          {filteredFurniture.length} items found
        </Badge>
      </div>

      {/* Furniture List */}
      <div className="grid gap-4">
        {filteredFurniture.map((item) => (
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
                <div className="flex gap-2">
                  <Badge className={getStatusColor(item.assetStatus || 'Unknown')}>
                    {item.assetStatus || 'Unknown'}
                  </Badge>
                  <Badge className={getConditionColor(item.condition || 'Unknown')}>
                    {item.condition || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Make/Model</p>
                  <p>{item.makeModel || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Material</p>
                  <p>{item.materialType || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Package2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-600">Quantity</p>
                    <p>{item.quantity || 1} unit(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-600">Location</p>
                    <p>{item.locationId || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {(item.roomAreaDescription || item.color) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {item.roomAreaDescription && (
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600">Room/Area:</span>
                        <span>{item.roomAreaDescription}</span>
                      </div>
                    )}
                    {item.color && (
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full border border-gray-300" style={{backgroundColor: item.color.toLowerCase()}}></div>
                        <span className="text-gray-600">Color:</span>
                        <span>{item.color}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(item.lastInspectionDate || item.nextMaintenanceDue || item.ownershipType) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {item.lastInspectionDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Last Inspection:</span>
                        <span>{new Date(item.lastInspectionDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {item.nextMaintenanceDue && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-600">Next Maintenance:</span>
                        <span>{new Date(item.nextMaintenanceDue).toLocaleDateString()}</span>
                      </div>
                    )}
                    {item.ownershipType && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-purple-500" />
                        <span className="text-gray-600">Ownership:</span>
                        <span>{item.ownershipType}</span>
                      </div>
                    )}
                  </div>
                  
                  {item.amcContractStatus && item.amcContractStatus !== 'NA' && (
                    <div className="mt-2">
                      <Badge variant="outline" className={`${item.amcContractStatus === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        AMC: {item.amcContractStatus}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFurniture.length === 0 && (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No furniture/infrastructure found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first furniture or infrastructure item'}
          </p>
        </div>
      )}
    </div>
  );
};

export default InfraFurnitureManagementSimple;
