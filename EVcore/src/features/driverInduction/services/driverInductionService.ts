import { PilotInductionData, Pilot } from '../../../types/pilot';
import { driverInductionApi } from './api';
import { pilotService } from '../../../services/database';
import { config } from '../../../config/environment';

export interface DriverInductionResponse {
  success: boolean;
  pilotId?: string;
  message: string;
  userCreated?: boolean;
  credentials?: {
    email?: string;
    temporaryPassword?: string;
    requirePasswordChange?: boolean;
    note?: string;
  };
}

export const driverInductionService = {
  /**
   * Submit driver induction data and automatically save to master database
   */
  async submitInduction(inductionData: PilotInductionData): Promise<DriverInductionResponse> {
    try {
      // Validate required fields
      const validation = this.validateInductionData(inductionData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Use the new backend API endpoint that creates both pilot profile and user account
      console.log('🚀 Submitting driver induction to backend API...');
      const response = await driverInductionApi.submitInduction(inductionData);
      
      if (response.success && response.data) {
        console.log('✅ Driver induction successful:', response.data);
        
        // Also save the pilot to local database for offline access
        try {
          const localPilot: Pilot = {
            id: response.data.pilot.pilotId,
            personalInfo: inductionData.personalInfo,
            drivingInfo: inductionData.drivingInfo,
            identityDocs: inductionData.identityDocs,
            bankingDetails: inductionData.bankingDetails,
            addressDetails: inductionData.addressDetails,
            pvcInfo: inductionData.pvcInfo,
            familyEmergency: inductionData.familyEmergency,
            medicalInfo: inductionData.medicalInfo,
            inductionDate: new Date(),
            status: 'active'
          };
          
          await pilotService.syncPilot(localPilot);
          console.log('✅ Pilot synced to local database:', localPilot.id);
        } catch (localError) {
          console.warn('⚠️ Could not sync pilot to local database:', localError);
          // Don't fail the entire operation if local sync fails
        }
        
        return {
          success: true,
          pilotId: response.data.pilot.pilotId,
          message: response.message,
          userCreated: true,
          credentials: response.data.credentials
        };
      } else {
        console.error('❌ Driver induction failed:', response.message);
        return {
          success: false,
          message: response.message || 'Failed to submit driver induction'
        };
      }

    } catch (error) {
      console.error('Error submitting driver induction:', error);
      return {
        success: false,
        message: 'Failed to submit driver induction. Please try again.'
      };
    }
  },

  /**
   * Validate induction data
   */
  validateInductionData(data: PilotInductionData): { isValid: boolean; message: string } {
    // Personal Info validation
    if (!data.personalInfo.fullName.trim()) {
      return { isValid: false, message: 'Full name is required' };
    }
    if (!data.personalInfo.mobileNumber.trim()) {
      return { isValid: false, message: 'Mobile number is required' };
    }
    if (!data.personalInfo.emailId.trim()) {
      return { isValid: false, message: 'Email ID is required' };
    }

    // Driving Info validation
    if (!data.drivingInfo.licenceNumber.trim()) {
      return { isValid: false, message: 'License number is required' };
    }

    // Identity Documents validation
    if (!data.identityDocs.aadhaarNumber.trim()) {
      return { isValid: false, message: 'Aadhaar number is required' };
    }
    if (!data.identityDocs.panNumber.trim()) {
      return { isValid: false, message: 'PAN number is required' };
    }

    // Banking Details validation
    if (!data.bankingDetails.accountNumber.trim()) {
      return { isValid: false, message: 'Bank account number is required' };
    }
    if (!data.bankingDetails.ifscCode.trim()) {
      return { isValid: false, message: 'IFSC code is required' };
    }

    return { isValid: true, message: 'Validation successful' };
  },

  /**
   * Get all inducted pilots
   */
  async getAllPilots(): Promise<Pilot[]> {
    try {
      const response = await driverInductionApi.getAllPilots();
      return response.success && response.data ? response.data.pilots : [];
    } catch (error) {
      console.error('Error fetching pilots:', error);
      return [];
    }
  },

  /**
   * Get pilot by ID
   */
  async getPilotById(id: string): Promise<Pilot | undefined> {
    try {
      const response = await driverInductionApi.getPilotById(id);
      return response.success && response.data ? response.data : undefined;
    } catch (error) {
      console.error('Error fetching pilot by ID:', error);
      return undefined;
    }
  },

  /**
   * Update pilot status
   */
  async updatePilotStatus(id: string, status: 'active' | 'inactive' | 'pending'): Promise<boolean> {
    try {
      const response = await driverInductionApi.updatePilotStatus(id, status);
      return response.success;
    } catch (error) {
      console.error('Error updating pilot status:', error);
      return false;
    }
  }
};
