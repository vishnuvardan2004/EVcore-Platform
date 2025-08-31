/**
 * Vehicle Deployment API Tests
 * Comprehensive test suite for vehicle deployment endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Vehicle = require('../src/models/Vehicle');
const Deployment = require('../src/models/Deployment');
const VehicleMaintenanceLog = require('../src/models/VehicleMaintenanceLog');
const User = require('../src/models/User');

describe('Vehicle Deployment API Tests', () => {
  let authToken;
  let testUser;
  let testVehicle;
  let testDeployment;
  let testPilot;

  // Setup before all tests
  before(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb+srv://vishnuvardan2004:Jaya.988@evcore.gjcfg9u.mongodb.net/evcore_test');
    
    // Create test user with admin privileges
    testUser = new User({
      email: 'test.admin@evzip.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'super_admin',
      modules: ['vehicle_deployment'],
      isActive: true
    });
    await testUser.save();
    
    // Create test pilot
    testPilot = new User({
      email: 'test.pilot@evzip.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Pilot',
      role: 'pilot',
      modules: ['vehicle_deployment'],
      isActive: true
    });
    await testPilot.save();
    
    // Login and get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test.admin@evzip.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
  });

  // Cleanup after all tests
  after(async () => {
    await Vehicle.deleteMany({});
    await Deployment.deleteMany({});
    await VehicleMaintenanceLog.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // Clear collections before each test
  beforeEach(async () => {
    await Vehicle.deleteMany({});
    await Deployment.deleteMany({});
    await VehicleMaintenanceLog.deleteMany({});
  });

  /**
   * ========================================
   * VEHICLE MANAGEMENT TESTS
   * ========================================
   */

  describe('Vehicle Management', () => {
    describe('POST /api/vehicle-deployment/vehicles', () => {
      it('should create a new vehicle with valid data', async () => {
        const vehicleData = {
          registrationNumber: 'TS09EZ1234',
          make: 'Tata',
          model: 'Nexon EV',
          year: 2024,
          color: 'White',
          batteryCapacity: 40.5,
          range: 312,
          chargingType: 'Both',
          seatingCapacity: 5,
          currentHub: 'Hyderabad Hub'
        };

        const response = await request(app)
          .post('/api/vehicle-deployment/vehicles')
          .set('Authorization', `Bearer ${authToken}`)
          .send(vehicleData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.registrationNumber).toBe(vehicleData.registrationNumber);
        expect(response.body.data.vehicleId).toMatch(/^EVZ_VEH_\d{3}$/);

        testVehicle = response.body.data;
      });

      it('should fail with invalid registration number', async () => {
        const vehicleData = {
          registrationNumber: 'INVALID',
          make: 'Tata',
          model: 'Nexon EV',
          year: 2024,
          color: 'White',
          batteryCapacity: 40.5,
          range: 312,
          chargingType: 'Both',
          seatingCapacity: 5,
          currentHub: 'Hyderabad Hub'
        };

        const response = await request(app)
          .post('/api/vehicle-deployment/vehicles')
          .set('Authorization', `Bearer ${authToken}`)
          .send(vehicleData);

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
        expect(response.body.errors).to.be.an('array');
      });

      it('should fail with invalid make', async () => {
        const vehicleData = {
          registrationNumber: 'TS09EZ1234',
          make: 'InvalidMake',
          model: 'Nexon EV',
          year: 2024,
          color: 'White',
          batteryCapacity: 40.5,
          range: 312,
          chargingType: 'Both',
          seatingCapacity: 5,
          currentHub: 'Hyderabad Hub'
        };

        const response = await request(app)
          .post('/api/vehicle-deployment/vehicles')
          .set('Authorization', `Bearer ${authToken}`)
          .send(vehicleData);

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
      });
    });

    describe('GET /api/vehicle-deployment/vehicles', () => {
      beforeEach(async () => {
        // Create test vehicles
        await Vehicle.create([
          {
            vehicleId: 'EVZ_VEH_001',
            registrationNumber: 'TS09EZ1234',
            make: 'Tata',
            model: 'Nexon EV',
            year: 2024,
            color: 'White',
            batteryCapacity: 40.5,
            range: 312,
            chargingType: 'Both',
            seatingCapacity: 5,
            currentHub: 'Hyderabad Hub',
            status: 'available'
          },
          {
            vehicleId: 'EVZ_VEH_002',
            registrationNumber: 'TS09EZ5678',
            make: 'Mahindra',
            model: 'eXUV300',
            year: 2024,
            color: 'Blue',
            batteryCapacity: 39.4,
            range: 315,
            chargingType: 'Both',
            seatingCapacity: 5,
            currentHub: 'Hyderabad Hub',
            status: 'deployed'
          }
        ]);
      });

      it('should return all vehicles with pagination', async () => {
        const response = await request(app)
          .get('/api/vehicle-deployment/vehicles?page=1&limit=10')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.equal(2);
        expect(response.body.pagination).to.exist;
      });

      it('should filter vehicles by status', async () => {
        const response = await request(app)
          .get('/api/vehicle-deployment/vehicles?status=available')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.equal(1);
        expect(response.body.data[0].status).to.equal('available');
      });

      it('should filter vehicles by make', async () => {
        const response = await request(app)
          .get('/api/vehicle-deployment/vehicles?make=Tata')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.equal(1);
        expect(response.body.data[0].make).to.equal('Tata');
      });
    });

    describe('GET /api/vehicle-deployment/vehicles/available', () => {
      beforeEach(async () => {
        await Vehicle.create([
          {
            vehicleId: 'EVZ_VEH_001',
            registrationNumber: 'TS09EZ1234',
            make: 'Tata',
            model: 'Nexon EV',
            year: 2024,
            color: 'White',
            batteryCapacity: 40.5,
            range: 312,
            chargingType: 'Both',
            seatingCapacity: 5,
            currentHub: 'Hyderabad Hub',
            status: 'available',
            batteryStatus: { currentLevel: 85 }
          },
          {
            vehicleId: 'EVZ_VEH_002',
            registrationNumber: 'TS09EZ5678',
            make: 'Mahindra',
            model: 'eXUV300',
            year: 2024,
            color: 'Blue',
            batteryCapacity: 39.4,
            range: 315,
            chargingType: 'Both',
            seatingCapacity: 5,
            currentHub: 'Hyderabad Hub',
            status: 'deployed'
          }
        ]);
      });

      it('should return only available vehicles', async () => {
        const response = await request(app)
          .get('/api/vehicle-deployment/vehicles/available')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.equal(1);
        expect(response.body.data[0].status).to.equal('available');
      });
    });
  });

  /**
   * ========================================
   * DEPLOYMENT MANAGEMENT TESTS
   * ========================================
   */

  describe('Deployment Management', () => {
    beforeEach(async () => {
      // Create test vehicle
      testVehicle = await Vehicle.create({
        vehicleId: 'EVZ_VEH_001',
        registrationNumber: 'TS09EZ1234',
        make: 'Tata',
        model: 'Nexon EV',
        year: 2024,
        color: 'White',
        batteryCapacity: 40.5,
        range: 312,
        chargingType: 'Both',
        seatingCapacity: 5,
        currentHub: 'Hyderabad Hub',
        status: 'available',
        batteryStatus: { currentLevel: 85 }
      });
    });

    describe('POST /api/vehicle-deployment/deployments', () => {
      it('should create a new deployment with valid data', async () => {
        const deploymentData = {
          vehicleId: testVehicle._id.toString(),
          pilotId: testPilot._id.toString(),
          startTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
          estimatedEndTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          startLocation: {
            latitude: 17.4065,
            longitude: 78.4772,
            address: 'HITEC City, Hyderabad, Telangana, India'
          },
          purpose: 'Client demonstration and test drive'
        };

        const response = await request(app)
          .post('/api/vehicle-deployment/deployments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(deploymentData);

        expect(response.status).to.equal(201);
        expect(response.body.success).to.be.true;
        expect(response.body.data.vehicleId.toString()).to.equal(testVehicle._id.toString());
        expect(response.body.data.deploymentId).to.match(/^DEP_\d{3}_\d{6}$/);

        testDeployment = response.body.data;
      });

      it('should fail with invalid vehicle ID', async () => {
        const deploymentData = {
          vehicleId: 'invalid_id',
          pilotId: testPilot._id.toString(),
          startTime: new Date(Date.now() + 60000).toISOString(),
          estimatedEndTime: new Date(Date.now() + 3600000).toISOString(),
          startLocation: {
            latitude: 17.4065,
            longitude: 78.4772,
            address: 'HITEC City, Hyderabad, Telangana, India'
          },
          purpose: 'Client demonstration and test drive'
        };

        const response = await request(app)
          .post('/api/vehicle-deployment/deployments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(deploymentData);

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
      });

      it('should fail when end time is before start time', async () => {
        const deploymentData = {
          vehicleId: testVehicle._id.toString(),
          pilotId: testPilot._id.toString(),
          startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          estimatedEndTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
          startLocation: {
            latitude: 17.4065,
            longitude: 78.4772,
            address: 'HITEC City, Hyderabad, Telangana, India'
          },
          purpose: 'Client demonstration and test drive'
        };

        const response = await request(app)
          .post('/api/vehicle-deployment/deployments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(deploymentData);

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
      });
    });

    describe('GET /api/vehicle-deployment/deployments', () => {
      beforeEach(async () => {
        // Create test deployments
        await Deployment.create([
          {
            deploymentId: 'DEP_001_240101',
            vehicleId: testVehicle._id,
            pilotId: testPilot._id,
            startTime: new Date(),
            estimatedEndTime: new Date(Date.now() + 3600000),
            startLocation: {
              latitude: 17.4065,
              longitude: 78.4772,
              address: 'HITEC City, Hyderabad, Telangana, India'
            },
            purpose: 'Test deployment 1',
            status: 'in_progress'
          },
          {
            deploymentId: 'DEP_002_240101',
            vehicleId: testVehicle._id,
            pilotId: testPilot._id,
            startTime: new Date(Date.now() - 7200000),
            estimatedEndTime: new Date(Date.now() - 3600000),
            endTime: new Date(Date.now() - 3600000),
            startLocation: {
              latitude: 17.4065,
              longitude: 78.4772,
              address: 'HITEC City, Hyderabad, Telangana, India'
            },
            purpose: 'Test deployment 2',
            status: 'completed'
          }
        ]);
      });

      it('should return all deployments with pagination', async () => {
        const response = await request(app)
          .get('/api/vehicle-deployment/deployments?page=1&limit=10')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.equal(2);
      });

      it('should filter deployments by status', async () => {
        const response = await request(app)
          .get('/api/vehicle-deployment/deployments?status=in_progress')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.equal(1);
        expect(response.body.data[0].status).to.equal('in_progress');
      });
    });
  });

  /**
   * ========================================
   * MAINTENANCE MANAGEMENT TESTS
   * ========================================
   */

  describe('Maintenance Management', () => {
    beforeEach(async () => {
      testVehicle = await Vehicle.create({
        vehicleId: 'EVZ_VEH_001',
        registrationNumber: 'TS09EZ1234',
        make: 'Tata',
        model: 'Nexon EV',
        year: 2024,
        color: 'White',
        batteryCapacity: 40.5,
        range: 312,
        chargingType: 'Both',
        seatingCapacity: 5,
        currentHub: 'Hyderabad Hub',
        status: 'available'
      });
    });

    describe('POST /api/vehicle-deployment/maintenance', () => {
      it('should create a maintenance log with valid data', async () => {
        const maintenanceData = {
          vehicleId: testVehicle._id.toString(),
          maintenanceType: 'routine_service',
          description: 'Monthly routine service and battery health check',
          scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          estimatedDuration: 4,
          serviceProvider: {
            name: 'EV Service Center',
            contactInfo: '+91-9876543210',
            location: 'Madhapur, Hyderabad'
          }
        };

        const response = await request(app)
          .post('/api/vehicle-deployment/maintenance')
          .set('Authorization', `Bearer ${authToken}`)
          .send(maintenanceData);

        expect(response.status).to.equal(201);
        expect(response.body.success).to.be.true;
        expect(response.body.data.vehicleId.toString()).to.equal(testVehicle._id.toString());
        expect(response.body.data.maintenanceId).to.match(/^MAINT_\d{6}_\d{3}$/);
      });

      it('should fail with invalid maintenance type', async () => {
        const maintenanceData = {
          vehicleId: testVehicle._id.toString(),
          maintenanceType: 'invalid_type',
          description: 'Monthly routine service and battery health check',
          scheduledDate: new Date(Date.now() + 86400000).toISOString(),
          serviceProvider: {
            name: 'EV Service Center',
            contactInfo: '+91-9876543210'
          }
        };

        const response = await request(app)
          .post('/api/vehicle-deployment/maintenance')
          .set('Authorization', `Bearer ${authToken}`)
          .send(maintenanceData);

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
      });

      it('should fail when scheduled date is in the past', async () => {
        const maintenanceData = {
          vehicleId: testVehicle._id.toString(),
          maintenanceType: 'routine_service',
          description: 'Monthly routine service and battery health check',
          scheduledDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          serviceProvider: {
            name: 'EV Service Center',
            contactInfo: '+91-9876543210'
          }
        };

        const response = await request(app)
          .post('/api/vehicle-deployment/maintenance')
          .set('Authorization', `Bearer ${authToken}`)
          .send(maintenanceData);

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
      });
    });
  });

  /**
   * ========================================
   * ANALYTICS TESTS
   * ========================================
   */

  describe('Analytics', () => {
    beforeEach(async () => {
      // Create test data for analytics
      testVehicle = await Vehicle.create({
        vehicleId: 'EVZ_VEH_001',
        registrationNumber: 'TS09EZ1234',
        make: 'Tata',
        model: 'Nexon EV',
        year: 2024,
        color: 'White',
        batteryCapacity: 40.5,
        range: 312,
        chargingType: 'Both',
        seatingCapacity: 5,
        currentHub: 'Hyderabad Hub',
        status: 'available'
      });

      await Deployment.create([
        {
          deploymentId: 'DEP_001_240101',
          vehicleId: testVehicle._id,
          pilotId: testPilot._id,
          startTime: new Date(Date.now() - 86400000),
          endTime: new Date(Date.now() - 82800000),
          estimatedEndTime: new Date(Date.now() - 82800000),
          startLocation: {
            latitude: 17.4065,
            longitude: 78.4772,
            address: 'HITEC City, Hyderabad, Telangana, India'
          },
          purpose: 'Completed deployment',
          status: 'completed',
          actualDistance: 45
        }
      ]);
    });

    describe('GET /api/vehicle-deployment/dashboard', () => {
      it('should return dashboard statistics', async () => {
        const response = await request(app)
          .get('/api/vehicle-deployment/dashboard')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('totalVehicles');
        expect(response.body.data).to.have.property('activeDeployments');
        expect(response.body.data).to.have.property('completedDeployments');
        expect(response.body.data).to.have.property('maintenanceAlerts');
      });
    });

    describe('GET /api/vehicle-deployment/analytics/deployments', () => {
      it('should return deployment analytics', async () => {
        const startDate = new Date(Date.now() - 7 * 86400000).toISOString(); // 7 days ago
        const endDate = new Date().toISOString();

        const response = await request(app)
          .get(`/api/vehicle-deployment/analytics/deployments?startDate=${startDate}&endDate=${endDate}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('totalDeployments');
        expect(response.body.data).to.have.property('completionRate');
        expect(response.body.data).to.have.property('averageDuration');
      });
    });
  });

  /**
   * ========================================
   * REAL-TIME TRACKING TESTS
   * ========================================
   */

  describe('Real-time Tracking', () => {
    beforeEach(async () => {
      testVehicle = await Vehicle.create({
        vehicleId: 'EVZ_VEH_001',
        registrationNumber: 'TS09EZ1234',
        make: 'Tata',
        model: 'Nexon EV',
        year: 2024,
        color: 'White',
        batteryCapacity: 40.5,
        range: 312,
        chargingType: 'Both',
        seatingCapacity: 5,
        currentHub: 'Hyderabad Hub',
        status: 'deployed'
      });

      testDeployment = await Deployment.create({
        deploymentId: 'DEP_001_240101',
        vehicleId: testVehicle._id,
        pilotId: testPilot._id,
        startTime: new Date(),
        estimatedEndTime: new Date(Date.now() + 3600000),
        startLocation: {
          latitude: 17.4065,
          longitude: 78.4772,
          address: 'HITEC City, Hyderabad, Telangana, India'
        },
        purpose: 'Active deployment',
        status: 'in_progress'
      });
    });

    describe('PUT /api/vehicle-deployment/deployments/:id/tracking', () => {
      it('should update deployment tracking data', async () => {
        const trackingData = {
          currentLocation: {
            latitude: 17.4165,
            longitude: 78.4872
          },
          batteryLevel: 78,
          speed: 45,
          odometer: 123.5
        };

        const response = await request(app)
          .put(`/api/vehicle-deployment/deployments/${testDeployment._id}/tracking`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(trackingData);

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data.realTimeData.currentLocation.latitude).to.equal(trackingData.currentLocation.latitude);
        expect(response.body.data.realTimeData.batteryLevel).to.equal(trackingData.batteryLevel);
      });

      it('should fail with invalid coordinates', async () => {
        const trackingData = {
          currentLocation: {
            latitude: 200, // Invalid latitude
            longitude: 78.4872
          },
          batteryLevel: 78
        };

        const response = await request(app)
          .put(`/api/vehicle-deployment/deployments/${testDeployment._id}/tracking`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(trackingData);

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
      });

      it('should fail with invalid battery level', async () => {
        const trackingData = {
          currentLocation: {
            latitude: 17.4165,
            longitude: 78.4872
          },
          batteryLevel: 150 // Invalid battery level
        };

        const response = await request(app)
          .put(`/api/vehicle-deployment/deployments/${testDeployment._id}/tracking`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(trackingData);

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
      });
    });
  });

  /**
   * ========================================
   * AUTHORIZATION TESTS
   * ========================================
   */

  describe('Authorization', () => {
    let pilotToken;

    before(async () => {
      // Login as pilot to test authorization
      const pilotLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.pilot@evzip.com',
          password: 'password123'
        });
      
      pilotToken = pilotLoginResponse.body.token;
    });

    it('should allow pilot to create deployments', async () => {
      const vehicleData = {
        registrationNumber: 'TS09EZ9999',
        make: 'Tata',
        model: 'Nexon EV',
        year: 2024,
        color: 'Red',
        batteryCapacity: 40.5,
        range: 312,
        chargingType: 'Both',
        seatingCapacity: 5,
        currentHub: 'Hyderabad Hub'
      };

      // Admin creates vehicle first
      const vehicleResponse = await request(app)
        .post('/api/vehicle-deployment/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vehicleData);

      const deploymentData = {
        vehicleId: vehicleResponse.body.data._id,
        pilotId: testPilot._id.toString(),
        startTime: new Date(Date.now() + 60000).toISOString(),
        estimatedEndTime: new Date(Date.now() + 3600000).toISOString(),
        startLocation: {
          latitude: 17.4065,
          longitude: 78.4772,
          address: 'HITEC City, Hyderabad, Telangana, India'
        },
        purpose: 'Pilot deployment test'
      };

      const response = await request(app)
        .post('/api/vehicle-deployment/deployments')
        .set('Authorization', `Bearer ${pilotToken}`)
        .send(deploymentData);

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
    });

    it('should prevent pilot from creating vehicles', async () => {
      const vehicleData = {
        registrationNumber: 'TS09EZ8888',
        make: 'Tata',
        model: 'Nexon EV',
        year: 2024,
        color: 'Green',
        batteryCapacity: 40.5,
        range: 312,
        chargingType: 'Both',
        seatingCapacity: 5,
        currentHub: 'Hyderabad Hub'
      };

      const response = await request(app)
        .post('/api/vehicle-deployment/vehicles')
        .set('Authorization', `Bearer ${pilotToken}`)
        .send(vehicleData);

      expect(response.status).to.equal(403);
      expect(response.body.success).to.be.false;
    });
  });
});
