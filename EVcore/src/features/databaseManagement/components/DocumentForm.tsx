import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { 
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import { 
  databaseService, 
  MODULE_CONFIG, 
  type DatabaseModule 
} from '../services/databaseService';
import { useRoleAccess } from '../../../hooks/useRoleAccess';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

const DocumentForm: React.FC = () => {
  const { module, id } = useParams<{ module: string; id?: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { hasAccess } = useRoleAccess();
  const { handleError: baseHandleError } = useErrorHandler();

  // Enhanced error handler that accepts custom messages
  const handleError = (error: any, customMessage?: string) => {
    if (customMessage) {
      console.error(customMessage, error);
      baseHandleError(new Error(customMessage));
    } else {
      baseHandleError(error);
    }
  };

  const isEdit = !!id;
  const moduleConfig = module && databaseService.isValidModule(module as DatabaseModule) 
    ? MODULE_CONFIG[module as DatabaseModule] 
    : null;

  const canEdit = hasAccess(['super_admin', 'admin']);

  useEffect(() => {
    if (isEdit && module && id && databaseService.isValidModule(module as DatabaseModule)) {
      loadDocument();
    } else if (module) {
      initializeFormData();
    }
  }, [module, id, isEdit]);

  const loadDocument = async () => {
    if (!module || !id) return;
    
    try {
      setLoading(true);
      const doc = await databaseService.getDocument(module as DatabaseModule, id);
      setFormData(doc);
    } catch (error) {
      handleError(error, 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const initializeFormData = () => {
    if (!module) return;
    
    const initialData = getInitialFormData(module as DatabaseModule);
    setFormData(initialData);
  };

  const getInitialFormData = (module: DatabaseModule) => {
    const baseData = {
      createdAt: new Date(),
      updatedAt: new Date()
    };

    switch (module) {
      case 'vehicles':
        return {
          ...baseData,
          vehicleId: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          licensePlate: '',
          vin: '',
          status: 'active',
          currentBatteryLevel: 100,
          batteryCapacity: 0,
          range: 0,
          currentOdometer: 0,
          efficiency: 0,
          location: {
            address: '',
            coordinates: { lat: 0, lng: 0 }
          }
        };

      case 'employees':
        return {
          ...baseData,
          employeeId: '',
          fullName: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: '',
          gender: '',
          maritalStatus: '',
          address: '',
          department: '',
          position: '',
          hireDate: new Date().toISOString().split('T')[0],
          employmentType: 'full-time',
          salary: 0,
          emergencyContact: {
            name: '',
            phoneNumber: '',
            relationship: ''
          }
        };

      case 'pilots':
        return {
          ...baseData,
          pilotId: '',
          fullName: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: '',
          licenseNumber: '',
          licenseType: '',
          licenseExpiryDate: '',
          currentStatus: 'available',
          experience: 0,
          rating: 5,
          totalTrips: 0,
          totalDistanceDriven: 0,
          address: '',
          emergencyContact: {
            name: '',
            phoneNumber: '',
            relationship: ''
          }
        };

      case 'chargingequipment':
        return {
          ...baseData,
          chargingEquipmentId: '',
          name: '',
          brand: '',
          model: '',
          status: 'operational',
          powerRating: 0,
          connectorType: '',
          voltage: 0,
          current: 0,
          installationDate: new Date().toISOString().split('T')[0],
          location: '',
          description: ''
        };

      case 'itequipment':
        return {
          ...baseData,
          itEquipmentId: '',
          name: '',
          category: '',
          brand: '',
          model: '',
          assetTag: '',
          status: 'active',
          assignedTo: {
            employeeId: '',
            employeeName: ''
          },
          location: '',
          purchaseDate: new Date().toISOString().split('T')[0],
          warrantyExpiry: '',
          specifications: {}
        };

      default:
        return baseData;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!module) {
      newErrors.general = 'Invalid module specified';
      setErrors(newErrors);
      return false;
    }

    // Module-specific validation
    switch (module as DatabaseModule) {
      case 'vehicles':
        if (!formData.vehicleId) newErrors.vehicleId = 'Vehicle ID is required';
        if (!formData.make) newErrors.make = 'Make is required';
        if (!formData.model) newErrors.model = 'Model is required';
        if (!formData.licensePlate) newErrors.licensePlate = 'License plate is required';
        if (!formData.vin) newErrors.vin = 'VIN is required';
        break;

      case 'employees':
        if (!formData.employeeId) newErrors.employeeId = 'Employee ID is required';
        if (!formData.fullName) newErrors.fullName = 'Full name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.position) newErrors.position = 'Position is required';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Valid email is required';
        }
        break;

      case 'pilots':
        if (!formData.pilotId) newErrors.pilotId = 'Pilot ID is required';
        if (!formData.fullName) newErrors.fullName = 'Full name is required';
        if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required';
        if (!formData.licenseType) newErrors.licenseType = 'License type is required';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Valid email is required';
        }
        break;

      case 'chargingequipment':
        if (!formData.chargingEquipmentId) newErrors.chargingEquipmentId = 'Equipment ID is required';
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.brand) newErrors.brand = 'Brand is required';
        if (!formData.model) newErrors.model = 'Model is required';
        break;

      case 'itequipment':
        if (!formData.itEquipmentId) newErrors.itEquipmentId = 'IT Equipment ID is required';
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !module) return;

    try {
      setSaving(true);
      
      if (isEdit && id) {
        await databaseService.updateDocument(module as DatabaseModule, id, formData);
        navigate(`/database-management/${module}/${id}`);
      } else {
        const newDoc = await databaseService.createDocument(module as DatabaseModule, formData);
        navigate(`/database-management/${module}/${newDoc._id}`);
      }
    } catch (error) {
      handleError(error, `Failed to ${isEdit ? 'update' : 'create'} document`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderFormFields = () => {
    if (!module) return null;

    switch (module as DatabaseModule) {
      case 'vehicles':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vehicle ID *</label>
                  <input
                    type="text"
                    value={formData.vehicleId || ''}
                    onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${errors.vehicleId ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter vehicle ID"
                  />
                  {errors.vehicleId && <p className="text-red-500 text-sm mt-1">{errors.vehicleId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Make *</label>
                  <input
                    type="text"
                    value={formData.make || ''}
                    onChange={(e) => handleInputChange('make', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${errors.make ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter vehicle make"
                  />
                  {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Model *</label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${errors.model ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter vehicle model"
                  />
                  {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">License Plate *</label>
                  <input
                    type="text"
                    value={formData.licensePlate || ''}
                    onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${errors.licensePlate ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter license plate"
                  />
                  {errors.licensePlate && <p className="text-red-500 text-sm mt-1">{errors.licensePlate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">VIN *</label>
                  <input
                    type="text"
                    value={formData.vin || ''}
                    onChange={(e) => handleInputChange('vin', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${errors.vin ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter VIN"
                  />
                  {errors.vin && <p className="text-red-500 text-sm mt-1">{errors.vin}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="charging">Charging</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Battery & Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Battery Level (%)</label>
                  <input
                    type="number"
                    value={formData.currentBatteryLevel || ''}
                    onChange={(e) => handleInputChange('currentBatteryLevel', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Battery Capacity (kWh)</label>
                  <input
                    type="number"
                    value={formData.batteryCapacity || ''}
                    onChange={(e) => handleInputChange('batteryCapacity', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.1"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Range (km)</label>
                  <input
                    type="number"
                    value={formData.range || ''}
                    onChange={(e) => handleInputChange('range', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Current Odometer (km)</label>
                  <input
                    type="number"
                    value={formData.currentOdometer || ''}
                    onChange={(e) => handleInputChange('currentOdometer', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Efficiency (km/kWh)</label>
                  <input
                    type="number"
                    value={formData.efficiency || ''}
                    onChange={(e) => handleInputChange('efficiency', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.1"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location Address</label>
                  <input
                    type="text"
                    value={formData.location?.address || ''}
                    onChange={(e) => handleInputChange('location.address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter current location"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'employees':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee ID *</label>
                  <input
                    type="text"
                    value={formData.employeeId || ''}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${errors.employeeId ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter employee ID"
                  />
                  {errors.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Enter address"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Department *</label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter department"
                  />
                  {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Position *</label>
                  <input
                    type="text"
                    value={formData.position || ''}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${errors.position ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter position"
                  />
                  {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Hire Date</label>
                  <input
                    type="date"
                    value={formData.hireDate || ''}
                    onChange={(e) => handleInputChange('hireDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType || 'full-time'}
                    onChange={(e) => handleInputChange('employmentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Salary</label>
                  <input
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => handleInputChange('salary', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="1000"
                    placeholder="Enter annual salary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContact?.name || ''}
                    onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyContact?.phoneNumber || ''}
                    onChange={(e) => handleInputChange('emergencyContact.phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter emergency contact phone"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (!canEdit) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to {isEdit ? 'edit' : 'create'} documents in this module.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(`/database-management/${module}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {moduleConfig?.displayName}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit' : 'Create'} {moduleConfig?.displayName?.slice(0, -1)}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update the information below' : 'Fill in the information below'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        {renderFormFields()}

        {/* Form Actions */}
        <div className="flex gap-4 pt-6">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update' : 'Create'}
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(`/database-management/${module}`)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;
