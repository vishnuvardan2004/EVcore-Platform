
import Dexie, { Table } from 'dexie';
import { Vehicle, Deployment } from '../types/vehicle';
import { Pilot, TemporaryPilot } from '../types/pilot';

// Alert Status interface for persistence
export interface AlertStatus {
  alertId: string;
  status: 'resolved' | 'acknowledged' | 'unresolved';
  resolvedAt?: string;
  resolvedBy?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  notes?: string;
}

export class VehicleDatabase extends Dexie {
  vehicles!: Table<Vehicle>;
  deployments!: Table<Deployment>;
  pilots!: Table<Pilot>;
  temporaryPilots!: Table<TemporaryPilot>;
  alertStatuses!: Table<AlertStatus>;

  constructor() {
    super('VehicleDatabase');
    this.version(4).stores({
      vehicles: 'id, vehicleNumber, status',
      deployments: 'id, vehicleNumber, direction, outTimestamp, inTimestamp',
      pilots: 'id, personalInfo.fullName, personalInfo.mobileNumber, status, inductionDate',
      temporaryPilots: 'tempId, fullName, mobileNumber, status, expiryDate',
      alertStatuses: 'alertId, status'
    });
  }
}

export const db = new VehicleDatabase();

export const vehicleService = {
  async getVehicle(vehicleNumber: string): Promise<Vehicle | undefined> {
    return await db.vehicles.where('vehicleNumber').equals(vehicleNumber).first();
  },

  async createOrUpdateVehicle(vehicle: Vehicle): Promise<void> {
    await db.vehicles.put(vehicle);
  },

  async createDeployment(deployment: Deployment): Promise<void> {
    await db.deployments.add(deployment);
    
    // Update vehicle status and current deployment
    const vehicle = await this.getVehicle(deployment.vehicleNumber);
    if (vehicle) {
      vehicle.status = deployment.direction;
      if (deployment.direction === 'OUT') {
        vehicle.currentDeployment = deployment;
      } else {
        vehicle.currentDeployment = undefined;
      }
      vehicle.deploymentHistory.push(deployment);
      await this.createOrUpdateVehicle(vehicle);
    } else {
      // Create new vehicle if it doesn't exist
      const newVehicle: Vehicle = {
        id: deployment.vehicleNumber,
        vehicleNumber: deployment.vehicleNumber,
        status: deployment.direction,
        currentDeployment: deployment.direction === 'OUT' ? deployment : undefined,
        deploymentHistory: [deployment]
      };
      await this.createOrUpdateVehicle(newVehicle);
    }
  },

  async updateDeployment(deploymentId: string, updates: Partial<Deployment>): Promise<void> {
    await db.deployments.update(deploymentId, updates);
    
    if (updates.inData) {
      // Update vehicle status when IN is completed
      const deployment = await db.deployments.get(deploymentId);
      if (deployment) {
        const vehicle = await this.getVehicle(deployment.vehicleNumber);
        if (vehicle) {
          vehicle.status = 'IN';
          vehicle.currentDeployment = undefined;
          await this.createOrUpdateVehicle(vehicle);
        }
      }
    }
  },

  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.vehicles.toArray();
  },

  async getDeploymentHistory(vehicleNumber?: string): Promise<Deployment[]> {
    if (vehicleNumber) {
      return await db.deployments.where('vehicleNumber').equals(vehicleNumber).toArray();
    }
    return await db.deployments.toArray();
  }
};

// Pilot ID Generation Utility
export const generatePilotId = async (): Promise<string> => {
  const pilots = await db.pilots.toArray();
  const highestId = pilots.reduce((max, pilot) => {
    const idNumber = parseInt(pilot.id.split('-')[1] || '0');
    return Math.max(max, idNumber);
  }, 0);
  return `EVZIP-${highestId + 1}`;
};

// Pilot Service
export const pilotService = {
  async createPilot(pilotData: Omit<Pilot, 'id' | 'inductionDate' | 'status'>): Promise<string> {
    const pilotId = await generatePilotId();
    const newPilot: Pilot = {
      ...pilotData,
      id: pilotId,
      inductionDate: new Date(),
      status: 'active'
    };
    
    await db.pilots.add(newPilot);
    return pilotId;
  },

  // Add a method to create/update a pilot with a specific ID (for syncing)
  async syncPilot(pilotData: Pilot): Promise<void> {
    await db.pilots.put(pilotData);
  },

  async getPilot(id: string): Promise<Pilot | undefined> {
    return await db.pilots.where('id').equals(id).first();
  },

  async getAllPilots(): Promise<Pilot[]> {
    return await db.pilots.toArray();
  },

  async updatePilot(id: string, updates: Partial<Pilot>): Promise<void> {
    await db.pilots.update(id, updates);
  },

  async deletePilot(id: string): Promise<void> {
    await db.pilots.delete(id);
  },

  async getPilotCount(): Promise<number> {
    return await db.pilots.count();
  },

  async getActivePilots(): Promise<Pilot[]> {
    return await db.pilots.where('status').equals('active').toArray();
  },

  async searchPilots(searchTerm: string): Promise<Pilot[]> {
    return await db.pilots.filter(pilot => 
      pilot.personalInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pilot.personalInfo.mobileNumber.includes(searchTerm) ||
      pilot.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).toArray();
  }
};

