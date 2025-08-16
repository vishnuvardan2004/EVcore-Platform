
export interface Vehicle {
  id: string;
  vehicleNumber: string;
  status: 'IN' | 'OUT';
  currentDeployment?: Deployment;
  deploymentHistory: Deployment[];
}

export interface Deployment {
  id: string;
  vehicleNumber: string;
  direction: 'OUT' | 'IN';
  purpose: 'Office' | 'Pilot';
  outTimestamp?: string;
  inTimestamp?: string;
  duration?: number; // in minutes
  totalKms?: number;
  
  // OUT data
  outData?: {
    driverName?: string;
    employeeName?: string;
    pilotId?: string;
    location?: string;
    odometer: number;
    batteryCharge: number;
    range: number;
    supervisorName: string;
    driverPhoto?: string;
    vehiclePhotos?: string[];
    driverChecklist?: DriverChecklist;
    vehicleChecklist?: VehicleChecklist;
    notes?: string;
  };
  
  // IN data
  inData?: {
    returnOdometer: number;
    vehiclePhotos?: string[];
    inSupervisorName: string;
    vehicleChecklist?: VehicleChecklist;
    checklistMismatches?: string[];
  };
}

export interface DriverChecklist {
  idCard: boolean;
  uniform: boolean;
  shoes: boolean;
  groomed: boolean;
}

export interface VehicleChecklist {
  fireExtinguisher: boolean;
  stepney: boolean;
  carFreshener: boolean;
  cleaningCloth: boolean;
  umbrella: boolean;
  torch: boolean;
  toolkit: boolean;
  spanner: boolean;
  medicalKit: boolean;
  carCharger: boolean;
  jack: boolean;
  lightsWorking: boolean;
  tyrePressure: boolean;
  wheelCaps: boolean;
  wiperWater: boolean;
  cleanliness: boolean;
  antenna: boolean;
  acWorking: boolean;
  mobileCable: boolean;
  mobileAdapter: boolean;
  phoneStand: boolean;
  hornWorking: boolean;
  damages: string;
}

export interface TripSummary {
  vehicleNumber: string;
  outDateTime: string;
  inDateTime: string;
  totalDuration: string;
  totalKms: number;
  mismatches: string[];
  outSupervisor: string;
  inSupervisor: string;
  purpose: string;
}
