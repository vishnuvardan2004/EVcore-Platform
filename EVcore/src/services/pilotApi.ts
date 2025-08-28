import { apiService } from './api';
import { Pilot } from '../types/pilot';

export interface BackendPilot {
  _id: string;
  evzipId: string;
  personalInfo: {
    fullName: string;
    mobileNumber: string;
    emailId: string;
    designation?: string;
  };
  documentInfo?: {
    aadhaarNumber?: string;
    panNumber?: string;
    drivingLicenseNumber?: string;
  };
  addresses?: {
    presentAddress?: string;
    permanentAddress?: string;
  };
  emergencyContact?: {
    name?: string;
    relation?: string;
    mobileNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Transform backend pilot to frontend pilot format
const transformBackendPilot = (backendPilot: BackendPilot): Pilot => {
  return {
    id: backendPilot.evzipId,
    personalInfo: {
      fullName: backendPilot.personalInfo.fullName,
      mobileNumber: backendPilot.personalInfo.mobileNumber,
      emailId: backendPilot.personalInfo.emailId,
      dateOfBirth: undefined,
      workingDays: '',
      salary: '',
      designation: backendPilot.personalInfo.designation || '',
      yearsOfExperience: '',
      previousCompany: '',
    },
    drivingInfo: {
      licenceNumber: backendPilot.documentInfo?.drivingLicenseNumber || '',
      licencePic: null,
      drivingCertificate: null,
    },
    identityDocs: {
      aadhaarNumber: backendPilot.documentInfo?.aadhaarNumber || '',
      aadhaarPic: null,
      panNumber: backendPilot.documentInfo?.panNumber || '',
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
      presentAddress: backendPilot.addresses?.presentAddress || '',
      presentAddressPhoto: null,
      permanentAddress: backendPilot.addresses?.permanentAddress || '',
      permanentAddressPhoto: null,
    },
    pvcInfo: {
      pvcDetails: '',
      pvcPhoto: null,
    },
    familyEmergency: {
      fatherName: '',
      motherName: '',
      emergencyContactName: backendPilot.emergencyContact?.name || '',
      emergencyContactNumber: backendPilot.emergencyContact?.mobileNumber || '',
      emergencyRelation: backendPilot.emergencyContact?.relation || '',
    },
    medicalInfo: {
      medicalCertificate: null,
      bloodGroup: '',
      allergies: '',
      medications: '',
    },
    inductionDate: new Date(backendPilot.createdAt),
    status: 'active', // Default status for now
  };
};

export const pilotApiService = {
  async getAllPilots(): Promise<Pilot[]> {
    try {
      console.log('🔍 Fetching pilots from backend API...');
      const response = await apiService.databaseMgmt.pilots.getAll();
      console.log('📊 Raw backend response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        const pilots = response.data.map(transformBackendPilot);
        console.log('✅ Transformed pilots:', pilots);
        return pilots;
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching pilots:', error);
      throw error;
    }
  },

  async getPilot(id: string): Promise<Pilot | undefined> {
    try {
      const response = await apiService.databaseMgmt.pilots.getById(id);
      if (response.data) {
        return transformBackendPilot(response.data);
      }
      return undefined;
    } catch (error) {
      console.error('❌ Error fetching pilot:', error);
      throw error;
    }
  },

  async createPilot(pilotData: Omit<Pilot, 'id' | 'inductionDate' | 'status'>): Promise<string> {
    try {
      const response = await apiService.databaseMgmt.pilots.create(pilotData);
      if (response.data && response.data.evzipId) {
        return response.data.evzipId;
      }
      throw new Error('Failed to create pilot - no ID returned');
    } catch (error) {
      console.error('❌ Error creating pilot:', error);
      throw error;
    }
  },

  async updatePilot(id: string, updates: Partial<Pilot>): Promise<void> {
    try {
      await apiService.databaseMgmt.pilots.update(id, updates);
    } catch (error) {
      console.error('❌ Error updating pilot:', error);
      throw error;
    }
  },

  async deletePilot(id: string): Promise<void> {
    try {
      await apiService.databaseMgmt.pilots.delete(id);
    } catch (error) {
      console.error('❌ Error deleting pilot:', error);
      throw error;
    }
  },

  async getPilotCount(): Promise<number> {
    try {
      const pilots = await this.getAllPilots();
      return pilots.length;
    } catch (error) {
      console.error('❌ Error getting pilot count:', error);
      return 0;
    }
  },

  async getActivePilots(): Promise<Pilot[]> {
    try {
      const pilots = await this.getAllPilots();
      return pilots.filter(pilot => pilot.status === 'active');
    } catch (error) {
      console.error('❌ Error getting active pilots:', error);
      return [];
    }
  },

  async searchPilots(searchTerm: string): Promise<Pilot[]> {
    try {
      const pilots = await this.getAllPilots();
      return pilots.filter(pilot => 
        pilot.personalInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pilot.personalInfo.mobileNumber.includes(searchTerm) ||
        pilot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pilot.personalInfo.emailId && pilot.personalInfo.emailId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('❌ Error searching pilots:', error);
      return [];
    }
  }
};
