// Master Database Service - IndexedDB Implementation (Read-Only)

import Dexie, { Table } from 'dexie';
import {
  Vehicle,
  ChargingEquipment,
  ElectricalEquipment,
  ITEquipment,
  InfraFurniture,
  Employee,
  Pilot,
  DatabaseStats
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

  constructor() {
    super('MasterDatabase');
    
    this.version(1).stores({
      // Asset tables
      vehicles: 'id, vin, registrationNumber, model, brand, type, status, location',
      chargingEquipment: 'id, equipmentNumber, model, brand, location, status',
      electricalEquipment: 'id, equipmentNumber, type, brand, location, status',
      itEquipment: 'id, equipmentNumber, type, brand, assignedTo, location, status',
      infraFurniture: 'id, itemNumber, type, category, location, room',
      
      // Resource tables
      employees: 'id, employeeId, email, role, department, status',
      pilots: 'id, pilotId, employeeId, licenseNumber, status'
    });

    // Populate with sample data on first load (only in development or when explicitly enabled)
    this.on('ready', () => this.initializeSampleData());
  }

  private async initializeSampleData() {
    // Only initialize if database is empty AND we're in development mode
    const vehicleCount = await this.vehicles.count();
    const shouldPopulateSampleData = import.meta.env.DEV || localStorage.getItem('enableSampleData') === 'true';
    
    if (vehicleCount === 0 && shouldPopulateSampleData) {
      console.log('Populating database with sample data for development...');
      await this.populateSampleData();
    }
  }

  // Method to manually populate sample data for demos
  public async populateSampleDataManually() {
    await this.populateSampleData();
  }

  private async populateSampleData() {
    // Simple sample data to provide basic counts
    try {
      // Sample Vehicles - updated to match Vehicle interface
      await this.vehicles.bulkAdd([
        {
          id: '1',
          vehicleId: 'VEH001',
          vinNumber: 'EV001234567890123',
          engineNumber: 'ENG001',
          registrationNumber: 'KA01AB1234',
          registrationDate: '2023-01-15',
          brand: 'Tata',
          model: 'Nexon EV',
          vehicleClass: 'SUV',
          vehicleType: 'E4W',
          fuelType: 'Electric',
          batterySerialNumber: 'BAT001',
          noOfTyres: 4,
          tyreSerialNumbers: '["TYR001", "TYR002", "TYR003", "TYR004"]',
          chargerSerialNumber: 'CHG001',
          chargerType: 'Fast',
          batteryCapacityKWh: 30.2,
          chargingPortType: 'CCS2',
          insuranceProvider: 'ICICI Lombard',
          insurancePolicyNo: 'POL001234',
          insuranceExpiryDate: '2025-01-15',
          permitNumber: 'PRM001',
          permitExpiryDate: '2025-12-31',
          policeCertificateStatus: 'Verified',
          rcFile: 'RC001.pdf',
          pucStatus: 'Valid',
          vehicleCondition: 'Good',
          odometerReading: 5000,
          locationAssigned: 'Bangalore Hub',
          assignedPilotId: 'PIL001',
          maintenanceDueDate: '2024-06-15',
          lastServiceDate: '2024-01-15',
          status: 'Active',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
          createdBy: 'system'
        }
      ]);

      // Sample Charging Equipment - updated to match ChargingEquipment interface
      await this.chargingEquipment.bulkAdd([
        {
          id: '1',
          chargerId: 'CHG001',
          serialNumber: 'SN123456789',
          chargerName: 'Fast Charger Hub 1',
          chargerType: 'DC Fast',
          portType: 'CCS2',
          noOfPorts: 2,
          powerRatingKW: 50.0,
          compatibleVehicleTypes: 'E4W, E2W, Shuttle',
          locationType: 'Hub',
          locationId: 'BLR-HUB-001',
          assignedToId: '',
          chargerStatus: 'Active',
          ownershipType: 'EVZIP',
          manufacturerName: 'ABB',
          dateOfInstallation: '2023-01-15',
          warrantyValidTill: '2026-01-15',
          lastServiceDate: '2024-01-15',
          nextMaintenanceDue: '2024-07-15',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
          createdBy: 'system'
        },
        {
          id: '2',
          chargerId: 'CHG002',
          serialNumber: 'SN987654321',
          chargerName: 'AC Slow Charger Office',
          chargerType: 'AC Slow',
          portType: 'Type 2',
          noOfPorts: 4,
          powerRatingKW: 7.4,
          compatibleVehicleTypes: 'E4W, E2W',
          locationType: 'Office',
          locationId: 'BLR-OFF-001',
          assignedToId: '',
          chargerStatus: 'Active',
          ownershipType: 'EVZIP',
          manufacturerName: 'Schneider Electric',
          dateOfInstallation: '2023-03-20',
          warrantyValidTill: '2026-03-20',
          lastServiceDate: '2024-03-20',
          nextMaintenanceDue: '2024-09-20',
          createdAt: '2024-03-20T09:00:00Z',
          updatedAt: '2024-03-20T09:00:00Z',
          createdBy: 'system'
        },
        {
          id: '3',
          chargerId: 'CHG003',
          serialNumber: 'SN456789123',
          chargerName: 'Public Fast Charger',
          chargerType: 'DC Fast',
          portType: 'CCS2, CHAdeMO',
          noOfPorts: 1,
          powerRatingKW: 150.0,
          compatibleVehicleTypes: 'E4W, Shuttle',
          locationType: 'Public',
          locationId: 'BLR-PUB-001',
          assignedToId: '',
          chargerStatus: 'Active',
          ownershipType: 'Leased',
          manufacturerName: 'Tesla',
          dateOfInstallation: '2023-06-10',
          warrantyValidTill: '2026-06-10',
          lastServiceDate: '2024-06-10',
          nextMaintenanceDue: '2024-12-10',
          createdAt: '2024-06-10T09:00:00Z',
          updatedAt: '2024-06-10T09:00:00Z',
          createdBy: 'system'
        }
      ]);

      // Sample Employees - minimal data
      await this.employees.bulkAdd([
        {
          id: '1',
          employeeId: 'EMP001',
          fullName: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          gender: 'Male',
          dateOfBirth: '1990-01-15',
          contactNumber: '+91-9876543210',
          emailId: 'john.doe@company.com',
          aadharNumber: '****-****-1234',
          panNumber: 'ABCDE1234F',
          address: '123 Main Street, Koramangala, Bangalore',
          city: 'Bangalore',
          emergencyContact: 'Jane Doe - +91-9876543211',
          maritalStatus: 'Married',
          dateOfJoining: '2023-01-15',
          employmentType: 'Full-Time',
          designation: 'Operations Manager',
          department: 'Operations',
          shiftType: 'Morning',
          workLocation: 'Bangalore Hub',
          employeeStatus: 'Active',
          salaryMode: 'Bank',
          monthlySalary: 50000,
          pfEligible: true,
          backgroundCheckStatus: 'Cleared',
          email: 'john.doe@company.com',
          phone: '+91-9876543210',
          position: 'Operations Manager',
          role: 'admin',
          hireDate: '2023-01-15',
          status: 'Active',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
          createdBy: 'system'
        }
      ]);

      // Sample Electrical Equipment - updated to match ElectricalEquipment interface
      await this.electricalEquipment.bulkAdd([
        {
          id: '1',
          equipmentId: 'EQ-HUB-001',
          equipmentName: 'Main Distribution Transformer',
          category: 'Transformer',
          makeModel: 'ABB Model TX-500',
          serialNumber: 'TX500-001-2023',
          powerCapacityKVA: 500.0,
          phaseType: 'Three',
          voltageRating: '11kV/415V',
          currentRating: '750A',
          frequency: 50.0,
          locationId: 'BLR-HUB-001',
          locationType: 'Hub',
          installationDate: '2023-01-15',
          ownershipStatus: 'Owned',
          installedBy: 'ABB Technical Services',
          usagePurpose: 'Primary power distribution for hub operations',
          status: 'Active',
          warrantyValidTill: '2026-01-15',
          amcContractStatus: 'Active',
          lastServiceDate: '2024-01-15',
          nextMaintenanceDue: '2024-07-15',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
          createdBy: 'system'
        },
        {
          id: '2',
          equipmentId: 'EQ-OFF-001',
          equipmentName: 'Office UPS System',
          category: 'UPS',
          makeModel: 'APC Smart UPS 10kVA',
          serialNumber: 'UPS10K-002-2023',
          powerCapacityKVA: 10.0,
          phaseType: 'Single',
          voltageRating: '230V',
          currentRating: '45A',
          frequency: 50.0,
          locationId: 'BLR-OFF-001',
          locationType: 'Office',
          installationDate: '2023-03-20',
          ownershipStatus: 'Owned',
          installedBy: 'APC Authorized Partner',
          usagePurpose: 'Backup power for office critical systems',
          status: 'Active',
          warrantyValidTill: '2026-03-20',
          amcContractStatus: 'Active',
          lastServiceDate: '2024-03-20',
          nextMaintenanceDue: '2024-09-20',
          createdAt: '2024-03-20T09:00:00Z',
          updatedAt: '2024-03-20T09:00:00Z',
          createdBy: 'system'
        },
        {
          id: '3',
          equipmentId: 'EQ-HUB-002',
          equipmentName: 'Emergency Generator',
          category: 'Generator',
          makeModel: 'Cummins 250kVA',
          serialNumber: 'GEN250-003-2023',
          powerCapacityKVA: 250.0,
          phaseType: 'Three',
          voltageRating: '415V',
          currentRating: '400A',
          frequency: 50.0,
          locationId: 'BLR-HUB-001',
          locationType: 'Hub',
          installationDate: '2023-06-10',
          ownershipStatus: 'Leased',
          installedBy: 'Cummins India Ltd',
          usagePurpose: 'Emergency backup power during grid outages',
          status: 'Active',
          warrantyValidTill: '2026-06-10',
          amcContractStatus: 'Active',
          lastServiceDate: '2024-06-10',
          nextMaintenanceDue: '2024-12-10',
          createdAt: '2024-06-10T09:00:00Z',
          updatedAt: '2024-06-10T09:00:00Z',
          createdBy: 'system'
        }
      ]);

      // Sample IT Equipment - updated to match ITEquipment interface
      await this.itEquipment.bulkAdd([
        {
          id: '1',
          assetId: 'IT-TAB-001',
          assetType: 'Tablet',
          makeModel: 'Apple iPad Pro 12.9"',
          serialNumber: 'IPAD001234567',
          imeiNumber: '123456789012345',
          assetStatus: 'In Use',
          purchaseDate: '2023-01-15',
          purchaseInvoiceNo: 'INV-2023-001',
          vendorName: 'Apple Authorized Reseller',
          warrantyValidTill: '2025-01-15',
          assignedToId: 'EMP001',
          assignedDate: '2023-01-20',
          returnDate: '',
          accessoriesProvided: 'Charger, Apple Pencil, Protective Case',
          conditionNotes: 'Excellent condition, no visible scratches',
          assetLocation: 'Bangalore Hub',
          complianceTag: true,
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
          createdBy: 'system'
        },
        {
          id: '2',
          assetId: 'IT-LAP-001',
          assetType: 'Laptop',
          makeModel: 'Dell Latitude 5520',
          serialNumber: 'DELL987654321',
          imeiNumber: '',
          assetStatus: 'In Use',
          purchaseDate: '2023-03-20',
          purchaseInvoiceNo: 'INV-2023-045',
          vendorName: 'Dell Technologies',
          warrantyValidTill: '2026-03-20',
          assignedToId: 'PIL001',
          assignedDate: '2023-03-25',
          returnDate: '',
          accessoriesProvided: 'Charger, Wireless Mouse, Laptop Bag',
          conditionNotes: 'Good working condition, minor wear on keyboard',
          assetLocation: 'Bangalore Office',
          complianceTag: true,
          createdAt: '2024-03-20T09:00:00Z',
          updatedAt: '2024-03-20T09:00:00Z',
          createdBy: 'system'
        },
        {
          id: '3',
          assetId: 'IT-PHN-001',
          assetType: 'Phone',
          makeModel: 'Samsung Galaxy S23',
          serialNumber: 'SAM456789123',
          imeiNumber: '987654321098765',
          assetStatus: 'Available',
          purchaseDate: '2023-06-10',
          purchaseInvoiceNo: 'INV-2023-089',
          vendorName: 'Samsung Electronics',
          warrantyValidTill: '2025-06-10',
          assignedToId: '',
          assignedDate: '',
          returnDate: '2024-05-15',
          accessoriesProvided: 'Charger, Screen Protector, Phone Case',
          conditionNotes: 'Like new condition, recently returned',
          assetLocation: 'IT Store Room',
          complianceTag: true,
          createdAt: '2024-06-10T09:00:00Z',
          updatedAt: '2024-06-10T09:00:00Z',
          createdBy: 'system'
        }
      ]);

      // Sample Pilots - minimal data
      await this.pilots.bulkAdd([
        {
          id: '1',
          pilotId: 'PIL001',
          employeeId: 'EMP001',
          licenseNumber: 'DL1234567890',
          licenseType: 'Commercial',
          licenseExpiry: '2025-12-31',
          medicalCertificate: 'MED001',
          medicalExpiry: '2025-06-30',
          flightHours: 1000,
          certifications: ['Commercial Vehicle License'],
          vehicleTypes: ['Electric Vehicle'],
          status: 'Active',
          lastTraining: '2024-01-01',
          nextTraining: '2024-07-01',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
          createdBy: 'system'
        }
      ]);

      // Sample Infrastructure & Furniture - updated to match InfraFurniture interface
      await this.infraFurniture.bulkAdd([
        {
          id: '1',
          assetId: 'INF-CHAIR-001',
          assetType: 'Chair',
          makeModel: 'Herman Miller Aeron',
          materialType: 'Mesh and Aluminum',
          color: 'Black',
          quantity: 25,
          purchaseDate: '2023-01-15',
          vendorName: 'Herman Miller India',
          assetStatus: 'In Use',
          ownershipType: 'Owned',
          locationId: 'BLR-OFF-001',
          roomAreaDescription: 'Open Office Area',
          condition: 'Good',
          lastInspectionDate: '2024-01-15',
          nextMaintenanceDue: '2024-07-15',
          amcContractStatus: 'Active',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
          createdBy: 'system'
        },
        {
          id: '2',
          assetId: 'INF-DESK-001',
          assetType: 'Desk',
          makeModel: 'IKEA BEKANT',
          materialType: 'Laminated Wood',
          color: 'White',
          quantity: 15,
          purchaseDate: '2023-03-20',
          vendorName: 'IKEA Business Solutions',
          assetStatus: 'In Use',
          ownershipType: 'Owned',
          locationId: 'BLR-OFF-001',
          roomAreaDescription: 'Open Office Area',
          condition: 'Good',
          lastInspectionDate: '2024-03-20',
          nextMaintenanceDue: '2024-09-20',
          amcContractStatus: 'NA',
          createdAt: '2024-03-20T09:00:00Z',
          updatedAt: '2024-03-20T09:00:00Z',
          createdBy: 'system'
        },
        {
          id: '3',
          assetId: 'INF-CAB-001',
          assetType: 'Cabinet',
          makeModel: 'Godrej Steel Cabinet',
          materialType: 'Steel',
          color: 'Grey',
          quantity: 8,
          purchaseDate: '2023-06-10',
          vendorName: 'Godrej Interio',
          assetStatus: 'In Use',
          ownershipType: 'Owned',
          locationId: 'BLR-HUB-001',
          roomAreaDescription: 'Control Room',
          condition: 'Excellent',
          lastInspectionDate: '2024-06-10',
          nextMaintenanceDue: '2024-12-10',
          amcContractStatus: 'NA',
          createdAt: '2024-06-10T09:00:00Z',
          updatedAt: '2024-06-10T09:00:00Z',
          createdBy: 'system'
        }
      ]);
    } catch (error) {
      console.error('Error populating sample data:', error);
    }
  }
}

