#!/usr/bin/env node

/**
 * Vehicle Deployment Tracker Migration Runner
 * Run this script to set up the Vehicle Deployment Tracker database structure
 */

require('dotenv').config();
const mongoose = require('mongoose');
const VehicleDeploymentMigration = require('../src/utils/vehicleDeploymentMigration');

async function runMigration() {
  try {
    console.log('🚀 Vehicle Deployment Tracker Migration Runner\n');
    
    // Connect to MongoDB Atlas (production-ready)
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://vishnuvardan2004:Jaya.988@evcore.gjcfg9u.mongodb.net/evcore';
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Run migration
    const migration = new VehicleDeploymentMigration();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
      case 'migrate':
      case undefined:
        await migration.migrate();
        break;
        
      case 'rollback':
        console.log('⚠️  WARNING: This will delete all Vehicle Deployment Tracker data!');
        console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        await migration.rollback();
        break;
        
      case 'status':
        await migration.getStatus();
        break;
        
      default:
        console.log('❌ Unknown command:', command);
        console.log('\nAvailable commands:');
        console.log('  migrate  - Run the migration (default)');
        console.log('  rollback - Remove all Vehicle Deployment Tracker data');
        console.log('  status   - Show current database status');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error details:');
    console.error(error);
    process.exit(1);
    
  } finally {
    // Close MongoDB connection
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error.message);
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Migration interrupted by user');
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the migration
runMigration();
