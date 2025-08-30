const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');
const User = require('../src/models/User');
const RolePermission = require('../src/models/RolePermission');

async function checkPilotAccount() {
  try {
    console.log('🔍 Checking pilot account...');
    
    // Connect to MongoDB
    await connectToDatabase(mongoose);
    // Connection success logged by helper

    const pilotEmail = 'prasadh@gmail.com';
    
    // Find the pilot user
    console.log(`\n🔍 Searching for pilot: ${pilotEmail}`);
    const pilot = await User.findOne({ email: pilotEmail }).select('+password');
    
    if (!pilot) {
      console.log('❌ Pilot account not found in database');
      
      // Let's see all users to understand what's there
      console.log('\n📋 All users in database:');
      const allUsers = await User.find({}, 'email role fullName isActive active').limit(10);
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.role}) - Active: ${u.active !== false}, IsActive: ${u.isActive !== false}`);
      });
      
      return;
    }

    console.log('\n✅ Pilot account found:');
    console.log(`   Email: ${pilot.email}`);
    console.log(`   Role: ${pilot.role}`);
    console.log(`   Full Name: ${pilot.fullName}`);
    console.log(`   Username: ${pilot.username}`);
    console.log(`   EVZIP ID: ${pilot.evzipId}`);
    console.log(`   Mobile: ${pilot.mobileNumber}`);
    console.log(`   Active: ${pilot.active !== false}`);
    console.log(`   IsActive: ${pilot.isActive !== false}`);
    console.log(`   Email Verified: ${pilot.emailVerified}`);
    console.log(`   Password Hash Length: ${pilot.password ? pilot.password.length : 'No password'}`);
    console.log(`   Is Temporary Password: ${pilot.isTemporaryPassword}`);
    console.log(`   Must Change Password: ${pilot.mustChangePassword}`);
    console.log(`   Login Attempts: ${pilot.loginAttempts || 0}`);
    console.log(`   Account Locked: ${pilot.isLocked || false}`);
    console.log(`   Lock Until: ${pilot.lockUntil || 'None'}`);

    // Check role permissions for pilot
    console.log('\n📊 Checking role permissions...');
    const rolePermissions = await RolePermission.findOne({ role: 'pilot' });
    if (rolePermissions) {
      console.log('✅ Pilot role permissions exist:');
      console.log(`   Modules: ${rolePermissions.modules.map(m => m.name || m).join(', ')}`);
    } else {
      console.log('❌ No role permissions found for pilot role');
      
      // Create pilot permissions
      console.log('🔧 Creating pilot role permissions...');
      const pilotPermissions = RolePermission.getDefaultPermissions('pilot');
      if (pilotPermissions) {
        await RolePermission.create({
          role: 'pilot',
          modules: pilotPermissions.modules,
          permissions: pilotPermissions.permissions,
          createdBy: pilot._id
        });
        console.log('✅ Created pilot role permissions');
      }
    }

    // Test password verification
    console.log('\n🔐 Testing password verification...');
    if (pilot.correctPassword) {
      // Try common test passwords
      const testPasswords = ['pilot123', 'password', '123456', 'admin123', 'pilot'];
      
      for (const testPassword of testPasswords) {
        try {
          const isValid = await pilot.correctPassword(testPassword, pilot.password);
          console.log(`   Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
          if (isValid) break;
        } catch (error) {
          console.log(`   Password "${testPassword}": ❌ Error - ${error.message}`);
        }
      }
    }

    // Check if account needs any fixes
    console.log('\n🔧 Account status check:');
    const needsFix = [];
    
    if (pilot.active === false) needsFix.push('Account is deactivated');
    if (pilot.isActive === false) needsFix.push('IsActive flag is false');
    if (!pilot.emailVerified) needsFix.push('Email not verified');
    if (pilot.isLocked) needsFix.push('Account is locked');
    if (!pilot.password) needsFix.push('No password set');
    
    if (needsFix.length > 0) {
      console.log('⚠️  Issues found:');
      needsFix.forEach(issue => console.log(`   - ${issue}`));
      
      console.log('\n🔧 Fixing issues...');
      await User.updateOne(
        { email: pilotEmail },
        { 
          active: true,
          isActive: true,
          emailVerified: true,
          isLocked: false,
          lockUntil: undefined,
          loginAttempts: 0
        }
      );
      console.log('✅ Fixed account issues');
    } else {
      console.log('✅ Account looks good');
    }

  } catch (error) {
    console.error('❌ Error checking pilot account:', error);
  } finally {
    console.log('💤 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
}

// Run the script
checkPilotAccount();
