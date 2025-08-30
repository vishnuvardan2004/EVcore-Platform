const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');

async function checkAllCollections() {
  try {
    console.log('🔍 Checking all collections for pilot data...');
    
    // Connect to MongoDB
    await connectToDatabase(mongoose);
    // Connection success logged by helper

    const pilotEmail = 'prasadh@gmail.com';
    
    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Search in each collection for the email
    console.log(`\n🔍 Searching for "${pilotEmail}" in all collections:`);
    
    for (const collection of collections) {
      try {
        const results = await mongoose.connection.db
          .collection(collection.name)
          .find({ 
            $or: [
              { email: pilotEmail },
              { emailId: pilotEmail },
              { 'email': pilotEmail }
            ]
          })
          .toArray();
        
        if (results.length > 0) {
          console.log(`\n✅ Found in collection "${collection.name}":`);
          results.forEach(result => {
            console.log(`   - ID: ${result._id}`);
            console.log(`   - Email: ${result.email || result.emailId}`);
            console.log(`   - Name: ${result.name || result.fullName || result.pilotName}`);
            console.log(`   - Role: ${result.role || 'Not specified'}`);
            console.log(`   - Active: ${result.active !== false && result.isActive !== false}`);
            console.log(`   - Data:`, JSON.stringify(result, null, 2));
          });
        } else {
          console.log(`   - ${collection.name}: Not found`);
        }
      } catch (error) {
        console.log(`   - ${collection.name}: Error searching - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking collections:', error);
  } finally {
    console.log('💤 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
}

// Run the script
checkAllCollections();
