const axios = require('axios');

async function testAuthentication() {
  console.log('🔍 Testing Live Authentication API...\n');

  const baseURL = 'http://localhost:3001/api/auth';

  // Test 1: Admin login (should work)
  try {
    console.log('1️⃣ Testing admin@evcore.com login...');
    const adminResponse = await axios.post(`${baseURL}/login`, {
      email: 'admin@evcore.com',
      password: 'admin123'
    });
    console.log('✅ Admin login successful!');
    console.log(`   Role: ${adminResponse.data.data.user.role}`);
    console.log(`   Token received: ${adminResponse.data.token ? 'Yes' : 'No'}\n`);
  } catch (error) {
    console.log('❌ Admin login failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
  }

  // Test 2: Pilot login (the problematic one)
  try {
    console.log('2️⃣ Testing prasadh@gmail.com login...');
    const pilotResponse = await axios.post(`${baseURL}/login`, {
      email: 'prasadh@gmail.com',
      password: 'Pilot123'
    });
    console.log('✅ Pilot login successful!');
    console.log(`   Role: ${pilotResponse.data.data.user.role}`);
    console.log(`   Token received: ${pilotResponse.data.token ? 'Yes' : 'No'}\n`);
  } catch (error) {
    console.log('❌ Pilot login failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    console.log(`   Full error data:`, error.response?.data);
    
    // Additional debugging - check if user exists in database
    console.log('\n🔍 Checking if user exists in database...');
    const mongoose = require('mongoose');
    const User = require('../src/models/User');
    const { connectToDatabase } = require('./database-helper');
    
    try {
      await connectToDatabase(mongoose);
      const user = await User.findOne({ email: 'prasadh@gmail.com' });
      console.log(`   User exists in DB: ${user ? 'Yes' : 'No'}`);
      if (user) {
        console.log(`   User email: ${user.email}`);
        console.log(`   User role: ${user.role}`);
        console.log(`   User active: ${user.active}`);
        console.log(`   User username: ${user.username}`);
        console.log(`   User evzipId: ${user.evzipId}`);
      }
      await mongoose.disconnect();
    } catch (dbError) {
      console.log(`   Database check failed: ${dbError.message}`);
    }
  }

  // Test 3: Super admin login
  try {
    console.log('\n3️⃣ Testing vishhnuvardan2004@gmail.com login...');
    const superResponse = await axios.post(`${baseURL}/login`, {
      email: 'vishhnuvardan2004@gmail.com',
      password: 'SuperAdmin123'
    });
    console.log('✅ Super admin login successful!');
    console.log(`   Role: ${superResponse.data.data.user.role}`);
    console.log(`   Token received: ${superResponse.data.token ? 'Yes' : 'No'}\n`);
  } catch (error) {
    console.log('❌ Super admin login failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
  }
}

testAuthentication().catch(console.error);
