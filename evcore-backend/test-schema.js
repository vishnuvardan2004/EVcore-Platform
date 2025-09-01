const path = require('path');
const mongoose = require('mongoose');

// Mock logger
const logger = { info: console.log, error: console.error };

// Load the DatabaseService
const DatabaseService = require('./src/services/databaseService');
const service = new DatabaseService();

async function testSchemas() {
  console.log('Initializing DatabaseService...');
  await service.initialize();
  
  console.log('Testing schema registration logic...');
  console.log('Registered schemas:', Array.from(service.registeredSchemas.keys()));
  console.log('Registered models:', Array.from(service.registeredModels.keys()));

  // Test the getModel method
  try {
    const model = service.getModel('pilot');
    console.log('✅ getModel("pilot") succeeded');
  } catch (error) {
    console.log('❌ getModel("pilot") failed:', error.message);
  }

  try {
    const model = service.getModel('Pilot');
    console.log('✅ getModel("Pilot") succeeded');
  } catch (error) {
    console.log('❌ getModel("Pilot") failed:', error.message);
  }

  console.log('\nTesting other platforms:');
  const testPlatforms = ['employee', 'vehicle', 'chargingequipment', 'electricequipment', 'itequipment', 'infrastructurefurniture'];
  testPlatforms.forEach(platform => {
    try {
      const model = service.getModel(platform);
      console.log(`✅ getModel("${platform}") succeeded`);
    } catch (error) {
      console.log(`❌ getModel("${platform}") failed:`, error.message);
    }
  });
}

testSchemas().catch(console.error);
