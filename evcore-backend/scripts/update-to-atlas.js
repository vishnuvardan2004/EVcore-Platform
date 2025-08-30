const fs = require('fs');
const path = require('path');

// Files to update with Atlas connection
const filesToUpdate = [
  'scripts/create-test-users.js',
  'scripts/create-your-account.js', 
  'scripts/check-pilot-account.js',
  'scripts/check-all-collections.js',
  'scripts/create-pilot-prasadh.js',
  'scripts/debug-login.js',
  'scripts/test-login-server.js',
  'scripts/test-db-connection.js',
  'debug-rbac-db.js',
  'test-middleware.js'
];

function updateFileToAtlas(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add database helper import at the top
    if (!content.includes('database-helper')) {
      // Find the position after mongoose import
      const mongooseImportRegex = /const mongoose = require\('mongoose'\);/;
      if (mongooseImportRegex.test(content)) {
        content = content.replace(
          mongooseImportRegex,
          "const mongoose = require('mongoose');\nconst { connectToDatabase } = require('./database-helper');"
        );
      }
    }
    
    // Replace localhost connections with Atlas helper
    const replacements = [
      {
        from: /await mongoose\.connect\('mongodb:\/\/localhost:27017\/evcore'\);/g,
        to: "await connectToDatabase(mongoose);"
      },
      {
        from: /await mongoose\.connect\('mongodb:\/\/localhost:27017\/evzip-platform'\);/g,
        to: "await connectToDatabase(mongoose);"
      },
      {
        from: /mongoose\.connect\('mongodb:\/\/localhost:27017\/evcore'\)/g,
        to: "connectToDatabase(mongoose)"
      },
      {
        from: /const MONGODB_URI = process\.env\.MONGODB_URI \|\| 'mongodb:\/\/localhost:27017\/evzip-platform';/g,
        to: "const { getMongoUri } = require('./scripts/database-helper');\nconst MONGODB_URI = getMongoUri();"
      },
      {
        from: /console\.log\('✅ Connected to MongoDB'\);/g,
        to: "// Connection success logged by helper"
      }
    ];
    
    let modified = false;
    replacements.forEach(replacement => {
      if (replacement.from.test(content)) {
        content = content.replace(replacement.from, replacement.to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

console.log('🔄 Updating all scripts to use MongoDB Atlas...\n');

filesToUpdate.forEach(updateFileToAtlas);

console.log('\n✅ All script files have been updated to use MongoDB Atlas!');
console.log('\nNext steps:');
console.log('1. Test a few key scripts to ensure they work');
console.log('2. Update any remaining hardcoded localhost connections');
console.log('3. Update environment examples');
