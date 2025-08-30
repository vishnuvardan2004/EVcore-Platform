/**
 * Role Permissions Initialization Script
 * Updates the database with the new 6-module RBAC system
 */

const mongoose = require('mongoose');
require('dotenv').config();

const RolePermission = require('../src/models/RolePermission');
const { getMongoUri } = require('./database-helper');

const MONGODB_URI = getMongoUri();

console.log('🚀 Starting Role Permissions Update...');

const initializeRolePermissions = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const roles = ['super_admin', 'admin', 'employee', 'pilot'];
    
    for (const role of roles) {
      console.log(`\n📋 Processing role: ${role}`);
      
      // Check if role permissions already exist
      let rolePermissions = await RolePermission.findOne({ role });
      
      if (rolePermissions) {
        console.log(`   ℹ️  Found existing permissions for ${role}`);
        
        // Get default permissions for this role
        const defaultPermissions = RolePermission.getDefaultPermissions(role);
        
        if (defaultPermissions) {
          // Update with new module structure
          rolePermissions.modules = defaultPermissions.modules;
          rolePermissions.updatedAt = new Date();
          
          await rolePermissions.save();
          console.log(`   ✅ Updated permissions for ${role}`);
        }
      } else {
        console.log(`   🆕 Creating new permissions for ${role}`);
        
        // Get default permissions for this role
        const defaultPermissions = RolePermission.getDefaultPermissions(role);
        
        if (defaultPermissions) {
          rolePermissions = new RolePermission({
            role,
            modules: defaultPermissions.modules,
            createdBy: null // System created
          });
          
          await rolePermissions.save();
          console.log(`   ✅ Created permissions for ${role}`);
        }
      }
      
      // Display permissions summary
      if (rolePermissions) {
        const enabledModules = rolePermissions.modules
          .filter(m => m.enabled)
          .map(m => m.name);
        console.log(`   📊 Enabled modules for ${role}: ${enabledModules.join(', ')}`);
      }
    }

    console.log('\n🎉 Role Permissions Update Complete!');
    console.log('\n📋 RBAC Summary:');
    console.log('   🔴 Super Admin → Full access to all 6 modules + Audit Logs');
    console.log('   🟠 Admin → All 6 modules (no Audit Logs)');
    console.log('   🟡 Employee → 5 modules (Vehicle Deployment, Smart Bookings, Driver Onboarding, Trip Analytics, Energy Management)');
    console.log('   🟢 Pilot → 2 modules (Trip Analytics, Energy Management - Read only)');
    
    console.log('\n🚀 New Platform Modules:');
    console.log('   1. Vehicle Deployment');
    console.log('   2. Smart Bookings');
    console.log('   3. Data Hub (Admin+ only)');
    console.log('   4. Driver Onboarding');
    console.log('   5. Trip Analytics');
    console.log('   6. Energy Management');
    console.log('   7. Audit Logs (Super Admin only)');

  } catch (error) {
    console.error('❌ Error updating role permissions:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n💤 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the initialization
initializeRolePermissions();
