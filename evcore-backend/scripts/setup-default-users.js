/**
 * Setup Default Admin User for Testing
 * Creates a default admin user to test the Vehicle Deployment Tracker
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const logger = require('../src/utils/logger');

// Import User model
const User = require('../src/models/User');

async function setupDefaultAdmin() {
  try {
    console.log('🔧 Setting up default admin user for testing...\n');
    
    // Connect to database
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Check if admin user already exists
    const adminEmail = 'admin@evcore.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log(`   Email: ${adminEmail}`);
      console.log('   Password: admin123');
      console.log('   Status: Active');
      
      // Update admin to ensure they have all required modules
      existingAdmin.modules = [
        'vehicle_deployment',
        'smart_bookings', 
        'data_hub',
        'driver_onboarding',
        'trip_analytics',
        'energy_management'
      ];
      existingAdmin.role = 'super_admin';
      existingAdmin.isActive = true;
      await existingAdmin.save();
      
      console.log('✅ Admin user updated with all modules');
      return existingAdmin;
    }
    
    // Create new admin user
    console.log('👤 Creating new admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      email: adminEmail,
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'super_admin',
      modules: [
        'vehicle_deployment',
        'smart_bookings', 
        'data_hub',
        'driver_onboarding',
        'trip_analytics',
        'energy_management'
      ],
      isActive: true,
      isEmailVerified: true,
      employeeId: 'ADMIN001',
      department: 'IT',
      designation: 'System Administrator'
    });
    
    await adminUser.save();
    
    console.log('✅ Default admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log('   Password: admin123');
    console.log('   Role: Super Admin');
    console.log('   Modules: All 6 core modules enabled');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Failed to setup admin user:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

async function createTestPilot() {
  try {
    await mongoose.connect(config.mongoUri);
    
    const testPilotEmail = 'pilot@evcore.com';
    const existingPilot = await User.findOne({ email: testPilotEmail });
    
    if (existingPilot) {
      console.log('ℹ️  Test pilot already exists');
      return existingPilot;
    }
    
    console.log('👨‍✈️ Creating test pilot user...');
    
    const hashedPassword = await bcrypt.hash('pilot123', 12);
    
    const pilotUser = new User({
      email: testPilotEmail,
      password: hashedPassword,
      fullName: 'Test Pilot',
      role: 'pilot',
      modules: ['vehicle_deployment'],
      isActive: true,
      isEmailVerified: true,
      employeeId: 'PILOT001',
      department: 'Operations',
      designation: 'Pilot'
    });
    
    await pilotUser.save();
    
    console.log('✅ Test pilot user created successfully!');
    console.log('   Email: pilot@evcore.com');
    console.log('   Password: pilot123');
    
    return pilotUser;
    
  } finally {
    await mongoose.disconnect();
  }
}

// Main execution
async function main() {
  console.log('🚀 EVcore Platform - Default User Setup\n');
  
  try {
    const admin = await setupDefaultAdmin();
    const pilot = await createTestPilot();
    
    console.log('\n🎉 User setup completed successfully!');
    console.log('\n💡 You can now login to test the Vehicle Deployment Tracker:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend: http://localhost:3001');
    console.log('\n👤 Admin Login:');
    console.log('   Email: admin@evcore.com');
    console.log('   Password: admin123');
    console.log('\n👨‍✈️ Pilot Login:');
    console.log('   Email: pilot@evcore.com');
    console.log('   Password: pilot123');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupDefaultAdmin, createTestPilot };
