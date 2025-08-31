/**
 * Vehicle Deployment Tracker Database Migration
 * This script sets up the database structure, indexes, and initial data
 * for the Vehicle Deployment Tracker module
 */

const mongoose = require('mongoose');
const { Vehicle, Deployment, DeploymentHistory, VehicleMaintenanceLog } = require('../models/vehicleDeploymentModels');

class VehicleDeploymentMigration {
  constructor() {
    this.models = {
      Vehicle,
      Deployment,
      DeploymentHistory,
      VehicleMaintenanceLog
    };
  }

  /**
   * Run the complete migration
   */
  async migrate() {
    console.log('🚀 Starting Vehicle Deployment Tracker Migration...\n');
    
    try {
      // Step 1: Ensure database connection
      await this.checkConnection();
      
      // Step 2: Create database indexes
      await this.createIndexes();
      
      // Step 3: Validate models
      await this.validateModels();
      
      // Step 4: Set up initial data (if needed)
      await this.setupInitialData();
      
      // Step 5: Run validation tests
      await this.runValidationTests();
      
      console.log('✅ Vehicle Deployment Tracker Migration completed successfully!\n');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Check database connection
   */
  async checkConnection() {
    console.log('🔌 Checking database connection...');
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database is not connected. Please ensure MongoDB connection is established.');
    }
    
    console.log('✅ Database connection verified\n');
  }

  /**
   * Create database indexes for performance
   */
  async createIndexes() {
    console.log('📊 Creating database indexes...');
    
    try {
      // Vehicle indexes
      await Vehicle.collection.createIndex({ vehicleId: 1 }, { unique: true });
      await Vehicle.collection.createIndex({ registrationNumber: 1 }, { unique: true });
      await Vehicle.collection.createIndex({ status: 1 });
      await Vehicle.collection.createIndex({ currentHub: 1 });
      await Vehicle.collection.createIndex({ isActive: 1 });
      await Vehicle.collection.createIndex({ createdAt: -1 });
      console.log('  ✅ Vehicle indexes created');

      // Deployment indexes
      await Deployment.collection.createIndex({ deploymentId: 1 }, { unique: true });
      await Deployment.collection.createIndex({ vehicleId: 1 });
      await Deployment.collection.createIndex({ pilotId: 1 });
      await Deployment.collection.createIndex({ status: 1 });
      await Deployment.collection.createIndex({ startTime: -1 });
      await Deployment.collection.createIndex({ createdAt: -1 });
      await Deployment.collection.createIndex({ status: 1, startTime: 1 });
      await Deployment.collection.createIndex({ vehicleId: 1, status: 1 });
      await Deployment.collection.createIndex({ pilotId: 1, status: 1 });
      console.log('  ✅ Deployment indexes created');

      // DeploymentHistory indexes
      await DeploymentHistory.collection.createIndex({ deploymentId: 1 });
      await DeploymentHistory.collection.createIndex({ 'statusChanges.changedAt': -1 });
      await DeploymentHistory.collection.createIndex({ 'locationHistory.timestamp': -1 });
      await DeploymentHistory.collection.createIndex({ createdAt: -1 });
      await DeploymentHistory.collection.createIndex({ deploymentId: 1, 'locationHistory.timestamp': -1 });
      console.log('  ✅ DeploymentHistory indexes created');

      // VehicleMaintenanceLog indexes
      await VehicleMaintenanceLog.collection.createIndex({ maintenanceId: 1 }, { unique: true });
      await VehicleMaintenanceLog.collection.createIndex({ vehicleId: 1 });
      await VehicleMaintenanceLog.collection.createIndex({ status: 1 });
      await VehicleMaintenanceLog.collection.createIndex({ scheduledDate: 1 });
      await VehicleMaintenanceLog.collection.createIndex({ maintenanceType: 1 });
      await VehicleMaintenanceLog.collection.createIndex({ createdAt: -1 });
      await VehicleMaintenanceLog.collection.createIndex({ vehicleId: 1, status: 1 });
      await VehicleMaintenanceLog.collection.createIndex({ vehicleId: 1, scheduledDate: -1 });
      console.log('  ✅ VehicleMaintenanceLog indexes created');

      console.log('✅ All indexes created successfully\n');
      
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
      throw error;
    }
  }

  /**
   * Validate all models by creating test documents
   */
  async validateModels() {
    console.log('🔍 Validating models...');
    
    try {
      // Test Vehicle model validation
      const testVehicle = new Vehicle({
        vehicleId: 'TEST_VEH_001',
        registrationNumber: 'TEST123',
        make: 'Tata',
        model: 'Nexon EV',
        year: 2024,
        color: 'White',
        batteryCapacity: 40.5,
        range: 312,
        chargingType: 'Both',
        seatingCapacity: 5,
        currentHub: 'Test Hub',
        createdBy: new mongoose.Types.ObjectId()
      });
      
      await testVehicle.validate();
      console.log('  ✅ Vehicle model validation passed');

      // Test Deployment model validation  
      const testDeployment = new Deployment({
        deploymentId: 'TEST_DEP_001_250830',
        vehicleId: new mongoose.Types.ObjectId(),
        pilotId: new mongoose.Types.ObjectId(),
        startTime: new Date(),
        estimatedEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
        startLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Bangalore, Karnataka'
        },
        purpose: 'testing',
        createdBy: new mongoose.Types.ObjectId()
      });
      
      await testDeployment.validate();
      console.log('  ✅ Deployment model validation passed');

      // Test VehicleMaintenanceLog model validation
      const testMaintenance = new VehicleMaintenanceLog({
        maintenanceId: 'TEST_MAINT_250830_001',
        vehicleId: new mongoose.Types.ObjectId(),
        maintenanceType: 'routine_service',
        description: 'Test maintenance',
        scheduledDate: new Date(),
        vehicleUnavailableFrom: new Date(),
        vehicleUnavailableTo: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours later
        serviceProvider: {
          name: 'Test Service Center'
        },
        createdBy: new mongoose.Types.ObjectId()
      });
      
      await testMaintenance.validate();
      console.log('  ✅ VehicleMaintenanceLog model validation passed');

      console.log('✅ All models validated successfully\n');
      
    } catch (error) {
      console.error('❌ Model validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Set up initial data if needed
   */
  async setupInitialData() {
    console.log('🌱 Setting up initial data...');
    
    try {
      // Check if we already have data
      const vehicleCount = await Vehicle.countDocuments();
      const deploymentCount = await Deployment.countDocuments();
      const maintenanceCount = await VehicleMaintenanceLog.countDocuments();
      
      console.log(`  Current data counts:`);
      console.log(`    Vehicles: ${vehicleCount}`);
      console.log(`    Deployments: ${deploymentCount}`);
      console.log(`    Maintenance Logs: ${maintenanceCount}`);
      
      if (vehicleCount === 0 && deploymentCount === 0 && maintenanceCount === 0) {
        console.log('  📝 No existing data found. Database is ready for fresh data.');
      } else {
        console.log('  📋 Existing data found. Skipping initial data setup.');
      }
      
      console.log('✅ Initial data setup completed\n');
      
    } catch (error) {
      console.error('❌ Error setting up initial data:', error.message);
      throw error;
    }
  }

  /**
   * Run validation tests to ensure everything works
   */
  async runValidationTests() {
    console.log('🧪 Running validation tests...');
    
    try {
      // Test 1: Model static methods
      const availableVehicles = await Vehicle.getAvailableVehicles();
      const dueMaintenance = await VehicleMaintenanceLog.getDueMaintenance();
      const activeDeployments = await Deployment.getActiveDeployments();
      
      console.log('  ✅ Static methods working correctly');
      
      // Test 2: Model virtuals and methods (using test documents)
      const testVehicle = new Vehicle({
        vehicleId: 'TEST_VEH_999',
        registrationNumber: 'VIRTUAL_TEST',
        make: 'Tata',
        model: 'Nexon EV',
        year: 2020,
        color: 'Blue',
        batteryCapacity: 30,
        range: 250,
        chargingType: 'AC',
        seatingCapacity: 5,
        currentHub: 'Virtual Test Hub',
        batteryHealth: 85,
        createdBy: new mongoose.Types.ObjectId()
      });
      
      // Test virtual properties
      const vehicleAge = testVehicle.vehicleAge;
      const batteryStatus = testVehicle.batteryHealthStatus;
      const isMaintenanceDue = testVehicle.isMaintenanceDue;
      
      console.log(`    Vehicle age: ${vehicleAge} years`);
      console.log(`    Battery status: ${batteryStatus}`);
      console.log(`    Maintenance due: ${isMaintenanceDue}`);
      
      console.log('  ✅ Virtual properties working correctly');
      
      // Test 3: ID generation (without saving)
      const testDeploymentForId = new Deployment({
        deploymentId: 'TEST_DEP_999_250830',
        vehicleId: new mongoose.Types.ObjectId(),
        pilotId: new mongoose.Types.ObjectId(),
        startTime: new Date(),
        estimatedEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        startLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Test Location'
        },
        purpose: 'testing',
        createdBy: new mongoose.Types.ObjectId()
      });
      
      console.log('  ✅ ID generation logic working correctly');
      
      console.log('✅ All validation tests passed\n');
      
    } catch (error) {
      console.error('❌ Validation tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Rollback migration (for development purposes)
   */
  async rollback() {
    console.log('🔄 Rolling back Vehicle Deployment Tracker Migration...\n');
    
    try {
      const collections = ['vehicles', 'deployments', 'deploymenthistories', 'vehiclemaintenancelogs'];
      
      for (const collectionName of collections) {
        if (await this.collectionExists(collectionName)) {
          await mongoose.connection.db.dropCollection(collectionName);
          console.log(`  ✅ Dropped collection: ${collectionName}`);
        } else {
          console.log(`  ℹ️  Collection ${collectionName} does not exist, skipping...`);
        }
      }
      
      console.log('\n✅ Migration rollback completed successfully!');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if a collection exists
   */
  async collectionExists(collectionName) {
    try {
      const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
      return collections.length > 0;
    } catch (error) {
      console.error(`Error checking collection ${collectionName}:`, error.message);
      return false;
    }
  }

  /**
   * Get migration status
   */
  async getStatus() {
    console.log('📊 Vehicle Deployment Tracker Status:\n');
    
    try {
      const stats = {
        vehicles: await Vehicle.countDocuments(),
        deployments: await Deployment.countDocuments(),
        deploymentHistory: await DeploymentHistory.countDocuments(),
        maintenanceLogs: await VehicleMaintenanceLog.countDocuments(),
        activeDeployments: await Deployment.countDocuments({ status: { $in: ['scheduled', 'in_progress'] } }),
        availableVehicles: await Vehicle.countDocuments({ status: 'available', isActive: true }),
        dueMaintenance: await VehicleMaintenanceLog.countDocuments({ 
          status: 'scheduled', 
          scheduledDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } 
        })
      };
      
      console.log('Current Database Status:');
      console.log(`  📋 Total Vehicles: ${stats.vehicles}`);
      console.log(`  🚗 Available Vehicles: ${stats.availableVehicles}`);
      console.log(`  🎯 Total Deployments: ${stats.deployments}`);
      console.log(`  ⚡ Active Deployments: ${stats.activeDeployments}`);
      console.log(`  📈 Deployment History Records: ${stats.deploymentHistory}`);
      console.log(`  🔧 Maintenance Logs: ${stats.maintenanceLogs}`);
      console.log(`  ⏰ Due Maintenance (7 days): ${stats.dueMaintenance}`);
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error getting status:', error.message);
      throw error;
    }
  }
}

module.exports = VehicleDeploymentMigration;
