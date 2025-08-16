
import React, { useState } from 'react';
import { PageLayout } from '../../../components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Clock, FileText, Users } from 'lucide-react';
import { PersonalInformationSection } from '../components/PersonalInformationSection';
import { DrivingInformationSection } from '../components/DrivingInformationSection';
import { IdentityDocumentsSection } from '../components/IdentityDocumentsSection';
import { BankingDetailsSection } from '../components/BankingDetailsSection';
import { AddressDetailsSection } from '../components/AddressDetailsSection';
import { PVCInformationSection } from '../components/PVCInformationSection';
import { FamilyEmergencySection } from '../components/FamilyEmergencySection';
import { MedicalInductionSection } from '../components/MedicalInductionSection';
import { QuickRegistration } from '../components/QuickRegistration';
import { TemporaryPilotsList } from '../components/TemporaryPilotsList';
import { useToast } from '../../../hooks/use-toast';
import { driverInductionService } from '../services/driverInductionService';
import { PilotInductionData, TemporaryPilot } from '../../../types/pilot';

export interface DriverInductionData {
  personalInfo: {
    fullName: string;
    mobileNumber: string;
    emailId: string;
    dateOfBirth: Date | undefined;
    workingDays: string;
    salary: string;
    designation: string;
    yearsOfExperience: string;
    previousCompany: string;
  };
  drivingInfo: {
    licenceNumber: string;
    licencePic: File | null;
    drivingCertificate: File | null;
  };
  identityDocs: {
    aadhaarNumber: string;
    aadhaarPic: File | null;
    panNumber: string;
    panPic: File | null;
  };
  bankingDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    bankBranch: string;
    bankProof: File | null;
  };
  addressDetails: {
    presentAddress: string;
    presentAddressPhoto: File | null;
    permanentAddress: string;
    permanentAddressProof: File | null;
    electricityBill: File | null;
  };
  pvcInfo: {
    acknowledgementDate: Date | undefined;
    issueDate: Date | undefined;
    expiryDate: Date | undefined;
    pvcPhoto: File | null;
  };
  familyEmergency: {
    parentName: string;
    parentMobile: string;
    parentsPhoto: File | null;
    emergencyContactName: string;
    emergencyContactNumber: string;
  };
  medicalInduction: {
    medicalTestReport: File | null;
    medicalTestDate: Date | undefined;
    medicalTestExpiry: Date | undefined;
    inductionTeamMember: string;
    agreementCopy: File | null;
    agreementDate: Date | undefined;
  };
}

const initialData: DriverInductionData = {
  personalInfo: {
    fullName: '',
    mobileNumber: '',
    emailId: '',
    dateOfBirth: undefined,
    workingDays: '',
    salary: '',
    designation: '',
    yearsOfExperience: '',
    previousCompany: '',
  },
  drivingInfo: {
    licenceNumber: '',
    licencePic: null,
    drivingCertificate: null,
  },
  identityDocs: {
    aadhaarNumber: '',
    aadhaarPic: null,
    panNumber: '',
    panPic: null,
  },
  bankingDetails: {
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    bankBranch: '',
    bankProof: null,
  },
  addressDetails: {
    presentAddress: '',
    presentAddressPhoto: null,
    permanentAddress: '',
    permanentAddressProof: null,
    electricityBill: null,
  },
  pvcInfo: {
    acknowledgementDate: undefined,
    issueDate: undefined,
    expiryDate: undefined,
    pvcPhoto: null,
  },
  familyEmergency: {
    parentName: '',
    parentMobile: '',
    parentsPhoto: null,
    emergencyContactName: '',
    emergencyContactNumber: '',
  },
  medicalInduction: {
    medicalTestReport: null,
    medicalTestDate: undefined,
    medicalTestExpiry: undefined,
    inductionTeamMember: '',
    agreementCopy: null,
    agreementDate: undefined,
  },
};

