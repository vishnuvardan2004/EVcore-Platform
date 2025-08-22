// Master Database Management System - Type Definitions
// Updated to match backend implementation

import { DatabaseDocument } from '../services/databaseService';

// Base interfaces
export interface LocationInfo {
  lat?: number;
  lng?: number;
  address?: string;
  facility?: string;
  building?: string;
  floor?: string;
  room?: string;
  area?: string;
  zone?: string;
}

export interface PurchaseInfo {
  purchaseDate?: string;
  purchasePrice?: number;
  vendor?: string;
  invoiceNumber?: string;
  poNumber?: string;
}

export interface WarrantyInfo {
  startDate?: string;
  endDate?: string;
  provider?: string;
  terms?: string;
  coverageType?: string;
}

export interface AssignmentInfo {
  userId?: string;
  employeeId?: string;
  employeeName?: string;
  department?: string;
}

// Vehicle Management Types - Updated to match exact schema requirements
export interface Vehicle extends DatabaseDocument {
  // Primary Vehicle Information
  Vehicle_ID: string;              // Internal vehicle ID (PK)
  VIN_Number: string;              // Chassis ID
  Engine_Number: string;           // Engine serial number
  Registration_Number: string;     // Number plate
  Registration_Date: string;       // RTO registration date
  Brand: string;                   // Manufacturer
  Model: string;                   // Vehicle model name
  Vehicle_Class: 'Hatchback' | 'Sedan' | 'Scooter' | 'SUV' | 'Truck' | 'Van'; // Vehicle class enum
  Vehicle_Type: 'E4W' | 'E2W' | 'Shuttle'; // Vehicle type enum
  Fuel_Type: 'Electric' | 'Hybrid' | 'NA'; // Fuel type enum
  
  // Battery & Technical Details
  Battery_Serial_Number: string;   // Unique battery ID
  No_of_Tyres: number;            // e.g., 4 or 2
  Tyre_Serial_Numbers: string;    // Optional for tracking (JSON format)
  Charger_Serial_Number: string;  // Portable charger info
  Charger_Type: 'Slow' | 'Fast';  // Charger type enum
  Battery_Capacity_kWh: number;   // Capacity in kWh
  Charging_Port_Type: string;     // e.g., CCS2
  
  // Insurance & Legal Documents
  Insurance_Provider: string;      // Name of insurer
  Insurance_Policy_No: string;    // Policy reference
  Insurance_Expiry_Date: string;  // Expiry date
  Permit_Number: string;          // Govt. permit
  Permit_Expiry_Date: string;     // Permit expiry date
  Police_Certificate_Status: 'Pending' | 'Verified'; // Status enum
  RC_File: string;                // Registration Certificate file
  PUC_Status: 'NA' | 'Valid' | 'Expired'; // PUC status enum
  
  // Condition & Maintenance
  Vehicle_Condition: 'New' | 'Good' | 'Retired'; // Condition enum
  Odometer_Reading: number;       // Current km reading
  Location_Assigned: string;      // Hub/depot location
  Assigned_Pilot_ID: string;      // Driver ID
  Maintenance_Due_Date: string;   // Next service due
  Last_Service_Date: string;      // Last maintenance
  Status: 'Active' | 'In Maintenance' | 'Idle'; // Status enum
}

// Legacy vehicle interface for backward compatibility
export interface LegacyVehicle {
  id: string;
  vehicleId: string; // Internal vehicle ID
  vinNumber: string; // Chassis ID
  engineNumber: string; // Engine serial number
  registrationNumber: string; // Number plate
  registrationDate: string; // RTO registration date
  brand: string; // Manufacturer
  model: string; // Vehicle model name
  vehicleClass: 'Hatchback' | 'Sedan' | 'Scooter' | 'SUV' | 'Truck' | 'Van'; // [Hatchback, Sedan, Scooter, etc.]
  vehicleType: 'E4W' | 'E2W' | 'Shuttle'; // [E4W, E2W, Shuttle]
  fuelType: 'Electric' | 'Hybrid' | 'NA'; // [Electric, Hybrid, NA]
  batterySerialNumber: string; // Unique battery ID
  noOfTyres: number; // e.g., 4 or 2
  tyreSerialNumbers: string; // Optional for tracking (JSON format)
  chargerSerialNumber: string; // Portable charger info
  chargerType: 'Slow' | 'Fast'; // [Slow, Fast]
  batteryCapacityKWh: number; // Capacity in kWh
  chargingPortType: string; // e.g., CCS2
  insuranceProvider: string; // Name of insurer
  insurancePolicyNo: string; // Policy reference
  insuranceExpiryDate: string; // Expiry date
  permitNumber: string; // Govt. permit
  permitExpiryDate: string; // Expiry date
  policeCertificateStatus: 'Pending' | 'Verified'; // [Pending, Verified]
  rcFile: string; // Registration Certificate file
  pucStatus: 'NA' | 'Valid' | 'Expired'; // [NA, Valid, Expired]
  vehicleCondition: 'New' | 'Good' | 'Retired'; // [New, Good, Retired]
  odometerReading: number; // Current km reading
  locationAssigned: string; // Hub/depot location
  assignedPilotId: string; // Driver ID
  maintenanceDueDate: string; // Next service due
  lastServiceDate: string; // Last maintenance
  status: 'Active' | 'In Maintenance' | 'Idle'; // [Active, In Maintenance, Idle]
  
