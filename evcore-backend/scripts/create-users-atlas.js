const mongoose = require('mongoose');
const User = require('../src/models/User');

async function createUsersInAtlas() {
  try {
    console.log('🚀 Creating users in MongoDB Atlas...');
    
    // Connect to the SAME database as the API (MongoDB Atlas)
    const mongoUri = 'mongodb+srv://vishnuvardan2004:Jaya.988@evcore.gjcfg9u.mongodb.net/evcore';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);

    // Check existing users
    const existingUsers = await User.find({}, 'email role');
    console.log(`\n📋 Existing users in Atlas: ${existingUsers.length}`);
    existingUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));

    // Create super admin user
    const superAdminEmail = 'vishhnuvardan2004@gmail.com';
    let superAdmin = await User.findOne({ email: superAdminEmail });
    
    if (!superAdmin) {
      console.log(`\n➕ Creating super admin: ${superAdminEmail}`);
      superAdmin = await User.create({
        fullName: 'Vishnu Vardan',
        email: superAdminEmail,
        mobileNumber: '9876543210',
        username: 'vishhnuvardan',
        evzipId: 'EVZ_VISHNU_001',
        role: 'super_admin',
        password: 'SuperAdmin123',
        passwordConfirm: 'SuperAdmin123',
        active: true,
        isTemporaryPassword: false,
        mustChangePassword: false,
        employeeId: 'EMP_VISHNU_001',
        department: 'Administration',
        designation: 'Super Administrator'
      });
      console.log('✅ Super admin created successfully!');
    } else {
      console.log(`✅ Super admin already exists`);
    }

    // Create pilot user
    const pilotEmail = 'prasadh@gmail.com';
    let pilot = await User.findOne({ email: pilotEmail });
    
    if (!pilot) {
      console.log(`\n➕ Creating pilot: ${pilotEmail}`);
      pilot = await User.create({
        fullName: 'Prasadh Pilot',
        email: pilotEmail,
        mobileNumber: '8765432109',
        username: 'prasadhpilot',
        evzipId: 'EVZ_PRASADH_001',
        role: 'pilot',
        password: 'Pilot123',
        passwordConfirm: 'Pilot123',
        active: true,
        isTemporaryPassword: false,
        mustChangePassword: false,
        licenseNumber: 'DL123456789',
        licenseExpiry: new Date('2026-12-31'),
        experienceYears: 5,
        vehicleTypes: ['EV', 'Sedan'],
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Friend',
          phone: '9876543210'
        }
      });
      console.log('✅ Pilot created successfully!');
    } else {
      console.log(`✅ Pilot already exists`);
    }

    // Verify the users were created
    console.log('\n🔍 Final verification...');
    const finalUsers = await User.find({}, 'email role fullName evzipId');
    finalUsers.forEach(u => {
      console.log(`   ✅ ${u.email} (${u.role}) - ${u.fullName} [${u.evzipId}]`);
    });

    console.log('\n🎉 All users created in MongoDB Atlas!');
    console.log('\nLogin Credentials:');
    console.log(`   Super Admin: ${superAdminEmail} / SuperAdmin123`);
    console.log(`   Pilot: ${pilotEmail} / Pilot123`);

  } catch (error) {
    console.error('❌ Error creating users in Atlas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n💤 Disconnected from MongoDB Atlas');
  }
}

createUsersInAtlas();