// Database Service Class
export class DatabaseService {
  // Read operations
  async getAll<T>(table: Table<T>): Promise<T[]> {
    return await table.toArray();
  }

  async getById<T>(table: Table<T>, id: string): Promise<T | undefined> {
    return await table.get(id);
  }

  // Write operations
  async createVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<Vehicle> {
    const now = new Date().toISOString();
    const vehicle: Vehicle = {
      ...vehicleData,
      id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      createdBy
    };
    
    await masterDb.vehicles.add(vehicle);
    return vehicle;
  }

  async createChargingEquipment(equipmentData: Omit<ChargingEquipment, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<ChargingEquipment> {
    const now = new Date().toISOString();
    const equipment: ChargingEquipment = {
      ...equipmentData,
      id: `charger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      createdBy
    };
    
    await masterDb.chargingEquipment.add(equipment);
    return equipment;
  }

  async createElectricalEquipment(equipmentData: Omit<ElectricalEquipment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, createdBy: string): Promise<ElectricalEquipment> {
    const now = new Date().toISOString();
    const equipment: ElectricalEquipment = {
      ...equipmentData,
      id: `electrical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      createdBy
    };
    
    await masterDb.electricalEquipment.add(equipment);
    return equipment;
  }

  async createITEquipment(equipmentData: Omit<ITEquipment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, createdBy: string): Promise<ITEquipment> {
    const now = new Date().toISOString();
    const equipment: ITEquipment = {
      ...equipmentData,
      id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      createdBy
    };
    
    await masterDb.itEquipment.add(equipment);
    return equipment;
  }

  async createInfraFurniture(furnitureData: Omit<InfraFurniture, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, createdBy: string): Promise<InfraFurniture> {
    const now = new Date().toISOString();
    const furniture: InfraFurniture = {
      ...furnitureData,
      id: `furniture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      createdBy
    };
    
    await masterDb.infraFurniture.add(furniture);
    return furniture;
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    const [
      vehicles,
      chargingEquipment,
      electricalEquipment,
      itEquipment,
      infraFurniture,
      employees,
      pilots
    ] = await Promise.all([
      masterDb.vehicles.count(),
      masterDb.chargingEquipment.count(),
      masterDb.electricalEquipment.count(),
      masterDb.itEquipment.count(),
      masterDb.infraFurniture.count(),
      masterDb.employees.count(),
      masterDb.pilots.count()
    ]);

    return {
      vehicles,
      chargingEquipment,
      electricalEquipment,
      itEquipment,
      infraFurniture,
      employees,
      pilots,
      totalAssets: vehicles + chargingEquipment + electricalEquipment + itEquipment + infraFurniture,
      totalResources: employees + pilots
    };
  }

  // Asset getters
  async getVehicles(): Promise<Vehicle[]> {
    return this.getAll(masterDb.vehicles);
  }

  async getChargingEquipment(): Promise<ChargingEquipment[]> {
    return this.getAll(masterDb.chargingEquipment);
  }

  async getElectricalEquipment(): Promise<ElectricalEquipment[]> {
    return this.getAll(masterDb.electricalEquipment);
  }

  async getITEquipment(): Promise<ITEquipment[]> {
    return this.getAll(masterDb.itEquipment);
  }

  async getInfraFurniture(): Promise<InfraFurniture[]> {
    return this.getAll(masterDb.infraFurniture);
  }

  // Resource getters
  async getEmployees(): Promise<Employee[]> {
    return this.getAll(masterDb.employees);
  }

  async getPilots(): Promise<Pilot[]> {
    return this.getAll(masterDb.pilots);
  }

  // Employee CRUD operations
  async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<Employee> {
    const now = new Date().toISOString();
    const employee: Employee = {
      ...employeeData,
      id: `employee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      createdBy
    };
    
    await masterDb.employees.add(employee);
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<Employee>, userId: string): Promise<void> {
    const now = new Date().toISOString();
    await masterDb.employees.update(id, {
      ...updates,
      updatedAt: now
    });
  }

  async deleteEmployee(id: string, userId: string): Promise<void> {
    await masterDb.employees.delete(id);
  }
}

// Database instances
export const masterDb = new MasterDatabase();
export const databaseService = new DatabaseService();

// Initialize database
masterDb.open().catch(err => {
  console.error('Failed to open database:', err);
});

export default databaseService;
