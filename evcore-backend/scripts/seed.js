const mongoose = require('mongoose');
const config = require('../src/config');
const User = require('../src/models/User');
const RolePermission = require('../src/models/RolePermission');
const logger = require('../src/utils/logger');

// Super Admin default data
const superAdminData = {
  fullName: 'Super Administrator',
  email: 'admin@evcore.com',
  mobileNumber: '9999999999',
  password: 'SuperAdmin@123',
  passwordConfirm: 'SuperAdmin@123',
  role: 'super_admin',
  department: 'Administration',
  designation: 'Super Administrator',
  employeeId: 'EV001',
  verified: true,
  active: true
};

async function createSuperAdmin() {
  try {
    console.log('🌱 Starting seed process...');

    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('ℹ️  Super Admin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Mobile: ${existingSuperAdmin.mobileNumber}`);
      console.log(`   Created: ${existingSuperAdmin.createdAt}`);
      return;
    }

    // Create super admin user
    console.log('👤 Creating Super Admin user...');
    const superAdmin = await User.create(superAdminData);
    console.log('✅ Super Admin created successfully');
    console.log(`   ID: ${superAdmin._id}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Mobile: ${superAdmin.mobileNumber}`);

    // Create role permissions for all roles
    console.log('🔑 Creating role permissions...');
    
    const roles = ['super_admin', 'admin', 'employee', 'pilot'];
    
    for (const role of roles) {
      const existingPermissions = await RolePermission.findOne({ role });
      
      if (!existingPermissions) {
        const defaultPermissions = RolePermission.getDefaultPermissions(role);
        
        if (defaultPermissions) {
          await RolePermission.create({
            role,
            modules: defaultPermissions.modules,
            createdBy: superAdmin._id
          });
          console.log(`   ✅ Created permissions for ${role}`);
        }
      } else {
        console.log(`   ℹ️  Permissions for ${role} already exist`);
      }
    }

    console.log('🎉 Seed process completed successfully!');
    console.log('');
    console.log('📋 Super Admin Login Credentials:');
    console.log(`   Email: ${superAdminData.email}`);
    console.log(`   Password: ${superAdminData.password}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');

  } catch (error) {
    console.error('❌ Seed process failed:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - user might already exist');
    }
    throw error; // Re-throw to be handled by main seed function
  }
}

async function createTestUsers() {
  try {
    console.log('👥 Creating test users...');

    const testUsers = [
      {
        fullName: 'Admin User',
        email: 'admin.user@evcore.com',
        mobileNumber: '8888888888',
        password: 'Admin@123',
        passwordConfirm: 'Admin@123',
        role: 'admin',
        department: 'Operations',
        designation: 'Administrator',
        employeeId: 'EV002',
        verified: true
      },
      {
        fullName: 'Employee User',
        email: 'employee@evcore.com',
        mobileNumber: '7777777777',
        password: 'Employee@123',
        passwordConfirm: 'Employee@123',
        role: 'employee',
        department: 'Operations',
        designation: 'Operations Executive',
        employeeId: 'EV003',
        verified: true
      },
      {
        fullName: 'Pilot User',
        email: 'pilot@evcore.com',
        mobileNumber: '6666666666',
        password: 'Pilot@123',
        passwordConfirm: 'Pilot@123',
        role: 'pilot',
        department: 'Operations',
        designation: 'Driver',
        employeeId: 'EV004',
        verified: true
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        const user = await User.create(userData);
        console.log(`   ✅ Created ${userData.role}: ${userData.email}`);
      } else {
        console.log(`   ℹ️  ${userData.role} already exists: ${userData.email}`);
      }
    }

    console.log('✅ Test users creation completed');

  } catch (error) {
    console.error('❌ Test users creation failed:', error.message);
  }
}

// Main seed function
async function seed() {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await createSuperAdmin();
    
    // Create test users only in development
    if (config.isDevelopment) {
      await createTestUsers();
    }

  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seed();
}

module.exports = { seed, createSuperAdmin, createTestUsers };
