/**
 * Test moduleAuth middleware functions directly
 */

const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');
require('dotenv').config();

const { hasModuleAccess, hasModulePermission } = require('./src/middleware/moduleAuth');

const { getMongoUri } = require('./scripts/database-helper');
const MONGODB_URI = getMongoUri();

const testModuleAuth = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    // Connection success logged by helper

    // Create a mock pilot user
    const pilotUser = {
      role: 'pilot',
      email: 'teju@gmail.com'
    };

    console.log('\n🧪 Testing middleware functions directly:');
    
    // Test trip_analytics access
    console.log('\n📊 Testing trip_analytics access for pilot:');
    const tripAccess = await hasModuleAccess(pilotUser, 'trip_analytics');
    console.log(`   hasModuleAccess('trip_analytics'): ${tripAccess ? '✅ TRUE' : '❌ FALSE'}`);
    
    const tripReadPermission = await hasModulePermission(pilotUser, 'trip_analytics', 'read');
    console.log(`   hasModulePermission('trip_analytics', 'read'): ${tripReadPermission ? '✅ TRUE' : '❌ FALSE'}`);

    // Test energy_management access
    console.log('\n⚡ Testing energy_management access for pilot:');
    const energyAccess = await hasModuleAccess(pilotUser, 'energy_management');
    console.log(`   hasModuleAccess('energy_management'): ${energyAccess ? '✅ TRUE' : '❌ FALSE'}`);
    
    const energyReadPermission = await hasModulePermission(pilotUser, 'energy_management', 'read');
    console.log(`   hasModulePermission('energy_management', 'read'): ${energyReadPermission ? '✅ TRUE' : '❌ FALSE'}`);

    // Test vehicle_deployment access (should be false)
    console.log('\n🚗 Testing vehicle_deployment access for pilot (should be denied):');
    const vehicleAccess = await hasModuleAccess(pilotUser, 'vehicle_deployment');
    console.log(`   hasModuleAccess('vehicle_deployment'): ${vehicleAccess ? '❌ TRUE (unexpected)' : '✅ FALSE (correct)'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n💤 Disconnected from MongoDB');
  }
};

testModuleAuth();
