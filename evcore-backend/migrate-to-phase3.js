const mongoose = require('mongoose');
const config = require('./src/config');

async function migrateToPhase3() {
  console.log('🚀 Phase 3 Migration: Complete Reference-Based Architecture');
  console.log('================================================================\n');

  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get database collections
    const deployments = mongoose.connection.db.collection('deployments');
    const vehicleDeployments = mongoose.connection.db.collection('vehicle_deployments');
    const vehicles = mongoose.connection.db.collection('vehicles'); // Data Hub

    // Step 1: Analyze current deployment data
    console.log('📊 Analyzing current deployment data...');
    const totalDeployments = await deployments.countDocuments();
    const legacyDeployments = await deployments.countDocuments({ source: { $ne: 'data-hub-reference' } });
    const dataHubDeployments = await deployments.countDocuments({ source: 'data-hub-reference' });
    
    console.log(`   Total deployments: ${totalDeployments}`);
    console.log(`   Legacy deployments (need migration): ${legacyDeployments}`);
    console.log(`   Data Hub deployments (already migrated): ${dataHubDeployments}\n`);

    // Step 2: Migrate legacy deployments to reference Data Hub
    if (legacyDeployments > 0) {
      console.log('🔄 Migrating legacy deployments to Data Hub references...');
      
      const legacyDeploys = await deployments.find({ 
        source: { $ne: 'data-hub-reference' } 
      }).toArray();

      let migratedCount = 0;
      let errorCount = 0;

      for (const deployment of legacyDeploys) {
        try {
          // Try to find the corresponding vehicle in Vehicle Deployment collection
          let vehicleInfo = null;
          
          if (deployment.vehicleId) {
            const vehicleDeployment = await vehicleDeployments.findOne({
              _id: deployment.vehicleId
            });
            
            if (vehicleDeployment && vehicleDeployment.registrationNumber) {
              // Try to find this vehicle in Data Hub by registration
              const dataHubVehicle = await vehicles.findOne({
                Registration_Number: { 
                  $regex: new RegExp(`^${vehicleDeployment.registrationNumber}$`, 'i') 
                }
              });

              if (dataHubVehicle) {
                vehicleInfo = {
                  dataHubId: dataHubVehicle._id,
                  registrationNumber: dataHubVehicle.Registration_Number,
                  vehicleId: dataHubVehicle.Vehicle_ID,
                  brand: dataHubVehicle.Brand,
                  model: dataHubVehicle.Model
                };
              }
            }
          }

          if (vehicleInfo) {
            // Update deployment to use Data Hub reference
            await deployments.updateOne(
              { _id: deployment._id },
              {
                $set: {
                  dataHubVehicleId: vehicleInfo.dataHubId,
                  vehicleRegistration: vehicleInfo.registrationNumber,
                  vehicleDetails: {
                    brand: vehicleInfo.brand,
                    model: vehicleInfo.model,
                    vehicleId: vehicleInfo.vehicleId,
                    registrationNumber: vehicleInfo.registrationNumber
                  },
                  source: 'data-hub-reference'
                },
                $unset: {
                  vehicleId: "" // Remove old reference
                }
              }
            );
            migratedCount++;
          } else {
            console.log(`   ⚠️  Could not find Data Hub match for deployment ${deployment.deploymentId}`);
            errorCount++;
          }
        } catch (error) {
          console.error(`   ❌ Error migrating deployment ${deployment.deploymentId}:`, error.message);
          errorCount++;
        }
      }

      console.log(`   ✅ Successfully migrated: ${migratedCount} deployments`);
      console.log(`   ⚠️  Could not migrate: ${errorCount} deployments\n`);
    }

    // Step 3: Analyze Vehicle Deployment collection usage
    console.log('🗂️  Analyzing Vehicle Deployment collection...');
    const totalVehicleDeployments = await vehicleDeployments.countDocuments();
    const referencedVehicleDeployments = await deployments.countDocuments({
      vehicleId: { $exists: true }
    });
    
    console.log(`   Total vehicle deployment records: ${totalVehicleDeployments}`);
    console.log(`   Still referenced by deployments: ${referencedVehicleDeployments}`);

    // Step 4: Archive Vehicle Deployment collection (don't delete yet for safety)
    if (totalVehicleDeployments > 0 && referencedVehicleDeployments === 0) {
      console.log('\n📦 Archiving Vehicle Deployment collection...');
      
      // Create archive collection
      const archiveCollection = mongoose.connection.db.collection('vehicle_deployments_archive_phase3');
      
      // Copy all data to archive
      const vehicleDeploymentData = await vehicleDeployments.find({}).toArray();
      if (vehicleDeploymentData.length > 0) {
        await archiveCollection.insertMany(vehicleDeploymentData);
        console.log(`   ✅ Archived ${vehicleDeploymentData.length} vehicle deployment records`);
      }

      // Add metadata to archive
      await archiveCollection.insertOne({
        _metadata: {
          archivedAt: new Date(),
          archivedBy: 'Phase3Migration',
          reason: 'Complete migration to Data Hub reference-based architecture',
          originalCollection: 'vehicle_deployments'
        }
      });

      console.log('   📋 Archive collection created: vehicle_deployments_archive_phase3');
      console.log('   ⚠️  Original vehicle_deployments collection preserved for safety');
    }

    // Step 5: Verify migration success
    console.log('\n✅ Verifying migration...');
    const finalDataHubDeployments = await deployments.countDocuments({ 
      source: 'data-hub-reference' 
    });
    const finalLegacyDeployments = await deployments.countDocuments({ 
      source: { $ne: 'data-hub-reference' } 
    });

    console.log(`   Data Hub deployments: ${finalDataHubDeployments}`);
    console.log(`   Legacy deployments: ${finalLegacyDeployments}`);

    // Step 6: Data Hub integration test
    console.log('\n🔍 Testing Data Hub integration...');
    const sampleDataHubVehicles = await vehicles.countDocuments();
    console.log(`   Data Hub vehicles available: ${sampleDataHubVehicles}`);

    if (finalLegacyDeployments === 0) {
      console.log('\n🎉 Phase 3 Migration SUCCESSFUL!');
      console.log('   ✅ All deployments now use Data Hub references');
      console.log('   ✅ Vehicle Deployment collection archived');
      console.log('   ✅ System ready for pure reference-based architecture');
    } else {
      console.log('\n⚠️  Phase 3 Migration PARTIALLY COMPLETE');
      console.log(`   ${finalLegacyDeployments} deployments still need manual review`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n📡 Closing MongoDB connection...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('\n🏁 Phase 3 migration completed');
    process.exit(0);
  }
}

migrateToPhase3();
