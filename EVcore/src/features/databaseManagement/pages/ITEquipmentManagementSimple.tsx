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
import { Plus, Search, Monitor, Calendar, MapPin, User, Package, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { dbApi } from '../services/api';
import { ITEquipment } from '../types';
import { useToast } from '@/hooks/use-toast';

const ITEquipmentManagementSimple = () => {
  const [equipment, setEquipment] = useState<ITEquipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
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
    fetchITEquipments();
  }, []);

  const fetchITEquipments = async () => {
    try {
      console.log('Loading IT equipment from API...');
      const response = await dbApi.listITEquipment();
      console.log('API Response:', response);
      
      // Backend returns { success: true, data: { documents, pagination } }
      if (response.success && response.data) {
        // The response.data should contain { documents: ITEquipment[], pagination: {...} }
        const data = response.data as any;
        setEquipment(data.documents || []);
      } else {
        setEquipment([]);
      }
    } catch (error) {
      console.error('Error loading IT equipment:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to load IT equipment. Please try again.";
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddEquipment = async () => {
    // Validate required fields according to backend schema
    if (!formData.assetId || !formData.assetType || !formData.makeModel) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields: Asset ID, Category, and Brand/Model",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Build payload matching backend ITEquipment schema
      const equipmentData: any = {
        itEquipmentId: formData.assetId,
        name: formData.makeModel, // Use makeModel as name
        category: formData.assetType, // Map assetType to category
        type: formData.assetType, // Use assetType as type as well
        brand: formData.makeModel.split(' ')[0] || formData.makeModel, // Extract brand from makeModel
        model: formData.makeModel.split(' ').slice(1).join(' ') || formData.makeModel, // Extract model
        serialNumber: formData.serialNumber || undefined,
        assetTag: formData.assetId,
        status: formData.assetStatus || 'active',
        condition: 'good', // Default condition
        assignedTo: {
          employeeId: formData.assignedToId || undefined,
          department: formData.assetLocation || undefined
        },
        purchaseInfo: {
          purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
          vendor: formData.vendorName || undefined,
          invoiceNumber: formData.purchaseInvoiceNo || undefined
        },
        warranty: {
          endDate: formData.warrantyValidTill ? new Date(formData.warrantyValidTill) : undefined
        },
        location: {
          department: formData.assetLocation || undefined
        },
        notes: formData.conditionNotes || undefined
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

      console.log('Sending IT equipment data to API (backend schema):', equipmentData);
      
      const response = await dbApi.createITEquipment(equipmentData);
      console.log('IT equipment creation response:', response);
      
      if (response.success && response.data) {
        // The actual document is nested in response.data.document
        const createdEquipment = (response.data as any).document || response.data;
        
        // Check for both _id and id fields in response
        const createdId = createdEquipment._id || createdEquipment.id;
        if (!createdId) {
          console.warn('Warning: Created IT equipment missing ID fields:', response.data);
          console.warn('Available response fields:', Object.keys(response.data));
          // Still show success since equipment was likely created
        }
        
        toast({
          title: "Success",
          description: "IT equipment added successfully"
        });

        // Refresh the equipment list to show the new equipment
        await fetchITEquipments();

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
        await fetchITEquipments();
      } else {
        throw new Error('Failed to create IT equipment - invalid response');
      }
    } catch (error) {
      console.error('Error adding IT equipment:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to add IT equipment. Please try again.";
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

  const handleCardClick = (itemId: string) => {
    console.log('💻 Card clicked for IT equipment ID:', itemId);
    setExpandedCardId(expandedCardId === itemId ? null : itemId);
  };

  const renderDetailedView = (item: ITEquipment) => {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Asset Information</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Asset ID:</span> {item.assetId || 'N/A'}</div>
              <div><span className="font-medium">Asset Type:</span> {item.assetType || 'N/A'}</div>
              <div><span className="font-medium">Make & Model:</span> {item.makeModel || 'N/A'}</div>
              <div><span className="font-medium">Serial Number:</span> {item.serialNumber || 'N/A'}</div>
              <div><span className="font-medium">IMEI Number:</span> {item.imeiNumber || 'N/A'}</div>
              <div><span className="font-medium">Asset Status:</span> {item.assetStatus || 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Purchase & Vendor</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Purchase Date:</span> {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Invoice Number:</span> {item.purchaseInvoiceNo || 'N/A'}</div>
              <div><span className="font-medium">Vendor Name:</span> {item.vendorName || 'N/A'}</div>
              <div><span className="font-medium">Warranty Valid Till:</span> {item.warrantyValidTill ? new Date(item.warrantyValidTill).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Assignment Details</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Assigned To ID:</span> {item.assignedToId || 'N/A'}</div>
              <div><span className="font-medium">Assigned Date:</span> {item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Return Date:</span> {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Asset Location:</span> {item.assetLocation || 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Additional Information</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Accessories Provided:</span> {item.accessoriesProvided || 'N/A'}</div>
              <div><span className="font-medium">Condition Notes:</span> {item.conditionNotes || 'N/A'}</div>
              <div><span className="font-medium">Compliance Tag:</span> {item.complianceTag ? 'Yes' : 'No'}</div>
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
                    <Label htmlFor="assetType">Category *</Label>
                    <Select value={formData.assetType} onValueChange={(value) => handleInputChange('assetType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="computer">Computer</SelectItem>
                        <SelectItem value="laptop">Laptop</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="network">Network</SelectItem>
                        <SelectItem value="printer">Printer</SelectItem>
                        <SelectItem value="scanner">Scanner</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="monitor">Monitor</SelectItem>
                        <SelectItem value="projector">Projector</SelectItem>
                        <SelectItem value="camera">Camera</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="license">License</SelectItem>
                        <SelectItem value="accessory">Accessory</SelectItem>
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
                    <Label htmlFor="assetStatus">Status</Label>
                    <Select value={formData.assetStatus} onValueChange={(value) => handleInputChange('assetStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="stolen">Stolen</SelectItem>
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
        {filteredEquipment.map((item, index) => {
          const isExpanded = expandedCardId === (item.id || item.assetId);
          return (
            <Card key={item.id || item.assetId || `it-equipment-${index}`} className="transition-all duration-200">
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
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(item.assetStatus || 'Unknown')}>
                      {item.assetStatus || 'Unknown'}
                    </Badge>
                    <button
                      onClick={() => handleCardClick(item.id || item.assetId || `it-equipment-${index}`)}
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

                {/* Expandable Details Section */}
                {isExpanded && renderDetailedView(item)}
              </CardContent>
            </Card>
          );
        })}
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
