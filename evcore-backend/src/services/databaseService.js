const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const logger = require('../utils/logger');

// Global instance for shared access
let globalInstance = null;

/**
 * Database Management Service
 * Handles all database operations for dynamic sub-platforms (collections)
 */
class DatabaseService {
  constructor() {
    this.registeredSchemas = new Map();
    this.registeredModels = new Map();
    this.isInitialized = false;
  }

  /**
   * Get or create the global singleton instance
   */
  static getInstance() {
    if (!globalInstance) {
      globalInstance = new DatabaseService();
    }
    return globalInstance;
  }

  /**
   * Initialize schemas after database connection is established
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    this.initializeDefaultSchemas();
    this.isInitialized = true;
    logger.info('DatabaseService initialized successfully');
  }

  /**
   * Initialize default schemas for existing collections
   */
  initializeDefaultSchemas() {
    // Employee Schema - Updated to match frontend Employee interface
    const employeeSchema = {
      name: 'Employee',
      fields: {
        // Primary identification
        fullName: { type: 'String', required: true, maxLength: 100 },
        email: { type: 'String', required: true },
        employeeId: { type: 'String', required: true },
        
        // Personal information
        firstName: { type: 'String' },
        lastName: { type: 'String' },
        gender: { type: 'String', enum: ['Male', 'Female', 'Other'] },
        dateOfBirth: { type: 'String' },
        contactNumber: { type: 'String' },
        emailId: { type: 'String' }, // Frontend uses emailId, backend uses email
        aadharNumber: { type: 'String' },
        panNumber: { type: 'String' },
        address: { type: 'String' },
        city: { type: 'String' },
        emergencyContact: { type: 'String' },
        maritalStatus: { type: 'String', enum: ['Single', 'Married', 'Divorced'] },
        
        // Employment information
        department: { type: 'String', required: true },
        position: { type: 'String', required: true }, // Backend uses position, frontend uses designation
        designation: { type: 'String' }, // For compatibility
        employmentType: { type: 'String', enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'] },
        reportingManagerId: { type: 'String' },
        shiftType: { type: 'String', enum: ['Morning', 'Evening', 'Rotational'] },
        workLocation: { type: 'String' },
        employeeStatus: { type: 'String', enum: ['Active', 'On Leave', 'Terminated'] },
        
        // Financial information
        salary: { type: 'Number', min: 0 },
        salaryMode: { type: 'String', enum: ['Bank', 'UPI', 'Cash'] },
        monthlySalary: { type: 'Number', min: 0 },
        bankAccountNumber: { type: 'String' },
        ifscCode: { type: 'String' },
        uanNumber: { type: 'String' },
        esicNumber: { type: 'String' },
        pfEligible: { type: 'Boolean', default: false },
        
        // Documents and verification
        photoUrl: { type: 'String' },
        dlCopyUrl: { type: 'String' },
        backgroundCheckStatus: { type: 'String', enum: ['Pending', 'Cleared', 'Rejected'], default: 'Pending' },
        
        // System fields
        hireDate: { type: 'Date', default: 'Date.now' },
        dateOfJoining: { type: 'String' }, // Frontend uses dateOfJoining
        isActive: { type: 'Boolean', default: true },
        permissions: [{ type: 'String' }],
        lastLogin: { type: 'Date' },
        role: { type: 'String', default: 'employee' },
        createdBy: { type: 'ObjectId', ref: 'User' },
        updatedBy: { type: 'ObjectId', ref: 'User' }
      },
      indexes: [
        { fields: { email: 1 }, options: { unique: true } },
        { fields: { employeeId: 1 }, options: { unique: true } },
        { fields: { department: 1, isActive: 1 } }
      ],
      validation: {
        required: ['fullName', 'email', 'employeeId', 'department', 'position'],
        unique: ['email', 'employeeId']
      }
    };

    // Pilot Schema
    const pilotSchema = {
      name: 'Pilot',
      fields: {
        fullName: { type: 'String', required: true, maxLength: 100 },
        email: { type: 'String', required: true },
        pilotId: { type: 'String', required: true },
        licenseNumber: { type: 'String', required: true },
        licenseExpiry: { type: 'Date', required: true },
        experience: { type: 'Number', min: 0 }, // years
        rating: { type: 'Number', min: 1, max: 5, default: 3 },
        vehicleTypes: [{ type: 'String' }], // EV types they can drive
        currentStatus: { type: 'String', enum: ['available', 'on_trip', 'off_duty'], default: 'available' },
        location: {
          lat: { type: 'Number' },
          lng: { type: 'Number' },
          address: { type: 'String' }
        },
        isActive: { type: 'Boolean', default: true },
        createdBy: { type: 'ObjectId', ref: 'User' },
        updatedBy: { type: 'ObjectId', ref: 'User' }
      },
      indexes: [
        { fields: { email: 1 }, options: { unique: true } },
        { fields: { pilotId: 1 }, options: { unique: true } },
        { fields: { licenseNumber: 1 }, options: { unique: true } },
        { fields: { currentStatus: 1, isActive: 1 } }
      ],
      validation: {
        required: ['fullName', 'email', 'pilotId', 'licenseNumber', 'licenseExpiry'],
        unique: ['email', 'pilotId', 'licenseNumber']
      }
    };

    // Vehicle Schema - Updated to match exact attachment requirements
    const vehicleSchema = {
      name: 'Vehicle',
      fields: {
        Vehicle_ID: { type: 'String', required: true },
        VIN_Number: { type: 'String', required: true },
        Engine_Number: { type: 'String', required: true },
        Registration_Number: { type: 'String', required: true },
        Registration_Date: { type: 'String', required: true },
        Brand: { type: 'String', required: true },
        Model: { type: 'String', required: true },
        Variant: { type: 'String' },
        Year: { type: 'Number', required: true, min: 2000 },
        Body_Type: { type: 'String', enum: ['Sedan', 'SUV', 'Hatchback', 'Crossover', 'Van', 'Truck', 'Other'] },
        Fuel_Type: { type: 'String', enum: ['Electric', 'Hybrid', 'Petrol', 'Diesel', 'CNG'], default: 'Electric' },
        Transmission_Type: { type: 'String', enum: ['Automatic', 'Manual', 'CVT'] },
        Seating_Capacity: { type: 'Number', min: 1, max: 20 },
        Engine_Capacity: { type: 'String' },
        Max_Power: { type: 'String' },
        Max_Torque: { type: 'String' },
        Battery_Capacity: { type: 'Number' }, // kWh
        Battery_Type: { type: 'String' },
        Range_WLTP: { type: 'Number' }, // km
        Charging_Type: { type: 'String', enum: ['AC', 'DC', 'AC+DC', 'Plug-in'] },
        Max_Charging_Speed: { type: 'String' },
        Color: { type: 'String' },
        Status: { type: 'String', enum: ['Active', 'Maintenance', 'Out of Service', 'Retired'], default: 'Active' },
        Current_Location: { type: 'String' },
        Home_Station: { type: 'String' },
        Insurance_Provider: { type: 'String' },
        Insurance_Policy_Number: { type: 'String' },
        Insurance_Expiry: { type: 'String' },
        PUC_Expiry: { type: 'String' },
        Fitness_Certificate_Expiry: { type: 'String' },
        Permit_Expiry: { type: 'String' },
        Road_Tax_Expiry: { type: 'String' },
        Assigned_Pilot_ID: { type: 'String' },
        Maintenance_Due_Date: { type: 'String' },
        Last_Service_Date: { type: 'String' },
        Purchase_Date: { type: 'String' },
        Purchase_Price: { type: 'Number' },
        Depreciation_Method: { type: 'String', enum: ['Straight Line', 'Declining Balance', 'Units of Production'] },
        Book_Value: { type: 'Number' },
        isActive: { type: 'Boolean', default: true },
        createdBy: { type: 'ObjectId', ref: 'User' },
        updatedBy: { type: 'ObjectId', ref: 'User' }
      },
      indexes: [
        { fields: { Vehicle_ID: 1 }, options: { unique: true } },
        { fields: { VIN_Number: 1 }, options: { unique: true } },
        { fields: { Registration_Number: 1 }, options: { unique: true } },
        { fields: { Status: 1, isActive: 1 } },
        { fields: { Assigned_Pilot_ID: 1 } },
        { fields: { Brand: 1, Model: 1 } }
      ],
      validation: {
        required: ['Vehicle_ID', 'VIN_Number', 'Engine_Number', 'Registration_Number', 'Registration_Date', 'Brand', 'Model', 'Year'],
        unique: ['Vehicle_ID', 'VIN_Number', 'Registration_Number']
      }
    };

    // Electric Equipment Schema
    const electricEquipmentSchema = {
      name: 'ElectricEquipment',
      fields: {
        equipmentId: { type: 'String', required: true },
        name: { type: 'String', required: true },
        type: { type: 'String', required: true, enum: ['charger', 'inverter', 'battery_pack', 'solar_panel', 'transformer', 'meter', 'cable', 'connector'] },
        brand: { type: 'String', required: true },
        model: { type: 'String', required: true },
        serialNumber: { type: 'String' },
        specifications: {
          voltage: { type: 'Number' }, // Volts
          current: { type: 'Number' }, // Amperes
          power: { type: 'Number' }, // Watts
          capacity: { type: 'Number' }, // kWh for batteries
          efficiency: { type: 'Number', min: 0, max: 100 } // Percentage
        },
        status: { type: 'String', enum: ['operational', 'maintenance', 'faulty', 'offline'], default: 'operational' },
        location: {
          lat: { type: 'Number' },
          lng: { type: 'Number' },
          address: { type: 'String' },
          facility: { type: 'String' } // Building/facility name
        },
        installationDate: { type: 'Date' },
        lastMaintenanceDate: { type: 'Date' },
        nextMaintenanceDate: { type: 'Date' },
        warranty: {
          startDate: { type: 'Date' },
          endDate: { type: 'Date' },
          provider: { type: 'String' }
        },
        assignedVehicles: [{ type: 'ObjectId', ref: 'Vehicle' }], // For chargers
        isActive: { type: 'Boolean', default: true },
        createdBy: { type: 'ObjectId', ref: 'User' },
        updatedBy: { type: 'ObjectId', ref: 'User' }
      },
      indexes: [
        { fields: { equipmentId: 1 }, options: { unique: true } },
        { fields: { serialNumber: 1 }, options: { unique: true, sparse: true } },
        { fields: { type: 1, status: 1 } },
        { fields: { 'location.facility': 1 } }
      ],
      validation: {
        required: ['equipmentId', 'name', 'type', 'brand', 'model'],
        unique: ['equipmentId', 'serialNumber']
      }
    };

    // Charging Station Schema
    const chargingStationSchema = {
      name: 'ChargingStation',
      fields: {
        stationId: { type: 'String', required: true },
        name: { type: 'String', required: true },
        location: {
          lat: { type: 'Number', required: true },
          lng: { type: 'Number', required: true },
          address: { type: 'String', required: true },
          city: { type: 'String', required: true },
          state: { type: 'String', required: true },
          zipCode: { type: 'String' }
        },
        chargers: [{
          chargerId: { type: 'String', required: true },
          type: { type: 'String', enum: ['AC', 'DC', 'Fast_DC'], required: true },
          power: { type: 'Number', required: true }, // kW
          status: { type: 'String', enum: ['available', 'occupied', 'offline', 'maintenance'], default: 'available' },
          connectorType: { type: 'String', enum: ['Type1', 'Type2', 'CCS', 'CHAdeMO'], required: true },
          currentVehicle: { type: 'ObjectId', ref: 'Vehicle' },
          pricePerKwh: { type: 'Number', min: 0 }
        }],
        operatingHours: {
          open: { type: 'String' }, // 24/7 or specific hours
          close: { type: 'String' }
        },
        amenities: [{ type: 'String' }], // parking, restroom, food, wifi
        isPublic: { type: 'Boolean', default: true },
        isActive: { type: 'Boolean', default: true },
        createdBy: { type: 'ObjectId', ref: 'User' },
        updatedBy: { type: 'ObjectId', ref: 'User' }
      },
      indexes: [
        { fields: { stationId: 1 }, options: { unique: true } },
        { fields: { 'location.lat': 1, 'location.lng': 1 } },
        { fields: { 'location.city': 1 } },
        { fields: { isPublic: 1, isActive: 1 } }
      ],
      validation: {
        required: ['stationId', 'name', 'location.lat', 'location.lng', 'location.address'],
        unique: ['stationId']
      }
    };

    // Charging Equipment Schema (Separate from Electric Equipment)
    const chargingEquipmentSchema = {
      name: 'ChargingEquipment',
      fields: {
        chargingEquipmentId: { type: 'String', required: true },
        name: { type: 'String', required: true },
        type: { type: 'String', required: true, enum: ['ac_charger', 'dc_fast_charger', 'ultra_fast_charger', 'wireless_charger', 'portable_charger'] },
        brand: { type: 'String', required: true },
        model: { type: 'String', required: true },
        serialNumber: { type: 'String' },
        powerRating: { type: 'Number', required: true }, // kW
        connectorTypes: [{ type: 'String', enum: ['Type1', 'Type2', 'CCS', 'CHAdeMO', 'Tesla'] }],
        numberOfPorts: { type: 'Number', default: 1 },
        specifications: {
          inputVoltage: { type: 'Number' }, // Volts
          outputVoltage: { type: 'Number' }, // Volts
          maxCurrent: { type: 'Number' }, // Amperes
          efficiency: { type: 'Number', min: 0, max: 100 }, // Percentage
          powerFactor: { type: 'Number' }
        },
        status: { type: 'String', enum: ['available', 'occupied', 'offline', 'maintenance', 'error'], default: 'available' },
        location: {
          lat: { type: 'Number' },
          lng: { type: 'Number' },
          address: { type: 'String' },
          facility: { type: 'String' },
          zone: { type: 'String' } // Parking zone or area
        },
        installationDate: { type: 'Date' },
        lastMaintenanceDate: { type: 'Date' },
        nextMaintenanceDate: { type: 'Date' },
        operatingHours: {
          startTime: { type: 'String' }, // 24/7 or specific hours
          endTime: { type: 'String' }
        },
        pricing: {
          pricePerKwh: { type: 'Number', min: 0 },
          flatRate: { type: 'Number', min: 0 },
          timeBasedRate: { type: 'Number', min: 0 }
        },
        currentSession: {
          vehicleId: { type: 'ObjectId', ref: 'Vehicle' },
          startTime: { type: 'Date' },
          energyDelivered: { type: 'Number' }, // kWh
          currentPower: { type: 'Number' } // kW
        },
        networkConnected: { type: 'Boolean', default: true },
        paymentMethods: [{ type: 'String', enum: ['credit_card', 'mobile_app', 'rfid_card', 'subscription'] }],
        isActive: { type: 'Boolean', default: true },
        createdBy: { type: 'ObjectId', ref: 'User' },
        updatedBy: { type: 'ObjectId', ref: 'User' }
      },
      indexes: [
        { fields: { chargingEquipmentId: 1 }, options: { unique: true } },
        { fields: { serialNumber: 1 }, options: { unique: true, sparse: true } },
        { fields: { type: 1, status: 1 } },
        { fields: { 'location.facility': 1, 'location.zone': 1 } },
        { fields: { status: 1, isActive: 1 } }
      ],
      validation: {
        required: ['chargingEquipmentId', 'name', 'type', 'brand', 'model', 'powerRating'],
        unique: ['chargingEquipmentId', 'serialNumber']
      }
    };

    // IT Equipment Schema
    const itEquipmentSchema = {
      name: 'ITEquipment',
      fields: {
        itEquipmentId: { type: 'String', required: true },
        name: { type: 'String', required: true },
        category: { type: 'String', required: true, enum: ['computer', 'laptop', 'server', 'network', 'printer', 'scanner', 'tablet', 'phone', 'monitor', 'projector', 'camera', 'software', 'license', 'accessory'] },
        type: { type: 'String', required: true }, // Desktop, Router, Laser Printer, etc.
        brand: { type: 'String', required: true },
        model: { type: 'String', required: true },
        serialNumber: { type: 'String' },
        assetTag: { type: 'String' },
        specifications: {
          processor: { type: 'String' },
          memory: { type: 'String' }, // RAM
          storage: { type: 'String' }, // HDD/SSD
          operatingSystem: { type: 'String' },
          screenSize: { type: 'String' },
          networkPorts: { type: 'Number' },
          powerConsumption: { type: 'Number' }, // Watts
          dimensions: { type: 'String' },
          weight: { type: 'String' }
        },
        status: { type: 'String', enum: ['active', 'inactive', 'maintenance', 'retired', 'lost', 'stolen'], default: 'active' },
        condition: { type: 'String', enum: ['excellent', 'good', 'fair', 'poor', 'damaged'], default: 'good' },
        location: {
          building: { type: 'String' },
          floor: { type: 'String' },
          room: { type: 'String' },
          desk: { type: 'String' },
          department: { type: 'String' }
        },
        assignedTo: {
          userId: { type: 'ObjectId', ref: 'User' },
          employeeId: { type: 'String' },
          employeeName: { type: 'String' },
          department: { type: 'String' }
        },
        purchaseInfo: {
          purchaseDate: { type: 'Date' },
          purchasePrice: { type: 'Number' },
          vendor: { type: 'String' },
          invoiceNumber: { type: 'String' },
          poNumber: { type: 'String' }
        },
        warranty: {
          startDate: { type: 'Date' },
          endDate: { type: 'Date' },
          provider: { type: 'String' },
          coverageType: { type: 'String' }
        },
        software: [{
          name: { type: 'String' },
          version: { type: 'String' },
          licenseKey: { type: 'String' },
          expiryDate: { type: 'Date' }
        }],
        networkInfo: {
          ipAddress: { type: 'String' },
          macAddress: { type: 'String' },
          hostname: { type: 'String' },
          domain: { type: 'String' }
        },
        lastMaintenanceDate: { type: 'Date' },
        nextMaintenanceDate: { type: 'Date' },
        depreciationRate: { type: 'Number' }, // Annual percentage
        disposalDate: { type: 'Date' },
        notes: { type: 'String' },
        isActive: { type: 'Boolean', default: true },
        createdBy: { type: 'ObjectId', ref: 'User' },
        updatedBy: { type: 'ObjectId', ref: 'User' }
      },
      indexes: [
        { fields: { itEquipmentId: 1 }, options: { unique: true } },
        { fields: { serialNumber: 1 }, options: { unique: true, sparse: true } },
        { fields: { assetTag: 1 }, options: { unique: true, sparse: true } },
        { fields: { category: 1, status: 1 } },
        { fields: { 'assignedTo.employeeId': 1 } },
        { fields: { 'location.department': 1 } },
        { fields: { status: 1, isActive: 1 } }
      ],
      validation: {
        required: ['itEquipmentId', 'name', 'category', 'type', 'brand', 'model'],
        unique: ['itEquipmentId', 'serialNumber', 'assetTag']
      }
    };

    // Infrastructure and Furniture Schema
    const infrastructureFurnitureSchema = {
      name: 'InfrastructureFurniture',
      fields: {
        assetId: { type: 'String', required: true },
        name: { type: 'String', required: true },
        category: { type: 'String', required: true, enum: ['furniture', 'infrastructure', 'fixture', 'equipment', 'safety', 'security', 'hvac', 'lighting', 'plumbing', 'electrical'] },
        subcategory: { type: 'String', required: true }, // Desk, Chair, Fire Extinguisher, Camera, etc.
        type: { type: 'String', required: true }, // Office Chair, Conference Table, Security Camera, etc.
        brand: { type: 'String' },
        model: { type: 'String' },
        serialNumber: { type: 'String' },
        assetTag: { type: 'String' },
        description: { type: 'String' },
        specifications: {
          dimensions: { type: 'String' }, // L x W x H
          weight: { type: 'String' },
          material: { type: 'String' }, // Wood, Metal, Plastic, etc.
          color: { type: 'String' },
          capacity: { type: 'String' }, // Seating capacity, weight capacity, etc.
          powerRequirement: { type: 'String' },
          connectivity: { type: 'String' } // WiFi, Ethernet, etc.
        },
        status: { type: 'String', enum: ['active', 'inactive', 'maintenance', 'damaged', 'disposed', 'lost'], default: 'active' },
        condition: { type: 'String', enum: ['excellent', 'good', 'fair', 'poor', 'damaged'], default: 'good' },
        location: {
          building: { type: 'String', required: true },
          floor: { type: 'String' },
          room: { type: 'String' },
          area: { type: 'String' }, // Reception, Conference Room, Cafeteria, etc.
          zone: { type: 'String' }, // A1, B2, etc.
          coordinates: {
            x: { type: 'Number' },
            y: { type: 'Number' }
          }
        },
        assignedTo: {
          department: { type: 'String' },
          employeeId: { type: 'String' },
          employeeName: { type: 'String' }
        },
        purchaseInfo: {
          purchaseDate: { type: 'Date' },
          purchasePrice: { type: 'Number' },
          vendor: { type: 'String' },
          invoiceNumber: { type: 'String' },
          poNumber: { type: 'String' }
        },
        warranty: {
          startDate: { type: 'Date' },
          endDate: { type: 'Date' },
          provider: { type: 'String' },
          terms: { type: 'String' }
        },
        maintenance: {
          lastServiceDate: { type: 'Date' },
          nextServiceDate: { type: 'Date' },
          serviceProvider: { type: 'String' },
          maintenanceSchedule: { type: 'String' }, // Monthly, Quarterly, Annually
          maintenanceNotes: { type: 'String' }
        },
        safety: {
          inspectionDate: { type: 'Date' },
          nextInspectionDate: { type: 'Date' },
          certificationNumber: { type: 'String' },
          safetyRating: { type: 'String' }
        },
        depreciationRate: { type: 'Number' }, // Annual percentage
        expectedLifespan: { type: 'Number' }, // Years
        disposalDate: { type: 'Date' },
        disposalMethod: { type: 'String' },
        qrCode: { type: 'String' }, // For asset tracking
        rfidTag: { type: 'String' },
        photos: [{ type: 'String' }], // URLs to asset photos
        documents: [{ type: 'String' }], // URLs to manuals, certificates, etc.
        notes: { type: 'String' },
        isActive: { type: 'Boolean', default: true },
        createdBy: { type: 'ObjectId', ref: 'User' },
        updatedBy: { type: 'ObjectId', ref: 'User' }
      },
      indexes: [
        { fields: { assetId: 1 }, options: { unique: true } },
        { fields: { serialNumber: 1 }, options: { unique: true, sparse: true } },
        { fields: { assetTag: 1 }, options: { unique: true, sparse: true } },
        { fields: { category: 1, subcategory: 1 } },
        { fields: { 'location.building': 1, 'location.floor': 1, 'location.room': 1 } },
        { fields: { status: 1, condition: 1 } },
        { fields: { 'assignedTo.department': 1 } }
      ],
      validation: {
        required: ['assetId', 'name', 'category', 'subcategory', 'type', 'location.building'],
        unique: ['assetId', 'serialNumber', 'assetTag']
      }
    };

    // Register default schemas
    this.registerSchema(employeeSchema);
    this.registerSchema(pilotSchema);
    this.registerSchema(vehicleSchema);
    this.registerSchema(electricEquipmentSchema);
    this.registerSchema(chargingEquipmentSchema);
    this.registerSchema(itEquipmentSchema);
    this.registerSchema(infrastructureFurnitureSchema);
    this.registerSchema(chargingStationSchema);
  }

  /**
   * Register a new schema for a sub-platform
   */
  registerSchema(schemaDefinition) {
    try {
      const { name, fields, indexes = [], validation = {} } = schemaDefinition;
      
      // Convert our schema definition to Mongoose schema
      const mongooseSchema = new mongoose.Schema(
        this.convertFieldsToMongoose(fields),
        {
          timestamps: true,
          versionKey: false
        }
      );

      // Add indexes
      indexes.forEach(index => {
        mongooseSchema.index(index.fields, index.options || {});
      });

      // Store schema definition and validation rules
      this.registeredSchemas.set(name.toLowerCase(), {
        schema: mongooseSchema,
        definition: schemaDefinition,
        validation
      });

      // Create or update the model
      if (mongoose.models[name]) {
        delete mongoose.models[name];
      }
      
      const model = mongoose.model(name, mongooseSchema);
      this.registeredModels.set(name.toLowerCase(), model);

      logger.info(`Schema registered successfully: ${name}`);
      return { success: true, message: `Schema ${name} registered successfully` };
    } catch (error) {
      logger.error(`Error registering schema ${schemaDefinition.name}:`, error);
      throw error;
    }
  }

  /**
   * Convert field definitions to Mongoose schema format
   */
  convertFieldsToMongoose(fields) {
    const mongooseFields = {};
    
    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      mongooseFields[fieldName] = this.convertFieldDefinition(fieldDef);
    }
    
    return mongooseFields;
  }

