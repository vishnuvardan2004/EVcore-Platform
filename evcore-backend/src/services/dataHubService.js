const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Data Hub Integration Service
 * Provides centralized access to master data from Database Management
 * Allows other modules to reference and validate data without duplication
 */
class DataHubService {
  constructor() {
    // Lazy-load collections when needed
    this.vehiclesCollection = null;
    this.employeesCollection = null;
    this.initialized = false;
  }

  async ensureInitialized() {
    if (this.initialized) return;
    
    try {
      // Wait for mongoose connection to be ready
      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB connection not ready');
      }

      // Get direct collection references for performance
      this.vehiclesCollection = mongoose.connection.db.collection('vehicles');
      this.employeesCollection = mongoose.connection.db.collection('employees');
      this.initialized = true;
      logger.info('DataHubService initialized successfully');
    } catch (error) {
      logger.error('DataHubService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Vehicle Operations
   */

  /**
   * Find vehicle by registration number
   * @param {string} registrationNumber - Vehicle registration number
   * @returns {Object|null} Vehicle data or null if not found
   */
  async findVehicleByRegistration(registrationNumber) {
    try {
      await this.ensureInitialized();

      const vehicle = await this.vehiclesCollection.findOne({
        Registration_Number: { $regex: new RegExp(`^${registrationNumber}$`, 'i') }
      });

      if (vehicle) {
        // Transform Database Management format to standardized format
        return this.transformVehicleData(vehicle);
      }

      return null;
    } catch (error) {
      logger.error(`Error finding vehicle by registration ${registrationNumber}:`, error);
      throw new Error('Vehicle lookup failed');
    }
  }

  /**
   * Find vehicle by Vehicle ID
   * @param {string} vehicleId - Database Management Vehicle_ID
   * @returns {Object|null} Vehicle data or null if not found
   */
  async findVehicleById(vehicleId) {
    try {
      await this.ensureInitialized();

      const vehicle = await this.vehiclesCollection.findOne({
        Vehicle_ID: vehicleId
      });

      if (vehicle) {
        return this.transformVehicleData(vehicle);
      }

      return null;
    } catch (error) {
      logger.error(`Error finding vehicle by ID ${vehicleId}:`, error);
      throw new Error('Vehicle lookup failed');
    }
  }

  /**
   * Get all available vehicles for deployment
   * @param {Object} filters - Optional filters (status, hub, etc.)
   * @returns {Array} List of available vehicles
   */
  async getAvailableVehicles(filters = {}) {
    try {
      await this.ensureInitialized();

      const query = {};
      
      // Apply filters
      if (filters.status) {
        query.Status = filters.status;
      }
      
      if (filters.hub) {
        query.Current_Hub = filters.hub;
      }

      // Only get active vehicles
      query.isActive = { $ne: false };

      const vehicles = await this.vehiclesCollection
        .find(query)
        .sort({ Registration_Number: 1 })
        .limit(filters.limit || 100)
        .toArray();

      return vehicles.map(vehicle => this.transformVehicleData(vehicle));
    } catch (error) {
      logger.error('Error getting available vehicles:', error);
      throw new Error('Vehicle listing failed');
    }
  }

  /**
   * Validate if vehicle exists and is deployable
   * @param {string} registrationNumber - Vehicle registration number
   * @returns {Object} Validation result with vehicle data
   */
  async validateVehicleForDeployment(registrationNumber) {
    try {
      const vehicle = await this.findVehicleByRegistration(registrationNumber);
      
      if (!vehicle) {
        return {
          valid: false,
          error: 'Vehicle not found in Data Hub',
          suggestion: 'Please add the vehicle to Database Management first'
        };
      }

      // Check if vehicle is deployable
      const deployabilityCheck = this.checkVehicleDeployability(vehicle);
      
      return {
        valid: deployabilityCheck.deployable,
        vehicle: vehicle,
        error: deployabilityCheck.error,
        warnings: deployabilityCheck.warnings
      };
    } catch (error) {
      logger.error(`Error validating vehicle ${registrationNumber}:`, error);
      return {
        valid: false,
        error: 'Validation service error'
      };
    }
  }

  /**
   * Employee/Pilot Operations
   */

  /**
   * Find employee by ID
   * @param {string} employeeId - Employee ID
   * @returns {Object|null} Employee data or null if not found
   */
  async findEmployeeById(employeeId) {
    try {
      await this.ensureInitialized();

      const employee = await this.employeesCollection.findOne({
        Employee_ID: employeeId
      });

      if (employee) {
        return this.transformEmployeeData(employee);
      }

      return null;
    } catch (error) {
      logger.error(`Error finding employee by ID ${employeeId}:`, error);
      throw new Error('Employee lookup failed');
    }
  }

  /**
   * Get available pilots for deployment
   * @returns {Array} List of available pilots
   */
  async getAvailablePilots() {
    try {
      await this.ensureInitialized();

      const pilots = await this.employeesCollection
        .find({
          Role: { $regex: /pilot/i },
          Status: { $ne: 'Inactive' }
        })
        .sort({ Name: 1 })
        .toArray();

      return pilots.map(pilot => this.transformEmployeeData(pilot));
    } catch (error) {
      logger.error('Error getting available pilots:', error);
      throw new Error('Pilot listing failed');
    }
  }

  /**
   * Data Transformation Methods
   */

  /**
   * Transform Database Management vehicle data to standardized format
   * @param {Object} dbVehicle - Raw vehicle data from Database Management
   * @returns {Object} Standardized vehicle data
   */
  transformVehicleData(dbVehicle) {
    return {
      // Reference data (from Database Management)
      dataHubId: dbVehicle._id.toString(),
      vehicleId: dbVehicle.Vehicle_ID,
      registrationNumber: dbVehicle.Registration_Number,
      
      // Vehicle details
      brand: dbVehicle.Brand,
      model: dbVehicle.Model,
      year: dbVehicle.Year,
      color: dbVehicle.Color,
      
      // Technical specifications
      vinNumber: dbVehicle.VIN_Number,
      chassisNumber: dbVehicle.Chassis_Number,
      engineNumber: dbVehicle.Engine_Number,
      batteryCapacity: dbVehicle.Battery_Capacity,
      range: dbVehicle.Range,
      
      // Status and location
      status: dbVehicle.Status,
      currentHub: dbVehicle.Current_Hub,
      assignedPilotId: dbVehicle.Assigned_Pilot_ID,
      
      // Metadata
      isActive: dbVehicle.isActive !== false,
      createdAt: dbVehicle.createdAt,
      updatedAt: dbVehicle.updatedAt,
      
      // Data source tracking
      source: 'data-hub',
      lastSynced: new Date()
    };
  }

  /**
   * Transform Database Management employee data to standardized format
   * @param {Object} dbEmployee - Raw employee data from Database Management
   * @returns {Object} Standardized employee data
   */
  transformEmployeeData(dbEmployee) {
    return {
      // Reference data
      dataHubId: dbEmployee._id.toString(),
      employeeId: dbEmployee.Employee_ID,
      
      // Personal details
      name: dbEmployee.Name,
      phone: dbEmployee.Phone_Number,
      email: dbEmployee.Email,
      
      // Role and status
      role: dbEmployee.Role,
      status: dbEmployee.Status,
      
      // Metadata
      isActive: dbEmployee.Status !== 'Inactive',
      createdAt: dbEmployee.createdAt,
      updatedAt: dbEmployee.updatedAt,
      
      // Data source tracking
      source: 'data-hub',
      lastSynced: new Date()
    };
  }

  /**
   * Check if vehicle is deployable
   * @param {Object} vehicle - Standardized vehicle data
   * @returns {Object} Deployability check result
   */
  checkVehicleDeployability(vehicle) {
    const warnings = [];
    let deployable = true;
    let error = null;

    // Check if vehicle is active
    if (!vehicle.isActive) {
      deployable = false;
      error = 'Vehicle is not active';
    }

    // Check vehicle status
    if (vehicle.status === 'Out of Service' || vehicle.status === 'Maintenance') {
      deployable = false;
      error = `Vehicle is currently in ${vehicle.status}`;
    }

    // Check if already assigned
    if (vehicle.assignedPilotId && vehicle.status === 'Deployed') {
      warnings.push('Vehicle is currently assigned to another pilot');
    }

    // Check required fields
    if (!vehicle.registrationNumber) {
      deployable = false;
      error = 'Vehicle missing registration number';
    }

    return {
      deployable,
      error,
      warnings
    };
  }

  /**
   * Utility Methods
   */

  /**
   * Get service health status
   * @returns {Object} Service health information
   */
  async getServiceHealth() {
    try {
      await this.ensureInitialized();
      
      const vehicleCount = await this.vehiclesCollection?.countDocuments() || 0;
      const employeeCount = await this.employeesCollection?.countDocuments() || 0;

      return {
        status: 'healthy',
        collections: {
          vehicles: vehicleCount,
          employees: employeeCount
        },
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date()
      };
    }
  }
}

// Create singleton instance
const dataHubService = new DataHubService();

module.exports = dataHubService;
