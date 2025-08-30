const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

async function createTestUsers() {
  try {
    console.log('🚀 Starting Test User Creation...');
    
    // Connect to MongoDB
    await connectToDatabase(mongoose);
    // Connection success logged by helper

    const testUsers = [
      {
        email: 'super@evcore.com',
        password: 'superadmin123',
        passwordConfirm: 'superadmin123',
        role: 'super_admin',
        fullName: 'Super Administrator',
        mobileNumber: '9876543210',
        username: 'superadmin',
        evzipId: 'EVZ_SUPER_001'
      },
      {
        email: 'admin@evcore.com',
        password: 'admin123',
        passwordConfirm: 'admin123', 
        role: 'admin',
        fullName: 'Administrator',
        mobileNumber: '9876543211',
        username: 'admin',
        evzipId: 'EVZ_ADMIN_001'
      },
      {
        email: 'employee@evcore.com',
        password: 'employee123',
        passwordConfirm: 'employee123',
        role: 'employee',
        fullName: 'Employee User',
        mobileNumber: '9876543212',
        username: 'employee',
        evzipId: 'EVZ_EMP_001'
      },
      {
        email: 'pilot@evcore.com',
        password: 'pilot123',
        passwordConfirm: 'pilot123',
        role: 'pilot',
        fullName: 'Pilot User',
        mobileNumber: '9876543213',
        username: 'pilot',
        evzipId: 'EVZ_PILOT_001'
      }
    ];

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`   ℹ️  User ${userData.email} already exists, updating...`);
          
          // Update password and role
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(userData.password, salt);
          
          await User.updateOne(
            { email: userData.email },
            { 
              password: hashedPassword,
              role: userData.role,
              fullName: userData.fullName,
              mobileNumber: userData.mobileNumber,
              username: userData.username,
              evzipId: userData.evzipId
            }
          );
          
          console.log(`   ✅ Updated user: ${userData.email} (${userData.role})`);
        } else {
          // Create new user - set passwordConfirm before save, it gets cleared by pre-save hook
          const newUser = new User({
            email: userData.email,
            password: userData.password,
            passwordConfirm: userData.password,
            role: userData.role,
            fullName: userData.fullName,
            mobileNumber: userData.mobileNumber,
            username: userData.username,
            evzipId: userData.evzipId,
            isActive: true,
            emailVerified: true
          });
          
          await newUser.save();
          console.log(`   ✅ Created user: ${userData.email} (${userData.role})`);
        }
      } catch (userError) {
        console.error(`   ❌ Failed to process user ${userData.email}:`, userError.message);
      }
    }

    console.log('\n🎉 Test User Creation Complete!');
    console.log('\n📋 Available Test Accounts:');
    console.log('   🔴 Super Admin: super@evcore.com / superadmin123');
    console.log('   🟠 Admin: admin@evcore.com / admin123');
    console.log('   🟡 Employee: employee@evcore.com / employee123');
    console.log('   🟢 Pilot: pilot@evcore.com / pilot123');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    console.log('💤 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
}

// Run the script
createTestUsers();
