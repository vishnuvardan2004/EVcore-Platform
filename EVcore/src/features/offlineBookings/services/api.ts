import apiService from '../../../services/api';
import type { BookingData } from '../../../services/bookingService';

export const bookingsApi = {
  list: (params?: Record<string, string | number>) =>
    apiService.request<BookingData[]>(`/api/bookings${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  create: (data: BookingData) =>
    apiService.request<BookingData>(`/api/bookings`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, updates: Partial<BookingData>) =>
    apiService.request<BookingData>(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  export: (format: 'csv' | 'excel' | 'pdf', params?: Record<string, string | number>) =>
    apiService.request<Blob>(`/api/bookings/export?format=${format}${params ? `&${new URLSearchParams(params as any)}` : ''}`),
  stats: () => apiService.request<any>(`/api/bookings/stats`),
};

export default bookingsApi;


