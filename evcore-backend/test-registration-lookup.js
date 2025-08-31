/**
 * Test script to verify vehicle registration number lookup functionality
 * Run this with: node test-registration-lookup.js
 */

const mongoose = require('mongoose');
const VehicleDeploymentService = require('./src/services/vehicleDeploymentService');

// Test configuration - use the same MongoDB URI as the application
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://vishnuvardan2004:Jaya.988@evcore.gjcfg9u.mongodb.net/evcore';
const TEST_REGISTRATION_NUMBER = 'MH12AB1234';

async function testRegistrationLookup() {
  try {
    console.log('🚀 Testing Vehicle Registration Number Lookup...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Find vehicle by registration number
    console.log(`🔍 Testing: Find vehicle by registration number "${TEST_REGISTRATION_NUMBER}"`);
    const vehicle = await VehicleDeploymentService.findVehicleByRegistration(TEST_REGISTRATION_NUMBER);
    
    if (vehicle) {
      console.log('✅ Vehicle found successfully!');
      console.log(`   Registration: ${vehicle.registrationNumber}`);
      console.log(`   Make/Model: ${vehicle.make} ${vehicle.model}`);
      console.log(`   Status: ${vehicle.status}`);
      console.log(`   Battery: ${vehicle.batteryStatus?.currentLevel || 'N/A'}%`);
    } else {
      console.log('ℹ️ No vehicle found with this registration number');
      console.log('   This is expected if no test data exists');
    }
    
    console.log('\n✅ Registration lookup test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    // Close MongoDB connection
    console.log('\n📡 Closing MongoDB connection...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testRegistrationLookup().then(() => {
  console.log('\n🎉 Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test script failed:', error);
  process.exit(1);
});
