// Examine actual vehicle collection structure
const mongoose = require('mongoose');

async function examineVehicleCollection() {
    try {
        await mongoose.connect('mongodb://localhost:27017/evcore');
        console.log('🔗 Connected to MongoDB');

        const db = mongoose.connection.db;
        const vehiclesCollection = db.collection('vehicles');

        console.log('\n🔍 EXAMINING VEHICLE COLLECTION');
        console.log('===============================');

        // Get sample documents to understand the actual structure
        console.log('Sample documents in vehicles collection:');
        const sampleVehicles = await vehiclesCollection.find({}).limit(3).toArray();
        
        if (sampleVehicles.length === 0) {
            console.log('ℹ️  No vehicles found in collection');
            
            // Check if we should be looking at vehicledeployments instead
            const deploymentCollection = db.collection('vehicle_deployments');
            const sampleDeployments = await deploymentCollection.find({}).limit(3).toArray();
            
            if (sampleDeployments.length > 0) {
                console.log('\n📋 Found vehicles in vehicle_deployments collection:');
                sampleDeployments.forEach((vehicle, index) => {
                    console.log(`\n   Vehicle ${index + 1}:`);
                    console.log('   Field Names:', Object.keys(vehicle));
                    console.log('   Sample Data:', {
                        vehicleId: vehicle.vehicleId,
                        registrationNumber: vehicle.registrationNumber,
                        make: vehicle.make,
                        model: vehicle.model
                    });
                });
            }
        } else {
            sampleVehicles.forEach((vehicle, index) => {
                console.log(`\n   Vehicle ${index + 1}:`);
                console.log('   Field Names:', Object.keys(vehicle));
                console.log('   Sample Data:', {
                    vehicleId: vehicle.vehicleId,
                    Vehicle_ID: vehicle.Vehicle_ID,
                    registrationNumber: vehicle.registrationNumber,
                    Registration_Number: vehicle.Registration_Number,
                    make: vehicle.make,
                    Make: vehicle.Make,
                    model: vehicle.model,
                    Model: vehicle.Model
                });
            });
        }

        // Check indexes on both collections
        console.log('\n📊 Indexes on vehicles collection:');
        const vehicleIndexes = await vehiclesCollection.listIndexes().toArray();
        vehicleIndexes.forEach(idx => {
            console.log(`   ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        console.log('\n📊 Indexes on vehicle_deployments collection:');
        const deploymentCollection = db.collection('vehicle_deployments');
        const deploymentIndexes = await deploymentCollection.listIndexes().toArray();
        deploymentIndexes.forEach(idx => {
            console.log(`   ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        // Get collection stats
        console.log('\n📈 Collection Statistics:');
        try {
            const vehicleStats = await vehiclesCollection.stats();
            console.log(`   vehicles collection: ${vehicleStats.count} documents`);
        } catch (error) {
            console.log('   vehicles collection: stats not available');
        }
        
        try {
            const deploymentStats = await deploymentCollection.stats();
            console.log(`   vehicle_deployments collection: ${deploymentStats.count} documents`);
        } catch (error) {
            console.log('   vehicle_deployments collection: stats not available');
        }

        console.log('\n🎯 UNDERSTANDING:');
        console.log('==================');
        console.log('This will help us understand which collection and field names');
        console.log('are actually being used for vehicle storage in your system.');

    } catch (error) {
        console.error('❌ Examination failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

examineVehicleCollection();
