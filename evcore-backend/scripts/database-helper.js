// Database configuration helper
// This ensures all scripts use the same MongoDB Atlas connection as the API

const getMongoUri = () => {
  // Use the same connection as the API server
  return process.env.MONGO_URI || 'mongodb+srv://vishnuvardan2004:Jaya.988@evcore.gjcfg9u.mongodb.net/evcore';
};

const connectToDatabase = async (mongoose) => {
  const mongoUri = getMongoUri();
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB Atlas');
  console.log(`   Host: ${mongoose.connection.host}`);
  console.log(`   Database: ${mongoose.connection.name}`);
  return mongoose.connection;
};

module.exports = {
  getMongoUri,
  connectToDatabase
};
