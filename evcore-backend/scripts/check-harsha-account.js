const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');
const User = require('../src/models/User');

async function checkHarshaAccount() {
  try {
    console.log('🔍 Checking harsha@gmail.com account in MongoDB Atlas...\n');
    
    await connectToDatabase(mongoose);

    // 1. Check if User account exists
    console.log('1️⃣ Checking User collection...');
    const user = await User.findOne({ email: 'harsha@gmail.com' });
    
    if (user) {
      console.log('✅ User account found:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Full Name: ${user.fullName}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   evzipId: ${user.evzipId}`);
      console.log(`   Active: ${user.active}`);
      console.log(`   Is Temporary Password: ${user.isTemporaryPassword}`);
      console.log(`   Must Change Password: ${user.mustChangePassword}`);
      console.log(`   Mobile Number: ${user.mobileNumber}`);
      console.log(`   Created At: ${user.createdAt}`);
    } else {
      console.log('❌ User account NOT found in User collection');
    }

    // 2. Check if there's a Pilot-specific record (if there's a separate Pilot model)
    console.log('\n2️⃣ Checking for any Pilot-specific records...');
    try {
      const Pilot = require('../src/models/Pilot');
      const pilot = await Pilot.findOne({ email: 'harsha@gmail.com' });
      
      if (pilot) {
        console.log('✅ Pilot record found:');
        console.log(`   Email: ${pilot.email}`);
        console.log(`   Full Name: ${pilot.fullName || pilot.name}`);
        console.log(`   Created At: ${pilot.createdAt}`);
      } else {
        console.log('❌ Pilot record NOT found');
      }
    } catch (error) {
      console.log('ℹ️  No separate Pilot model found (this is normal if pilots are stored in User collection)');
    }

    // 3. Search for any records with "harsha" in email across collections
    console.log('\n3️⃣ Searching for any records with "harsha"...');
    const allUsersWithHarsha = await User.find({ 
      email: { $regex: 'harsha', $options: 'i' } 
    });
    
    console.log(`   Found ${allUsersWithHarsha.length} records matching "harsha"`);
    allUsersWithHarsha.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.email} (${u.role}) - ${u.fullName}`);
    });

    // 4. If user exists, test authentication
    if (user) {
      console.log('\n4️⃣ Testing authentication...');
      
      // Test with default password
      const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'Welcome123!';
      console.log(`   Testing with default password: "${defaultPassword}"`);
      
      const userWithPassword = await User.findOne({ email: 'harsha@gmail.com' }).select('+password');
      if (userWithPassword && userWithPassword.password) {
        const isDefaultValid = await userWithPassword.correctPassword(defaultPassword, userWithPassword.password);
        console.log(`   Default password valid: ${isDefaultValid ? '✅' : '❌'}`);
        
        // Test with common pilot passwords
        const testPasswords = ['Pilot123', 'Harsha123', 'harsha123', 'Password123'];
        for (const testPass of testPasswords) {
          const isValid = await userWithPassword.correctPassword(testPass, userWithPassword.password);
          if (isValid) {
            console.log(`   ✅ Password "${testPass}" works!`);
            break;
          }
        }
      } else {
        console.log('❌ Password field is empty or null');
      }
    }

    // 5. Test findByEmailOrMobile method
    if (user) {
      console.log('\n5️⃣ Testing findByEmailOrMobile method...');
      const foundUser = await User.findByEmailOrMobile('harsha@gmail.com');
      console.log(`   Method result: ${foundUser ? '✅ Found' : '❌ Not found'}`);
      
      if (foundUser) {
        console.log(`   Email: ${foundUser.email}`);
        console.log(`   Role: ${foundUser.role}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking account:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n💤 Disconnected from MongoDB Atlas');
  }
}

checkHarshaAccount();
