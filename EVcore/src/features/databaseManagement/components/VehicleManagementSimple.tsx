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
import { 
  Car, 
  Plus, 
  Search, 
  RefreshCw,
  MapPin,
  Calendar,
  Fuel
} from 'lucide-react';
import { databaseService } from '../services/databaseSimple';
import { Vehicle } from '../types';

export const VehicleManagementSimple: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Vehicle>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getVehicles();
      console.log('Fetched vehicles:', data);
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Active': 'bg-green-100 text-green-800',
      'In Maintenance': 'bg-yellow-100 text-yellow-800',
      'Idle': 'bg-gray-100 text-gray-800'
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
      const vehicleData = {
        ...formData,
        vehicleId: formData.vehicleId || `VEH${Date.now()}`,
        vinNumber: formData.vinNumber || '',
        registrationNumber: formData.registrationNumber || '',
        brand: formData.brand || '',
        model: formData.model || '',
        status: formData.status || 'Active'
      } as Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;
      
      await databaseService.createVehicle(vehicleData, 'system');
      console.log('Vehicle created successfully');
      setIsAddDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error('Error creating vehicle:', error);
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
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{vehicle.registrationNumber}</h3>
                        <p className="text-gray-600">{vehicle.brand} {vehicle.model}</p>
                      </div>
                      {vehicle.status && getStatusBadge(vehicle.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        <span>Class: {vehicle.vehicleClass || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4" />
                        <span>Type: {vehicle.vehicleType || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{vehicle.locationAssigned || 'N/A'}</span>
                      </div>
                      {vehicle.registrationDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Registered: {new Date(vehicle.registrationDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                    value={formData.vehicleId || ''}
                    onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                    placeholder="Internal vehicle ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vinNumber">VIN Number *</Label>
                  <Input
                    id="vinNumber"
                    value={formData.vinNumber || ''}
                    onChange={(e) => setFormData({...formData, vinNumber: e.target.value})}
                    placeholder="Chassis ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engineNumber">Engine Number *</Label>
                  <Input
                    id="engineNumber"
                    value={formData.engineNumber || ''}
                    onChange={(e) => setFormData({...formData, engineNumber: e.target.value})}
                    placeholder="Engine serial number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    placeholder="Number plate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDate">Registration Date</Label>
                  <Input
                    id="registrationDate"
                    type="date"
                    value={formData.registrationDate ? new Date(formData.registrationDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, registrationDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="Manufacturer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="Vehicle model name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleClass">Vehicle Class *</Label>
                  <Select value={formData.vehicleClass || ''} onValueChange={(value) => setFormData({...formData, vehicleClass: value as any})}>
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
                  <Select value={formData.vehicleType || ''} onValueChange={(value) => setFormData({...formData, vehicleType: value as any})}>
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
                  <Select value={formData.fuelType || ''} onValueChange={(value) => setFormData({...formData, fuelType: value as any})}>
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
                  <Select value={formData.vehicleCondition || ''} onValueChange={(value) => setFormData({...formData, vehicleCondition: value as any})}>
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
                  <Select value={formData.status || ''} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="In Maintenance">In Maintenance</SelectItem>
                      <SelectItem value="Idle">Idle</SelectItem>
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
                    value={formData.batterySerialNumber || ''}
                    onChange={(e) => setFormData({...formData, batterySerialNumber: e.target.value})}
                    placeholder="Unique battery ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batteryCapacityKWh">Battery Capacity (kWh)</Label>
                  <Input
                    id="batteryCapacityKWh"
                    type="number"
                    step="0.1"
                    value={formData.batteryCapacityKWh || ''}
                    onChange={(e) => setFormData({...formData, batteryCapacityKWh: parseFloat(e.target.value)})}
                    placeholder="Capacity in kWh"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="noOfTyres">Number of Tyres</Label>
                  <Input
                    id="noOfTyres"
                    type="number"
                    value={formData.noOfTyres || ''}
                    onChange={(e) => setFormData({...formData, noOfTyres: parseInt(e.target.value)})}
                    placeholder="e.g., 4 or 2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tyreSerialNumbers">Tyre Serial Numbers</Label>
                  <Textarea
                    id="tyreSerialNumbers"
                    value={formData.tyreSerialNumbers || ''}
                    onChange={(e) => setFormData({...formData, tyreSerialNumbers: e.target.value})}
                    placeholder="Optional for tracking (JSON format)"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chargerSerialNumber">Charger Serial Number</Label>
                  <Input
                    id="chargerSerialNumber"
                    value={formData.chargerSerialNumber || ''}
                    onChange={(e) => setFormData({...formData, chargerSerialNumber: e.target.value})}
                    placeholder="Portable charger info"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chargerType">Charger Type</Label>
                  <Select value={formData.chargerType || ''} onValueChange={(value) => setFormData({...formData, chargerType: value as any})}>
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
                    value={formData.chargingPortType || ''}
                    onChange={(e) => setFormData({...formData, chargingPortType: e.target.value})}
                    placeholder="e.g., CCS2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="odometerReading">Odometer Reading (km)</Label>
                  <Input
                    id="odometerReading"
                    type="number"
                    value={formData.odometerReading || ''}
                    onChange={(e) => setFormData({...formData, odometerReading: parseFloat(e.target.value)})}
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
                    value={formData.insuranceProvider || ''}
                    onChange={(e) => setFormData({...formData, insuranceProvider: e.target.value})}
                    placeholder="Name of insurer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurancePolicyNo">Insurance Policy No</Label>
                  <Input
                    id="insurancePolicyNo"
                    value={formData.insurancePolicyNo || ''}
                    onChange={(e) => setFormData({...formData, insurancePolicyNo: e.target.value})}
                    placeholder="Policy reference"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceExpiryDate">Insurance Expiry Date</Label>
                  <Input
                    id="insuranceExpiryDate"
                    type="date"
                    value={formData.insuranceExpiryDate ? new Date(formData.insuranceExpiryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, insuranceExpiryDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permitNumber">Permit Number</Label>
                  <Input
                    id="permitNumber"
                    value={formData.permitNumber || ''}
                    onChange={(e) => setFormData({...formData, permitNumber: e.target.value})}
                    placeholder="Govt. permit"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permitExpiryDate">Permit Expiry Date</Label>
                  <Input
                    id="permitExpiryDate"
                    type="date"
                    value={formData.permitExpiryDate ? new Date(formData.permitExpiryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, permitExpiryDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policeCertificateStatus">Police Certificate Status</Label>
                  <Select value={formData.policeCertificateStatus || ''} onValueChange={(value) => setFormData({...formData, policeCertificateStatus: value as any})}>
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
                    value={formData.rcFile || ''}
                    onChange={(e) => setFormData({...formData, rcFile: e.target.value})}
                    placeholder="Registration Certificate file"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pucStatus">PUC Status</Label>
                  <Select value={formData.pucStatus || ''} onValueChange={(value) => setFormData({...formData, pucStatus: value as any})}>
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
                    value={formData.maintenanceDueDate ? new Date(formData.maintenanceDueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, maintenanceDueDate: e.target.value})}
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
              </div>
            </TabsContent>

            {/* Assignment Tab */}
            <TabsContent value="assignment" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locationAssigned">Location Assigned</Label>
                  <Input
                    id="locationAssigned"
                    value={formData.locationAssigned || ''}
                    onChange={(e) => setFormData({...formData, locationAssigned: e.target.value})}
                    placeholder="Hub/depot location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedPilotId">Assigned Pilot ID</Label>
                  <Input
                    id="assignedPilotId"
                    value={formData.assignedPilotId || ''}
                    onChange={(e) => setFormData({...formData, assignedPilotId: e.target.value})}
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
