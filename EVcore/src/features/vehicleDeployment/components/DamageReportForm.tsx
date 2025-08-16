import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Upload, 
  X, 
  AlertTriangle,
  Car,
  User,
  MapPin,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';

interface DamageFormData {
  vehicleNumber: string;
  reportedBy: string;
  damageType: 'minor' | 'major' | 'critical';
  category: 'body' | 'mechanical' | 'electrical' | 'interior' | 'tire';
  location: string;
  description: string;
  estimatedCost: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  photos: File[];
}

interface DamageReportFormProps {
  onSubmit: (data: DamageFormData) => void;
  onCancel: () => void;
}

export const DamageReportForm: React.FC<DamageReportFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<DamageFormData>({
    vehicleNumber: '',
    reportedBy: '',
    damageType: 'minor',
    category: 'body',
    location: '',
    description: '',
    estimatedCost: '',
    priority: 'medium',
    photos: []
  });

  const [errors, setErrors] = useState<Partial<DamageFormData>>({});

  const handleInputChange = (field: keyof DamageFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DamageFormData> = {};

    if (!formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = 'Vehicle number is required';
    }
    if (!formData.reportedBy.trim()) {
      newErrors.reportedBy = 'Reporter name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Damage location is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.estimatedCost.trim() || isNaN(Number(formData.estimatedCost))) {
      newErrors.estimatedCost = 'Valid estimated cost is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getDamageTypeIcon = (type: string) => {
    switch (type) {
      case 'minor': return '🟢';
      case 'major': return '🟡';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return '🔵';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'urgent': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Report Vehicle Damage</h3>
          <p className="text-sm text-gray-600">Fill in all required information about the damage</p>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
              <Input
                id="vehicleNumber"
                placeholder="e.g., KA01AB1234"
                value={formData.vehicleNumber}
                onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                className={errors.vehicleNumber ? 'border-red-500' : ''}
              />
              {errors.vehicleNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.vehicleNumber}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="reportedBy">Reported By *</Label>
              <Input
                id="reportedBy"
                placeholder="Your name"
                value={formData.reportedBy}
                onChange={(e) => handleInputChange('reportedBy', e.target.value)}
                className={errors.reportedBy ? 'border-red-500' : ''}
              />
              {errors.reportedBy && (
                <p className="text-sm text-red-500 mt-1">{errors.reportedBy}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="damageType">Damage Severity *</Label>
              <Select 
                value={formData.damageType} 
                onValueChange={(value) => handleInputChange('damageType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">
                    <div className="flex items-center gap-2">
                      <span>🟢</span>
                      <span>Minor - Cosmetic damage</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="major">
                    <div className="flex items-center gap-2">
                      <span>🟡</span>
                      <span>Major - Functional impact</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <span>🔴</span>
                      <span>Critical - Safety concern</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <span>🔵</span>
                      <span>Low</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <span>🟡</span>
                      <span>Medium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <span>🟠</span>
                      <span>High</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <span>🔴</span>
                      <span>Urgent</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Damage Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Damage Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Damage Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="body">🚗 Body/Exterior</SelectItem>
                  <SelectItem value="mechanical">⚙️ Mechanical</SelectItem>
                  <SelectItem value="electrical">🔌 Electrical</SelectItem>
                  <SelectItem value="interior">🪑 Interior</SelectItem>
                  <SelectItem value="tire">🛞 Tire/Wheel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedCost">Estimated Cost (₹) *</Label>
              <Input
                id="estimatedCost"
                type="number"
                placeholder="e.g., 15000"
                value={formData.estimatedCost}
                onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                className={errors.estimatedCost ? 'border-red-500' : ''}
              />
              {errors.estimatedCost && (
                <p className="text-sm text-red-500 mt-1">{errors.estimatedCost}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="location">Specific Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Front bumper, Driver door, Engine bay"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-sm text-red-500 mt-1">{errors.location}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the damage in detail, including how it occurred, size, and any other relevant information..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photos
          </CardTitle>
          <CardDescription>
            Upload photos of the damage (optional but recommended)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="photos"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Label htmlFor="photos" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Click to upload photos or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 10MB each
              </p>
            </Label>
          </div>

          {formData.photos.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Photos ({formData.photos.length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border">
                      <div className="text-center">
                        <Camera className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500 truncate px-2">{photo.name}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="w-5 h-5" />
            Report Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700">Vehicle:</span>
                <span className="font-medium">{formData.vehicleNumber || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Severity:</span>
                <Badge className="text-xs">
                  {getDamageTypeIcon(formData.damageType)} {formData.damageType.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Category:</span>
                <span className="font-medium capitalize">{formData.category}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700">Priority:</span>
                <Badge className="text-xs">
                  {getPriorityIcon(formData.priority)} {formData.priority.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Estimated Cost:</span>
                <span className="font-medium">₹{formData.estimatedCost || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Photos:</span>
                <span className="font-medium">{formData.photos.length} uploaded</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
          Submit Damage Report
        </Button>
      </div>
    </form>
  );
};

export default DamageReportForm;
