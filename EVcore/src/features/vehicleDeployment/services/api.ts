import apiService from '../../../services/api';
import type { Deployment } from '../../../types/vehicle';

export const deploymentsApi = {
  create: (data: Deployment) =>
    apiService.request<Deployment>(`/api/deployments`, { method: 'POST', body: JSON.stringify(data) }),
  list: (params?: Record<string, string | number>) =>
    apiService.request<Deployment[]>(`/api/deployments${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  update: (id: string, updates: Partial<Deployment>) =>
    apiService.request<Deployment>(`/api/deployments/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  damageEstimate: (description: string, category: string) =>
    apiService.request<{ estimatedCost: number }>(`/api/vehicles/damages/estimate`, {
      method: 'POST',
      body: JSON.stringify({ description, category })
    }),
};

export default deploymentsApi;


