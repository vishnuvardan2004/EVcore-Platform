const mongoose = require('mongoose');
const config = require('./src/config');
const dataHubService = require('./src/services/dataHubService');

async function testDataHubService() {
  console.log('🔧 Data Hub Service Test Script');
  console.log('=====================================\n');

  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Test service health
    console.log('🏥 Testing service health...');
    const health = await dataHubService.getServiceHealth();
    console.log('Service Health:', health);
    console.log('');

    // Test available vehicles
    console.log('🚗 Testing available vehicles...');
    const vehicles = await dataHubService.getAvailableVehicles({ limit: 5 });
    console.log(`Found ${vehicles.length} available vehicles:`);
    vehicles.forEach(vehicle => {
      console.log(`   - ${vehicle.registrationNumber} (${vehicle.brand} ${vehicle.model}) - Status: ${vehicle.status}`);
    });
    console.log('');

    // Test vehicle validation
    if (vehicles.length > 0) {
      const testReg = vehicles[0].registrationNumber;
      console.log(`🔍 Testing vehicle validation for: ${testReg}...`);
      const validation = await dataHubService.validateVehicleForDeployment(testReg);
      console.log('Validation Result:');
      console.log(`   Valid: ${validation.valid}`);
      console.log(`   Vehicle: ${validation.vehicle ? validation.vehicle.registrationNumber : 'None'}`);
      console.log(`   Error: ${validation.error || 'None'}`);
      console.log(`   Warnings: ${validation.warnings ? validation.warnings.join(', ') : 'None'}`);
      console.log('');
    }

    // Test pilots
    console.log('👨‍✈️ Testing available pilots...');
    const pilots = await dataHubService.getAvailablePilots();
    console.log(`Found ${pilots.length} available pilots:`);
    pilots.slice(0, 3).forEach(pilot => {
      console.log(`   - ${pilot.name} (${pilot.employeeId}) - Role: ${pilot.role}`);
    });
    console.log('');

    // Test invalid vehicle
    console.log('❌ Testing invalid vehicle validation...');
    const invalidValidation = await dataHubService.validateVehicleForDeployment('INVALID123');
    console.log('Invalid Vehicle Result:');
    console.log(`   Valid: ${invalidValidation.valid}`);
    console.log(`   Error: ${invalidValidation.error}`);
    console.log(`   Suggestion: ${invalidValidation.suggestion || 'None'}`);

    console.log('\n✅ All Data Hub service tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n📡 Closing MongoDB connection...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('\n🏁 Test script completed');
    process.exit(0);
  }
}

testDataHubService();
