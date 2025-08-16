import apiService from '../../../services/api';
import type { Vehicle, Employee, Pilot, ChargingEquipment, ElectricalEquipment, ITEquipment, InfraFurniture } from '../types';

export const dbApi = {
  // Vehicles
  listVehicles: () => apiService.request<Vehicle[]>(`/api/vehicles`),
  createVehicle: (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiService.request<Vehicle>(`/api/vehicles`, { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id: string, updates: Partial<Vehicle>) =>
    apiService.request<Vehicle>(`/api/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  // Employees
  listEmployees: () => apiService.request<Employee[]>(`/api/employees`),
  createEmployee: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiService.request<Employee>(`/api/employees`, { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, updates: Partial<Employee>) =>
    apiService.request<Employee>(`/api/employees/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  // Pilots
  listPilots: () => apiService.request<Pilot[]>(`/api/pilots`),

  // Equipment
  listChargingEquipment: () => apiService.request<ChargingEquipment[]>(`/api/charging-equipment`),
  listElectricalEquipment: () => apiService.request<ElectricalEquipment[]>(`/api/electrical-equipment`),
  listITEquipment: () => apiService.request<ITEquipment[]>(`/api/it-equipment`),
  listInfraFurniture: () => apiService.request<InfraFurniture[]>(`/api/infra-furniture`),
};

export default dbApi;