  // Legacy fields for compatibility
  vin?: string;
  styleClass?: 'SUV' | 'Sedan' | 'Hatchback' | 'Coupe' | 'Truck' | 'Van';
  type?: 'Electric' | 'Hybrid' | 'Petrol' | 'Diesel';
  batteryNumber?: string;
  tyreNumbers?: string[];
  chargerNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  location?: string;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// New comprehensive module types to match backend implementation

export interface ChargingEquipment extends DatabaseDocument {
  chargingEquipmentId: string;
  name: string;
  type: 'ac_charger' | 'dc_fast_charger' | 'ultra_fast_charger' | 'wireless_charger' | 'portable_charger';
  brand: string;
  model: string;
  serialNumber?: string;
  powerRating: number;
  connectorTypes: ('Type1' | 'Type2' | 'CCS' | 'CHAdeMO' | 'Tesla')[];
  numberOfPorts: number;
  specifications: {
    inputVoltage?: number;
    outputVoltage?: number;
    maxCurrent?: number;
    efficiency?: number;
    powerFactor?: number;
  };
  status: 'available' | 'occupied' | 'offline' | 'maintenance' | 'error';
  location?: LocationInfo & { zone?: string };
  installationDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  operatingHours: {
    startTime?: string;
    endTime?: string;
  };
  pricing: {
    pricePerKwh?: number;
    flatRate?: number;
    timeBasedRate?: number;
  };
  currentSession?: {
    vehicleId?: string;
    startTime?: string;
    energyDelivered?: number;
    currentPower?: number;
  };
  networkConnected: boolean;
  paymentMethods: ('credit_card' | 'mobile_app' | 'rfid_card' | 'subscription')[];
}

// Legacy charging equipment interface for backward compatibility
export interface LegacyChargingEquipment {
  id: string;
  chargerId: string; // Unique charger ID
  serialNumber: string; // Manufacturer serial no.
  chargerName: string; // Label/model name
  chargerType: 'AC Slow' | 'DC Fast'; // [AC Slow, DC Fast]
  portType: string; // CCS2, Type 2, etc.
  noOfPorts: number; // Simultaneous ports
  powerRatingKW: number; // Charger capacity
  compatibleVehicleTypes: string; // E2W, E4W, Shuttle (Array format)
  locationType: 'Hub' | 'Office' | 'Public'; // [Hub, Office, Public]
  locationId: string; // Assigned location ID
  assignedToId?: string; // Vehicle or pilot (optional)
  chargerStatus: 'Active' | 'Repair' | 'Retired'; // [Active, Repair, Retired]
  ownershipType: 'EVZIP' | 'Leased'; // [EVZIP, Leased]
  manufacturerName: string; // OEM info
  dateOfInstallation: string; // Date
  warrantyValidTill: string; // Expiry date
  lastServiceDate: string; // Last maintenance
  nextMaintenanceDue: string; // Scheduled date
  
