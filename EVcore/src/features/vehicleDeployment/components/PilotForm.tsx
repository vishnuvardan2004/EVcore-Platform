import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, User, X, CheckCircle } from 'lucide-react';
import { ChecklistSection } from './ChecklistSection';
import { DriverChecklist, VehicleChecklist } from '../../../types/vehicle';
import { useCamera } from '../../../hooks/useCamera';

interface PilotFormProps {
  direction: 'OUT' | 'IN';
  onSubmit: (data: any) => void;
  onBack: () => void;
  previousData?: any;
}

export const PilotForm: React.FC<PilotFormProps> = ({ 
  direction, 
  onSubmit, 
  onBack,
  previousData 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    pilotId: previousData?.outData?.pilotId || '',
    location: previousData?.outData?.location || '',
    odometer: previousData?.inData ? 0 : (previousData?.outData?.odometer || 0),
    returnOdometer: previousData?.outData?.odometer || 0,
    batteryCharge: previousData?.outData?.batteryCharge || 0,
    range: previousData?.outData?.range || 0,
    supervisorName: '',
    notes: previousData?.outData?.notes || '',
  });

  const [driverChecklist, setDriverChecklist] = useState<DriverChecklist>({
    idCard: false,
    uniform: false,
    shoes: false,
    groomed: false,
  });

  const [vehicleChecklist, setVehicleChecklist] = useState<VehicleChecklist>({
    fireExtinguisher: false,
    stepney: false,
    carFreshener: false,
    cleaningCloth: false,
    umbrella: false,
    torch: false,
    toolkit: false,
    spanner: false,
    medicalKit: false,
    carCharger: false,
    jack: false,
    lightsWorking: false,
    tyrePressure: false,
    wheelCaps: false,
    wiperWater: false,
    cleanliness: false,
    antenna: false,
    acWorking: false,
    mobileCable: false,
    mobileAdapter: false,
    phoneStand: false,
    hornWorking: false,
    damages: '',
  });

  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([]);
  const [driverPhoto, setDriverPhoto] = useState<string>('');
  const [checklistMismatches, setChecklistMismatches] = useState<string[]>([]);
  
  // Supervisor selfie state
  const [supervisorSelfie, setSupervisorSelfie] = useState<string>('');
  const [isSupervisorSelfieDialogOpen, setIsSupervisorSelfieDialogOpen] = useState(false);
  const [isSupervisorCameraActive, setIsSupervisorCameraActive] = useState(false);
  const [supervisorStream, setSupervisorStream] = useState<MediaStream | null>(null);

  const { startCamera, capturedImage, resetCapture } = useCamera();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDriverChecklistChange = (checklist: DriverChecklist | VehicleChecklist) => {
    setDriverChecklist(checklist as DriverChecklist);
  };

  const handleVehicleChecklistChange = (checklist: DriverChecklist | VehicleChecklist) => {
    setVehicleChecklist(checklist as VehicleChecklist);
  };

  const handleScanSupervisor = async () => {
    try {
      // In a real implementation, this would:
      // 1. Access device camera/barcode scanner
      // 2. Scan supervisor ID card/QR code
      // 3. Validate against employee database
      // 4. Return supervisor details
      
      // For now, prompt for manual entry
      const supervisorId = prompt('Enter Supervisor ID or scan QR code:');
      if (supervisorId) {
        // In production, validate this ID against your employee database
        const supervisorName = `Supervisor: ${supervisorId}`;
        setFormData(prev => ({ ...prev, supervisorName }));
      }
    } catch (error) {
      console.error('Error scanning supervisor ID:', error);
    }
  };

  const captureDriverPhoto = async () => {
    try {
      // In production, this would use the device camera
      // For now, use file input as fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'user'; // Request front camera
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const photoData = e.target?.result as string;
            setDriverPhoto(photoData);
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error capturing driver photo:', error);
    }
  };

  const captureVehiclePhoto = async () => {
    try {
      // In production, this would use the device camera
      // For now, use file input as fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Request back camera
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const photoData = e.target?.result as string;
            setVehiclePhotos(prev => [...prev, photoData]);
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error capturing vehicle photo:', error);
    }
  };

  // Supervisor selfie functions
  const startSupervisorCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } // Front camera for selfie
      });
      setSupervisorStream(mediaStream);
      setIsSupervisorCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopSupervisorCamera = () => {
    if (supervisorStream) {
      supervisorStream.getTracks().forEach(track => track.stop());
      setSupervisorStream(null);
    }
    setIsSupervisorCameraActive(false);
  };

  const captureSupervisorSelfie = () => {
    if (!supervisorStream) return;
    
    const video = document.getElementById('supervisor-camera-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (video && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setSupervisorSelfie(photoDataUrl);
      stopSupervisorCamera();
      setIsSupervisorSelfieDialogOpen(false);
    }
  };

  const openSupervisorSelfieDialog = () => {
    setIsSupervisorSelfieDialogOpen(true);
    startSupervisorCamera();
  };

  const closeSupervisorSelfieDialog = () => {
    setIsSupervisorSelfieDialogOpen(false);
    stopSupervisorCamera();
  };

  const removeSupervisorSelfie = () => {
    setSupervisorSelfie('');
    // Keep supervisor name intact - only remove the selfie
  };

  const detectMismatches = () => {
    if (!previousData?.outData?.vehicleChecklist) return [];
    
    const outChecklist = previousData.outData.vehicleChecklist;
    const mismatches: string[] = [];
    
    Object.keys(vehicleChecklist).forEach(key => {
      if (key !== 'damages' && outChecklist[key] && !vehicleChecklist[key as keyof VehicleChecklist]) {
        mismatches.push(key);
      }
    });
    
    return mismatches;
  };

  const getTotalSteps = () => {
    if (direction === 'OUT') return 3; // Driver info, Driver checklist, Vehicle section
    return 2; // Vehicle return, Mismatch detection
  };

  const handleNext = () => {
    if (direction === 'IN' && currentStep === 1) {
      const mismatches = detectMismatches();
      setChecklistMismatches(mismatches);
    }
    setCurrentStep(prev => Math.min(prev + 1, getTotalSteps()));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (direction === 'OUT') {
      onSubmit({
        outData: {
          pilotId: formData.pilotId,
          location: formData.location,
          odometer: Number(formData.odometer),
          batteryCharge: Number(formData.batteryCharge),
          range: Number(formData.range),
          supervisorName: formData.supervisorName,
          driverPhoto,
          vehiclePhotos,
          driverChecklist,
          vehicleChecklist,
          notes: formData.notes,
        }
      });
    } else {
      onSubmit({
        inData: {
          returnOdometer: Number(formData.returnOdometer),
          vehiclePhotos,
          inSupervisorName: formData.supervisorName,
          vehicleChecklist,
          checklistMismatches,
        }
      });
    }
  };

  const renderStep = () => {
    if (direction === 'OUT') {
      switch (currentStep) {
        case 1:
          return (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Driver Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pilotId">Pilot ID *</Label>
                  <Input
                    id="pilotId"
                    value={formData.pilotId}
                    onChange={(e) => handleInputChange('pilotId', e.target.value)}
                    placeholder="Enter pilot ID"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter location"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Driver Photo (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={captureDriverPhoto}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {driverPhoto ? 'Retake Photo' : 'Capture Driver Photo'}
                  </Button>
                  {driverPhoto && (
                    <div className="text-sm text-green-600">✓ Photo captured</div>
                  )}
                </div>
              </div>
            </Card>
          );

        case 2:
          return (
            <ChecklistSection
              type="driver"
              checklist={driverChecklist}
              onChange={handleDriverChecklistChange}
            />
          );

        case 3:
          return (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="odometer">ODO *</Label>
                    <Input
                      id="odometer"
                      type="number"
                      value={formData.odometer}
                      onChange={(e) => handleInputChange('odometer', Number(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="batteryCharge">Charge % *</Label>
                    <Input
                      id="batteryCharge"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.batteryCharge}
                      onChange={(e) => handleInputChange('batteryCharge', Number(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="range">Range (KM) *</Label>
                    <Input
                      id="range"
                      type="number"
                      value={formData.range}
                      onChange={(e) => handleInputChange('range', Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label>Vehicle Photos</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={captureVehiclePhoto}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Vehicle Photo ({vehiclePhotos.length})
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  <Label htmlFor="supervisorName">Supervised By *</Label>
                  <Input
                    id="supervisorName"
                    value={formData.supervisorName}
                    onChange={(e) => handleInputChange('supervisorName', e.target.value)}
                    placeholder="Enter supervisor name"
                    required
                  />
                  
                  {/* Dedicated Supervisor Selfie Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Supervisor Verification *</Label>
                    
                    {supervisorSelfie ? (
                      // Selfie captured - show verification
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <img
                          src={supervisorSelfie}
                          alt="Supervisor selfie"
                          className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-sm font-medium text-green-800">Supervisor Verified</p>
                          </div>
                          <p className="text-xs text-green-600">Live photo captured successfully</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeSupervisorSelfie}
                          className="text-red-600 hover:text-red-800"
                          title="Remove selfie and retake"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      // No selfie - show capture button
                      <div className="space-y-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={openSupervisorSelfieDialog}
                          className="w-full h-12 flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                        >
                          <User className="w-6 h-6 text-gray-500" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-700">Take Supervisor Selfie</p>
                            <p className="text-xs text-gray-500">Required for verification</p>
                          </div>
                        </Button>
                        
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Camera className="w-4 h-4 text-yellow-600" />
                            <p className="text-sm font-medium text-yellow-800">Live Photo Required</p>
                          </div>
                          <p className="text-xs text-yellow-600">
                            The supervisor must take a live selfie to verify their identity. Gallery uploads are not allowed.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Supervisor Selfie Dialog */}
                  <Dialog open={isSupervisorSelfieDialogOpen} onOpenChange={closeSupervisorSelfieDialog}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Supervisor Verification</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 font-medium">⚠️ Live Photo Required</p>
                          <p className="text-xs text-blue-600">Gallery uploads are not allowed. Supervisor must take a live selfie.</p>
                        </div>
                        
                        {formData.supervisorName && (
                          <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Supervisor:</span> {formData.supervisorName}
                            </p>
                          </div>
                        )}
                        
                        {isSupervisorCameraActive && supervisorStream ? (
                          <div className="relative">
                            <video
                              id="supervisor-camera-video"
                              autoPlay
                              playsInline
                              className="w-full rounded-lg"
                              style={{ transform: 'scaleX(-1)' }} // Mirror effect for selfie
                              ref={(video) => {
                                if (video && supervisorStream) {
                                  video.srcObject = supervisorStream;
                                }
                              }}
                            />
                            <div className="flex justify-center gap-2 mt-4">
                              <Button onClick={captureSupervisorSelfie} className="flex items-center gap-2">
                                <Camera className="w-4 h-4" />
                                Capture Selfie
                              </Button>
                              <Button variant="outline" onClick={closeSupervisorSelfieDialog}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-500">Loading camera...</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </Card>

              <ChecklistSection
                type="vehicle"
                checklist={vehicleChecklist}
                onChange={handleVehicleChecklistChange}
              />
            </div>
          );

        default:
          return null;
      }
    } else {
      // IN Flow
      switch (currentStep) {
        case 1:
          return (
            <div className="space-y-6">
              {previousData && (
                <Card className="p-4 bg-gray-50">
                  <h3 className="font-medium mb-2">Previous OUT Data</h3>
                  <p>Pilot ID: {previousData.outData?.pilotId}</p>
                  <p>Location: {previousData.outData?.location}</p>
                  <p>OUT Odometer: {previousData.outData?.odometer} km</p>
                </Card>
              )}

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Vehicle Return</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="returnOdometer">Return Odometer Reading *</Label>
                    <Input
                      id="returnOdometer"
                      type="number"
                      value={formData.returnOdometer}
                      onChange={(e) => handleInputChange('returnOdometer', Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Post-Trip Vehicle Photos</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={captureVehiclePhoto}
                      className="w-full"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Vehicle Photo ({vehiclePhotos.length})
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="inSupervisorName">IN Supervisor Name *</Label>
                    <Input
                      id="inSupervisorName"
                      value={formData.supervisorName}
                      onChange={(e) => handleInputChange('supervisorName', e.target.value)}
                      placeholder="Enter supervisor name"
                      required
                    />
                    
                    {/* Dedicated Supervisor Selfie Section */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Supervisor Verification *</Label>
                      
                      {supervisorSelfie ? (
                        // Selfie captured - show verification
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <img
                            src={supervisorSelfie}
                            alt="Supervisor selfie"
                            className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <p className="text-sm font-medium text-green-800">Supervisor Verified</p>
                            </div>
                            <p className="text-xs text-green-600">Live photo captured successfully</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeSupervisorSelfie}
                            className="text-red-600 hover:text-red-800"
                            title="Remove selfie and retake"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        // No selfie - show capture button
                        <div className="space-y-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={openSupervisorSelfieDialog}
                            className="w-full h-12 flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                          >
                            <User className="w-6 h-6 text-gray-500" />
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-700">Take Supervisor Selfie</p>
                              <p className="text-xs text-gray-500">Required for verification</p>
                            </div>
                          </Button>
                          
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Camera className="w-4 h-4 text-yellow-600" />
                              <p className="text-sm font-medium text-yellow-800">Live Photo Required</p>
                            </div>
                            <p className="text-xs text-yellow-600">
                              The supervisor must take a live selfie to verify their identity. Gallery uploads are not allowed.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Supervisor Selfie Dialog */}
                    <Dialog open={isSupervisorSelfieDialogOpen} onOpenChange={closeSupervisorSelfieDialog}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Supervisor Verification</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 font-medium">⚠️ Live Photo Required</p>
                            <p className="text-xs text-blue-600">Gallery uploads are not allowed. Supervisor must take a live selfie.</p>
                          </div>
                          
                          {formData.supervisorName && (
                            <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Supervisor:</span> {formData.supervisorName}
                              </p>
                            </div>
                          )}
                          
                          {isSupervisorCameraActive && supervisorStream ? (
                            <div className="relative">
                              <video
                                id="supervisor-camera-video"
                                autoPlay
                                playsInline
                                className="w-full rounded-lg"
                                style={{ transform: 'scaleX(-1)' }} // Mirror effect for selfie
                                ref={(video) => {
                                  if (video && supervisorStream) {
                                    video.srcObject = supervisorStream;
                                  }
                                }}
                              />
                              <div className="flex justify-center gap-2 mt-4">
                                <Button onClick={captureSupervisorSelfie} className="flex items-center gap-2">
                                  <Camera className="w-4 h-4" />
                                  Capture Selfie
                                </Button>
                                <Button variant="outline" onClick={closeSupervisorSelfieDialog}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-gray-500">Loading camera...</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </Card>

              <ChecklistSection
                type="vehicle"
                checklist={vehicleChecklist}
                onChange={handleVehicleChecklistChange}
              />
            </div>
          );

        case 2:
          return (
            <div className="space-y-6">
              <ChecklistSection
                type="vehicle"
                checklist={vehicleChecklist}
                onChange={handleVehicleChecklistChange}
                mismatches={checklistMismatches}
                showMismatches={true}
              />

              {checklistMismatches.length > 0 && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <h3 className="font-medium text-red-800 mb-2">Checklist Mismatches Detected</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {checklistMismatches.map(mismatch => (
                      <li key={mismatch}>• {mismatch.replace(/([A-Z])/g, ' $1').toLowerCase()}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          );

        default:
          return null;
      }
    }
  };

  const isStepValid = () => {
    if (direction === 'OUT') {
      switch (currentStep) {
        case 1:
          return formData.pilotId && formData.location;
        case 2:
          return true; // Driver checklist is optional
        case 3:
          return formData.odometer > 0 && formData.supervisorName && supervisorSelfie; // Require supervisor selfie
        default:
          return false;
      }
    } else {
      switch (currentStep) {
        case 1:
          return formData.returnOdometer > 0 && formData.supervisorName && supervisorSelfie; // Require supervisor selfie for IN
        case 2:
          return true; // Final review step
        default:
          return false;
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          Pilot Purpose - {direction} Form
        </h2>
        <p className="text-sm text-gray-600">
          Step {currentStep} of {getTotalSteps()}
        </p>
      </div>

      {renderStep()}

      <div className="flex gap-4">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={handlePrevious} className="flex-1">
            Previous
          </Button>
        )}
        
        {currentStep === 1 && (
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}

        {currentStep < getTotalSteps() ? (
          <Button 
            type="button" 
            onClick={handleNext} 
            disabled={!isStepValid()} 
            className="flex-1"
          >
            Next
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={!isStepValid()} 
            className="flex-1"
          >
            Submit {direction}
          </Button>
        )}
      </div>
    </div>
  );
};
