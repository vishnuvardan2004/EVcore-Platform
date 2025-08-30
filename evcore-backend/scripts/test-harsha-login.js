const axios = require('axios');

async function testHarshaLogin() {
  console.log('🔍 Testing Harsha Login via API...\n');

  const baseURL = 'http://localhost:3001/api/auth';

  try {
    console.log('Testing harsha@gmail.com login...');
    const response = await axios.post(`${baseURL}/login`, {
      email: 'harsha@gmail.com',
      password: 'Pilot123'
    });

    console.log('✅ Login successful!');
    console.log(`   Email: ${response.data.data.user.email}`);
    console.log(`   Role: ${response.data.data.user.role}`);
    console.log(`   Full Name: ${response.data.data.user.fullName}`);
    console.log(`   Username: ${response.data.data.user.username}`);
    console.log(`   evzipId: ${response.data.data.user.evzipId}`);
    console.log(`   Token received: ${response.data.token ? 'Yes' : 'No'}`);
    console.log(`   Is Temporary Password: ${response.data.data.user.isTemporaryPassword}`);
    console.log(`   Must Change Password: ${response.data.data.user.mustChangePassword}`);

    if (response.data.data.user.isTemporaryPassword) {
      console.log('\n📝 Note: User will be forced to change password on first login to frontend');
    }

  } catch (error) {
    console.log('❌ Login failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data) {
      console.log('   Full error data:', error.response.data);
    }
  }
}

testHarshaLogin();
