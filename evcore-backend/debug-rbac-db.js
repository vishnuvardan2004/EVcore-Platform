/**
 * Debug RBAC Database Permissions
 */

const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');
require('dotenv').config();

const RolePermission = require('./src/models/RolePermission');

const { getMongoUri } = require('./scripts/database-helper');
const MONGODB_URI = getMongoUri();

const checkRolePermissions = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    // Connection success logged by helper

    console.log('\n🔍 Checking Role Permissions in Database:');
    console.log('=' .repeat(60));

    const roles = ['super_admin', 'admin', 'employee', 'pilot'];
    
    for (const role of roles) {
      console.log(`\n📋 ${role.toUpperCase()}:`);
      
      const rolePermissions = await RolePermission.findOne({ role });
      
      if (rolePermissions) {
        console.log('   ✅ Role permissions found');
        console.log('   📊 Enabled modules:');
        
        rolePermissions.modules
          .filter(m => m.enabled)
          .forEach(module => {
            console.log(`     🟢 ${module.name} - Permissions: [${module.permissions.join(', ')}]`);
          });
          
        console.log('   🚫 Disabled modules:');
        rolePermissions.modules
          .filter(m => !m.enabled)
          .forEach(module => {
            console.log(`     🔴 ${module.name}`);
          });
      } else {
        console.log('   ❌ No role permissions found');
      }
    }

    console.log('\n🎯 Testing specific pilot permissions:');
    const pilotPermissions = await RolePermission.findOne({ role: 'pilot' });
    if (pilotPermissions) {
      const tripAnalytics = pilotPermissions.modules.find(m => m.name === 'trip_analytics');
      const energyManagement = pilotPermissions.modules.find(m => m.name === 'energy_management');
      
      console.log(`   trip_analytics: ${tripAnalytics ? (tripAnalytics.enabled ? '✅ ENABLED' : '❌ DISABLED') : '❓ NOT FOUND'}`);
      console.log(`   energy_management: ${energyManagement ? (energyManagement.enabled ? '✅ ENABLED' : '❌ DISABLED') : '❓ NOT FOUND'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n💤 Disconnected from MongoDB');
  }
};

checkRolePermissions();
