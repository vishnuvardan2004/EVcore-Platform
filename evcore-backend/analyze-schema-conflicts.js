/**
 * Database Schema Conflict Analysis
 * Identifies why vehicle creation keeps failing
 */

const mongoose = require('mongoose');
const config = require('./src/config/index');

async function analyzeSchemaConflicts() {
  try {
    console.log('🔍 Analyzing Database Schema Conflicts');
    console.log('=====================================');
    
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Step 1: Check all vehicle-related collections
    const collections = await db.listCollections().toArray();
    const vehicleRelatedCollections = collections.filter(c => 
      c.name.toLowerCase().includes('vehicle')
    );
    
    console.log('\n📋 Vehicle-Related Collections:');
    vehicleRelatedCollections.forEach(col => {
      console.log(`   ${col.name}`);
    });
    
    // Step 2: Analyze vehicles collection indexes
    if (vehicleRelatedCollections.some(c => c.name === 'vehicles')) {
      console.log('\n🔍 Vehicle Collection Indexes:');
      const indexes = await db.collection('vehicles').indexes();
      indexes.forEach(idx => {
        const isProblematic = idx.unique && (
          JSON.stringify(idx.key).includes('null') ||
          Object.keys(idx.key).some(key => key.includes('_ID') || key.includes('Number'))
        );
        const status = isProblematic ? '⚠️ POTENTIAL CONFLICT' : '✅ OK';
        console.log(`   ${idx.name}: ${JSON.stringify(idx.key)} (Unique: ${!!idx.unique}) ${status}`);
      });
      
      // Step 3: Check document structure
      const sampleVehicle = await db.collection('vehicles').findOne({});
      if (sampleVehicle) {
        console.log('\n📄 Current Vehicle Document Fields:');
        const fields = Object.keys(sampleVehicle).filter(k => k !== '_id');
        fields.forEach(field => {
          const value = sampleVehicle[field];
          const type = typeof value;
          const isNull = value === null;
          console.log(`   ${field}: ${type} ${isNull ? '(NULL - POTENTIAL ISSUE)' : ''}`);
        });
      }
      
      // Step 4: Check for documents with problematic values
      console.log('\n🚨 Checking for Problematic Documents:');
      
      const nullRegistrationCount = await db.collection('vehicles').countDocuments({
        $or: [
          { Registration_Number: null },
          { Registration_Number: { $exists: false } },
          { registrationNumber: null },
          { registrationNumber: { $exists: false } }
        ]
      });
      
      const nullVinCount = await db.collection('vehicles').countDocuments({
        $or: [
          { VIN_Number: null },
          { VIN_Number: { $exists: false } },
          { vinNumber: null },
          { vinNumber: { $exists: false } }
        ]
      });
      
      const nullVehicleIdCount = await db.collection('vehicles').countDocuments({
        $or: [
          { Vehicle_ID: null },
          { Vehicle_ID: { $exists: false } },
          { vehicleId: null },
          { vehicleId: { $exists: false } }
        ]
      });
      
      console.log(`   Vehicles with null Registration Number: ${nullRegistrationCount}`);
      console.log(`   Vehicles with null VIN Number: ${nullVinCount}`);
      console.log(`   Vehicles with null Vehicle ID: ${nullVehicleIdCount}`);
      
      if (nullRegistrationCount > 0 || nullVinCount > 0 || nullVehicleIdCount > 0) {
        console.log('   🔴 PROBLEM IDENTIFIED: Multiple null values in unique fields');
      }
    }
    
    // Step 5: Check for competing schemas
    console.log('\n⚙️ Schema Conflict Analysis:');
    console.log('----------------------------');
    
    // Try to identify if there are multiple vehicle schemas loaded
    const loadedModels = mongoose.modelNames();
    const vehicleModels = loadedModels.filter(name => 
      name.toLowerCase().includes('vehicle')
    );
    
    console.log('Loaded Mongoose Models:', vehicleModels);
    
    // Step 6: Identify the root cause
    console.log('\n🎯 Root Cause Analysis:');
    console.log('------------------------');
    
    const totalVehicles = await db.collection('vehicles').countDocuments();
    
    if (totalVehicles === 0) {
      console.log('❌ NO VEHICLES IN DATABASE');
      console.log('   Issue: Database is empty but creation is still failing');
      console.log('   Cause: Schema validation or index conflicts');
    } else if (nullRegistrationCount > 1) {
      console.log('❌ MULTIPLE NULL VALUES IN UNIQUE FIELDS');
      console.log('   Issue: Database has multiple documents with null values in unique fields');
      console.log('   Cause: Previous documents created without proper validation');
    } else {
      console.log('⚠️ INTERMITTENT CONFLICTS');
      console.log('   Issue: Schema or validation conflicts between different parts of the system');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Analysis complete');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

analyzeSchemaConflicts();
