// Master Database Service - IndexedDB Implementation

import Dexie, { Table } from 'dexie';
import {
  Vehicle,
  ChargingEquipment,
  ElectricalEquipment,
  ITEquipment,
  InfraFurniture,
  Employee,
  Pilot,
  User,
  AuditLog,
  AssetCategory,
  ResourceCategory
} from '../types';

export class MasterDatabase extends Dexie {
  // Asset Tables
  vehicles!: Table<Vehicle>;
  chargingEquipment!: Table<ChargingEquipment>;
  electricalEquipment!: Table<ElectricalEquipment>;
  itEquipment!: Table<ITEquipment>;
  infraFurniture!: Table<InfraFurniture>;
  
  // Resource Tables
  employees!: Table<Employee>;
  pilots!: Table<Pilot>;
  
  // System Tables
  users!: Table<User>;
  auditLogs!: Table<AuditLog>;

  constructor() {
    super('MasterDatabase');
    
    this.version(1).stores({
      // Asset tables
      vehicles: 'id, vehicleId, vinNumber, engineNumber, registrationNumber, model, brand, vehicleClass, vehicleType, fuelType, batterySerialNumber, chargerSerialNumber, chargerType, batteryCapacityKWh, chargingPortType, insuranceProvider, insurancePolicyNo, permitNumber, policeCertificateStatus, rcFile, pucStatus, vehicleCondition, odometerReading, locationAssigned, assignedPilotId, status, createdBy',
      chargingEquipment: 'id, equipmentNumber, model, brand, location, status, createdBy',
      electricalEquipment: 'id, equipmentNumber, type, brand, location, status, createdBy',
      itEquipment: 'id, equipmentNumber, type, brand, assignedTo, location, status, createdBy',
      infraFurniture: 'id, itemNumber, type, category, location, room, createdBy',
      
      // Resource tables
      employees: 'id, employeeId, fullName, gender, emailId, contactNumber, aadharNumber, panNumber, city, maritalStatus, dateOfJoining, employmentType, designation, department, reportingManagerId, shiftType, workLocation, employeeStatus, salaryMode, monthlySalary, pfEligible, backgroundCheckStatus, createdBy',
      pilots: 'id, pilotId, employeeId, licenseNumber, status, createdBy',
      
      // System tables
      users: 'id, username, email, employeeId, role, isActive',
      auditLogs: 'id, userId, module, recordId, timestamp'
    });
  }
}

export const masterDb = new MasterDatabase();

// Database Service Class
export class DatabaseService {
  
  // Generic CRUD operations
  async create<T extends { id?: string; _id?: string; createdAt?: string; updatedAt?: string; createdBy?: string }>(
    table: Table<T>,
    data: Omit<T, 'id' | '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    userId: string
  ): Promise<T> {
    const id = this.generateId();
    const record = {
      ...data,
      id,
      _id: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId
    } as T;

    await table.add(record);
    await this.logAction(userId, 'create', table.name, record.id || record._id || id, record);
    return record;
  }

  async update<T extends { id?: string; _id?: string; updatedAt?: string }>(
    table: Table<T>,
    id: string,
    updates: Partial<T>,
    userId: string
  ): Promise<void> {
    const existing = await table.get(id);
    if (!existing) throw new Error('Record not found');

    const updatedRecord = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await table.update(id, updatedRecord as any);
    await this.logAction(userId, 'update', table.name, id, updatedRecord);
  }

  async delete<T>(
    table: Table<T>,
    id: string,
    userId: string
  ): Promise<void> {
    const existing = await table.get(id);
    if (!existing) throw new Error('Record not found');

    await table.delete(id);
    await this.logAction(userId, 'delete', table.name, id, { deleted: true });
  }

  async getById<T>(table: Table<T>, id: string): Promise<T | undefined> {
    return await table.get(id);
  }

  async getAll<T>(table: Table<T>): Promise<T[]> {
    return await table.toArray();
  }

