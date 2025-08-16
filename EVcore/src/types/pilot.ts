// Pilot data types for the master database integration

export interface PilotPersonalInfo {
  fullName: string;
  mobileNumber: string;
  emailId: string;
  dateOfBirth: Date | undefined;
  workingDays: string;
  salary: string;
  designation: string;
  yearsOfExperience: string;
  previousCompany: string;
}

export interface PilotDrivingInfo {
  licenceNumber: string;
  licencePic: File | null;
  drivingCertificate: File | null;
}

export interface PilotIdentityDocs {
  aadhaarNumber: string;
  aadhaarPic: File | null;
  panNumber: string;
  panPic: File | null;
}

export interface PilotBankingDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  bankProof: File | null;
}

export interface PilotAddressDetails {
  presentAddress: string;
  presentAddressPhoto: File | null;
  permanentAddress: string;
  permanentAddressPhoto: File | null;
}

export interface PilotPVCInfo {
  pvcDetails: string;
  pvcPhoto: File | null;
}

export interface PilotFamilyEmergency {
  fatherName: string;
  motherName: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  emergencyRelation: string;
}

export interface PilotMedicalInfo {
  medicalCertificate: File | null;
  bloodGroup: string;
  allergies: string;
  medications: string;
}

export interface Pilot {
  id: string; // Auto-generated EVZIP-{number}
  tempId?: string; // Temporary ID for quick access (TEMP-001)
  personalInfo: PilotPersonalInfo;
  drivingInfo: PilotDrivingInfo;
  identityDocs: PilotIdentityDocs;
  bankingDetails: PilotBankingDetails;
  addressDetails: PilotAddressDetails;
  pvcInfo: PilotPVCInfo;
  familyEmergency: PilotFamilyEmergency;
  medicalInfo: PilotMedicalInfo;
  inductionDate: Date;
  status: 'active' | 'inactive' | 'pending' | 'temporary' | 'pending_verification';
  profilePicture?: File | null;
  
  // Temporary Access Configuration
  temporaryAccess?: {
    isTemporary: boolean;
    allowedRides: number;
    completedRides: number;
    expiryDate: Date;
    supervisionRequired: boolean;
    registeredBy: string; // Staff member who registered
  };
  
  // Document Status Tracking
  documentStatus?: {
    aadhar: 'not_submitted' | 'submitted' | 'verified' | 'rejected';
    license: 'not_submitted' | 'submitted' | 'verified' | 'rejected';
    photo: 'not_submitted' | 'submitted' | 'verified' | 'rejected';
    address: 'not_submitted' | 'submitted' | 'verified' | 'rejected';
    banking: 'not_submitted' | 'submitted' | 'verified' | 'rejected';
    medical: 'not_submitted' | 'submitted' | 'verified' | 'rejected';
  };
}

// Temporary Pilot - Minimal info for quick registration
export interface TemporaryPilot {
  tempId: string; // TEMP-001, TEMP-002, etc.
  fullName: string;
  mobileNumber: string;
  emailId?: string;
  allowedRides: number;
  completedRides: number;
  expiryDate: Date;
  registeredBy: string;
  registrationDate: Date;
  status: 'temporary' | 'pending_verification' | 'expired' | 'converted';
  notes?: string;
}

export interface PilotInductionData {
  personalInfo: PilotPersonalInfo;
  drivingInfo: PilotDrivingInfo;
  identityDocs: PilotIdentityDocs;
  bankingDetails: PilotBankingDetails;
  addressDetails: PilotAddressDetails;
  pvcInfo: PilotPVCInfo;
  familyEmergency: PilotFamilyEmergency;
  medicalInfo: PilotMedicalInfo;
}
