/**
 * MongoDB Atlas Connection Test
 * Verifies that the production database configuration is working
 */

const mongoose = require('mongoose');
const config = require('../src/config');

async function testAtlasConnection() {
  console.log('🧪 Testing MongoDB Atlas Connection...\n');
  
  try {
    console.log('📡 Connecting to MongoDB Atlas...');
    console.log(`   Database: ${config.mongoUri.split('@')[1].split('/')[0]}`);
    console.log(`   Database Name: ${config.mongoUri.split('/').pop()}`);
    
    await mongoose.connect(config.mongoUri);
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test basic database operations
    console.log('\n🔍 Testing database operations...');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`✅ Database accessible - Found ${collections.length} collections`);
    
    if (collections.length > 0) {
      console.log('   Collections:', collections.map(c => c.name).join(', '));
    }
    
    // Test ping
    await db.admin().ping();
    console.log('✅ Database ping successful');
    
    console.log('\n🎯 Atlas Connection Test Results:');
    console.log('   • Connection: ✅ Successful');
    console.log('   • Database Access: ✅ Verified');
    console.log('   • Network Connectivity: ✅ Working');
    console.log('   • Authentication: ✅ Valid');
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('   Issue: Invalid credentials');
    } else if (error.message.includes('network')) {
      console.error('   Issue: Network connectivity problem');
    } else if (error.message.includes('timeout')) {
      console.error('   Issue: Connection timeout - check IP whitelist');
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify MongoDB Atlas credentials');
    console.log('   2. Check IP whitelist (0.0.0.0/0 for all IPs)');
    console.log('   3. Ensure cluster is running');
    console.log('   4. Verify network connectivity');
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB Atlas');
  }
}

// Run test
testAtlasConnection()
  .then(() => {
    console.log('\n🎉 MongoDB Atlas is ready for production!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });
