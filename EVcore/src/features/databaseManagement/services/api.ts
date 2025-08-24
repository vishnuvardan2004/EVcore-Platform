import apiService from '../../../services/api';
import type { Vehicle, Employee, Pilot, ChargingEquipment, ElectricalEquipment, ITEquipment, InfraFurniture } from '../types';

export const dbApi = {
  // Vehicles - Updated to use correct singular platform names
  listVehicles: () => apiService.request<Vehicle[]>(`/api/database-mgmt/platforms/vehicle/documents`),
  createVehicle: (data: Omit<Vehicle, '_id' | 'createdAt' | 'updatedAt'>) =>
    apiService.request<Vehicle>(`/api/database-mgmt/platforms/vehicle/documents`, { 
      method: 'POST', 
      body: JSON.stringify({ document: data }), // Backend expects data wrapped in 'document' property
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  updateVehicle: (id: string, updates: Partial<Vehicle>) =>
    apiService.request<Vehicle>(`/api/database-mgmt/platforms/vehicle/documents/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ updates }), // Backend expects updates wrapped in 'updates' property
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  deleteVehicle: (id: string) =>
    apiService.request<void>(`/api/database-mgmt/platforms/vehicle/documents/${id}`, { method: 'DELETE' }),

  // Employees - Updated to use correct singular platform names
  listEmployees: () => apiService.request<Employee[]>(`/api/database-mgmt/platforms/employee/documents`),
  createEmployee: (data: Omit<Employee, '_id' | 'createdAt' | 'updatedAt'>) =>
    apiService.request<Employee>(`/api/database-mgmt/platforms/employee/documents`, { 
      method: 'POST', 
      body: JSON.stringify({ document: data }), // Backend expects data wrapped in 'document' property
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  updateEmployee: (id: string, updates: Partial<Employee>) =>
    apiService.request<Employee>(`/api/database-mgmt/platforms/employee/documents/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ updates }), // Backend expects updates wrapped in 'updates' property
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  deleteEmployee: (id: string) =>
    apiService.request<void>(`/api/database-mgmt/platforms/employee/documents/${id}`, { method: 'DELETE' }),

  // Pilots - Updated to use correct singular platform names
  listPilots: () => apiService.request<Pilot[]>(`/api/database-mgmt/platforms/pilot/documents`),

  // Equipment - Updated to use correct schema names (all lowercase)
  listChargingEquipment: () => apiService.request<ChargingEquipment[]>(`/api/database-mgmt/platforms/chargingequipment/documents`),
  createChargingEquipment: (data: Omit<ChargingEquipment, '_id' | 'createdAt' | 'updatedAt'>) =>
    apiService.request<ChargingEquipment>(`/api/database-mgmt/platforms/chargingequipment/documents`, { 
      method: 'POST', 
      body: JSON.stringify({ document: data }), // Backend expects data wrapped in 'document' property
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  updateChargingEquipment: (id: string, updates: Partial<ChargingEquipment>) =>
    apiService.request<ChargingEquipment>(`/api/database-mgmt/platforms/chargingequipment/documents/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(updates),
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  deleteChargingEquipment: (id: string) =>
    apiService.request<void>(`/api/database-mgmt/platforms/chargingequipment/documents/${id}`, { method: 'DELETE' }),
  
  listElectricalEquipment: () => apiService.request<ElectricalEquipment[]>(`/api/database-mgmt/platforms/electricequipment/documents`),
  createElectricalEquipment: (data: Omit<ElectricalEquipment, '_id' | 'createdAt' | 'updatedAt'>) =>
    apiService.request<ElectricalEquipment>(`/api/database-mgmt/platforms/electricequipment/documents`, { 
      method: 'POST', 
      body: JSON.stringify({ document: data }), // Backend expects data wrapped in 'document' property
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  updateElectricalEquipment: (id: string, updates: Partial<ElectricalEquipment>) =>
    apiService.request<ElectricalEquipment>(`/api/database-mgmt/platforms/electricequipment/documents/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(updates),
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  deleteElectricalEquipment: (id: string) =>
    apiService.request<void>(`/api/database-mgmt/platforms/electricequipment/documents/${id}`, { method: 'DELETE' }),
  
  listITEquipment: () => apiService.request<ITEquipment[]>(`/api/database-mgmt/platforms/itequipment/documents`),
  createITEquipment: (data: Omit<ITEquipment, '_id' | 'createdAt' | 'updatedAt'>) =>
    apiService.request<ITEquipment>(`/api/database-mgmt/platforms/itequipment/documents`, { 
      method: 'POST', 
      body: JSON.stringify({ document: data }), // Backend expects data wrapped in 'document' property
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  updateITEquipment: (id: string, updates: Partial<ITEquipment>) =>
    apiService.request<ITEquipment>(`/api/database-mgmt/platforms/itequipment/documents/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(updates),
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  deleteITEquipment: (id: string) =>
    apiService.request<void>(`/api/database-mgmt/platforms/itequipment/documents/${id}`, { method: 'DELETE' }),
  
  listInfraFurniture: () => apiService.request<InfraFurniture[]>(`/api/database-mgmt/platforms/infrastructurefurniture/documents`),
  createInfraFurniture: (data: Omit<InfraFurniture, '_id' | 'createdAt' | 'updatedAt'>) =>
    apiService.request<InfraFurniture>(`/api/database-mgmt/platforms/infrastructurefurniture/documents`, { 
      method: 'POST', 
      body: JSON.stringify({ document: data }), // Backend expects data wrapped in 'document' property
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  updateInfraFurniture: (id: string, updates: Partial<InfraFurniture>) =>
    apiService.request<InfraFurniture>(`/api/database-mgmt/platforms/infrastructurefurniture/documents/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(updates),
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  deleteInfraFurniture: (id: string) =>
    apiService.request<void>(`/api/database-mgmt/platforms/infrastructurefurniture/documents/${id}`, { method: 'DELETE' }),

  // Pilots - Create method
  createPilot: (data: Omit<Pilot, '_id' | 'createdAt' | 'updatedAt'>) =>
    apiService.request<Pilot>(`/api/database-mgmt/platforms/pilot/documents`, { 
      method: 'POST', 
      body: JSON.stringify({ document: data }), // Backend expects data wrapped in 'document' property
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  updatePilot: (id: string, updates: Partial<Pilot>) =>
    apiService.request<Pilot>(`/api/database-mgmt/platforms/pilot/documents/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(updates),
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  deletePilot: (id: string) =>
    apiService.request<void>(`/api/database-mgmt/platforms/pilot/documents/${id}`, { method: 'DELETE' }),
};

export default dbApi;


