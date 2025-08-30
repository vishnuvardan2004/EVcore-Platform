const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');
const User = require('../src/models/User');

async function debugLogin() {
  try {
    console.log('🔍 Debugging login process...');
    
    // Connect to MongoDB
    await connectToDatabase(mongoose);
    // Connection success logged by helper

    const email = 'prasadh@gmail.com';
    const password = 'Pilot123';
    
    // Step 1: Find user like the API does
    console.log('\n1️⃣ Searching for user...');
    const user = await User.findByEmailOrMobile(email).select('+password +active +loginAttempts +lockUntil');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      active: user.active,
      isLocked: user.isLocked,
      loginAttempts: user.loginAttempts,
      lockUntil: user.lockUntil
    });
    
    // Step 2: Check account status
    console.log('\n2️⃣ Checking account status...');
    if (user.isLocked) {
      console.log('❌ Account is locked');
      return;
    }
    
    if (!user.active) {
      console.log('❌ Account is inactive');
      return;
    }
    
    console.log('✅ Account status is good');
    
    // Step 3: Test password
    console.log('\n3️⃣ Testing password...');
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    console.log(`Password result: ${isPasswordCorrect ? '✅ Correct' : '❌ Incorrect'}`);
    
    if (!isPasswordCorrect) {
      console.log('❌ Password verification failed');
      return;
    }
    
    console.log('✅ All checks passed - login should work');
    
    // Step 4: Check if there are any other issues
    console.log('\n4️⃣ Additional checks...');
    console.log('User object type:', typeof user);
    console.log('Password method exists:', typeof user.correctPassword === 'function');
    console.log('User ID:', user._id);
    console.log('User password hash (first 20 chars):', user.password.substring(0, 20) + '...');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    console.log('💤 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
}

// Run the script
debugLogin();
