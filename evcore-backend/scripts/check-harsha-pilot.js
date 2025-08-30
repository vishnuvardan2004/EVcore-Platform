const { connectToDatabase } = require('./database-helper');
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function checkHarshaPilot() {
  try {
    console.log('🔍 Investigating harsha@gmail.com pilot account...\n');
    
    // Connect to MongoDB Atlas
    await connectToDatabase(mongoose);

    const email = 'harsha@gmail.com';
    
    // 1. Check if user exists
    console.log('1️⃣ Checking if user exists...');
    const user = await User.findOne({ email: email });
    console.log(`   User found: ${user ? '✅ YES' : '❌ NO'}`);
    
    if (!user) {
      console.log('❌ User does not exist in the database!');
      console.log('\n💡 Possible solutions:');
      console.log('   1. User was not created yet');
      console.log('   2. User was created in local MongoDB instead of Atlas');
      console.log('   3. Email address was entered incorrectly');
      
      // Check for similar email addresses
      console.log('\n🔍 Checking for similar email addresses...');
      const similarUsers = await User.find({
        email: { $regex: 'harsha', $options: 'i' }
      }, 'email role fullName');
      
      if (similarUsers.length > 0) {
        console.log('   Found similar emails:');
        similarUsers.forEach(u => console.log(`     - ${u.email} (${u.role}) - ${u.fullName}`));
      } else {
        console.log('   No similar emails found');
      }
      
      return;
    }

    // 2. Check user details
    console.log('\n2️⃣ User details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Full Name: ${user.fullName}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   EV Zip ID: ${user.evzipId}`);
    console.log(`   Active: ${user.active}`);
    console.log(`   Is Temporary Password: ${user.isTemporaryPassword}`);
    console.log(`   Must Change Password: ${user.mustChangePassword}`);

    // 3. Test findByEmailOrMobile (the method used in login)
    console.log('\n3️⃣ Testing login query method...');
    const loginUser = await User.findByEmailOrMobile(email).select('+password +active +loginAttempts +lockUntil');
    console.log(`   findByEmailOrMobile result: ${loginUser ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (loginUser) {
      console.log(`   Password field present: ${loginUser.password ? '✅ YES' : '❌ NO'}`);
      console.log(`   Account active: ${loginUser.active ? '✅ YES' : '❌ NO'}`);
      console.log(`   Account locked: ${loginUser.isLocked ? '❌ YES' : '✅ NO'}`);
      console.log(`   Login attempts: ${loginUser.loginAttempts || 0}`);
    }

    // 4. Test different possible passwords
    console.log('\n4️⃣ Testing common pilot passwords...');
    const commonPasswords = ['Pilot123', 'Harsha123', 'harsha123', 'Welcome123!'];
    
    for (const password of commonPasswords) {
      if (loginUser && loginUser.password) {
        const isValid = await loginUser.correctPassword(password, loginUser.password);
        console.log(`   Password "${password}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      }
    }

    // 5. Show creation date and last updates
    console.log('\n5️⃣ Account history:');
    console.log(`   Created at: ${user.createdAt}`);
    console.log(`   Updated at: ${user.updatedAt}`);
    console.log(`   Password changed at: ${user.passwordChangedAt}`);

  } catch (error) {
    console.error('❌ Error investigating harsha pilot:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n💤 Disconnected from MongoDB Atlas');
  }
}

checkHarshaPilot();
