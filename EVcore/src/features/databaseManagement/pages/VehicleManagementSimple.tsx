import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Car, 
  Plus, 
  Search, 
  RefreshCw,
  MapPin,
  Calendar,
  Fuel,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { Vehicle } from '../types';
import { dbApi } from '../services/api';

export const VehicleManagementSimple: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<Vehicle>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      console.log('Loading vehicles from API...');
      const response = await dbApi.listVehicles();
      console.log('API Response:', response);
      
      // Backend returns { success: true, data: { documents, pagination } }
      if (response.success && response.data) {
        // The response.data should contain { documents: Vehicle[], pagination: {...} }
        const data = response.data as any;
        setVehicles(data.documents || []);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to load vehicles. Please try again.";
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
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.Registration_Number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.Model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.Brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Active': 'bg-green-100 text-green-800',
      'In_Maintenance': 'bg-yellow-100 text-yellow-800',
      'Idle': 'bg-gray-100 text-gray-800',
      'Out_of_Service': 'bg-red-100 text-red-800'
    };
    const color = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
    return <Badge className={color}>{status.replace('_', ' ')}</Badge>;
  };

  const handleCardClick = (itemId: string) => {
    console.log('🚗 Card clicked for vehicle ID:', itemId);
    setExpandedCardId(expandedCardId === itemId ? null : itemId);
  };

  const renderDetailedView = (vehicle: Vehicle) => {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Basic Information</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Vehicle ID:</span> {vehicle.Vehicle_ID || 'N/A'}</div>
              <div><span className="font-medium">Registration Number:</span> {vehicle.Registration_Number || 'N/A'}</div>
              <div><span className="font-medium">VIN Number:</span> {vehicle.VIN_Number || 'N/A'}</div>
              <div><span className="font-medium">Engine Number:</span> {vehicle.Engine_Number || 'N/A'}</div>
              <div><span className="font-medium">Brand:</span> {vehicle.Brand || 'N/A'}</div>
              <div><span className="font-medium">Model:</span> {vehicle.Model || 'N/A'}</div>
              <div><span className="font-medium">Vehicle Class:</span> {vehicle.Vehicle_Class || 'N/A'}</div>
              <div><span className="font-medium">Vehicle Type:</span> {vehicle.Vehicle_Type || 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Registration & Status</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Registration Date:</span> {vehicle.Registration_Date ? new Date(vehicle.Registration_Date).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Fuel Type:</span> {vehicle.Fuel_Type || 'N/A'}</div>
              <div><span className="font-medium">Status:</span> {vehicle.Status || 'N/A'}</div>
              <div><span className="font-medium">Vehicle Condition:</span> {vehicle.Vehicle_Condition || 'N/A'}</div>
              <div><span className="font-medium">Location Assigned:</span> {vehicle.Location_Assigned || 'N/A'}</div>
              <div><span className="font-medium">Assigned Pilot ID:</span> {vehicle.Assigned_Pilot_ID || 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Battery & Technical</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Battery Serial:</span> {vehicle.Battery_Serial_Number || 'N/A'}</div>
              <div><span className="font-medium">Battery Capacity:</span> {vehicle.Battery_Capacity_kWh ? `${vehicle.Battery_Capacity_kWh} kWh` : 'N/A'}</div>
              <div><span className="font-medium">Charging Port:</span> {vehicle.Charging_Port_Type || 'N/A'}</div>
              <div><span className="font-medium">Charger Type:</span> {vehicle.Charger_Type || 'N/A'}</div>
              <div><span className="font-medium">Charger Serial:</span> {vehicle.Charger_Serial_Number || 'N/A'}</div>
              <div><span className="font-medium">Number of Tyres:</span> {vehicle.No_of_Tyres || 'N/A'}</div>
              <div><span className="font-medium">Odometer Reading:</span> {vehicle.Odometer_Reading ? `${vehicle.Odometer_Reading} km` : 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Insurance & Legal</h4>
            <div className="space-y-2">
              <div><span className="font-medium">Insurance Provider:</span> {vehicle.Insurance_Provider || 'N/A'}</div>
              <div><span className="font-medium">Insurance Policy:</span> {vehicle.Insurance_Policy_No || 'N/A'}</div>
              <div><span className="font-medium">Insurance Expiry:</span> {vehicle.Insurance_Expiry_Date ? new Date(vehicle.Insurance_Expiry_Date).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Permit Number:</span> {vehicle.Permit_Number || 'N/A'}</div>
              <div><span className="font-medium">Permit Expiry:</span> {vehicle.Permit_Expiry_Date ? new Date(vehicle.Permit_Expiry_Date).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Police Certificate:</span> {vehicle.Police_Certificate_Status || 'N/A'}</div>
              <div><span className="font-medium">PUC Status:</span> {vehicle.PUC_Status || 'N/A'}</div>
              <div><span className="font-medium">Created:</span> {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Database management API required fields validation (from databaseService.js)
    // Required: ['Vehicle_ID', 'VIN_Number', 'Engine_Number', 'Registration_Number', 'Registration_Date', 'Brand', 'Model', 'Year']
    
    if (!formData.Registration_Number?.trim()) newErrors.Registration_Number = 'Registration Number is required';
    if (!formData.Brand?.trim()) newErrors.Brand = 'Brand is required';
    if (!formData.Model?.trim()) newErrors.Model = 'Model is required';
    if (!formData.Year) newErrors.Year = 'Manufacturing year is required';
    
    // Note: Vehicle_ID, VIN_Number, Engine_Number will be auto-generated if not provided
    // Registration_Date will default to current date if not provided
    
    // Numeric validations
    if (formData.Year) {
      const currentYear = new Date().getFullYear();
      if (formData.Year < 2015 || formData.Year > currentYear + 1) {
        newErrors.Year = `Year must be between 2015 and ${currentYear + 1}`;
      }
    }
    
    // Optional field validations
    if (formData.Battery_Capacity_kWh && formData.Battery_Capacity_kWh < 0) {
      newErrors.Battery_Capacity_kWh = 'Battery capacity cannot be negative';
    }
    if (formData.Odometer_Reading && formData.Odometer_Reading < 0) {
      newErrors.Odometer_Reading = 'Odometer reading cannot be negative';
    }
    if (formData.No_of_Tyres && formData.No_of_Tyres < 2) {
      newErrors.No_of_Tyres = 'Number of tyres must be at least 2';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({});
    setErrors({});
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleSave = async () => {
    console.log('Form submission started...');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      // Create new vehicle with all required fields for database management API
      // Note: We deliberately DON'T include 'vehicleId' field to avoid conflicts
      // with the Vehicle model's auto-generation logic in the backend
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      const newVehicle: any = {
        // Primary Vehicle Information (required by database management API)
        Vehicle_ID: `VEH_${timestamp}_${randomSuffix}`, // Unique ID for database management system
        VIN_Number: formData.VIN_Number || `VIN${timestamp}${randomSuffix}`,
        Engine_Number: formData.Engine_Number || `ENG${timestamp}${randomSuffix}`,
        Registration_Number: formData.Registration_Number || '',
        Registration_Date: formData.Registration_Date || new Date().toISOString().split('T')[0],
        Brand: formData.Brand || '',
        Model: formData.Model || '',
        Year: formData.Year || new Date().getFullYear(),
        Vehicle_Class: formData.Vehicle_Class || 'Hatchback',
        Vehicle_Type: formData.Vehicle_Type || 'E4W',
        Fuel_Type: formData.Fuel_Type || 'Electric',
        
        // Battery & Technical Details (with defaults)
        Battery_Serial_Number: formData.Battery_Serial_Number || `BAT${timestamp.toString().slice(-10)}`,
        No_of_Tyres: formData.No_of_Tyres || 4,
        Tyre_Serial_Numbers: formData.Tyre_Serial_Numbers || '',
        Charger_Serial_Number: formData.Charger_Serial_Number || `CHG${timestamp.toString().slice(-10)}`,
        Charger_Type: formData.Charger_Type || 'Slow',
        Battery_Capacity_kWh: formData.Battery_Capacity_kWh || 40,
        Charging_Port_Type: formData.Charging_Port_Type || 'CCS2',
        
        // Insurance & Legal Documents (optional fields)
        Insurance_Provider: formData.Insurance_Provider || '',
        Insurance_Policy_No: formData.Insurance_Policy_No || '',
        Insurance_Expiry_Date: formData.Insurance_Expiry_Date || '',
        Permit_Number: formData.Permit_Number || '',
        Permit_Expiry_Date: formData.Permit_Expiry_Date || '',
        Police_Certificate_Status: formData.Police_Certificate_Status || 'Pending',
        RC_File: formData.RC_File || '',
        PUC_Status: formData.PUC_Status || 'NA',
        
        // Condition & Maintenance
        Vehicle_Condition: formData.Vehicle_Condition || 'New',
        Odometer_Reading: formData.Odometer_Reading || 0,
        Location_Assigned: formData.Location_Assigned || 'Main Office',
        Assigned_Pilot_ID: formData.Assigned_Pilot_ID || '',
        Maintenance_Due_Date: formData.Maintenance_Due_Date || '',
        Last_Service_Date: formData.Last_Service_Date || '',
        Status: formData.Status || 'Active'
      };
      
      console.log('Sending vehicle data to API (database management format):', newVehicle);
      
      // Important: Ensure we don't include conflicting fields that might interfere
      // with the backend Vehicle model's auto-generation logic
      const sanitizedVehicleData = { ...newVehicle };
      
      // Remove any fields that might conflict with the Vehicle.js model
      delete sanitizedVehicleData.vehicleId; // Let backend auto-generate this
      delete sanitizedVehicleData._id;        // MongoDB will auto-generate this
      
      console.log('Sanitized vehicle data:', sanitizedVehicleData);

      const response = await dbApi.createVehicle(sanitizedVehicleData as any);
      console.log('Vehicle creation response:', response);
      console.log('Response data:', response.data);
      
      if (response.success && response.data) {
        // The actual document is nested in response.data.document
        const createdVehicle = (response.data as any).document || response.data;
        console.log('Created vehicle:', createdVehicle);
        
        // Defensive check to ensure the created vehicle has an _id
        if (!createdVehicle._id) {
          console.warn('Warning: Created vehicle does not have _id:', response.data);
          console.warn('Full response structure:', response);
          throw new Error(`Server did not return a valid vehicle ID. Response structure: ${JSON.stringify(Object.keys(response.data))}`);
        }
        
        toast({
          title: "Success",
          description: "Vehicle added successfully!",
        });
        
        // Refresh the vehicle list to show the new vehicle
        await fetchVehicles();
        
        // Close dialog and reset form
        setIsAddDialogOpen(false);
        setFormData({});
        setErrors({});
      } else {
        throw new Error(response.message || 'Failed to create vehicle');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      
      // Extract meaningful error message from different error types
      let errorMessage = "Failed to save vehicle. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if ((error as any).message) {
          errorMessage = (error as any).message;
        } else if ((error as any).error) {
          errorMessage = (error as any).error;
        } else if ((error as any).details) {
          errorMessage = (error as any).details;
        }
      }
      
      // Show validation errors specifically
      if (errorMessage.includes('Validation failed') || errorMessage.includes('required')) {
        toast({
          title: "Validation Error",
          description: `Please check required fields: ${errorMessage}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
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
            <Car className="w-6 h-6 text-blue-600" />
            Vehicle Management
          </h1>
          <p className="text-gray-600 mt-1">Manage fleet vehicles and specifications</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchVehicles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicles ({filteredVehicles.length})</CardTitle>
          <CardDescription>Fleet inventory and status tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2">Loading vehicles...</span>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {vehicles.length === 0 ? 'No vehicles found in database' : 'No vehicles match your search'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => {
                const isExpanded = expandedCardId === vehicle._id;
                return (
                  <Card key={vehicle._id} className="border hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      {/* Main Card Content - Always Visible */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{vehicle.Registration_Number}</h3>
                          <p className="text-gray-600">{vehicle.Brand} {vehicle.Model}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {vehicle.Status && getStatusBadge(vehicle.Status)}
                          <button
                            onClick={() => handleCardClick(vehicle._id!)}
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
                          <Car className="w-4 h-4" />
                          <span>Class: {vehicle.Vehicle_Class || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Fuel className="w-4 h-4" />
                          <span>Type: {vehicle.Vehicle_Type || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{vehicle.Location_Assigned || 'N/A'}</span>
                        </div>
                        {vehicle.Registration_Date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Registered: {new Date(vehicle.Registration_Date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Expandable Details Section */}
                      {isExpanded && renderDetailedView(vehicle)}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Vehicle Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Enter vehicle details to add to the database
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleId">Vehicle ID *</Label>
                  <Input
                    id="vehicleId"
                    value={formData.Vehicle_ID || ''}
                    onChange={(e) => setFormData({...formData, Vehicle_ID: e.target.value})}
                    placeholder="Internal vehicle ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vinNumber">VIN Number *</Label>
                  <Input
                    id="vinNumber"
                    value={formData.VIN_Number || ''}
                    onChange={(e) => setFormData({...formData, VIN_Number: e.target.value})}
                    placeholder="Chassis ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engineNumber">Engine Number *</Label>
                  <Input
                    id="engineNumber"
                    value={formData.Engine_Number || ''}
                    onChange={(e) => setFormData({...formData, Engine_Number: e.target.value})}
                    placeholder="Engine serial number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.Registration_Number || ''}
                    onChange={(e) => setFormData({...formData, Registration_Number: e.target.value})}
                    placeholder="Number plate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDate">Registration Date</Label>
                  <Input
                    id="registrationDate"
                    type="date"
                    value={formData.Registration_Date ? new Date(formData.Registration_Date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, Registration_Date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    value={formData.Brand || ''}
                    onChange={(e) => setFormData({...formData, Brand: e.target.value})}
                    placeholder="Enter vehicle brand/company name"
                    className={errors.Brand ? 'border-red-500' : ''}
                  />
                  {errors.Brand && <p className="text-sm text-red-500">{errors.Brand}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.Model || ''}
                    onChange={(e) => setFormData({...formData, Model: e.target.value})}
                    placeholder="Vehicle model name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Manufacturing Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2015"
                    max={new Date().getFullYear() + 1}
                    value={formData.Year || ''}
                    onChange={(e) => setFormData({...formData, Year: parseInt(e.target.value) || undefined})}
                    placeholder="e.g., 2023"
                    className={errors.Year ? 'border-red-500' : ''}
                  />
                  {errors.Year && <p className="text-sm text-red-500">{errors.Year}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleClass">Vehicle Class *</Label>
                  <Select value={formData.Vehicle_Class || ''} onValueChange={(value) => setFormData({...formData, Vehicle_Class: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hatchback">Hatchback</SelectItem>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="Scooter">Scooter</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type *</Label>
                  <Select value={formData.Vehicle_Type || ''} onValueChange={(value) => setFormData({...formData, Vehicle_Type: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="E4W">E4W</SelectItem>
                      <SelectItem value="E2W">E2W</SelectItem>
                      <SelectItem value="Shuttle">Shuttle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type *</Label>
                  <Select value={formData.Fuel_Type || ''} onValueChange={(value) => setFormData({...formData, Fuel_Type: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="NA">NA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleCondition">Vehicle Condition</Label>
                  <Select value={formData.Vehicle_Condition || ''} onValueChange={(value) => setFormData({...formData, Vehicle_Condition: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.Status || ''} onValueChange={(value) => setFormData({...formData, Status: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="In_Maintenance">In Maintenance</SelectItem>
                      <SelectItem value="Idle">Idle</SelectItem>
                      <SelectItem value="Out_of_Service">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Technical Specifications Tab */}
            <TabsContent value="technical" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batterySerialNumber">Battery Serial Number</Label>
                  <Input
                    id="batterySerialNumber"
                    value={formData.Battery_Serial_Number || ''}
                    onChange={(e) => setFormData({...formData, Battery_Serial_Number: e.target.value})}
                    placeholder="Unique battery ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batteryCapacityKWh">Battery Capacity (kWh)</Label>
                  <Input
                    id="batteryCapacityKWh"
                    type="number"
                    step="0.1"
                    value={formData.Battery_Capacity_kWh || ''}
                    onChange={(e) => setFormData({...formData, Battery_Capacity_kWh: parseFloat(e.target.value)})}
                    placeholder="Capacity in kWh"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="noOfTyres">Number of Tyres</Label>
                  <Input
                    id="noOfTyres"
                    type="number"
                    value={formData.No_of_Tyres || ''}
                    onChange={(e) => setFormData({...formData, No_of_Tyres: parseInt(e.target.value)})}
                    placeholder="e.g., 4 or 2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tyreSerialNumbers">Tyre Serial Numbers</Label>
                  <Textarea
                    id="tyreSerialNumbers"
                    value={formData.Tyre_Serial_Numbers || ''}
                    onChange={(e) => setFormData({...formData, Tyre_Serial_Numbers: e.target.value})}
                    placeholder="Optional for tracking (JSON format)"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chargerSerialNumber">Charger Serial Number</Label>
                  <Input
                    id="chargerSerialNumber"
                    value={formData.Charger_Serial_Number || ''}
                    onChange={(e) => setFormData({...formData, Charger_Serial_Number: e.target.value})}
                    placeholder="Portable charger info"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chargerType">Charger Type</Label>
                  <Select value={formData.Charger_Type || ''} onValueChange={(value) => setFormData({...formData, Charger_Type: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select charger type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Slow">Slow</SelectItem>
                      <SelectItem value="Fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chargingPortType">Charging Port Type</Label>
                  <Input
                    id="chargingPortType"
                    value={formData.Charging_Port_Type || ''}
                    onChange={(e) => setFormData({...formData, Charging_Port_Type: e.target.value})}
                    placeholder="e.g., CCS2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="odometerReading">Odometer Reading (km)</Label>
                  <Input
                    id="odometerReading"
                    type="number"
                    value={formData.Odometer_Reading || ''}
                    onChange={(e) => setFormData({...formData, Odometer_Reading: parseFloat(e.target.value)})}
                    placeholder="Current km reading"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                  <Input
                    id="insuranceProvider"
                    value={formData.Insurance_Provider || ''}
                    onChange={(e) => setFormData({...formData, Insurance_Provider: e.target.value})}
                    placeholder="Name of insurer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurancePolicyNo">Insurance Policy No</Label>
                  <Input
                    id="insurancePolicyNo"
                    value={formData.Insurance_Policy_No || ''}
                    onChange={(e) => setFormData({...formData, Insurance_Policy_No: e.target.value})}
                    placeholder="Policy reference"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceExpiryDate">Insurance Expiry Date</Label>
                  <Input
                    id="insuranceExpiryDate"
                    type="date"
                    value={formData.Insurance_Expiry_Date ? new Date(formData.Insurance_Expiry_Date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, Insurance_Expiry_Date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permitNumber">Permit Number</Label>
                  <Input
                    id="permitNumber"
                    value={formData.Permit_Number || ''}
                    onChange={(e) => setFormData({...formData, Permit_Number: e.target.value})}
                    placeholder="Govt. permit"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permitExpiryDate">Permit Expiry Date</Label>
                  <Input
                    id="permitExpiryDate"
                    type="date"
                    value={formData.Permit_Expiry_Date ? new Date(formData.Permit_Expiry_Date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, Permit_Expiry_Date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policeCertificateStatus">Police Certificate Status</Label>
                  <Select value={formData.Police_Certificate_Status || ''} onValueChange={(value) => setFormData({...formData, Police_Certificate_Status: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Verified">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rcFile">RC File</Label>
                  <Input
                    id="rcFile"
                    value={formData.RC_File || ''}
                    onChange={(e) => setFormData({...formData, RC_File: e.target.value})}
                    placeholder="Registration Certificate file"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pucStatus">PUC Status</Label>
                  <Select value={formData.PUC_Status || ''} onValueChange={(value) => setFormData({...formData, PUC_Status: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PUC status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NA">NA</SelectItem>
                      <SelectItem value="Valid">Valid</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenanceDueDate">Maintenance Due Date</Label>
                  <Input
                    id="maintenanceDueDate"
                    type="date"
                    value={formData.Maintenance_Due_Date ? new Date(formData.Maintenance_Due_Date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, Maintenance_Due_Date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastServiceDate">Last Service Date</Label>
                  <Input
                    id="lastServiceDate"
                    type="date"
                    value={formData.Last_Service_Date ? new Date(formData.Last_Service_Date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, Last_Service_Date: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Assignment Tab */}
            <TabsContent value="assignment" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locationAssigned">Location Assigned</Label>
                  <Input
                    id="locationAssigned"
                    value={formData.Location_Assigned || ''}
                    onChange={(e) => setFormData({...formData, Location_Assigned: e.target.value})}
                    placeholder="Hub/depot location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedPilotId">Assigned Pilot ID</Label>
                  <Input
                    id="assignedPilotId"
                    value={formData.Assigned_Pilot_ID || ''}
                    onChange={(e) => setFormData({...formData, Assigned_Pilot_ID: e.target.value})}
                    placeholder="Driver ID"
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
              {saving ? 'Adding...' : 'Add Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleManagementSimple;
