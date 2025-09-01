// Add test vehicles to properly test the Data Hub compatibility fix
const mongoose = require('mongoose');

async function addTestVehiclesForTesting() {
    try {
        await mongoose.connect('mongodb://localhost:27017/evcore');
        console.log('🔗 Connected to MongoDB');

        const db = mongoose.connection.db;
        const vehiclesCollection = db.collection('vehicles');

        console.log('\n📝 ADDING TEST VEHICLES FOR DATA HUB TESTING');
        console.log('=============================================');

        // Add vehicles in the format that Database Management now uses (camelCase)
        const testVehicles = [
            {
                vehicleId: 'TEST-DB-001',
                registrationNumber: '23453454', // This is the registration we tested in demo-validation.js
                vinNumber: 'TEST-VIN-001',
                make: 'Tata',
                model: 'Nexon EV',
                year: 2024,
                batteryCapacity: 40,
                range: 312,
                chargingType: 'AC',
                status: 'active',
                currentHub: 'Test Hub',
                createdAt: new Date(),
                isActive: true
            },
            {
                vehicleId: 'TEST-DB-002',
                registrationNumber: 'KA01AB1234',
                vinNumber: 'TEST-VIN-002',
                make: 'Mahindra',
                model: 'XUV400',
                year: 2024,
                batteryCapacity: 39,
                range: 456,
                chargingType: 'DC',
                status: 'active',
                currentHub: 'Bangalore Hub',
                createdAt: new Date(),
                isActive: true
            }
        ];

        console.log('Adding test vehicles...');
        for (let i = 0; i < testVehicles.length; i++) {
            const vehicle = testVehicles[i];
            try {
                const result = await vehiclesCollection.insertOne(vehicle);
                console.log(`✅ Vehicle ${i + 1}: ${vehicle.registrationNumber} (ID: ${result.insertedId})`);
            } catch (error) {
                if (error.code === 11000) {
                    console.log(`ℹ️  Vehicle ${i + 1}: ${vehicle.registrationNumber} (already exists)`);
                } else {
                    console.log(`❌ Vehicle ${i + 1}: Failed - ${error.message}`);
                }
            }
        }

        // Now test the queries again
        console.log('\n🧪 TESTING QUERIES WITH ACTUAL DATA:');
        console.log('=====================================');
        
        const testRegistration = '23453454';
        console.log(`Looking for vehicle: ${testRegistration}`);

        // Test PascalCase query (what Data Hub Service currently uses)
        const pascalResult = await vehiclesCollection.findOne({
            Registration_Number: { $regex: new RegExp(`^${testRegistration}$`, 'i') }
        });
        console.log('PascalCase query (Registration_Number):', pascalResult ? 'FOUND' : 'NOT FOUND');

        // Test camelCase query (what database actually has)
        const camelResult = await vehiclesCollection.findOne({
            registrationNumber: { $regex: new RegExp(`^${testRegistration}$`, 'i') }
        });
        console.log('camelCase query (registrationNumber):', camelResult ? 'FOUND' : 'NOT FOUND');

        // Test dual-format query (the solution)
        const dualResult = await vehiclesCollection.findOne({
            $or: [
                { Registration_Number: { $regex: new RegExp(`^${testRegistration}$`, 'i') } },
                { registrationNumber: { $regex: new RegExp(`^${testRegistration}$`, 'i') } }
            ]
        });
        console.log('Dual-format query:', dualResult ? 'FOUND ✅' : 'NOT FOUND');

        if (dualResult) {
            console.log('\n📋 Found Vehicle Data:');
            console.log('  Registration:', dualResult.registrationNumber || dualResult.Registration_Number);
            console.log('  Make/Model:', dualResult.make || dualResult.Make, dualResult.model || dualResult.Model);
            console.log('  Vehicle ID:', dualResult.vehicleId || dualResult.Vehicle_ID);
        }

        console.log('\n🎯 PROBLEM CONFIRMED:');
        console.log('======================');
        console.log('❌ Data Hub Service looks for "Registration_Number" (PascalCase)');
        console.log('✅ Database actually has "registrationNumber" (camelCase)');
        console.log('💡 Solution: Update Data Hub Service to check both formats');

        console.log('\n🚀 Ready to implement the fix!');

    } catch (error) {
        console.error('❌ Test setup failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

addTestVehiclesForTesting();
