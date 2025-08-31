const mongoose = require('mongoose');
const config = require('./src/config/index');

async function checkAndCleanIndexes() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const vehiclesCollection = db.collection('vehicles');
    
    // Check all current indexes
    console.log('🔍 Current Vehicle Collection Indexes:');
    console.log('======================================');
    
    const indexes = await vehiclesCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. Name: ${index.name}`);
      console.log(`   Key: ${JSON.stringify(index.key)}`);
      console.log(`   Unique: ${!!index.unique}`);
      console.log(`   Sparse: ${!!index.sparse}`);
      console.log('   ---');
    });
    
    // Drop problematic indexes that might cause conflicts
    const problematicIndexes = ['Vehicle_ID_1', 'vehicleId_1'];
    
    for (const indexName of problematicIndexes) {
      try {
        await vehiclesCollection.dropIndex(indexName);
        console.log(`✅ Dropped problematic index: ${indexName}`);
      } catch (error) {
        console.log(`⚠️ Index ${indexName} may not exist: ${error.message}`);
      }
    }
    
    console.log('\n✅ Indexes after cleanup:');
    const finalIndexes = await vehiclesCollection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)} (Unique: ${!!index.unique})`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndCleanIndexes();
