const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');
const User = require('../src/models/User');
const RolePermission = require('../src/models/RolePermission');

async function createPilotAccount() {
  try {
    console.log('🚀 Creating pilot account for prasadh@gmail.com...');
    
    // Connect to MongoDB
    await connectToDatabase(mongoose);
    // Connection success logged by helper

    // Check if pilot already exists
    const existingPilot = await User.findOne({ email: 'prasadh@gmail.com' });
    if (existingPilot) {
      console.log('⚠️  Pilot already exists, updating...');
      
      // Update existing pilot
      await User.updateOne(
        { email: 'prasadh@gmail.com' },
        { 
          role: 'pilot',
          fullName: 'Prasadh Pilot',
          active: true,
          isActive: true,
          emailVerified: true
        }
      );
      
      console.log('✅ Updated existing pilot account');
      return;
    }

    // Create new pilot account
    const pilotData = {
      email: 'prasadh@gmail.com',
      password: 'Pilot123', // Must have uppercase, lowercase, number
      passwordConfirm: 'Pilot123',
      role: 'pilot',
      fullName: 'Prasadh Pilot',
      mobileNumber: '9876543214', // Unique mobile number
      username: 'prasadhpilot',
      evzipId: 'EVZ_PRASADH_001'
    };

    console.log('👤 Creating pilot with data:', {
      email: pilotData.email,
      role: pilotData.role,
      fullName: pilotData.fullName,
      username: pilotData.username,
      evzipId: pilotData.evzipId
    });

    const newPilot = new User(pilotData);
    await newPilot.save();

    console.log('✅ Pilot account created successfully!');

    // Ensure pilot role permissions exist
    let pilotPermissions = await RolePermission.findOne({ role: 'pilot' });
    if (!pilotPermissions) {
      console.log('🔧 Creating pilot role permissions...');
      const defaultPermissions = RolePermission.getDefaultPermissions('pilot');
      pilotPermissions = await RolePermission.create({
        role: 'pilot',
        modules: defaultPermissions.modules,
        permissions: defaultPermissions.permissions,
        createdBy: newPilot._id
      });
      console.log('✅ Created pilot role permissions');
    }

    console.log('\n🎉 Pilot Account Ready!');
    console.log('📋 Login Credentials:');
    console.log(`   Email: prasadh@gmail.com`);
    console.log(`   Password: Pilot123`);
    console.log(`   Role: pilot`);
    
    console.log('\n📊 Available Modules for Pilot:');
    const modules = pilotPermissions.modules || [];
    modules.forEach(module => {
      const moduleName = typeof module === 'string' ? module : module.name;
      console.log(`   ✅ ${moduleName}`);
    });

    // Test login
    console.log('\n🔐 Testing password verification...');
    const savedPilot = await User.findOne({ email: 'prasadh@gmail.com' }).select('+password');
    if (savedPilot && savedPilot.correctPassword) {
      const isValid = await savedPilot.correctPassword('Pilot123', savedPilot.password);
      console.log(`   Password test: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    }

  } catch (error) {
    console.error('❌ Error creating pilot account:', error);
    
    if (error.errors) {
      console.log('\n📋 Validation Errors:');
      Object.keys(error.errors).forEach(field => {
        console.log(`   - ${field}: ${error.errors[field].message}`);
      });
    }
  } finally {
    console.log('💤 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
}

// Run the script
createPilotAccount();