  /**
   * Convert individual field definition
   */
  convertFieldDefinition(fieldDef) {
    if (typeof fieldDef === 'string') {
      return { type: this.getMongooseType(fieldDef) };
    }

    const converted = {};
    
    // Type conversion
    if (fieldDef.type) {
      if (fieldDef.type === 'ObjectId') {
        converted.type = mongoose.Schema.Types.ObjectId;
        if (fieldDef.ref) {
          converted.ref = fieldDef.ref;
        }
      } else {
        converted.type = this.getMongooseType(fieldDef.type);
      }
    }

    // Copy other properties
    const allowedProps = ['required', 'unique', 'default', 'min', 'max', 'maxLength', 'minLength', 'enum', 'match'];
    allowedProps.forEach(prop => {
      if (fieldDef[prop] !== undefined) {
        if (prop === 'default' && fieldDef[prop] === 'Date.now') {
          converted[prop] = Date.now;
        } else {
          converted[prop] = fieldDef[prop];
        }
      }
    });

    return converted;
  }

  /**
   * Get Mongoose type from string
   */
  getMongooseType(typeString) {
    const typeMap = {
      'String': String,
      'Number': Number,
      'Date': Date,
      'Boolean': Boolean,
      'Array': Array,
      'Object': Object,
      'ObjectId': mongoose.Schema.Types.ObjectId
    };
    
    return typeMap[typeString] || String;
  }

