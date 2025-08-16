
import Dexie, { Table } from 'dexie';
import { Vehicle, Deployment } from '../types/vehicle';
import { Pilot } from '../types/pilot';

export class VehicleDatabase extends Dexie {
  vehicles!: Table<Vehicle>;
  deployments!: Table<Deployment>;
  pilots!: Table<Pilot>;

  constructor() {
    super('VehicleDatabase');
    this.version(2).stores({
      vehicles: 'id, vehicleNumber, status',
      deployments: 'id, vehicleNumber, direction, outTimestamp, inTimestamp',
      pilots: 'id, personalInfo.fullName, personalInfo.mobileNumber, status, inductionDate'
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