  async search<T>(
    table: Table<T>,
    searchTerm: string,
    fields: string[]
  ): Promise<T[]> {
    return await table.filter(record => {
      return fields.some(field => {
        const value = (record as any)[field];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    }).toArray();
  }

  // Vehicle operations
  async createVehicle(data: Omit<Vehicle, 'id' | '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>, userId: string): Promise<Vehicle> {
    return this.create(masterDb.vehicles, data, userId);
  }

  async getVehicles(): Promise<Vehicle[]> {
    return this.getAll(masterDb.vehicles);
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>, userId: string): Promise<void> {
    return this.update(masterDb.vehicles, id, updates, userId);
  }

  async deleteVehicle(id: string, userId: string): Promise<void> {
    return this.delete(masterDb.vehicles, id, userId);
  }

  // Charging Equipment operations
  async createChargingEquipment(data: Omit<ChargingEquipment, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<ChargingEquipment> {
    return this.create(masterDb.chargingEquipment, data, userId);
  }

  async getChargingEquipment(): Promise<ChargingEquipment[]> {
    return this.getAll(masterDb.chargingEquipment);
  }

  async updateChargingEquipment(id: string, updates: Partial<ChargingEquipment>, userId: string): Promise<void> {
    return this.update(masterDb.chargingEquipment, id, updates, userId);
  }

  async deleteChargingEquipment(id: string, userId: string): Promise<void> {
    return this.delete(masterDb.chargingEquipment, id, userId);
  }

  // Electrical Equipment operations
  async createElectricalEquipment(data: Omit<ElectricalEquipment, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<ElectricalEquipment> {
    return this.create(masterDb.electricalEquipment, data, userId);
  }

  async getElectricalEquipment(): Promise<ElectricalEquipment[]> {
    return this.getAll(masterDb.electricalEquipment);
  }

  // IT Equipment operations
  async createITEquipment(data: Omit<ITEquipment, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<ITEquipment> {
    return this.create(masterDb.itEquipment, data, userId);
  }

  async getITEquipment(): Promise<ITEquipment[]> {
    return this.getAll(masterDb.itEquipment);
  }

  // Infrastructure & Furniture operations
  async createInfraFurniture(data: Omit<InfraFurniture, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<InfraFurniture> {
    return this.create(masterDb.infraFurniture, data, userId);
  }

  async getInfraFurniture(): Promise<InfraFurniture[]> {
    return this.getAll(masterDb.infraFurniture);
  }

  // Employee operations
  async createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Employee> {
    return this.create(masterDb.employees, data, userId);
  }

  async getEmployees(): Promise<Employee[]> {
    return this.getAll(masterDb.employees);
  }

  async updateEmployee(id: string, updates: Partial<Employee>, userId: string): Promise<void> {
    return this.update(masterDb.employees, id, updates, userId);
  }

  async deleteEmployee(id: string, userId: string): Promise<void> {
    return this.delete(masterDb.employees, id, userId);
  }

  // Pilot operations
  async createPilot(data: Omit<Pilot, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Pilot> {
    return this.create(masterDb.pilots, data, userId);
  }

  async getPilots(): Promise<Pilot[]> {
    try {
      // Import dbApi here to avoid circular dependency
      const { default: dbApi } = await import('./api');
      const response = await dbApi.listPilots();
      
      if (response.success && response.data) {
        // Transform backend data structure to frontend format
        return response.data.map((pilot: any) => ({
          id: pilot._id || pilot.id,
          personalInfo: {
            fullName: pilot.fullName || '',
            mobileNumber: pilot.mobileNumber || '',
            emailId: pilot.email || ''
          },
          licenseInfo: {
            licenseNumber: pilot.licenseNumber || '',
            licenseExpiry: pilot.licenseExpiry || ''
          },
          status: pilot.currentStatus || 'active',
          experience: pilot.experience || 0,
          rating: pilot.rating || 3,
          vehicleTypes: pilot.vehicleTypes || [],
          location: pilot.location || {},
          isActive: pilot.isActive !== false,
          notes: pilot.notes || '',
          createdAt: pilot.createdAt || new Date().toISOString(),
          updatedAt: pilot.updatedAt || new Date().toISOString()
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching pilots from backend:', error);
      // Fallback to local IndexedDB
      return this.getAll(masterDb.pilots);
    }
  }

  // Statistics
  async getDatabaseStats() {
    const [
      vehicles,
      chargingEquipment,
      electricalEquipment,
      itEquipment,
      infraFurniture,
      employees,
      pilots
    ] = await Promise.all([
      this.getVehicles(),
      this.getChargingEquipment(),
      this.getElectricalEquipment(),
      this.getITEquipment(),
      this.getInfraFurniture(),
      this.getEmployees(),
      this.getPilots()
    ]);

    return {
      vehicles: vehicles.length,
      chargingEquipment: chargingEquipment.length,
      electricalEquipment: electricalEquipment.length,
      itEquipment: itEquipment.length,
      infraFurniture: infraFurniture.length,
      employees: employees.length,
      pilots: pilots.length,
      totalAssets: vehicles.length + chargingEquipment.length + electricalEquipment.length + itEquipment.length + infraFurniture.length,
      totalResources: employees.length + pilots.length
    };
  }

  // Audit logging
  private async logAction(
    userId: string,
    action: string,
    module: string,
    recordId: string,
    changes: any
  ): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateId(),
      userId,
      action,
      module,
      recordId,
      changes,
      timestamp: new Date().toISOString(),
      ipAddress: 'localhost' // In production, get real IP
    };

    await masterDb.auditLogs.add(auditLog);
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Bulk operations
  async bulkCreate<T extends { id: string; createdAt: string; updatedAt: string; createdBy: string }>(
    table: Table<T>,
    dataArray: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[],
    userId: string
  ): Promise<T[]> {
    const records = dataArray.map(data => ({
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId
    } as T));

    await table.bulkAdd(records);
    
    // Log bulk creation
    await this.logAction(userId, 'bulk_create', table.name, 'multiple', { count: records.length });
    
    return records;
  }

  // Search across all asset categories
  async searchAssets(searchTerm: string): Promise<{
    vehicles: Vehicle[];
    chargingEquipment: ChargingEquipment[];
    electricalEquipment: ElectricalEquipment[];
    itEquipment: ITEquipment[];
    infraFurniture: InfraFurniture[];
  }> {
    const [vehicles, chargingEquipment, electricalEquipment, itEquipment, infraFurniture] = await Promise.all([
      this.search(masterDb.vehicles, searchTerm, ['vehicleId', 'vinNumber', 'registrationNumber', 'model', 'brand', 'engineNumber']),
      this.search(masterDb.chargingEquipment, searchTerm, ['equipmentNumber', 'model', 'brand', 'location']),
      this.search(masterDb.electricalEquipment, searchTerm, ['equipmentNumber', 'type', 'brand', 'location']),
      this.search(masterDb.itEquipment, searchTerm, ['equipmentNumber', 'type', 'brand', 'serialNumber']),
      this.search(masterDb.infraFurniture, searchTerm, ['itemNumber', 'type', 'brand', 'location'])
    ]);

    return {
      vehicles,
      chargingEquipment,
      electricalEquipment,
      itEquipment,
      infraFurniture
    };
  }
}

export const databaseService = new DatabaseService();
