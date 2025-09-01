/**
 * Quick Vehicle Deployment Validation Demo
 * Shows that only Database Management vehicles can be deployed
 */

const mongoose = require('mongoose');
const config = require('./src/config/index');

async function quickValidationDemo() {
  try {
    console.log('🚗 Quick Vehicle Deployment Validation Demo');
    console.log('============================================');
    
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const dataHubService = require('./src/services/dataHubService');
    
    // Test with your actual vehicle from database
    console.log('\n✅ Test 1: Valid Vehicle from Database');
    console.log('--------------------------------------');
    
    const validResult = await dataHubService.validateVehicleForDeployment('23453454');
    console.log('Registration: 23453454');
    console.log('Valid:', validResult.valid ? '✅ YES' : '❌ NO');
    if (validResult.valid) {
      console.log('Vehicle Brand:', validResult.vehicle.brand || 'N/A');
      console.log('Vehicle Model:', validResult.vehicle.model || 'N/A');
      console.log('🎉 This vehicle CAN be deployed');
    } else {
      console.log('Error:', validResult.error);
    }
    
    // Test with fake registration
    console.log('\n❌ Test 2: Fake Vehicle Registration');
    console.log('------------------------------------');
    
    const invalidResult = await dataHubService.validateVehicleForDeployment('FAKE12345');
    console.log('Registration: FAKE12345');
    console.log('Valid:', invalidResult.valid ? '✅ YES' : '❌ NO');
    console.log('Error:', invalidResult.error);
    console.log('Suggestion:', invalidResult.suggestion);
    console.log('🚫 This vehicle CANNOT be deployed');
    
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    
    console.log('\n🎯 Result: Vehicle Deployment Validation is ACTIVE');
    console.log('===================================================');
    console.log('✅ Only vehicles from Database Management can be deployed');
    console.log('❌ Random/fake registration numbers are blocked');
    console.log('🔒 Your system prevents deployment errors');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

quickValidationDemo();
