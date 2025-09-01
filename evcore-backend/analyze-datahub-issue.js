// Solution: Fix Data Hub Service to handle both field naming conventions
// This ensures Vehicle Deployment validation works without breaking Database Management

const mongoose = require('mongoose');

async function fixDataHubCompatibility() {
    try {
        await mongoose.connect('mongodb://localhost:27017/evcore');
        console.log('🔗 Connected to MongoDB');

        console.log('\n🔧 FIXING DATA HUB COMPATIBILITY ISSUE');
        console.log('======================================');
        console.log('Problem: Vehicle Deployment validation looks for PascalCase fields');
        console.log('Current: Database uses camelCase fields after permanent fix');
        console.log('Solution: Make Data Hub Service compatible with both formats\n');

        // Step 1: Check current vehicle field structure
        const db = mongoose.connection.db;
        const vehiclesCollection = db.collection('vehicles');
        
        console.log('📊 Current Vehicle Collection Structure:');
        const sampleVehicle = await vehiclesCollection.findOne({});
        if (sampleVehicle) {
            console.log('Field names:', Object.keys(sampleVehicle));
            console.log('Sample registration field:', {
                'Registration_Number': sampleVehicle.Registration_Number,
                'registrationNumber': sampleVehicle.registrationNumber
            });
        } else {
            console.log('No vehicles found to analyze');
        }

        // Step 2: Test the problematic query
        console.log('\n🧪 Testing Current Data Hub Query:');
        const testRegistration = '23453454'; // Using a known registration
        
        console.log(`Looking for vehicle with registration: ${testRegistration}`);
        
        // Try PascalCase (current Data Hub Service approach)
        const pascalResult = await vehiclesCollection.findOne({
            Registration_Number: { $regex: new RegExp(`^${testRegistration}$`, 'i') }
        });
        console.log('PascalCase query result:', pascalResult ? 'FOUND' : 'NOT FOUND');
        
        // Try camelCase (fixed database approach)
        const camelResult = await vehiclesCollection.findOne({
            registrationNumber: { $regex: new RegExp(`^${testRegistration}$`, 'i') }
        });
        console.log('camelCase query result:', camelResult ? 'FOUND' : 'NOT FOUND');

        // Step 3: Show the solution approach
        console.log('\n💡 SOLUTION APPROACH:');
        console.log('================');
        console.log('✅ Update Data Hub Service to query both field formats');
        console.log('✅ This ensures Vehicle Deployment validation works');
        console.log('✅ Database Management continues working normally');
        console.log('✅ No database structure changes needed');

        // Step 4: Test the dual-format query approach
        console.log('\n🧪 Testing Dual-Format Query:');
        const dualFormatResult = await vehiclesCollection.findOne({
            $or: [
                { Registration_Number: { $regex: new RegExp(`^${testRegistration}$`, 'i') } },
                { registrationNumber: { $regex: new RegExp(`^${testRegistration}$`, 'i') } }
            ]
        });
        console.log('Dual-format query result:', dualFormatResult ? 'FOUND' : 'NOT FOUND');
        
        if (dualFormatResult) {
            console.log('✅ Solution will work - vehicle found with dual query');
        } else {
            console.log('❌ No vehicle found - will need to add test data first');
        }

        console.log('\n🎯 NEXT STEPS:');
        console.log('==============');
        console.log('1. Update src/services/dataHubService.js to use dual-format queries');
        console.log('2. Ensure both PascalCase and camelCase field searches work');
        console.log('3. Test Vehicle Deployment validation');
        console.log('4. Verify Database Management still works');

        console.log('\n✅ Analysis Complete!');
        console.log('The issue is a field naming mismatch between systems.');
        console.log('Solution: Make Data Hub Service compatible with both formats.');

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

fixDataHubCompatibility();
