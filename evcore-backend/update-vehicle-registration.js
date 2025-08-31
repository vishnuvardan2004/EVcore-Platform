const mongoose = require('mongoose');
const config = require('./src/config/index');

async function updateVehicleRegistration() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const vehiclesCollection = db.collection('vehicles');
    
    // Update the temporary registration with a proper one
    const result = await vehiclesCollection.updateOne(
      { isTemporaryRegistration: true },
      { 
        $set: { 
          registrationNumber: '23453454'
        },
        $unset: { 
          isTemporaryRegistration: '',
          needsProperRegistration: ''
        }
      }
    );
    
    console.log('✅ Updated vehicle with proper registration number: 23453454');
    console.log('Modified count:', result.modifiedCount);
    
    // Verify the update
    const updatedVehicle = await vehiclesCollection.findOne({ registrationNumber: '23453454' });
    console.log('✅ Verification - Vehicle found:', !!updatedVehicle);
    console.log('Registration Number:', updatedVehicle?.registrationNumber);
    
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateVehicleRegistration();
