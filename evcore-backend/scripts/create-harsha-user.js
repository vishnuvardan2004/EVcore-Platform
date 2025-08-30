const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');
const User = require('../src/models/User');

async function createHarshaUserAccount() {
  try {
    console.log('🚀 Creating User account for harsha@gmail.com...\n');
    
    await connectToDatabase(mongoose);

    // Check if pilot record exists in the database
    console.log('1️⃣ Checking for existing pilot data...');
    
    // First check if there's a Pilot record (if Pilot model exists)
    let pilotData = null;
    try {
      const Pilot = require('../src/models/Pilot');
      pilotData = await Pilot.findOne({ email: 'harsha@gmail.com' });
      
      if (pilotData) {
        console.log('✅ Found Pilot record:');
        console.log(`   Full Name: ${pilotData.fullName}`);
        console.log(`   Email: ${pilotData.email}`);
        console.log(`   Mobile: ${pilotData.mobileNumber}`);
        console.log(`   Pilot ID: ${pilotData.pilotId}`);
      } else {
        console.log('❌ No Pilot record found');
      }
    } catch (error) {
      console.log('ℹ️  No separate Pilot model found');
    }

    // Check if User account already exists
    console.log('\n2️⃣ Checking if User account already exists...');
    const existingUser = await User.findOne({ email: 'harsha@gmail.com' });
    
    if (existingUser) {
      console.log('✅ User account already exists! No need to create.');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      return;
    }

    console.log('❌ User account does not exist. Creating now...');

    // Create User account
    console.log('\n3️⃣ Creating User account...');
    
    // Use pilot data if available, otherwise create with basic info
    const userData = {
      fullName: pilotData?.fullName || 'Harsha Pilot',
      email: 'harsha@gmail.com',
      mobileNumber: pilotData?.mobileNumber || '8765432101', // Unique mobile number
      username: 'harshapilot',
      evzipId: pilotData?.pilotId || 'EVZ_HARSHA_001',
      role: 'pilot',
      password: 'Pilot123', // Default password
      passwordConfirm: 'Pilot123',
      active: true,
      isTemporaryPassword: true,
      mustChangePassword: true,
      department: 'Operations',
      designation: 'Pilot/Driver',
      licenseNumber: pilotData?.licenseNumber || 'DL123456790',
      licenseExpiry: pilotData?.licenseExpiry || new Date('2026-12-31'),
      experienceYears: pilotData?.experience || 2,
      vehicleTypes: pilotData?.vehicleTypes || ['EV', 'Sedan'],
      emergencyContact: {
        name: pilotData?.emergencyContactName || 'Emergency Contact',
        relationship: 'Family',
        phone: pilotData?.emergencyContactNumber || '8765432101'
      }
    };

    const newUser = await User.create(userData);

    console.log('✅ User account created successfully!');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Username: ${newUser.username}`);
    console.log(`   evzipId: ${newUser.evzipId}`);
    console.log(`   Is Temporary Password: ${newUser.isTemporaryPassword}`);
    console.log(`   Must Change Password: ${newUser.mustChangePassword}`);

    // Test authentication
    console.log('\n4️⃣ Testing authentication...');
    const testUser = await User.findByEmailOrMobile('harsha@gmail.com').select('+password');
    
    if (testUser) {
      const isPasswordValid = await testUser.correctPassword('Pilot123', testUser.password);
      console.log(`   Password test: ${isPasswordValid ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (isPasswordValid) {
        console.log('\n🎉 SUCCESS! Harsha can now login with:');
        console.log(`   Email: harsha@gmail.com`);
        console.log(`   Password: Pilot123`);
        console.log(`   Note: System will force password change on first login`);
      }
    }

  } catch (error) {
    console.error('❌ Error creating User account:', error.message);
    if (error.code === 11000) {
      console.error('   This means a duplicate key error - user might already exist');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n💤 Disconnected from MongoDB Atlas');
  }
}

createHarshaUserAccount();
