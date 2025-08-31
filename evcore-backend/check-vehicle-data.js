const mongoose = require('mongoose');
const config = require('./src/config');

async function checkVehicleData() {
  console.log('🔍 Vehicle Data Check Script');
  console.log('=====================================\n');

  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check vehicles collection (Database Management)
    const vehiclesDb = mongoose.connection.db.collection('vehicles');
    
    console.log('📊 Database Management vehicles collection stats:');
    const totalVehicles = await vehiclesDb.countDocuments();
    console.log(`   Total documents: ${totalVehicles}`);
    
    // Check for documents with null vehicleId
    const nullVehicleId = await vehiclesDb.countDocuments({ vehicleId: null });
    console.log(`   Documents with null vehicleId: ${nullVehicleId}`);
    
    // Check for documents with missing vehicleId field
    const missingVehicleId = await vehiclesDb.countDocuments({ vehicleId: { $exists: false } });
    console.log(`   Documents without vehicleId field: ${missingVehicleId}`);
    
    // Sample some documents to see structure
    console.log('\n📋 Sample documents:');
    const samples = await vehiclesDb.find().limit(3).toArray();
    samples.forEach((doc, index) => {
      console.log(`   Sample ${index + 1}:`);
      console.log(`     _id: ${doc._id}`);
      console.log(`     Vehicle_ID: ${doc.Vehicle_ID || 'Not set'}`);
      console.log(`     vehicleId: ${doc.vehicleId || 'Not set'}`);
      console.log(`     Registration_Number: ${doc.Registration_Number || 'Not set'}`);
      console.log(`     registrationNumber: ${doc.registrationNumber || 'Not set'}`);
      console.log(`     Brand: ${doc.Brand || 'Not set'}`);
      console.log(`     Model: ${doc.Model || 'Not set'}`);
      console.log('');
    });

    // Check vehicle_deployments collection
    console.log('📊 Vehicle Deployment collection stats:');
    const deploymentDb = mongoose.connection.db.collection('vehicle_deployments');
    const totalDeployments = await deploymentDb.countDocuments();
    console.log(`   Total deployments: ${totalDeployments}`);
    
    if (totalDeployments > 0) {
      const deploymentSamples = await deploymentDb.find().limit(2).toArray();
      console.log('\n📋 Sample deployment documents:');
      deploymentSamples.forEach((doc, index) => {
        console.log(`   Deployment ${index + 1}:`);
        console.log(`     _id: ${doc._id}`);
        console.log(`     vehicleId: ${doc.vehicleId || 'Not set'}`);
        console.log(`     registrationNumber: ${doc.registrationNumber || 'Not set'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('📡 Closing MongoDB connection...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('\n🏁 Data check completed');
  }
}

checkVehicleData();
