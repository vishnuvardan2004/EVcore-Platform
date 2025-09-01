// Add test vehicles for autocomplete demonstration
const mongoose = require('mongoose');

async function addTestVehiclesForAutocomplete() {
    try {
        await mongoose.connect('mongodb://localhost:27017/evcore');
        console.log('🔗 Connected to MongoDB');

        const db = mongoose.connection.db;
        const vehiclesCollection = db.collection('vehicles');

        console.log('\n📝 ADDING TEST VEHICLES FOR AUTOCOMPLETE DEMO');
        console.log('===============================================');

        // Add realistic vehicles with various registration patterns
        const testVehicles = [
            {
                vehicleId: 'AUTO-DEMO-001',
                registrationNumber: '2345678901',
                vinNumber: 'DEMO-VIN-001',
                make: 'Tesla',
                model: 'Model 3',
                year: 2024,
                batteryCapacity: 75,
                range: 500,
                chargingType: 'DC',
                status: 'active',
                currentHub: 'Bangalore Hub',
                createdAt: new Date(),
                isActive: true
            },
            {
                vehicleId: 'AUTO-DEMO-002', 
                registrationNumber: '234ABC5678',
                vinNumber: 'DEMO-VIN-002',
                make: 'Tata',
                model: 'Nexon EV',
                year: 2024,
                batteryCapacity: 40,
                range: 312,
                chargingType: 'AC',
                status: 'active',
                currentHub: 'Mumbai Hub',
                createdAt: new Date(),
                isActive: true
            },
            {
                vehicleId: 'AUTO-DEMO-003',
                registrationNumber: '90XY123456',
                vinNumber: 'DEMO-VIN-003',
                make: 'Mahindra',
                model: 'XUV400',
                year: 2024,
                batteryCapacity: 39,
                range: 456,
                chargingType: 'DC',
                status: 'active',
                currentHub: 'Delhi Hub',
                createdAt: new Date(),
                isActive: true
            },
            {
                vehicleId: 'AUTO-DEMO-004',
                registrationNumber: '9012DEF345',
                vinNumber: 'DEMO-VIN-004',
                make: 'MG',
                model: 'ZS EV',
                year: 2024,
                batteryCapacity: 44,
                range: 461,
                chargingType: 'DC',
                status: 'active',
                currentHub: 'Pune Hub',
                createdAt: new Date(),
                isActive: true
            },
            {
                vehicleId: 'AUTO-DEMO-005',
                registrationNumber: 'KA01MX2024',
                vinNumber: 'DEMO-VIN-005',
                make: 'Hyundai',
                model: 'Kona Electric',
                year: 2024,
                batteryCapacity: 39,
                range: 452,
                chargingType: 'DC',
                status: 'active',
                currentHub: 'Bangalore Hub',
                createdAt: new Date(),
                isActive: true
            }
        ];

        console.log('Adding test vehicles for autocomplete demo...');
        let addedCount = 0;
        
        for (let i = 0; i < testVehicles.length; i++) {
            const vehicle = testVehicles[i];
            try {
                const result = await vehiclesCollection.insertOne(vehicle);
                console.log(`✅ Vehicle ${i + 1}: ${vehicle.registrationNumber} - ${vehicle.make} ${vehicle.model}`);
                addedCount++;
            } catch (error) {
                if (error.code === 11000) {
                    console.log(`ℹ️  Vehicle ${i + 1}: ${vehicle.registrationNumber} (already exists)`);
                } else {
                    console.log(`❌ Vehicle ${i + 1}: Failed - ${error.message}`);
                }
            }
        }

        console.log(`\n✅ Added ${addedCount} new test vehicles`);
        console.log('\n🧪 Test the autocomplete with these patterns:');
        console.log('- Type "2" to see vehicles starting with 2');
        console.log('- Type "23" to see more specific matches');
        console.log('- Type "90" to see vehicles starting with 90');
        console.log('- Type "KA" to see vehicles starting with KA');

        console.log('\n🎯 Vehicle Registration Numbers Available:');
        testVehicles.forEach((vehicle, index) => {
            console.log(`   ${index + 1}. ${vehicle.registrationNumber} - ${vehicle.make} ${vehicle.model}`);
        });

    } catch (error) {
        console.error('❌ Failed to add test vehicles:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

addTestVehiclesForAutocomplete();
