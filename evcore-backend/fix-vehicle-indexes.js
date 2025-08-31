/**
 * MongoDB Index Cleanup Script
 * This script removes conflicting indexes that are causing vehicle creation errors
 */

const mongoose = require('mongoose');
const config = require('./src/config');

async function cleanupConflictingIndexes() {
  try {
    console.log('🔧 MongoDB Index Cleanup Script');
    console.log('=====================================\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get the vehicles collection
    const db = mongoose.connection.db;
    const vehiclesCollection = db.collection('vehicles');

    console.log('🔍 Checking existing indexes on vehicles collection...');
    
    // List all indexes
    const indexes = await vehiclesCollection.indexes();
    console.log('Current indexes:');
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });
    console.log('');

    // Check if problematic vehicleId index exists
    const problemIndex = indexes.find(idx => idx.name === 'vehicleId_1');
    
    if (problemIndex) {
      console.log('⚠️  Found problematic vehicleId_1 index!');
      console.log('🗑️  Dropping conflicting vehicleId_1 index...');
      
      try {
        await vehiclesCollection.dropIndex('vehicleId_1');
        console.log('✅ Successfully dropped vehicleId_1 index');
      } catch (error) {
        if (error.codeName === 'IndexNotFound') {
          console.log('ℹ️  Index already removed or doesn\'t exist');
        } else {
          console.error('❌ Error dropping index:', error.message);
        }
      }
    } else {
      console.log('✅ No conflicting vehicleId_1 index found');
    }

    // Check for other potential conflicts
    const conflictingIndexes = indexes.filter(idx => 
      idx.name.includes('vehicleId') && idx.name !== '_id_'
    );

    if (conflictingIndexes.length > 0) {
      console.log('\n⚠️  Found other potentially conflicting indexes:');
      for (const idx of conflictingIndexes) {
        console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
        try {
          await vehiclesCollection.dropIndex(idx.name);
          console.log(`   ✅ Dropped ${idx.name}`);
        } catch (error) {
          console.log(`   ❌ Failed to drop ${idx.name}: ${error.message}`);
        }
      }
    }

    console.log('\n🔍 Final index check...');
    const finalIndexes = await vehiclesCollection.indexes();
    console.log('Remaining indexes:');
    finalIndexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Index cleanup completed!');
    console.log('🎉 Database Management vehicle creation should now work without conflicts.');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  } finally {
    // Close connection
    console.log('\n📡 Closing MongoDB connection...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupConflictingIndexes().then(() => {
  console.log('\n🏁 Cleanup script completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Cleanup script failed:', error);
  process.exit(1);
});
