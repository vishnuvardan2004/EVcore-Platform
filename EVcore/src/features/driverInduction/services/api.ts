import apiService, { APIResponse, APIError } from '../../../services/api';
import type { 
  PilotInductionData, 
  Pilot,
  DriverInductionSubmissionDTO,
  DriverInductionResponseDTO,
  PilotListDTO,
  PilotStatusUpdateDTO,
  PilotValidationDTO,
  InductionStatsDTO,
  DocumentUploadDTO
} from '../types';

/**
 * Driver Induction API Service
 * Standardized API layer following EVcore patterns
 */
export const driverInductionApi = {
  /**
   * Submit driver induction data
   */
  submitInduction: (inductionData: PilotInductionData): Promise<APIResponse<DriverInductionResponseDTO>> =>
    apiService.request<DriverInductionResponseDTO>('/api/driver-induction/submit', {
      method: 'POST',
      body: JSON.stringify({
        personalInfo: inductionData.personalInfo,
        drivingInfo: inductionData.drivingInfo,
        identityDocs: inductionData.identityDocs,
        bankingDetails: inductionData.bankingDetails,
        addressDetails: inductionData.addressDetails,
        pvcInfo: inductionData.pvcInfo,
        familyEmergency: inductionData.familyEmergency,
        medicalInfo: inductionData.medicalInfo
      }),
    }),

  /**
   * Get all inducted pilots with pagination
   */
  getAllPilots: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string 
  }): Promise<APIResponse<PilotListDTO>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    
    const endpoint = `/api/driver-induction/pilots${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.request<PilotListDTO>(endpoint);
  },

  /**
   * Get pilot by ID
   */
  getPilotById: (id: string): Promise<APIResponse<Pilot>> =>
    apiService.request<Pilot>(`/api/driver-induction/pilots/${id}`),

  /**
   * Update pilot status
   */
  updatePilotStatus: (id: string, status: 'active' | 'inactive' | 'pending'): Promise<APIResponse<PilotStatusUpdateDTO>> =>
    apiService.request<PilotStatusUpdateDTO>(`/api/driver-induction/pilots/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  /**
   * Delete pilot record
   */
  deletePilot: (id: string): Promise<APIResponse<void>> =>
    apiService.request<void>(`/api/driver-induction/pilots/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Upload pilot documents
   */
  uploadDocument: (pilotId: string, documentType: string, file: File): Promise<APIResponse<DocumentUploadDTO>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('pilotId', pilotId);

    return apiService.request<DocumentUploadDTO>('/api/driver-induction/upload-document', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set it with boundary for FormData
      },
    });
  },

  /**
   * Validate induction data before submission
   */
  validateInduction: (inductionData: PilotInductionData): Promise<APIResponse<PilotValidationDTO>> =>
    apiService.request<PilotValidationDTO>('/api/driver-induction/validate', {
      method: 'POST',
      body: JSON.stringify(inductionData),
    }),

  /**
   * Get induction statistics
   */
  getInductionStats: (): Promise<APIResponse<InductionStatsDTO>> =>
    apiService.request<InductionStatsDTO>('/api/driver-induction/stats'),
};

export default driverInductionApi;
