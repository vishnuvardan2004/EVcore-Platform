// Comprehensive diagnosis of the authentication issue
const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');

async function diagnoseAuth() {
  console.log('🔍 Comprehensive Auth Diagnosis\n');

  try {
    // 1. Connect to the same MongoDB Atlas database as the API
    console.log('1️⃣ Connecting to MongoDB Atlas...');
    await connectToDatabase(mongoose);

    // 2. Import User model
    console.log('\n2️⃣ Loading User model...');
    const User = require('../src/models/User');
    console.log('✅ User model loaded');
    console.log(`   Model name: ${User.modelName}`);
    console.log(`   Collection name: ${User.collection.name}`);

    // 3. Check if collection exists and has documents
    console.log('\n3️⃣ Checking collection...');
    const count = await User.countDocuments();
    console.log(`   Documents count: ${count}`);

    // 4. Test basic queries
    console.log('\n4️⃣ Testing basic queries...');
    const allUsers = await User.find({});
    console.log(`   Total users: ${allUsers.length}`);
    
    // List all users
    allUsers.forEach(user => {
      console.log(`     - ${user.email} (${user.role})`);
    });

    // 5. Test findByEmailOrMobile method specifically
    console.log('\n5️⃣ Testing findByEmailOrMobile method...');
    const testEmails = ['admin@evcore.com', 'prasadh@gmail.com', 'vishhnuvardan2004@gmail.com'];
    
    for (const email of testEmails) {
      console.log(`\n   Testing: ${email}`);
      
      // Method 1: Direct findOne
      const direct = await User.findOne({ email: email });
      console.log(`     Direct findOne: ${direct ? '✅ Found' : '❌ Not found'}`);
      
      // Method 2: Using $or query (same as findByEmailOrMobile)
      const orQuery = await User.findOne({
        $or: [
          { email: email },
          { mobileNumber: email }
        ]
      });
      console.log(`     $or query: ${orQuery ? '✅ Found' : '❌ Not found'}`);
      
      // Method 3: Using the static method
      try {
        const staticMethod = await User.findByEmailOrMobile(email);
        console.log(`     Static method: ${staticMethod ? '✅ Found' : '❌ Not found'}`);
      } catch (error) {
        console.log(`     Static method: ❌ ERROR: ${error.message}`);
      }
      
      // Method 4: With select (same as API)
      try {
        const withSelect = await User.findByEmailOrMobile(email).select('+password +active +loginAttempts +lockUntil');
        console.log(`     With select: ${withSelect ? '✅ Found' : '❌ Not found'}`);
        if (withSelect) {
          console.log(`       Password field: ${withSelect.password ? 'Present' : 'Missing'}`);
          console.log(`       Active field: ${withSelect.active !== undefined ? withSelect.active : 'Undefined'}`);
        }
      } catch (error) {
        console.log(`     With select: ❌ ERROR: ${error.message}`);
      }
    }

    // 6. Test password verification for prasadh
    console.log('\n6️⃣ Testing password verification for prasadh...');
    const prasadhUser = await User.findOne({ email: 'prasadh@gmail.com' }).select('+password');
    if (prasadhUser) {
      console.log(`   User found: ✅`);
      console.log(`   Password field present: ${prasadhUser.password ? '✅' : '❌'}`);
      
      if (prasadhUser.password) {
        const isValid = await prasadhUser.correctPassword('Pilot123', prasadhUser.password);
        console.log(`   Password 'Pilot123' valid: ${isValid ? '✅' : '❌'}`);
      }
    }

    // 7. Test exact API scenario
    console.log('\n7️⃣ Simulating exact API scenario...');
    const apiEmail = 'prasadh@gmail.com';
    const apiPassword = 'Pilot123';
    
    console.log(`   Email: "${apiEmail}"`);
    console.log(`   Password: "${apiPassword}"`);
    
    const apiUser = await User.findByEmailOrMobile(apiEmail).select('+password +active +loginAttempts +lockUntil');
    console.log(`   Query result: ${apiUser ? '✅ Found' : '❌ Not found'}`);
    
    if (apiUser) {
      console.log('   ✅ API query successful - authentication should work');
      const passwordCheck = await apiUser.correctPassword(apiPassword, apiUser.password);
      console.log(`   Password check: ${passwordCheck ? '✅ Valid' : '❌ Invalid'}`);
    } else {
      console.log('   ❌ API query failed - this is the source of the 401 error');
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n💤 Disconnected from database');
  }
}

diagnoseAuth();
