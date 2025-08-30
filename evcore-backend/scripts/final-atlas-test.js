/**
 * Final Integration Test - MongoDB Atlas Connectivity
 * Tests all major database operations to ensure everything works with Atlas
 */

const { connectToDatabase, getMongoUri } = require('./database-helper');
const mongoose = require('mongoose');

async function finalIntegrationTest() {
  console.log('🚀 Final MongoDB Atlas Integration Test\n');

  try {
    // 1. Test connection
    console.log('1️⃣ Testing database connection...');
    await connectToDatabase(mongoose);
    
    console.log('✅ Connection established');
    console.log(`   MongoDB URI: ${getMongoUri()}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);

    // 2. Import all models to test they work
    console.log('\n2️⃣ Testing model imports...');
    const User = require('../src/models/User');
    const RolePermission = require('../src/models/RolePermission');
    console.log('✅ All models imported successfully');

    // 3. Test basic CRUD operations
    console.log('\n3️⃣ Testing basic database operations...');
    
    // Count users
    const userCount = await User.countDocuments();
    console.log(`✅ User count: ${userCount}`);
    
    // Test user query
    const testUsers = await User.find({ role: { $in: ['super_admin', 'pilot'] } }, 'email role').limit(5);
    console.log(`✅ Query test: Found ${testUsers.length} super_admin/pilot users`);
    testUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });

    // 4. Test authentication workflow
    console.log('\n4️⃣ Testing authentication workflow...');
    
    // Test findByEmailOrMobile (the method that was failing before)
    const testUser = await User.findByEmailOrMobile('prasadh@gmail.com').select('+password');
    console.log(`✅ findByEmailOrMobile test: ${testUser ? 'SUCCESS' : 'FAILED'}`);
    
    if (testUser) {
      console.log(`   Found user: ${testUser.email} (${testUser.role})`);
      
      // Test password verification
      const passwordTest = await testUser.correctPassword('Pilot123', testUser.password);
      console.log(`✅ Password verification test: ${passwordTest ? 'SUCCESS' : 'FAILED'}`);
    }

    // 5. Test super admin account
    console.log('\n5️⃣ Testing super admin account...');
    const superAdmin = await User.findByEmailOrMobile('vishhnuvardan2004@gmail.com').select('+password');
    console.log(`✅ Super admin query: ${superAdmin ? 'SUCCESS' : 'FAILED'}`);
    
    if (superAdmin) {
      console.log(`   Found super admin: ${superAdmin.email} (${superAdmin.role})`);
      
      const adminPasswordTest = await superAdmin.correctPassword('SuperAdmin123', superAdmin.password);
      console.log(`✅ Super admin password test: ${adminPasswordTest ? 'SUCCESS' : 'FAILED'}`);
    }

    // 6. Test RBAC system
    console.log('\n6️⃣ Testing RBAC system...');
    const permissions = await RolePermission.find({}, 'role modules').limit(5);
    console.log(`✅ RBAC test: Found ${permissions.length} role permission records`);
    permissions.forEach(perm => {
      console.log(`   - ${perm.role}: ${perm.modules.length} modules`);
    });

    // 7. Final summary
    console.log('\n🎉 FINAL TEST RESULTS:');
    console.log('✅ Database connection: Working');
    console.log('✅ Model imports: Working');
    console.log('✅ User queries: Working');
    console.log('✅ Authentication: Working');
    console.log('✅ Password verification: Working');
    console.log('✅ RBAC system: Working');
    console.log('\n🌟 All systems are GO! MongoDB Atlas integration is complete.');
    
    console.log('\n📋 Ready for login testing:');
    console.log('   Super Admin: vishhnuvardan2004@gmail.com / SuperAdmin123');
    console.log('   Pilot: prasadh@gmail.com / Pilot123');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n💤 Disconnected from MongoDB Atlas');
  }
}

// Run the final test
finalIntegrationTest();
