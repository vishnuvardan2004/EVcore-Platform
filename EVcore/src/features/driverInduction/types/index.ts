// Driver Induction Feature Types
// Type definitions for the driver induction module

import type { PilotInductionData, Pilot } from '../../../types/pilot';

// Re-export global types for convenience
export type { PilotInductionData, Pilot } from '../../../types/pilot';

// Driver Induction specific DTOs
export interface DriverInductionSubmissionDTO {
  personalInfo: {
    fullName: string;
    mobileNumber: string;
    emailId: string;
    dateOfBirth: string;
    workingDays: string;
    salary: string;
    designation: string;
    yearsOfExperience: string;
    previousCompany: string;
  };
  drivingInfo: {
    licenceNumber: string;
    licenceFileUrl?: string;
    drivingCertificateUrl?: string;
  };
  identityDocs: {
    aadhaarNumber: string;
    aadhaarFileUrl?: string;
    panNumber: string;
    panFileUrl?: string;
  };
  bankingDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    bankBranch: string;
    bankProofUrl?: string;
  };
  addressDetails: {
    presentAddress: string;
    presentAddressPhotoUrl?: string;
    permanentAddress: string;
    permanentAddressPhotoUrl?: string;
  };
  pvcInfo: {
    pvcDetails: string;
    pvcPhotoUrl?: string;
  };
  familyEmergency: {
    fatherName: string;
    motherName: string;
    spouseName?: string;
    emergencyContactName: string;
    emergencyContactNumber: string;
  };
  medicalInfo: {
    bloodGroup: string;
    allergies?: string;
    medications?: string;
    medicalConditions?: string;
  };
}

export interface DriverInductionResponseDTO {
  pilot: {
    pilotId: string;
    fullName: string;
    email: string;
    mobileNumber: string;
  };
  credentials: {
    email: string;
    defaultPassword: string;
    role: string;
  };
}

export interface PilotListDTO {
  pilots: Pilot[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PilotStatusUpdateDTO {
  status: 'active' | 'inactive' | 'pending';
  updatedAt: string;
  updatedBy: string;
}

export interface PilotValidationDTO {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface InductionStatsDTO {
  totalPilots: number;
  activePilots: number;
  inactivePilots: number;
  pendingInductions: number;
  completedThisMonth: number;
  completedThisWeek: number;
  averageInductionTime: number; // in days
}

export interface DocumentUploadDTO {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  documentType: string;
}

// Form state types
export interface DriverInductionFormState {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  errors: Record<string, string>;
  data: Partial<PilotInductionData>;
}

// Filter and search types
export interface PilotSearchFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'pending' | 'all';
  dateFrom?: string;
  dateTo?: string;
  designation?: string;
  experience?: string;
}

export interface PilotSortOptions {
  field: 'name' | 'inductionDate' | 'status' | 'experience';
  direction: 'asc' | 'desc';
}