  // Legacy fields for compatibility
  equipmentNumber?: string;
  model?: string;
  brand?: string;
  powerOutput?: string; // kW
  connectorType?: 'Type 1' | 'Type 2' | 'CCS' | 'CHAdeMO' | 'Tesla';
  location?: string;
  status?: 'Active' | 'Maintenance' | 'Out of Service';
  installationDate?: string;
  warrantyExpiry?: string;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ElectricalEquipment {
  id: string;
  equipmentId: string; // Equipment_ID (PK) - e.g., EQ-HUB-001
  equipmentName: string; // Equipment_Name - e.g., Transformer
  category: 'Transformer' | 'Panel Board' | 'UPS' | 'Generator' | 'Switch Gear' | 'Cable' | 'Other'; // Category [Transformer, Panel Board, etc.]
  makeModel: string; // Make_Model - Manufacturer & model
  serialNumber: string; // Serial_Number - As per label
  powerCapacityKVA: number; // Power_Capacity_kVA/kW - Decimal
  phaseType: 'Single' | 'Three'; // Phase_Type [Single, Three]
  voltageRating: string; // Voltage_Rating - String
  currentRating: string; // Current_Rating - String
  frequency: number; // Frequency - Decimal, e.g., 50Hz
  locationId: string; // Location_ID (FK) - Assigned site
  locationType: 'Hub' | 'Depot' | 'Office' | 'Other'; // Location_Type [Hub, Depot, etc.]
  installationDate: string; // Installation_Date - Date
  ownershipStatus: 'Owned' | 'Leased' | 'Rented'; // Ownership_Status [Owned/Leased]
  installedBy: string; // Installed_By - Vendor info
  usagePurpose: string; // Usage_Purpose - Text description
  status: 'Active' | 'Retired' | 'Under Maintenance'; // Status [Active/Retired]
  warrantyValidTill: string; // Warranty_Valid_Till - Date
  amcContractStatus: 'Active' | 'Expired' | 'NA'; // AMC_Contract_Status [Active, NA]
  lastServiceDate: string; // Last_Service_Date - Date
  nextMaintenanceDue: string; // Next_Maintenance_Due - Date
  
  // Legacy fields for compatibility
  equipmentNumber?: string;
  type?: 'Panel' | 'Cable' | 'Switch' | 'Transformer' | 'Generator' | 'UPS';
  brand?: string;
  model?: string;
  voltage?: string;
  amperage?: string;
  location?: string;
  warrantyExpiry?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ITEquipment {
  id: string;
  assetId: string; // Asset_ID (PK) - e.g., IT-TAB-001
  assetType: 'Tablet' | 'Laptop' | 'Desktop' | 'Server' | 'Network' | 'Printer' | 'Phone' | 'Monitor' | 'Other'; // Asset_Type [Tablet, Laptop, etc.]
  makeModel: string; // Make_Model - Manufacturer info
  serialNumber: string; // Serial_Number - Device ID
  imeiNumber: string; // IMEI_Number - For phones/tablets
  assetStatus: 'In Use' | 'Repair' | 'Retired' | 'Available'; // Asset_Status [In Use, Repair, Retired]
  purchaseDate: string; // Purchase_Date - Date
  purchaseInvoiceNo: string; // Purchase_Invoice_No - Reference invoice
  vendorName: string; // Vendor_Name - Supplier name
  warrantyValidTill: string; // Warranty_Valid_Till - Expiry date
  assignedToId: string; // Assigned_To_ID (FK) - Employee or pilot
  assignedDate: string; // Assigned_Date - Date of handover
  returnDate: string; // Return_Date - Optional
  accessoriesProvided: string; // Accessories_Provided - e.g., Charger, Stylus
  conditionNotes: string; // Condition_Notes - Asset remarks
  assetLocation: string; // Asset_Location - Office/hub
  complianceTag: boolean; // Compliance_Tag - Yes/No

  // Legacy fields for compatibility
  equipmentNumber?: string;
  type?: 'Computer' | 'Laptop' | 'Tablet' | 'Server' | 'Network' | 'Printer' | 'Phone';
  brand?: string;
  model?: string;
  specifications?: string;
  assignedTo?: string;
  location?: string;
  status?: 'Active' | 'Maintenance' | 'Out of Service' | 'Assigned' | 'Available';
  warrantyExpiry?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface InfraFurniture {
  id: string;
  assetId: string; // Asset_ID (PK) - e.g., INF-CHAIR-001
  assetType: 'Chair' | 'Desk' | 'Partition' | 'Cabinet' | 'Table' | 'Sofa' | 'Shelf' | 'Rack' | 'Other'; // Asset_Type [Chair, Desk, Partition, etc.]
  makeModel: string; // Make/Model - If applicable
  materialType: string; // Material_Type - Wood, Steel, etc.
  color: string; // Color - Optional
  quantity: number; // Quantity - No. of units (Integer)
  purchaseDate: string; // Purchase_Date - Date
  vendorName: string; // Vendor_Name - Supplier name
  assetStatus: 'In Use' | 'Damaged' | 'Retired' | 'Available'; // Asset_Status [In Use, Damaged, Retired]
  ownershipType: 'Owned' | 'Rented' | 'Leased'; // Ownership_Type [Owned, Rented]
  locationId: string; // Location_ID (FK) - Office/Hub/Kiosk
  roomAreaDescription: string; // Room/Area_Description - e.g., Control Room
  condition: 'Good' | 'Worn' | 'Damaged' | 'Excellent'; // Condition [Good, Worn, Damaged]
  lastInspectionDate: string; // Last_Inspection_Date - Date
  nextMaintenanceDue: string; // Next_Maintenance_Due - If applicable
  amcContractStatus: 'Active' | 'NA' | 'Expired'; // AMC_Contract_Status [Active, NA]

  // Legacy fields for compatibility
  itemNumber?: string;
  type?: string;
  category?: 'Infrastructure' | 'Furniture';
  brand?: string;
  model?: string;
  description?: string;
  location?: string;
  room?: string;
  warrantyExpiry?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Resource Database Types

export interface Employee {
  id: string;
  employeeId: string; // Unique identifier
  fullName: string; // Full legal name
  firstName?: string; // For legacy compatibility
  lastName?: string; // For legacy compatibility
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // For age records
  contactNumber: string; // Mobile number
  emailId: string; // Official/personal email
  aadharNumber: string; // Masked/encrypted
  panNumber: string; // Tax compliance
  address: string; // Residential address
  city: string; // For location mapping
  emergencyContact: string; // Person and contact number
  maritalStatus: 'Single' | 'Married' | 'Divorced';
  dateOfJoining: string; // Joining date
  employmentType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
  designation: string; // Job title
  department: 'Operations' | 'Marketing' | 'Tech' | 'HR' | 'Finance' | 'Other';
  reportingManagerId?: string; // Supervisor/lead ID
  shiftType: 'Morning' | 'Evening' | 'Rotational';
  workLocation: string; // Office or hub location
  employeeStatus: 'Active' | 'On Leave' | 'Terminated';
  salaryMode: 'Bank' | 'UPI' | 'Cash';
  monthlySalary: number; // Gross amount
  bankAccountNumber?: string; // For salary credit
  ifscCode?: string; // For bank transfers
  uanNumber?: string; // For EPF
  esicNumber?: string; // For insurance
  pfEligible: boolean; // Yes/No
  photoUrl?: string; // Profile photo path
  dlCopyUrl?: string; // DL document path
  backgroundCheckStatus: 'Pending' | 'Cleared' | 'Rejected';
  
  // Legacy fields for compatibility
  email?: string;
  phone?: string;
  position?: string;
  role?: UserRole;
  supervisor?: string;
  hireDate?: string;
  status?: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Pilot {
  id: string;
  pilotId: string;
  employeeId: string; // Reference to Employee
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  medicalCertificate: string;
  medicalExpiry: string;
  flightHours: number;
  certifications: string[];
  vehicleTypes: string[]; // Types of vehicles certified to operate
  status: 'Active' | 'Inactive' | 'Suspended' | 'Training';
  lastTraining: string;
  nextTraining: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Role-Based Access Control Types

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'employee'
  | 'pilot';

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'manage';
}

export interface RolePermission {
  role: UserRole;
  permissions: Permission[];
  hierarchy: number; // Lower number = higher authority
}

export interface User {
  id: string;
  username: string;
  email: string;
  employeeId: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

// Database Category Types
export type AssetCategory = 'vehicles' | 'charging_equipment' | 'electrical_equipment' | 'it_equipment' | 'infra_furniture';
export type ResourceCategory = 'employees' | 'pilots';

// Common interfaces
export interface DatabaseStats {
  vehicles: number;
  chargingEquipment: number;
  electricalEquipment: number;
  itEquipment: number;
  infraFurniture: number;
  employees: number;
  pilots: number;
  totalAssets: number;
  totalResources: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  recordId: string;
  changes: Record<string, any>;
  timestamp: string;
  ipAddress: string;
}

// Union type for all database document types
export type DatabaseDocumentType = Vehicle | ChargingEquipment | ElectricalEquipment | ITEquipment | InfraFurniture | Employee | Pilot;