const DriverInduction = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'quick' | 'temporary' | 'full'>('quick');
  const [temporaryPilots, setTemporaryPilots] = useState<TemporaryPilot[]>([]);
  const [formData, setFormData] = useState<DriverInductionData>(initialData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  
  // Temporary pilots state (in real app, this would come from context/store)

  const updateFormData = (section: keyof DriverInductionData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const handleTemporaryRegistration = (tempPilot: TemporaryPilot) => {
    setTemporaryPilots(prev => [...prev, tempPilot]);
    
    // TODO: Sync with database
    // pilotService.createTemporaryPilot(tempPilot);
    
    // Switch to temporary pilots tab to show the new registration
    setActiveTab('temporary');
  };

  const handleConvertToFull = (tempPilot: TemporaryPilot) => {
    // Pre-fill form with temporary pilot data
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        fullName: tempPilot.fullName,
        mobileNumber: tempPilot.mobileNumber,
        emailId: tempPilot.emailId || ''
      }
    }));
    
    setShowFullForm(true);
    setActiveTab('full');
    
    toast({
      title: 'Converting to Full Registration',
      description: `Pre-filled form with ${tempPilot.fullName}'s information.`,
    });
  };

  const handleExtendAccess = (tempId: string, additionalRides: number, additionalDays: number) => {
    setTemporaryPilots(prev => 
      prev.map(pilot => 
        pilot.tempId === tempId 
          ? {
              ...pilot,
              allowedRides: pilot.allowedRides + additionalRides,
              expiryDate: new Date(pilot.expiryDate.getTime() + additionalDays * 24 * 60 * 60 * 1000)
            }
          : pilot
      )
    );
    
    toast({
      title: 'Access Extended',
      description: `Added ${additionalRides} rides and ${additionalDays} days.`,
    });
  };

  const handleRevokeAccess = (tempId: string) => {
    setTemporaryPilots(prev => 
      prev.map(pilot => 
        pilot.tempId === tempId 
          ? { ...pilot, status: 'expired' as const }
          : pilot
      )
    );
    
    toast({
      title: 'Access Revoked',
      description: 'Temporary pilot access has been revoked.',
      variant: 'destructive'
    });
  };

  const handleSubmit = async () => {
    try {
      // Convert DriverInductionData to PilotInductionData format
      const pilotData: PilotInductionData = {
        personalInfo: formData.personalInfo,
        drivingInfo: formData.drivingInfo,
        identityDocs: formData.identityDocs,
        bankingDetails: formData.bankingDetails,
        addressDetails: {
          presentAddress: formData.addressDetails.presentAddress,
          presentAddressPhoto: formData.addressDetails.presentAddressPhoto,
          permanentAddress: formData.addressDetails.permanentAddress,
          permanentAddressPhoto: formData.addressDetails.permanentAddressProof
        },
        pvcInfo: {
          pvcDetails: `Acknowledgement: ${formData.pvcInfo.acknowledgementDate?.toDateString() || 'N/A'}, Issue: ${formData.pvcInfo.issueDate?.toDateString() || 'N/A'}, Expiry: ${formData.pvcInfo.expiryDate?.toDateString() || 'N/A'}`,
          pvcPhoto: formData.pvcInfo.pvcPhoto
        },
        familyEmergency: {
          fatherName: formData.familyEmergency.parentName,
          motherName: '', // Add this field to the form if needed
          emergencyContactName: formData.familyEmergency.emergencyContactName,
          emergencyContactNumber: formData.familyEmergency.emergencyContactNumber,
          emergencyRelation: 'Emergency Contact'
        },
        medicalInfo: {
          medicalCertificate: formData.medicalInduction.medicalTestReport,
          bloodGroup: '', // Add this field to the form if needed
          allergies: '', // Add this field to the form if needed
          medications: '' // Add this field to the form if needed
        }
      };

      // Submit to database with auto-generated EVZIP ID
      const result = await driverInductionService.submitInduction(pilotData);
      
      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: "Success!",
          description: `Pilot inducted successfully with ID: ${result.pilotId}. Data has been saved to the master database.`,
        });

        // Reset form after 3 seconds and redirect to database
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData(initialData);
          navigate('/database/pilots'); // Redirect to pilot management
        }, 3000);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting driver induction:', error);
      toast({
        title: "Error",
        description: "Failed to submit driver induction. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <PageLayout 
        title="📋 Driver Induction" 
        subtitle="Enter and manage full driver profiles"
      >
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-12 pb-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Driver Induction Completed!
              </h2>
              <p className="text-gray-600 mb-6">
                All driver information has been successfully recorded and will be synced to the pilots database.
              </p>
              <Button onClick={() => setIsSubmitted(false)} className="mr-4">
                Add Another Driver
              </Button>
              <Button onClick={() => navigate('/')} variant="outline">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="📋 Driver Induction" 
      subtitle="Register new drivers and manage pilot profiles"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="text-sm text-gray-600">
            <span className="text-red-500">*</span> indicates required fields
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'quick' | 'temporary' | 'full')} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Registration</TabsTrigger>
            <TabsTrigger value="temporary">Temporary Pilots</TabsTrigger>
            <TabsTrigger value="full">Full Registration</TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <QuickRegistration 
              onRegistrationComplete={() => setActiveTab('temporary')}
              onViewFullForm={() => setActiveTab('full')}
            />
          </TabsContent>

          <TabsContent value="temporary">
            <TemporaryPilotsList 
              tempPilots={temporaryPilots}
              onConvertToFull={(pilotId) => {
                // TODO: Implement conversion to full registration
                console.log('Convert pilot to full registration:', pilotId);
                setActiveTab('full');
              }}
              onExtendAccess={(pilotId) => {
                // TODO: Implement access extension
                console.log('Extend access for pilot:', pilotId);
              }}
              onRevokeAccess={(pilotId) => {
                // TODO: Implement access revocation
                console.log('Revoke access for pilot:', pilotId);
              }}
            />
          </TabsContent>

          <TabsContent value="full">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Complete Driver Induction Form</CardTitle>
            <CardDescription>
              Complete onboarding information for new drivers/pilots
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <PersonalInformationSection 
              data={formData.personalInfo}
              onChange={(data) => updateFormData('personalInfo', data)}
            />
            
            <DrivingInformationSection 
              data={formData.drivingInfo}
              onChange={(data) => updateFormData('drivingInfo', data)}
            />
            
            <IdentityDocumentsSection 
              data={formData.identityDocs}
              onChange={(data) => updateFormData('identityDocs', data)}
            />
            
            <BankingDetailsSection 
              data={formData.bankingDetails}
              onChange={(data) => updateFormData('bankingDetails', data)}
            />
            
            <AddressDetailsSection 
              data={formData.addressDetails}
              onChange={(data) => updateFormData('addressDetails', data)}
            />
            
            <PVCInformationSection 
              data={formData.pvcInfo}
              onChange={(data) => updateFormData('pvcInfo', data)}
            />
            
            <FamilyEmergencySection 
              data={formData.familyEmergency}
              onChange={(data) => updateFormData('familyEmergency', data)}
            />
            
            <MedicalInductionSection 
              data={formData.medicalInduction}
              onChange={(data) => updateFormData('medicalInduction', data)}
            />

            <div className="flex justify-center pt-6 border-t">
              <Button onClick={handleSubmit} className="gap-2 bg-green-600 hover:bg-green-700 px-8 py-3 text-lg">
                <Save className="w-5 h-5" />
                Save / Submit Driver Information
              </Button>
            </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default DriverInduction;
