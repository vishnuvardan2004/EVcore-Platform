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
import { Plus, Search, Building2, Calendar, MapPin, Package2, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { dbApi } from '../services/api';
import { InfraFurniture } from '../types';
import { useToast } from '@/hooks/use-toast';

const InfraFurnitureManagementSimple = () => {
  const [furniture, setFurniture] = useState<InfraFurniture[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
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
    fetchInfraFurniture();
  }, []);

  const fetchInfraFurniture = async () => {
    try {
      console.log('Loading infrastructure & furniture from API...');
      const response = await dbApi.listInfraFurniture();
      console.log('API Response:', response);
      
      // Backend returns { success: true, data: { documents, pagination } }
      if (response.success && response.data) {
        // The response.data should contain { documents: InfraFurniture[], pagination: {...} }
        const data = response.data as any;
        setFurniture(data.documents || []);
      } else {
        setFurniture([]);
      }
    } catch (error) {
      console.error('Error loading infrastructure & furniture:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to load infrastructure & furniture. Please try again.";
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
      setFurniture([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddFurniture = async () => {
    // Log the current form state
    console.log("Current form data:", JSON.stringify(formData, null, 2));
    
    // Validate required fields according to backend schema
    if (!formData.assetId || !formData.assetType || !formData.makeModel || !formData.locationId || !formData.locationId.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields: Asset ID, Asset Type, Name/Model, and Building/Location (cannot be empty)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Log form data before building payload
      console.log("🔍 Form locationId value:", formData.locationId);
      console.log("🔍 Form locationId after trim:", formData.locationId ? formData.locationId.trim() : 'EMPTY');
      
      // Build payload matching backend InfrastructureFurniture schema
      const furnitureData: any = {
        assetId: formData.assetId, // Main identifier (required)
        name: formData.makeModel || formData.assetType, // Use makeModel as name (required)
        category: 'furniture', // Default to furniture category (required)
        subcategory: formData.assetType, // Map assetType to subcategory (required)
        type: formData.assetType, // Use assetType as type (required)
        brand: formData.makeModel ? formData.makeModel.split(' ')[0] : undefined,
        model: formData.makeModel ? formData.makeModel.split(' ').slice(1).join(' ') || formData.makeModel : undefined,
        assetTag: formData.assetId,
        description: formData.roomAreaDescription || undefined,
        specifications: {
          material: formData.materialType || undefined,
          color: formData.color || undefined,
          capacity: formData.quantity || undefined
        },
        status: formData.assetStatus || 'active',
        condition: formData.condition || 'good',
        location: {
          building: formData.locationId.trim(), // Required field
          room: formData.roomAreaDescription || undefined,
          area: formData.roomAreaDescription || undefined
        },
        assignedTo: {
          department: formData.locationId || undefined
        },
        purchaseInfo: {
          purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
          vendor: formData.vendorName || undefined
        },
        maintenance: {
          lastServiceDate: formData.lastInspectionDate ? new Date(formData.lastInspectionDate) : undefined,
          nextServiceDate: formData.nextMaintenanceDue ? new Date(formData.nextMaintenanceDue) : undefined
        }
      };

      // Debug payload before cleanup
      console.log("🔍 Payload BEFORE cleanup:", JSON.stringify(furnitureData, null, 2));
      console.log("🔍 Location object BEFORE cleanup:", furnitureData.location);
      console.log("🔍 Building field BEFORE cleanup:", furnitureData.location.building);

      // Remove undefined fields to keep payload clean (but preserve required location.building)
      Object.keys(furnitureData).forEach(key => {
        if (furnitureData[key] === undefined) {
          delete furnitureData[key];
        } else if (typeof furnitureData[key] === 'object' && furnitureData[key] !== null && !Array.isArray(furnitureData[key]) && !(furnitureData[key] instanceof Date)) {
          // Clean nested objects but preserve location.building (required field)
          if (key === 'location') {
            // Special handling for location object - NEVER remove building field
            Object.keys(furnitureData[key]).forEach(nestedKey => {
              if (nestedKey !== 'building' && furnitureData[key][nestedKey] === undefined) {
                delete furnitureData[key][nestedKey];
              }
            });
            // Ensure building field is always present and not empty
            if (!furnitureData.location.building || furnitureData.location.building.trim() === '') {
              console.error("❌ CRITICAL: location.building is missing or empty!");
              furnitureData.location.building = formData.locationId?.trim() || 'DefaultBuilding';
            }
          } else {
            // Normal cleanup for other nested objects
            Object.keys(furnitureData[key]).forEach(nestedKey => {
              if (furnitureData[key][nestedKey] === undefined) {
                delete furnitureData[key][nestedKey];
              }
            });
            // Remove empty objects (but not location which has required building)
            if (key !== 'location' && Object.keys(furnitureData[key]).length === 0) {
              delete furnitureData[key];
            }
          }
        }
      });

      // Debug payload after cleanup
      console.log("🔍 Payload AFTER cleanup:", JSON.stringify(furnitureData, null, 2));
      console.log("🔍 Location object AFTER cleanup:", furnitureData.location);
      console.log("🔍 Building field AFTER cleanup:", furnitureData.location?.building);
      
      // Final validation before API call
      if (!furnitureData.location || !furnitureData.location.building) {
        console.error("❌ CRITICAL: location.building is missing from payload!");
        console.error("Current location object:", furnitureData.location);
        console.error("Form locationId value:", formData.locationId);
        throw new Error("Payload validation failed: location.building is required");
      }
      
      console.log("✅ Final payload validation passed - calling API");
      console.log("✅ About to send to API:", JSON.stringify({ document: furnitureData }, null, 2));

      // FINAL VALIDATION - Ensure all required fields are present
      const requiredFields = ['assetId', 'name', 'category', 'subcategory', 'type'];
      const missingFields = requiredFields.filter(field => !furnitureData[field]);
      
      if (missingFields.length > 0) {
        console.error("❌ Missing required fields:", missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      if (!furnitureData.location || !furnitureData.location.building) {
        console.error("❌ CRITICAL ERROR: location.building is missing from final payload");
        console.error("❌ Current payload:", JSON.stringify(furnitureData, null, 2));
        throw new Error("Location building is required but missing from payload");
      }

      console.log("✅ All validations passed. Sending to API...");

      // Log the full payload as JSON for debugging
      console.log("=== BEFORE CLEANUP ===");
      console.log("Raw payload:", JSON.stringify(furnitureData, null, 2));
      console.log("Location object:", furnitureData.location);
      console.log("Building field:", furnitureData.location?.building);
      console.log("Payload:", JSON.stringify(furnitureData, null, 2));
      console.log('🚨 InfraFurniture Payload:', furnitureData);
      console.log('🔍 Location field specifically:', furnitureData.location);
      console.log('🔍 Building field specifically:', furnitureData.location.building);
      
      console.log("🔌 About to call dbApi.createInfraFurniture...");
      console.log("🔍 API expects wrapper format: { document: data }");
      
      const response = await dbApi.createInfraFurniture(furnitureData);
      console.log('Infrastructure & furniture creation response:', response);
      
      if (response.success && response.data) {
        // The actual document is nested in response.data.document
        const createdFurniture = (response.data as any).document || response.data;
        
        // Check for both _id and id fields in response
        const createdId = createdFurniture._id || createdFurniture.id;
        if (!createdId) {
          console.warn('Warning: Created infrastructure & furniture missing ID fields:', response.data);
          console.warn('Available response fields:', Object.keys(response.data));
          // Still show success since item was likely created
        }
        
        toast({
          title: "Success",
          description: "Infrastructure & furniture added successfully"
        });

        // Refresh the furniture list to show the new item
        await fetchInfraFurniture();

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
        await fetchInfraFurniture();
      } else {
        throw new Error('Failed to create infrastructure & furniture - invalid response');
      }
    } catch (error) {
      console.error("Error adding item:", error.response?.data || error.message);
      console.error('Full error details:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to add infrastructure & furniture. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
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

  const handleCardClick = (itemId: string) => {
    console.log('🏢 Card clicked for Infrastructure/Furniture ID:', itemId);
    setExpandedCardId(expandedCardId === itemId ? null : itemId);
  };

  const renderDetailedView = (item: InfraFurniture) => {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Asset Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Asset ID:</span>
                <span className="font-medium">{item.assetId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Make/Model:</span>
                <span className="font-medium">{item.makeModel || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Material:</span>
                <span className="font-medium">{item.materialType || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Color:</span>
                <span className="font-medium">{item.color || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{item.quantity || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Purchase & Vendor</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Date:</span>
                <span className="font-medium">{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendor:</span>
                <span className="font-medium">{item.vendorName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ownership:</span>
                <span className="font-medium">{item.ownershipType || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Location & Maintenance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{item.locationId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room/Area:</span>
                <span className="font-medium">{item.roomAreaDescription || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Inspection:</span>
                <span className="font-medium">{item.lastInspectionDate ? new Date(item.lastInspectionDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Maintenance:</span>
                <span className="font-medium">{item.nextMaintenanceDue ? new Date(item.nextMaintenanceDue).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Status & Contract</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Asset Status:</span>
                <span className="font-medium">{item.assetStatus || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Condition:</span>
                <span className="font-medium">{item.condition || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AMC Status:</span>
                <span className="font-medium">{item.amcContractStatus || 'N/A'}</span>
              </div>
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
                    <Label htmlFor="makeModel">Name/Model *</Label>
                    <Input
                      id="makeModel"
                      placeholder="e.g., Herman Miller Ergonomic Chair"
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
                    <Label htmlFor="locationId">Building/Location *</Label>
                    <Input
                      id="locationId"
                      placeholder="e.g., Main Building, Branch Office"
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
        {filteredFurniture.map((item, index) => {
          const isExpanded = expandedCardId === (item as any)._id;
          return (
            <Card key={(item as any)._id || item.assetId || `furniture-${index}`} className="transition-all duration-200">
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
                    <Badge className={getConditionColor(item.condition || 'Unknown')}>
                      {item.condition || 'Unknown'}
                    </Badge>
                    <button
                      onClick={() => handleCardClick((item as any)._id!)}
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

                {/* Expandable Details Section */}
                {isExpanded && renderDetailedView(item)}
              </CardContent>
            </Card>
          );
        })}
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
