// Test the fixed Data Hub Service
const mongoose = require('mongoose');

// Import the fixed Data Hub Service (singleton instance)
const dataHubService = require('./src/services/dataHubService');

async function testFixedDataHubService() {
    try {
        await mongoose.connect('mongodb://localhost:27017/evcore');
        console.log('🔗 Connected to MongoDB');

        console.log('\n🧪 TESTING FIXED DATA HUB SERVICE');
        console.log('==================================');
        
        // Test 1: Vehicle lookup that previously failed
        console.log('\n📝 Test 1: Find vehicle by registration number');
        const testRegistration = '23453454';
        console.log(`Looking for vehicle: ${testRegistration}`);
        
        const vehicle = await dataHubService.findVehicleByRegistration(testRegistration);
        if (vehicle) {
            console.log('✅ SUCCESS: Vehicle found!');
            console.log('  Registration:', vehicle.registrationNumber);
            console.log('  Make/Model:', vehicle.brand, vehicle.model);
            console.log('  Vehicle ID:', vehicle.vehicleId);
            console.log('  Data Hub ID:', vehicle.dataHubId);
        } else {
            console.log('❌ FAILED: Vehicle not found');
        }

        // Test 2: Vehicle validation for deployment
        console.log('\n📝 Test 2: Validate vehicle for deployment');
        const validationResult = await dataHubService.validateVehicleForDeployment(testRegistration);
        
        console.log('Validation Result:');
        console.log('  Valid:', validationResult.valid ? '✅ YES' : '❌ NO');
        if (validationResult.valid) {
            console.log('  Vehicle Data:', {
                registration: validationResult.vehicle.registrationNumber,
                brand: validationResult.vehicle.brand,
                model: validationResult.vehicle.model
            });
        } else {
            console.log('  Error:', validationResult.error);
            console.log('  Suggestion:', validationResult.suggestion);
        }

        // Test 3: Test with second vehicle
        console.log('\n📝 Test 3: Test with second vehicle');
        const testRegistration2 = 'KA01AB1234';
        console.log(`Looking for vehicle: ${testRegistration2}`);
        
        const vehicle2 = await dataHubService.findVehicleByRegistration(testRegistration2);
        if (vehicle2) {
            console.log('✅ SUCCESS: Second vehicle found!');
            console.log('  Registration:', vehicle2.registrationNumber);
            console.log('  Make/Model:', vehicle2.brand, vehicle2.model);
        } else {
            console.log('❌ FAILED: Second vehicle not found');
        }

        // Test 4: Test with non-existent vehicle (should fail gracefully)
        console.log('\n📝 Test 4: Test with fake vehicle (should fail)');
        const fakeRegistration = 'FAKE12345';
        console.log(`Looking for vehicle: ${fakeRegistration}`);
        
        const fakeVehicle = await dataHubService.findVehicleByRegistration(fakeRegistration);
        if (fakeVehicle) {
            console.log('❌ PROBLEM: Fake vehicle was found (should not happen)');
        } else {
            console.log('✅ SUCCESS: Fake vehicle correctly rejected');
        }

        const fakeValidation = await dataHubService.validateVehicleForDeployment(fakeRegistration);
        console.log('Fake validation result:');
        console.log('  Valid:', fakeValidation.valid ? '❌ YES (PROBLEM)' : '✅ NO (CORRECT)');
        if (!fakeValidation.valid) {
            console.log('  Error:', fakeValidation.error);
        }

        console.log('\n🎉 DATA HUB SERVICE TEST COMPLETE!');
        console.log('===================================');
        if (vehicle && validationResult.valid && vehicle2 && !fakeVehicle && !fakeValidation.valid) {
            console.log('✅ ALL TESTS PASSED');
            console.log('✅ Vehicle Deployment validation now works!');
            console.log('✅ Only real vehicles from Database Management can be deployed');
            console.log('✅ Fake vehicles are properly rejected');
            console.log('\n🚀 Your Vehicle Deployment system is fixed!');
        } else {
            console.log('❌ Some tests failed - check the results above');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

testFixedDataHubService();
