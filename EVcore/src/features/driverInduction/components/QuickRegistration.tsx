import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Clock, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle, 
  UserPlus,
  Mail,
  Calendar,
  Car,
  FileText,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { TemporaryPilot } from '../../../types/pilot';
import { tempPilotService } from '../../../services/database';
import { driverInductionApi } from '../services/api';
import { apiService } from '../../../services/api';

interface QuickRegistrationProps {
  onRegistrationComplete: (tempPilot: TemporaryPilot) => void;
  onViewFullForm: () => void;
}

export const QuickRegistration: React.FC<QuickRegistrationProps> = ({
  onRegistrationComplete,
  onViewFullForm
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    temporaryPassword: string;
    pilotName: string;
    pilotId: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    emailId: '',
    allowedRides: 5,
    validityDays: 3,
    notes: ''
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.mobileNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least name and mobile number.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First try to register via backend API with account creation
      try {
        console.log('🚀 Registering temporary pilot with backend API...');
        const backendResponse = await driverInductionApi.registerTemporaryPilot({
          fullName: formData.fullName.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          emailId: formData.emailId.trim() || undefined,
          allowedRides: formData.allowedRides,
          validityDays: formData.validityDays,
          notes: formData.notes.trim() || undefined
        });

        if (backendResponse.success && backendResponse.data) {
          console.log('✅ Backend registration successful:', backendResponse.data);
          
          // Create temporary pilot data for local database
          const tempPilotData = {
            fullName: formData.fullName.trim(),
            mobileNumber: formData.mobileNumber.trim(),
            emailId: formData.emailId.trim() || undefined,
            allowedRides: formData.allowedRides,
            completedRides: 0,
            expiryDate: new Date(backendResponse.data.pilot.expiryDate),
            registeredBy: 'Current User', // TODO: Get from auth context
            notes: formData.notes.trim() || undefined
          };

          // Save to local database with the backend-generated ID
          await tempPilotService.createTemporaryPilotWithId(tempPilotData, backendResponse.data.pilot.tempId);
          
          // Get the created temporary pilot
          const tempPilot = await tempPilotService.getTemporaryPilot(backendResponse.data.pilot.tempId);
          
          if (tempPilot) {
            onRegistrationComplete(tempPilot);
            
            // Show success message with account credentials
            toast({
              title: 'Temporary Pilot Registered & Account Created',
              description: `${tempPilot.fullName} (${tempPilot.tempId}) registered successfully!`,
              duration: 4000,
            });

            // Show credentials in modal
            if (backendResponse.data.userCreated && backendResponse.data.credentials) {
              setCredentials({
                email: backendResponse.data.credentials.email,
                temporaryPassword: backendResponse.data.credentials.temporaryPassword,
                pilotName: tempPilot.fullName,
                pilotId: tempPilot.tempId
              });
              setShowCredentials(true);
            }
            
            // Reset form
            setFormData({
              fullName: '',
              mobileNumber: '',
              emailId: '',
              allowedRides: 5,
              validityDays: 3,
              notes: ''
            });
            
            return; // Success, exit function
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Backend registration failed, falling back to local-only registration:', backendError);
      }

      // Fallback: Local-only registration (if backend fails)
      console.log('📱 Falling back to local-only temporary pilot registration...');
      
      // Create temporary pilot data for local database
      const tempPilotData = {
        fullName: formData.fullName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        emailId: formData.emailId.trim() || undefined,
        allowedRides: formData.allowedRides,
        completedRides: 0,
        expiryDate: new Date(Date.now() + formData.validityDays * 24 * 60 * 60 * 1000),
        registeredBy: 'Current User', // TODO: Get from auth context
        notes: formData.notes.trim() || undefined
      };

      // Save to local database
      const tempId = await tempPilotService.createTemporaryPilot(tempPilotData);
      
      // Get the created temporary pilot
      const tempPilot = await tempPilotService.getTemporaryPilot(tempId);
      
      if (tempPilot) {
        onRegistrationComplete(tempPilot);
        
        toast({
          title: 'Temporary Pilot Registered (Local Only)',
          description: `${tempPilot.fullName} (${tempPilot.tempId}) saved locally. Note: No user account created due to backend unavailability.`,
          duration: 6000,
        });

        // Reset form
        setFormData({
          fullName: '',
          mobileNumber: '',
          emailId: '',
          allowedRides: 5,
          validityDays: 3,
          notes: ''
        });
      } else {
        throw new Error('Failed to create temporary pilot');
      }

    } catch (error: any) {
      console.error('Error registering temporary pilot:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'There was an error registering the temporary pilot. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Driver Registration</h2>
        <p className="text-gray-600">Choose registration type based on urgency and documentation status</p>
      </div>

      {/* Registration Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Registration Card */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="h-5 w-5" />
              Quick Temporary Registration
            </CardTitle>
            <CardDescription>
              For immediate ride assignment while documents are being processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Use when:</strong> Driver needs to start immediately, full documentation pending
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter driver's full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    placeholder="+91 9876543210"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="emailId">Email (Optional)</Label>
                  <Input
                    id="emailId"
                    type="email"
                    placeholder="driver@example.com"
                    value={formData.emailId}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailId: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="allowedRides">Max Rides</Label>
                    <Select 
                      value={formData.allowedRides.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, allowedRides: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Rides</SelectItem>
                        <SelectItem value="5">5 Rides</SelectItem>
                        <SelectItem value="10">10 Rides</SelectItem>
                        <SelectItem value="15">15 Rides</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="validityDays">Validity</Label>
                    <Select 
                      value={formData.validityDays.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, validityDays: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="2">2 Days</SelectItem>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="7">1 Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Any additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register for Temporary Access
                  </>
                )}
              </Button>
            </form>

            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <Car className="h-3 w-3" />
                Can take rides immediately
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Must complete full registration within validity period
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                All documents required for permanent access
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Registration Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <FileText className="h-5 w-5" />
              Complete Registration
            </CardTitle>
            <CardDescription>
              Full driver induction with all documents and verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Use when:</strong> All documents available, time for complete process
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Required Sections:</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Personal Information
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Driving License & Certificates
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Identity Documents (Aadhar, PAN)
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Banking Details
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Address Verification
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Emergency Contacts
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Medical Certificate
                </div>
              </div>
            </div>

            <Button 
              onClick={onViewFullForm} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Start Complete Registration
            </Button>

            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Takes 15-30 minutes to complete
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Immediate permanent access upon completion
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                No ride limitations
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Modal */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Account Created Successfully
            </DialogTitle>
            <DialogDescription>
              Login credentials have been generated for {credentials?.pilotName} ({credentials?.pilotId})
            </DialogDescription>
          </DialogHeader>
          
          {credentials && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={credentials.email} 
                        readOnly 
                        className="text-sm bg-white"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(credentials.email, 'Email')}
                        className="px-3"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Temporary Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        type={showPassword ? 'text' : 'password'}
                        value={credentials.temporaryPassword} 
                        readOnly 
                        className="text-sm bg-white font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-3"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(credentials.temporaryPassword, 'Password')}
                        className="px-3"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> The pilot must change their password on first login. 
                  Please share these credentials securely with {credentials.pilotName}.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => setShowCredentials(false)} 
                  className="flex-1"
                >
                  Got it!
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
