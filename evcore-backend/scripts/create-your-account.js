const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');
const User = require('../src/models/User');
const RolePermission = require('../src/models/RolePermission');

async function createYourAccount() {
  try {
    console.log('🚀 Creating your account...');
    
    // Connect to MongoDB
    await connectToDatabase(mongoose);
    // Connection success logged by helper

    const userEmail = 'vishhnuvardan2004@gmail.com';
    
    // Check if user already exists
    let user = await User.findOne({ email: userEmail });
    
    const userData = {
      email: userEmail,
      password: 'admin123', // Temporary password
      passwordConfirm: 'admin123',
      role: 'super_admin',
      fullName: 'Vishnu Vardan',
      mobileNumber: '9876543200', // Unique mobile number
      username: 'vishnuvardan',
      evzipId: 'EVZ_VISHNU_001'
    };

    if (user) {
      console.log('👤 User already exists, updating...');
      
      // Update existing user to ensure super_admin role
      await User.updateOne(
        { email: userEmail },
        { 
          role: 'super_admin',
          fullName: userData.fullName,
          isActive: true,
          active: true
        }
      );
      
      console.log('✅ Updated existing user to super_admin');
      user = await User.findOne({ email: userEmail });
    } else {
      console.log('👤 Creating new user...');
      
      // Create new user
      user = new User(userData);
      await user.save();
      console.log('✅ Created new user successfully');
    }

    // Ensure role permissions exist for super_admin
    let rolePermissions = await RolePermission.findOne({ role: 'super_admin' });
    if (!rolePermissions) {
      console.log('🔧 Creating super_admin permissions...');
      const defaultPermissions = RolePermission.getDefaultPermissions('super_admin');
      rolePermissions = await RolePermission.create({
        role: 'super_admin',
        modules: defaultPermissions.modules,
        permissions: defaultPermissions.permissions,
        createdBy: user._id
      });
      console.log('✅ Created super_admin permissions');
    }

    console.log('\n🎉 Account Ready!');
    console.log('📋 Your Account Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Full Name: ${user.fullName}`);
    console.log(`   Active: ${user.active !== false}`);
    console.log(`   EVZIP ID: ${user.evzipId}`);
    console.log(`   Username: ${user.username}`);

    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: admin123`);

    console.log('\n📊 Available Modules (Super Admin):');
    const modules = rolePermissions.modules || [];
    modules.forEach(module => {
      console.log(`   ✅ ${module}`);
    });

  } catch (error) {
    console.error('❌ Error creating account:', error);
  } finally {
    console.log('💤 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
}

// Run the script
createYourAccount();
