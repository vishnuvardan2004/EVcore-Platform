
import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, X } from 'lucide-react';
import { DriverChecklist, VehicleChecklist } from '../../../types/vehicle';

interface ChecklistSectionProps {
  type: 'driver' | 'vehicle';
  checklist: DriverChecklist | VehicleChecklist;
  onChange: (checklist: DriverChecklist | VehicleChecklist) => void;
  mismatches?: string[];
  showMismatches?: boolean;
}

const driverChecklistItems = [
  { key: 'idCard', label: 'ID Card' },
  { key: 'uniform', label: 'Uniform' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'groomed', label: 'Groomed' },
];

const vehicleChecklistItems = [
  { key: 'fireExtinguisher', label: 'Fire Extinguisher' },
  { key: 'stepney', label: 'Stepney' },
  { key: 'carFreshener', label: 'Car Freshener' },
  { key: 'cleaningCloth', label: 'Cleaning Cloth' },
  { key: 'umbrella', label: 'Umbrella' },
  { key: 'torch', label: 'Torch' },
  { key: 'toolkit', label: 'Toolkit' },
  { key: 'spanner', label: 'Spanner' },
  { key: 'medicalKit', label: 'Medical Kit' },
  { key: 'carCharger', label: 'Car Charger' },
  { key: 'jack', label: 'Jack' },
  { key: 'lightsWorking', label: 'Lights Working' },
  { key: 'tyrePressure', label: 'Tyre Pressure' },
  { key: 'wheelCaps', label: 'Wheel Caps' },
  { key: 'wiperWater', label: 'Wiper Water' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'antenna', label: 'Antenna' },
  { key: 'acWorking', label: 'AC Working' },
  { key: 'mobileCable', label: 'Mobile Cable' },
  { key: 'mobileAdapter', label: 'Mobile Adapter' },
  { key: 'phoneStand', label: 'Phone Stand' },
  { key: 'hornWorking', label: 'Horn Working' },
];

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  type,
  checklist,
  onChange,
  mismatches = [],
  showMismatches = false
}) => {
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const items = type === 'driver' ? driverChecklistItems : vehicleChecklistItems;
  const isVehicleChecklist = type === 'vehicle';

  // Camera functionality
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera
      });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!stream) return;
    
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (video && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setDamagePhotos(prev => [...prev, photoDataUrl]);
      stopCamera();
      setIsPhotoDialogOpen(false);
    }
  };

  const removePhoto = (index: number) => {
    setDamagePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const openPhotoDialog = () => {
    setIsPhotoDialogOpen(true);
    startCamera();
  };

  const closePhotoDialog = () => {
    setIsPhotoDialogOpen(false);
    stopCamera();
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    onChange({
      ...checklist,
      [key]: checked
    });
  };

  const handleDamagesChange = (damages: string) => {
    if (isVehicleChecklist) {
      onChange({
        ...checklist,
        damages
      });
    }
  };

  const getMismatchIcon = (key: string) => {
    if (showMismatches && mismatches.includes(key)) {
      return <span className="text-red-500 ml-2">⚠️</span>;
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 capitalize">
        {type} Checklist
        {showMismatches && mismatches.length > 0 && (
          <span className="text-red-500 ml-2">({mismatches.length} mismatches)</span>
        )}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={key}
              checked={(checklist as any)[key] || false}
              onCheckedChange={(checked) => handleCheckboxChange(key, checked as boolean)}
            />
            <Label htmlFor={key} className="flex-1 cursor-pointer">
              {label}
              {getMismatchIcon(key)}
            </Label>
          </div>
        ))}
      </div>

      {isVehicleChecklist && (
        <div className="mt-6 space-y-4">
          <Label htmlFor="damages">Damages (if any)</Label>
          <div className="flex gap-2">
            <Textarea
              id="damages"
              placeholder="Describe any damages or issues..."
              value={(checklist as VehicleChecklist).damages || ''}
              onChange={(e) => handleDamagesChange(e.target.value)}
              rows={3}
              className="flex-1"
            />
            <Dialog open={isPhotoDialogOpen} onOpenChange={closePhotoDialog}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openPhotoDialog}
                  className="flex items-center gap-1 h-fit"
                  title="Capture damage photos"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Capture Damage Photo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {isCameraActive && stream ? (
                    <div className="relative">
                      <video
                        id="camera-video"
                        autoPlay
                        playsInline
                        className="w-full rounded-lg"
                        ref={(video) => {
                          if (video && stream) {
                            video.srcObject = stream;
                          }
                        }}
                      />
                      <div className="flex justify-center gap-2 mt-4">
                        <Button onClick={capturePhoto} className="flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Capture
                        </Button>
                        <Button variant="outline" onClick={closePhotoDialog}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Loading camera...</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Photo Gallery */}
          {damagePhotos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Damage Photos ({damagePhotos.length})</Label>
              <div className="grid grid-cols-3 gap-2">
                {damagePhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Damage ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showMismatches && mismatches.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium text-sm">
            ⚠️ Mismatch Detected – Review before submission
          </p>
        </div>
      )}
    </Card>
  );
};
