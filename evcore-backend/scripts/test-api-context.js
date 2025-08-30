const mongoose = require('mongoose');
const User = require('../src/models/User');
const { connectToDatabase } = require('./database-helper');

async function testAPIContext() {
  try {
    console.log('🔍 Testing API context...');
    
    // Connect to the same MongoDB Atlas database as the API
    await connectToDatabase(mongoose);

    const email = 'prasadh@gmail.com';
    
    // Test the exact same query as the API
    console.log(`\n🔍 Testing findByEmailOrMobile with: "${email}"`);
    const user1 = await User.findByEmailOrMobile(email);
    console.log('Result 1 (no select):', user1 ? `Found: ${user1.email}` : 'Not found');
    
    // Test with select (same as API)
    console.log(`\n🔍 Testing findByEmailOrMobile with select...`);
    const user2 = await User.findByEmailOrMobile(email).select('+password +active +loginAttempts +lockUntil');
    console.log('Result 2 (with select):', user2 ? `Found: ${user2.email}` : 'Not found');
    
    // Test direct findOne
    console.log(`\n🔍 Testing direct findOne...`);
    const user3 = await User.findOne({ email: email });
    console.log('Result 3 (direct findOne):', user3 ? `Found: ${user3.email}` : 'Not found');
    
    // Test findOne with $or
    console.log(`\n🔍 Testing findOne with $or...`);
    const user4 = await User.findOne({
      $or: [
        { email: email },
        { mobileNumber: email }
      ]
    });
    console.log('Result 4 ($or query):', user4 ? `Found: ${user4.email}` : 'Not found');

    // Show all users to compare
    console.log(`\n📋 All users in database:`);
    const allUsers = await User.find({}, 'email role fullName');
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });

  } catch (error) {
    console.error('❌ Error testing API context:', error);
  } finally {
    console.log('💤 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
}

// Run the script
testAPIContext();
