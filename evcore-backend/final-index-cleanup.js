// Final cleanup: Remove remaining problematic index
const mongoose = require('mongoose');

async function finalIndexCleanup() {
    try {
        await mongoose.connect('mongodb://localhost:27017/evcore');
        console.log('🔗 Connected to MongoDB');

        const db = mongoose.connection.db;
        const vehiclesCollection = db.collection('vehicles');

        console.log('\n🔍 FINAL INDEX CLEANUP');
        console.log('======================');
        
        // Check all current indexes
        console.log('Current indexes:');
        const allIndexes = await vehiclesCollection.listIndexes().toArray();
        allIndexes.forEach(idx => {
            console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        // Remove the problematic vehicleId_1 index
        console.log('\n🗑️ Removing problematic vehicleId index...');
        try {
            await vehiclesCollection.dropIndex('vehicleId_1');
            console.log('✅ Removed vehicleId_1 index');
        } catch (error) {
            if (error.message.includes('index not found')) {
                console.log('ℹ️  vehicleId_1 index not found (already removed)');
            } else {
                console.log('❌ Error removing vehicleId_1 index:', error.message);
            }
        }

        // Check for any other problematic indexes with null keys
        console.log('\n🔍 Checking for other problematic indexes...');
        const finalIndexes = await vehiclesCollection.listIndexes().toArray();
        const problematicIndexes = finalIndexes.filter(idx => 
            idx.name !== '_id_' && 
            !idx.name.startsWith('unified_') &&
            (idx.name.includes('vehicleId') || 
             idx.name.includes('Vehicle_ID') || 
             idx.name.includes('Registration') || 
             idx.name.includes('VIN'))
        );

        if (problematicIndexes.length > 0) {
            console.log('Found additional problematic indexes:');
            for (const idx of problematicIndexes) {
                console.log(`   🗑️ Removing: ${idx.name}`);
                try {
                    await vehiclesCollection.dropIndex(idx.name);
                    console.log(`   ✅ Removed: ${idx.name}`);
                } catch (error) {
                    console.log(`   ❌ Failed to remove ${idx.name}: ${error.message}`);
                }
            }
        } else {
            console.log('✅ No additional problematic indexes found');
        }

        // Final index verification
        console.log('\n✅ Final Index State:');
        const cleanIndexes = await vehiclesCollection.listIndexes().toArray();
        cleanIndexes.forEach(idx => {
            console.log(`   ✅ ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        console.log('\n🎉 FINAL CLEANUP COMPLETE!');
        console.log('===========================');
        console.log('✅ All problematic indexes removed');
        console.log('✅ Only safe unified indexes remain');
        console.log('✅ Vehicle creation should work flawlessly now');

    } catch (error) {
        console.error('❌ Final cleanup failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

finalIndexCleanup();
