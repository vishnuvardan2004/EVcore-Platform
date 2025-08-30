const mongoose = require('mongoose');
const User = require('../src/models/User');
const RolePermission = require('../src/models/RolePermission');
const { connectToDatabase } = require('./database-helper');

async function checkUserPermissions() {
  try {
    console.log('🔍 Checking user permissions...');
    
    // Connect to the same MongoDB Atlas database as the API
    await connectToDatabase(mongoose);

    // Find the user
    const userEmail = 'vishhnuvardan2004@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ User ${userEmail} not found in database`);
      return;
    }

    console.log(`📋 User Found:`, {
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      isActive: user.active !== false,
      evzipId: user.evzipId
    });

    // Check role permissions
    const rolePermissions = await RolePermission.findOne({ role: user.role });
    
    if (!rolePermissions) {
      console.log(`❌ No role permissions found for role: ${user.role}`);
      console.log(`🔧 Creating permissions for ${user.role}...`);
      
      // Create permissions for this role based on super_admin template
      const superAdminPerms = await RolePermission.findOne({ role: 'super_admin' });
      if (superAdminPerms) {
        const newRolePermissions = new RolePermission({
          role: user.role,
          modules: superAdminPerms.modules, // Give same permissions as super_admin
          permissions: superAdminPerms.permissions,
          isActive: true
        });
        await newRolePermissions.save();
        console.log(`✅ Created permissions for role: ${user.role}`);
      }
    } else {
      console.log(`📊 Current Permissions for ${user.role}:`);
      console.log(`   Enabled Modules: ${rolePermissions.modules.join(', ')}`);
      console.log(`   Permissions: ${JSON.stringify(rolePermissions.permissions, null, 2)}`);
    }

    // Also ensure user role is 'super_admin' if needed
    if (user.role !== 'super_admin') {
      console.log(`🔧 Updating user role to super_admin...`);
      await User.updateOne(
        { email: userEmail },
        { role: 'super_admin' }
      );
      console.log(`✅ Updated user role to super_admin`);
    }

  } catch (error) {
    console.error('❌ Error checking user permissions:', error);
  } finally {
    console.log('💤 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
}

// Run the script
checkUserPermissions();