// Alert Status Service
export const alertService = {
  async updateAlertStatus(alertId: string, status: 'resolved' | 'acknowledged' | 'unresolved', user?: string): Promise<void> {
    const existingStatus = await db.alertStatuses.where('alertId').equals(alertId).first();
    
    const alertStatus: AlertStatus = {
      alertId,
      status,
      ...(status === 'resolved' && { resolvedAt: new Date().toISOString(), resolvedBy: user }),
      ...(status === 'acknowledged' && { acknowledgedAt: new Date().toISOString(), acknowledgedBy: user }),
      ...existingStatus // Preserve existing data
    };

    await db.alertStatuses.put(alertStatus);
  },

  async getAlertStatus(alertId: string): Promise<AlertStatus | undefined> {
    return await db.alertStatuses.where('alertId').equals(alertId).first();
  },

  async getAllAlertStatuses(): Promise<AlertStatus[]> {
    return await db.alertStatuses.toArray();
  },

  async deleteAlertStatus(alertId: string): Promise<void> {
    await db.alertStatuses.where('alertId').equals(alertId).delete();
  },

  async clearResolvedAlerts(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    await db.alertStatuses
      .where('status').equals('resolved')
      .and(alert => {
        const resolvedDate = alert.resolvedAt ? new Date(alert.resolvedAt) : new Date(0);
        return resolvedDate < cutoffDate;
      })
      .delete();
  }
};

// Temporary Pilot ID Generation Utility
export const generateTempPilotId = async (): Promise<string> => {
  const tempPilots = await db.temporaryPilots.toArray();
  const highestId = tempPilots.reduce((max, pilot) => {
    const idNumber = parseInt(pilot.tempId.split('-')[1] || '0');
    return Math.max(max, idNumber);
  }, 0);
  return `TEMP-${String(highestId + 1).padStart(3, '0')}`;
};

// Temporary Pilot Service
export const tempPilotService = {
  async createTemporaryPilot(tempPilotData: Omit<TemporaryPilot, 'tempId' | 'registrationDate' | 'status'>): Promise<string> {
    const tempId = await generateTempPilotId();
    const newTempPilot: TemporaryPilot = {
      ...tempPilotData,
      tempId,
      registrationDate: new Date(),
      status: 'temporary'
    };
    
    await db.temporaryPilots.add(newTempPilot);
    return tempId;
  },

  // Create temporary pilot with specific ID (for backend sync)
  async createTemporaryPilotWithId(tempPilotData: Omit<TemporaryPilot, 'tempId' | 'registrationDate' | 'status'>, tempId: string): Promise<void> {
    const newTempPilot: TemporaryPilot = {
      ...tempPilotData,
      tempId,
      registrationDate: new Date(),
      status: 'temporary'
    };
    
    await db.temporaryPilots.add(newTempPilot);
  },

  async getAllTemporaryPilots(): Promise<TemporaryPilot[]> {
    return await db.temporaryPilots.toArray();
  },

  async getTemporaryPilot(tempId: string): Promise<TemporaryPilot | undefined> {
    return await db.temporaryPilots.where('tempId').equals(tempId).first();
  },

  async updateTemporaryPilot(tempId: string, updates: Partial<TemporaryPilot>): Promise<void> {
    await db.temporaryPilots.update(tempId, updates);
  },

  async deleteTemporaryPilot(tempId: string): Promise<void> {
    await db.temporaryPilots.delete(tempId);
  },

  async getActiveTemporaryPilots(): Promise<TemporaryPilot[]> {
    const now = new Date();
    return await db.temporaryPilots
      .where('status').equals('temporary')
      .and(pilot => pilot.expiryDate > now)
      .toArray();
  },

  async getExpiredTemporaryPilots(): Promise<TemporaryPilot[]> {
    const now = new Date();
    return await db.temporaryPilots
      .where('status').equals('temporary')
      .and(pilot => pilot.expiryDate <= now)
      .toArray();
  },

  async convertToFullPilot(tempId: string): Promise<void> {
    await db.temporaryPilots.update(tempId, { status: 'converted' });
  }
};