  /**
   * Get all registered sub-platforms
   */
  getSubPlatforms() {
    const platforms = Array.from(this.registeredSchemas.entries()).map(([name, data]) => ({
      name: data.definition.name,
      collectionName: name,
      fields: Object.keys(data.definition.fields),
      validation: data.validation,
      indexes: data.definition.indexes || [],
      createdAt: new Date().toISOString()
    }));

    return platforms;
  }

  /**
   * Get model for a sub-platform
   */
  getModel(platformName) {
    const model = this.registeredModels.get(platformName.toLowerCase());
    if (!model) {
      throw new Error(`Sub-platform '${platformName}' not found`);
    }
    return model;
  }

  /**
   * Get schema definition for a sub-platform
   */
  getSchemaDefinition(platformName) {
    const schemaData = this.registeredSchemas.get(platformName.toLowerCase());
    if (!schemaData) {
      throw new Error(`Schema for '${platformName}' not found`);
    }
    return schemaData.definition;
  }

  /**
   * Validate document against schema rules
   */
  validateDocument(platformName, document, isUpdate = false) {
    const schemaData = this.registeredSchemas.get(platformName.toLowerCase());
    if (!schemaData) {
      throw new Error(`Schema for '${platformName}' not found`);
    }

    const { validation } = schemaData;
    const errors = [];

    // Check required fields (only for new documents)
    if (!isUpdate && validation.required) {
      for (const field of validation.required) {
        if (!document[field] || document[field] === '') {
          errors.push(`Field '${field}' is required`);
        }
      }
    }

    // Check unique fields (basic validation - actual uniqueness checked by MongoDB)
    if (validation.unique) {
      for (const field of validation.unique) {
        if (document[field] && typeof document[field] !== 'string') {
          errors.push(`Field '${field}' must be a string for uniqueness validation`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new document in a sub-platform
   */
  async createDocument(platformName, documentData, userId) {
    try {
      const Model = this.getModel(platformName);
      
      // Validate document
      const validation = this.validateDocument(platformName, documentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Add metadata
      const document = new Model({
        ...documentData,
        createdBy: userId,
        updatedBy: userId
      });

      const savedDocument = await document.save();
      
      logger.info(`Document created in ${platformName}:`, savedDocument._id);
      return savedDocument;
    } catch (error) {
      logger.error(`Error creating document in ${platformName}:`, error);
      throw error;
    }
  }

  /**
   * Get documents from a sub-platform with pagination and filtering
   */
  async getDocuments(platformName, options = {}) {
    try {
      const Model = this.getModel(platformName);
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        filter = {},
        populate = []
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const query = Model.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Add population if specified
      if (populate.length > 0) {
        populate.forEach(pop => query.populate(pop));
      }

      const [documents, totalCount] = await Promise.all([
        query.exec(),
        Model.countDocuments(filter)
      ]);

      return {
        documents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalDocuments: totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error(`Error fetching documents from ${platformName}:`, error);
      throw error;
    }
  }

  /**
   * Update a document in a sub-platform
   */
  async updateDocument(platformName, documentId, updateData, userId) {
    try {
      const Model = this.getModel(platformName);
      
      // Validate update data
      const validation = this.validateDocument(platformName, updateData, true);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const updatedDocument = await Model.findByIdAndUpdate(
        documentId,
        {
          ...updateData,
          updatedBy: userId,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!updatedDocument) {
        throw new Error(`Document not found in ${platformName}`);
      }

      logger.info(`Document updated in ${platformName}:`, documentId);
      return updatedDocument;
    } catch (error) {
      logger.error(`Error updating document in ${platformName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document from a sub-platform
   */
  async deleteDocument(platformName, documentId, userId) {
    try {
      const Model = this.getModel(platformName);
      
      const deletedDocument = await Model.findByIdAndDelete(documentId);
      
      if (!deletedDocument) {
        throw new Error(`Document not found in ${platformName}`);
      }

      logger.info(`Document deleted from ${platformName}:`, documentId);
      return deletedDocument;
    } catch (error) {
      logger.error(`Error deleting document from ${platformName}:`, error);
      throw error;
    }
  }

  /**
   * Search documents in a sub-platform
   */
  async searchDocuments(platformName, searchCriteria, options = {}) {
    try {
      const Model = this.getModel(platformName);
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Build search query
      const searchQuery = this.buildSearchQuery(searchCriteria);

      const [documents, totalCount] = await Promise.all([
        Model.find(searchQuery).sort(sort).skip(skip).limit(limit),
        Model.countDocuments(searchQuery)
      ]);

      return {
        documents,
        searchCriteria,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalDocuments: totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error(`Error searching documents in ${platformName}:`, error);
      throw error;
    }
  }

  /**
   * Build MongoDB search query from criteria
   */
  buildSearchQuery(criteria) {
    const query = {};
    
    for (const [field, value] of Object.entries(criteria)) {
      if (typeof value === 'object' && value.type) {
        switch (value.type) {
          case 'regex':
            query[field] = { $regex: value.value, $options: 'i' };
            break;
          case 'range':
            query[field] = {};
            if (value.min !== undefined) query[field].$gte = value.min;
            if (value.max !== undefined) query[field].$lte = value.max;
            break;
          case 'in':
            query[field] = { $in: value.values };
            break;
          default:
            query[field] = value.value;
        }
      } else {
        query[field] = value;
      }
    }
    
    return query;
  }

  /**
   * Export data from a sub-platform to JSON
   */
  async exportToJSON(platformName, filter = {}) {
    try {
      const Model = this.getModel(platformName);
      const documents = await Model.find(filter).lean();
      
      const exportData = {
        platform: platformName,
        exportDate: new Date().toISOString(),
        totalRecords: documents.length,
        data: documents
      };

      return exportData;
    } catch (error) {
      logger.error(`Error exporting ${platformName} to JSON:`, error);
      throw error;
    }
  }

  /**
   * Export data from a sub-platform to CSV
   */
  async exportToCSV(platformName, filter = {}, filePath) {
    try {
      const Model = this.getModel(platformName);
      const documents = await Model.find(filter).lean();
      
      if (documents.length === 0) {
        throw new Error(`No data found to export from ${platformName}`);
      }

      // Get all unique keys from documents
      const allKeys = new Set();
      documents.forEach(doc => {
        Object.keys(doc).forEach(key => allKeys.add(key));
      });

      const headers = Array.from(allKeys).map(key => ({
        id: key,
        title: key.toUpperCase()
      }));

      // Flatten nested objects for CSV
      const flattenedData = documents.map(doc => {
        const flattened = {};
        for (const key of allKeys) {
          if (doc[key] && typeof doc[key] === 'object' && !Array.isArray(doc[key]) && !(doc[key] instanceof Date)) {
            flattened[key] = JSON.stringify(doc[key]);
          } else if (Array.isArray(doc[key])) {
            flattened[key] = doc[key].join(', ');
          } else {
            flattened[key] = doc[key] || '';
          }
        }
        return flattened;
      });

      const csvWriter = createCsvWriter({
        path: filePath,
        header: headers
      });

      await csvWriter.writeRecords(flattenedData);
      
      return {
        filePath,
        recordsExported: documents.length,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error exporting ${platformName} to CSV:`, error);
      throw error;
    }
  }

  /**
   * Import data to a sub-platform from JSON
   */
  async importFromJSON(platformName, jsonData, userId, options = {}) {
    try {
      const Model = this.getModel(platformName);
      const { overwrite = false, validateOnly = false } = options;
      
      if (!Array.isArray(jsonData)) {
        throw new Error('JSON data must be an array of documents');
      }

      const results = {
        total: jsonData.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      if (overwrite) {
        await Model.deleteMany({});
      }

      for (let i = 0; i < jsonData.length; i++) {
        try {
          const doc = jsonData[i];
          
          // Validate document
          const validation = this.validateDocument(platformName, doc);
          if (!validation.isValid) {
            results.errors.push({
              index: i,
              document: doc,
              errors: validation.errors
            });
            results.failed++;
            continue;
          }

          if (!validateOnly) {
            // Remove _id if present to avoid conflicts
            delete doc._id;
            
            const newDoc = new Model({
              ...doc,
              createdBy: userId,
              updatedBy: userId
            });

            await newDoc.save();
          }
          
          results.successful++;
        } catch (error) {
          results.errors.push({
            index: i,
            document: jsonData[i],
            error: error.message
          });
          results.failed++;
        }
      }

      return results;
    } catch (error) {
      logger.error(`Error importing to ${platformName} from JSON:`, error);
      throw error;
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(platformName) {
    try {
      const Model = this.getModel(platformName);
      
      const [totalCount, activeCount, recentCount] = await Promise.all([
        Model.countDocuments(),
        Model.countDocuments({ isActive: { $ne: false } }),
        Model.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        platform: platformName,
        totalDocuments: totalCount,
        activeDocuments: activeCount,
        recentDocuments: recentCount,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error getting stats for ${platformName}:`, error);
      throw error;
    }
  }
}

module.exports = DatabaseService;
