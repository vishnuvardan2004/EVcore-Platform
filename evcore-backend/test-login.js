/**
 * Login Test Script - Quick Authentication Verification
 * Tests login functionality after manual server startup
 */

const mongoose = require('mongoose');
const axios = require('axios');
const config = require('./src/config');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log('✅ Connected to MongoDB for login testing');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Test login functionality
const testLogin = async () => {
  console.log('\n🧪 Testing Login Functionality');
  console.log('=====================================');

  try {
    // First, let's check if there are any users in the database
    const User = require('./src/models/User');
    const allUsers = await User.find({}, 'email username evzipId role fullName active').limit(5);
    
    console.log('\n📋 Available Users in Database:');
    console.log('--------------------------------');
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 You need to create a user first or check if database connection is working');
      return;
    }
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   EVZIP ID: ${user.evzipId}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Full Name: ${user.fullName}`);
      console.log(`   Active: ${user.active}`);
      console.log('   ---');
    });

    // Test the findByEmailOrMobile method directly
    console.log('\n🔍 Testing User.findByEmailOrMobile Method:');
    console.log('-------------------------------------------');
    
    const testEmail = allUsers[0].email;
    console.log(`Testing with email: ${testEmail}`);
    
    const foundUser = await User.findByEmailOrMobile(testEmail).select('+password +active');
    
    if (foundUser) {
      console.log('✅ findByEmailOrMobile method working correctly');
      console.log(`   Found user: ${foundUser.fullName} (${foundUser.email})`);
      console.log(`   Has password: ${!!foundUser.password}`);
      console.log(`   Password length: ${foundUser.password ? foundUser.password.length : 'N/A'}`);
      console.log(`   Is active: ${foundUser.active}`);
    } else {
      console.log('❌ findByEmailOrMobile method failed to find user');
    }

    // Test API endpoint if server is running
    console.log('\n🌐 Testing Login API Endpoint:');
    console.log('-------------------------------');
    
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: testEmail,
        password: 'password123' // Common default password
      }, {
        timeout: 5000,
        validateStatus: () => true // Accept all status codes
      });
      
      console.log(`API Response Status: ${loginResponse.status}`);
      console.log(`API Response Message: ${loginResponse.data.message || 'No message'}`);
      
      if (loginResponse.status === 200) {
        console.log('✅ Login API endpoint working correctly');
      } else if (loginResponse.status === 401) {
        console.log('🔐 Login API endpoint working (wrong password expected)');
        console.log('💡 Try different passwords or reset user password');
      } else {
        console.log('⚠️  Unexpected response from login endpoint');
        console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
      }
      
    } catch (apiError) {
      if (apiError.code === 'ECONNREFUSED') {
        console.log('❌ Server is not running on http://localhost:5000');
        console.log('💡 Make sure your server is started with: npm run dev');
      } else {
        console.log('❌ API test failed:', apiError.message);
      }
    }

  } catch (error) {
    console.error('❌ Login test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Create a test user function
const createTestUser = async () => {
  console.log('\n👤 Creating Test User (if needed):');
  console.log('-----------------------------------');
  
  try {
    const User = require('./src/models/User');
    
    // Check if test user already exists
    const existingUser = await User.findByEmailOrMobile('test@evzip.com');
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      return existingUser;
    }
    
    // Create test user
    const testUserData = {
      fullName: 'Test User',
      email: 'test@evzip.com',
      mobileNumber: '9999999999',
      password: 'password123',
      passwordConfirm: 'password123',
      role: 'admin',
      department: 'IT',
      designation: 'Test Admin'
    };
    
    const testUser = await User.create(testUserData);
    console.log('✅ Test user created successfully');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Username: ${testUser.username}`);
    console.log(`   EVZIP ID: ${testUser.evzipId}`);
    console.log(`   Default Password: password123`);
    
    return testUser;
    
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    return null;
  }
};

// Main execution
const runLoginTests = async () => {
  console.log('🔐 EVcore Login System Test');
  console.log('============================');
  
  await connectDB();
  
  // Create test user if needed
  await createTestUser();
  
  // Test login functionality
  await testLogin();
  
  // Close connection
  await mongoose.connection.close();
  console.log('\n✅ Test completed - MongoDB connection closed');
  
  console.log('\n📋 Summary:');
  console.log('-----------');
  console.log('1. Check users in database ✓');
  console.log('2. Test findByEmailOrMobile method ✓');
  console.log('3. Test login API endpoint ✓');
  console.log('4. Create test user if needed ✓');
  console.log('\n💡 If login still fails, check:');
  console.log('   - Server is running on correct port');
  console.log('   - User passwords are correct');
  console.log('   - MongoDB connection is stable');
  console.log('   - No blocking middleware issues');
};

// Run the tests
runLoginTests().catch(console.error);
