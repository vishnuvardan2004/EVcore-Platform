import apiService from '../../../services/api';

export interface ShiftDTO {
  id: string;
  driverId: string;
  startTime: string;
  endTime?: string;
}

export interface TripDTO {
  id: string;
  shiftId: string;
  startTime: string;
  endTime?: string;
  distanceKm?: number;
  notes?: string;
}

export const tripDetailsApi = {
  createShift: (data: Omit<ShiftDTO, 'id'>) =>
    apiService.request<ShiftDTO>(`/api/shifts`, { method: 'POST', body: JSON.stringify(data) }),
  endShift: (id: string, endTime: string) =>
    apiService.request<ShiftDTO>(`/api/shifts/${id}`, { method: 'PATCH', body: JSON.stringify({ endTime }) }),
  createTrip: (data: Omit<TripDTO, 'id'>) =>
    apiService.request<TripDTO>(`/api/trips`, { method: 'POST', body: JSON.stringify(data) }),
  listTrips: (params?: Record<string, string | number>) =>
    apiService.request<TripDTO[]>(`/api/trips${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  analytics: (params?: Record<string, string | number>) =>
    apiService.request<any>(`/api/trips/analytics${params ? `?${new URLSearchParams(params as any)}` : ''}`),
};

export default tripDetailsApi;


