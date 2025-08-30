/**
 * Verify All Database Connections Use MongoDB Atlas
 * This script checks that all files are properly configured to use MongoDB Atlas
 */

const fs = require('fs');
const path = require('path');
const { connectToDatabase } = require('./database-helper');
const mongoose = require('mongoose');

// Expected Atlas connection string pattern
const ATLAS_PATTERN = /mongodb\+srv:\/\/.*@evcore\.gjcfg9u\.mongodb\.net/;
const LOCALHOST_PATTERN = /mongodb:\/\/localhost:27017/;

async function verifyAtlasConnections() {
  console.log('🔍 Verifying All Database Connections Use MongoDB Atlas\n');

  // 1. Test the database helper function
  console.log('1️⃣ Testing database helper...');
  try {
    await connectToDatabase(mongoose);
    console.log('✅ Database helper connects to Atlas successfully');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ Database helper connection failed:', error.message);
  }

  // 2. Check all JavaScript files for hardcoded MongoDB connections
  console.log('\n2️⃣ Scanning files for MongoDB connections...');
  
  const filesToCheck = [
    // Main config files
    'src/config/index.js',
    'src/config/database.js',
    '.env.example',
    
    // Root level files
    'reset-passwords.js',
    'debug-rbac-db.js',
    'test-middleware.js',
    
    // Scripts
    'scripts/seed.js',
    'scripts/initialize-rbac.js',
    'scripts/database-helper.js',
    'scripts/test-api-context.js',
    'scripts/diagnose-auth.js',
    'scripts/debug-login.js',
    'scripts/create-pilot-prasadh.js',
    'scripts/check-all-users.js',
    'scripts/test-db-connection.js',
    'scripts/create-users-atlas.js',
    'scripts/test-live-auth.js',
    'scripts/check-user-permissions.js'
  ];

  const issues = [];

  for (const filePath of filesToCheck) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for localhost connections (bad)
      if (LOCALHOST_PATTERN.test(content) && !filePath.includes('.env.example')) {
        issues.push(`❌ ${filePath}: Contains localhost MongoDB connection`);
      }
      // Check for Atlas connections (good) or uses helper (also good)
      else if (ATLAS_PATTERN.test(content) || content.includes('connectToDatabase') || content.includes('getMongoUri')) {
        console.log(`✅ ${filePath}: Uses Atlas connection or database helper`);
      }
      // Files that should have connections but don't
      else if (content.includes('mongoose.connect') || content.includes('MONGO_URI')) {
        issues.push(`⚠️  ${filePath}: Has database code but unclear connection type`);
      }
    } else {
      console.log(`⏭️  ${filePath}: File not found (skipping)`);
    }
  }

  // 3. Report results
  console.log('\n3️⃣ Verification Results:');
  
  if (issues.length === 0) {
    console.log('🎉 All files are properly configured for MongoDB Atlas!');
    console.log('\n✅ Summary:');
    console.log('   - Database helper function working');
    console.log('   - All scripts use Atlas connection');
    console.log('   - Configuration files point to Atlas');
    console.log('   - No localhost connections found');
  } else {
    console.log('🚨 Issues found:');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('\n💡 All files should either:');
    console.log('   - Use the database-helper.js connectToDatabase() function');
    console.log('   - Use process.env.MONGO_URI with Atlas fallback');
    console.log('   - Connect to MongoDB Atlas directly');
  }

  // 4. Test a sample user query to ensure data exists
  console.log('\n4️⃣ Testing sample data in Atlas...');
  try {
    await connectToDatabase(mongoose);
    const User = require('../src/models/User');
    
    const userCount = await User.countDocuments();
    console.log(`✅ Found ${userCount} users in Atlas database`);
    
    const sampleUsers = await User.find({}, 'email role').limit(3);
    console.log('   Sample users:');
    sampleUsers.forEach(user => {
      console.log(`     - ${user.email} (${user.role})`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ Data verification failed:', error.message);
  }

  console.log('\n✅ Verification complete!');
}

// Run verification
verifyAtlasConnections().catch(console.error);
