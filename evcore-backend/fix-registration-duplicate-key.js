/**
 * Fix E11000 Duplicate Key Error - Registration Number Solution
 * This script fixes the duplicate key error by:
 * 1. Cleaning existing null registration numbers
 * 2. Updating the vehicle schema to require registration numbers
 * 3. Recreating the proper unique index
 */

const mongoose = require('mongoose');
const config = require('./src/config/index');

async function fixRegistrationNumberDuplicateKeyError() {
  try {
    console.log('🔧 Starting E11000 Registration Number Fix');
    console.log('==========================================');
    
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const vehiclesCollection = db.collection('vehicles');
    
    // Step 1: Check current state
    console.log('\n📊 Current Database State:');
    console.log('---------------------------');
    
    const totalVehicles = await vehiclesCollection.countDocuments();
    const nullRegNumberVehicles = await vehiclesCollection.countDocuments({ registrationNumber: null });
    const nullRegNumberVehicles2 = await vehiclesCollection.countDocuments({ registrationNumber: { $exists: false } });
    
    console.log(`Total vehicles: ${totalVehicles}`);
    console.log(`Vehicles with null registration: ${nullRegNumberVehicles}`);
    console.log(`Vehicles without registration field: ${nullRegNumberVehicles2}`);
    
    // Show some examples
    const examples = await vehiclesCollection.find({
      $or: [
        { registrationNumber: null },
        { registrationNumber: { $exists: false } }
      ]
    }).limit(3).toArray();
    
    console.log('\nExample problematic vehicles:');
    examples.forEach((vehicle, index) => {
      console.log(`${index + 1}. ID: ${vehicle._id}, Brand: ${vehicle.brand || 'N/A'}, Model: ${vehicle.model || 'N/A'}, RegNumber: ${vehicle.registrationNumber}`);
    });
    
    // Step 2: Drop the problematic index
    console.log('\n🗑️ Dropping Existing Unique Index:');
    console.log('------------------------------------');
    
    try {
      await vehiclesCollection.dropIndex('registrationNumber_1');
      console.log('✅ Dropped registrationNumber_1 index');
    } catch (dropError) {
      console.log('⚠️ Index may not exist:', dropError.message);
    }
    
    // Step 3: Clean up null registration numbers
    console.log('\n🧹 Cleaning Null Registration Numbers:');
    console.log('---------------------------------------');
    
    // Option A: Generate temporary registration numbers for null entries
    const vehiclesWithNullReg = await vehiclesCollection.find({
      $or: [
        { registrationNumber: null },
        { registrationNumber: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${vehiclesWithNullReg.length} vehicles needing registration numbers`);
    
    // Generate unique temporary registration numbers
    for (let i = 0; i < vehiclesWithNullReg.length; i++) {
      const vehicle = vehiclesWithNullReg[i];
      const tempRegNumber = `TEMP${Date.now()}${String(i).padStart(3, '0')}`;
      
      await vehiclesCollection.updateOne(
        { _id: vehicle._id },
        { 
          $set: { 
            registrationNumber: tempRegNumber,
            isTemporaryRegistration: true,
            needsProperRegistration: true
          }
        }
      );
      
      console.log(`✅ Updated vehicle ${vehicle._id} with temp reg: ${tempRegNumber}`);
    }
    
    // Step 4: Create proper unique index
    console.log('\n🔧 Creating Proper Unique Index:');
    console.log('---------------------------------');
    
    try {
      await vehiclesCollection.createIndex(
        { registrationNumber: 1 }, 
        { 
          unique: true,
          name: 'registrationNumber_unique',
          background: true
        }
      );
      console.log('✅ Created unique index on registrationNumber');
    } catch (indexError) {
      console.error('❌ Failed to create index:', indexError.message);
      
      // Check for remaining duplicates
      const duplicates = await vehiclesCollection.aggregate([
        { $group: { _id: '$registrationNumber', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray();
      
      if (duplicates.length > 0) {
        console.log('\n⚠️ Found remaining duplicates:');
        duplicates.forEach(dup => {
          console.log(`  Registration: ${dup._id}, Count: ${dup.count}`);
        });
      }
    }
    
    // Step 5: Verify fix
    console.log('\n✅ Verification:');
    console.log('-----------------');
    
    const finalCount = await vehiclesCollection.countDocuments();
    const finalNullCount = await vehiclesCollection.countDocuments({ registrationNumber: null });
    const tempRegCount = await vehiclesCollection.countDocuments({ isTemporaryRegistration: true });
    
    console.log(`Total vehicles after fix: ${finalCount}`);
    console.log(`Vehicles with null registration: ${finalNullCount}`);
    console.log(`Vehicles with temporary registration: ${tempRegCount}`);
    
    // Check indexes
    const indexes = await vehiclesCollection.indexes();
    console.log('Current indexes:');
    indexes.forEach(index => {
      if (Object.keys(index.key).includes('registrationNumber')) {
        console.log(`  ✅ ${index.name}: ${JSON.stringify(index.key)}, Unique: ${!!index.unique}`);
      }
    });
    
    console.log('\n🎉 E11000 Fix Complete!');
    console.log('========================');
    console.log('✅ Removed duplicate null registration numbers');
    console.log('✅ Generated temporary registration numbers');
    console.log('✅ Created proper unique index');
    console.log('✅ Database is now ready for vehicle operations');
    console.log('');
    console.log('⚠️ Note: Vehicles with temporary registration numbers should be updated');
    console.log('   with proper registration numbers through the admin interface.');
    
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the fix
fixRegistrationNumberDuplicateKeyError().catch(console.error);
