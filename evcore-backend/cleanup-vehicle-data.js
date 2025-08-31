const mongoose = require('mongoose');
const config = require('./src/config');

async function cleanupVehicleData() {
  console.log('🧹 Vehicle Data Cleanup Script');
  console.log('=====================================\n');

  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const vehiclesDb = mongoose.connection.db.collection('vehicles');
    
    console.log('🔍 Checking for problematic documents...');
    
    // Find documents with null or missing vehicleId that might cause conflicts
    const problematicDocs = await vehiclesDb.find({
      $or: [
        { vehicleId: null },
        { vehicleId: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${problematicDocs.length} documents with null/missing vehicleId`);
    
    if (problematicDocs.length > 0) {
      console.log('\n🗑️  Removing problematic vehicleId fields...');
      
      // Remove the vehicleId field entirely from Database Management documents
      // since they don't need it (they use Vehicle_ID)
      const result = await vehiclesDb.updateMany(
        {
          $or: [
            { vehicleId: null },
            { vehicleId: { $exists: false } }
          ]
        },
        {
          $unset: { vehicleId: "" }
        }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} documents`);
      
      // Also remove registrationNumber field if it exists (Database Management uses Registration_Number)
      const result2 = await vehiclesDb.updateMany(
        { registrationNumber: { $exists: true } },
        { $unset: { registrationNumber: "" } }
      );
      
      console.log(`✅ Cleaned ${result2.modifiedCount} documents of registrationNumber field`);
    }
    
    console.log('\n📊 Final verification...');
    const finalCheck = await vehiclesDb.countDocuments({ vehicleId: { $exists: true } });
    console.log(`Documents with vehicleId field: ${finalCheck}`);
    
    const regCheck = await vehiclesDb.countDocuments({ registrationNumber: { $exists: true } });
    console.log(`Documents with registrationNumber field: ${regCheck}`);
    
    console.log('\n✅ Database Management collection cleaned!');
    console.log('📝 Database Management uses: Vehicle_ID, Registration_Number (proper casing)');
    console.log('📝 Vehicle Deployment uses: vehicleId, registrationNumber (camelCase)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n📡 Closing MongoDB connection...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('\n🏁 Cleanup completed');
  }
}

cleanupVehicleData();
