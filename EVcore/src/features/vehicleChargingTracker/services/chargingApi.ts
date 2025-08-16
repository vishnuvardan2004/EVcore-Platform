import apiService from '../../../services/api';

export interface ChargingSessionDTO {
  id: string;
  vehicleNumber: string;
  pilotId: string;
  startTime: string;
  endTime: string;
  startCharge: number;
  endCharge: number;
  startRange: number;
  endRange: number;
  units: number;
  cost: number;
  paymentMode: 'UPI' | 'Cash';
  location: 'HUB' | 'Outside';
  locationName?: string;
  brand?: string;
  hasReceipt: boolean;
}

export interface ChargingSummaryDTO {
  id: string;
  name: string;
  totalSessions: number;
  totalUnits: number;
  totalCost: number;
  averageCostPerUnit: number;
  mostUsedLocation: string;
}

export const chargingApi = {
  getSessions: (params?: Record<string, string | number>) =>
    apiService.request<ChargingSessionDTO[]>(`/api/charging/sessions${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  getSummary: (groupBy: 'vehicle' | 'pilot') =>
    apiService.request<ChargingSummaryDTO[]>(`/api/charging/summary?groupBy=${groupBy}`),
};

export default chargingApi;


