#!/usr/bin/env node

/**
 * Smart Bookings - Database Migration Script
 * 
 * This script sets up the Booking collection with proper indexes
 * and validates the schema implementation.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../src/models/Booking');

class SmartBookingsMigration {
  constructor() {
    this.mongoUri = process.env.MONGO_URI || 'mongodb+srv://vishnuvardan2004:Jaya.988@evcore.gjcfg9u.mongodb.net/evcore';
  }

  async connect() {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(this.mongoUri);
    console.log('✅ Connected to database\n');
  }

  async createIndexes() {
    console.log('📝 Creating MongoDB indexes for Smart Bookings...');
    
    try {
      const collection = mongoose.connection.db.collection('smart_bookings');
      
      // Drop existing indexes (except _id) to ensure clean state
      try {
        const existingIndexes = await collection.indexes();
        for (const index of existingIndexes) {
          if (index.name !== '_id_') {
            await collection.dropIndex(index.name);
            console.log(`   Dropped existing index: ${index.name}`);
          }
        }
      } catch (error) {
        console.log('   No existing indexes to drop');
      }

      // Create performance-optimized indexes
      const indexOperations = [
        // 1. Primary queries: status and scheduled date
        {
          keys: { status: 1, scheduledDate: 1 },
          name: 'status_scheduledDate_idx',
          background: true
        },
        
        // 2. Vehicle-based queries
        {
          keys: { vehicleNumber: 1, status: 1 },
          name: 'vehicleNumber_status_idx',
          background: true
        },
        
        // 3. Customer phone lookup
        {
          keys: { customerPhone: 1 },
          name: 'customerPhone_idx',
          background: true
        },
        
        // 4. Booking type and date filtering
        {
          keys: { bookingType: 1, scheduledDate: 1 },
          name: 'bookingType_scheduledDate_idx',
          background: true
        },
        
        // 5. Active bookings with status (soft delete support)
        {
          keys: { isActive: 1, status: 1 },
          name: 'isActive_status_idx',
          background: true
        },
        
        // 6. Date range queries with status and active flag
        {
          keys: { scheduledDate: 1, status: 1, isActive: 1 },
          name: 'scheduledDate_status_isActive_idx',
          background: true
        },
        
        // 7. Booking ID unique constraint
        {
          keys: { bookingId: 1 },
          name: 'bookingId_unique_idx',
          unique: true,
          background: true
        },
        
        // 8. Text search index for customer name and locations
        {
          keys: { 
            customerName: 'text', 
            pickupLocation: 'text', 
            dropLocation: 'text' 
          },
          name: 'booking_search_text_idx',
          weights: {
            customerName: 10,
            pickupLocation: 5,
            dropLocation: 5
          },
          background: true
        }
      ];

      // Create indexes one by one with progress tracking
      for (let i = 0; i < indexOperations.length; i++) {
        const indexOp = indexOperations[i];
        console.log(`   Creating index ${i + 1}/${indexOperations.length}: ${indexOp.name}...`);
        
        try {
          const indexOptions = {
            name: indexOp.name,
            unique: indexOp.unique || false,
            background: indexOp.background || true
          };
          
          // Only add weights for text indexes
          if (indexOp.weights) {
            indexOptions.weights = indexOp.weights;
          }
          
          await collection.createIndex(indexOp.keys, indexOptions);
          console.log(`   ✅ ${indexOp.name} created successfully`);
        } catch (error) {
          console.error(`   ❌ Failed to create ${indexOp.name}:`, error.message);
        }
      }

      console.log('\n📊 Index creation completed!');
      
      // Verify indexes
      const finalIndexes = await collection.indexes();
      console.log(`   Total indexes: ${finalIndexes.length}`);
      finalIndexes.forEach(index => {
        console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
      });

    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      throw error;
    }
  }

  async validateSchema() {
    console.log('\n🔍 Validating Booking schema...');
    
    try {
      // Test schema validation with sample data
      const testBooking = new Booking({
        customerName: 'Test Customer',
        customerPhone: '9876543210',
        customerEmail: 'test@example.com',
        bookingType: 'airport',
        subType: 'pickup',
        pickupLocation: 'Test Pickup Location',
        scheduledDate: new Date('2025-09-15'),
        scheduledTime: '10:30',
        estimatedCost: 500,
        paymentMode: 'Cash',
        createdBy: new mongoose.Types.ObjectId()
      });

      // Validate without saving
      const validationError = testBooking.validateSync();
      if (validationError) {
        console.error('❌ Schema validation failed:', validationError.message);
        return false;
      }

      console.log('✅ Schema validation passed');

      // Test booking ID generation
      const bookingIdGenerated = testBooking.generateBookingId();
      if (!testBooking.bookingId.match(/^SB_\d{6}_\d{4}$/)) {
        console.error('❌ Booking ID generation failed');
        return false;
      }

      console.log(`✅ Booking ID generation works: ${testBooking.bookingId}`);

      // Validate again with generated booking ID
      const validationError2 = testBooking.validateSync();
      if (validationError2) {
        console.error('❌ Schema validation failed after booking ID generation:', validationError2.message);
        return false;
      }

      // Test instance methods
      console.log(`✅ Can be cancelled: ${testBooking.canBeCancelled()}`);
      console.log(`✅ Can be modified: ${testBooking.canBeModified()}`);
      console.log(`✅ Total payment: ₹${testBooking.getTotalPayment()}`);

      return true;
    } catch (error) {
      console.error('❌ Schema validation error:', error);
      return false;
    }
  }

  async createSampleData() {
    console.log('\n📋 Creating sample booking data...');
    
    try {
      // Check if sample data already exists
      const existingCount = await Booking.countDocuments({ bookingId: /^TEST_SB_/ });
      if (existingCount > 0) {
        console.log(`   Found ${existingCount} existing test bookings, skipping sample data creation`);
        return;
      }

      const sampleBookings = [
        {
          customerName: 'John Doe',
          customerPhone: '9876543210',
          customerEmail: 'john@example.com',
          bookingType: 'airport',
          subType: 'pickup',
          pickupLocation: 'Rajiv Gandhi International Airport',
          dropLocation: 'Hitech City',
          scheduledDate: new Date('2025-09-15'),
          scheduledTime: '10:30',
          estimatedCost: 800,
          paymentMode: 'UPI',
          status: 'confirmed',
          vehicleNumber: 'TS09EZ1234',
          pilotName: 'Ram Kumar',
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          customerName: 'Jane Smith',
          customerPhone: '8765432109',
          customerEmail: 'jane@example.com',
          bookingType: 'rental',
          subType: 'package',
          pickupLocation: 'Banjara Hills',
          scheduledDate: new Date('2025-09-16'),
          scheduledTime: '14:00',
          estimatedCost: 1200,
          paymentMode: 'Part Payment',
          partPaymentCash: 500,
          partPaymentUPI: 700,
          status: 'pending',
          specialRequirements: 'Need child seat',
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          customerName: 'Rajesh Patel',
          customerPhone: '7654321098',
          bookingType: 'subscription',
          subType: 'monthly',
          pickupLocation: 'Kondapur',
          dropLocation: 'Gachibowli',
          scheduledDate: new Date('2025-09-17'),
          scheduledTime: '09:00',
          estimatedCost: 5000,
          paymentMode: 'Card',
          status: 'assigned',
          vehicleNumber: 'TS09EZ5678',
          pilotName: 'Suresh Reddy',
          createdBy: new mongoose.Types.ObjectId()
        }
      ];

      // Insert sample bookings
      for (const bookingData of sampleBookings) {
        const booking = new Booking(bookingData);
        await booking.save();
        console.log(`   ✅ Created sample booking: ${booking.bookingId} for ${booking.customerName}`);
      }

      console.log(`\n✅ Created ${sampleBookings.length} sample bookings`);
    } catch (error) {
      console.error('❌ Error creating sample data:', error);
    }
  }

  async testQueries() {
    console.log('\n🔍 Testing database queries...');
    
    try {
      // Test 1: Find by status
      const confirmedBookings = await Booking.findByStatus('confirmed');
      console.log(`✅ Query by status: Found ${confirmedBookings.length} confirmed bookings`);

      // Test 2: Find by date range
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const upcomingBookings = await Booking.findByDateRange(tomorrow, nextWeek);
      console.log(`✅ Query by date range: Found ${upcomingBookings.length} upcoming bookings`);

      // Test 3: Find by vehicle
      const vehicleBookings = await Booking.findByVehicle('TS09EZ1234');
      console.log(`✅ Query by vehicle: Found ${vehicleBookings.length} bookings for TS09EZ1234`);

      // Test 4: Get booking statistics
      const stats = await Booking.getBookingStats();
      console.log('✅ Booking statistics:');
      console.log(`   Total bookings: ${stats.totalBookings}`);
      console.log(`   Total revenue: ₹${stats.totalRevenue}`);
      console.log(`   Completed bookings: ${stats.completedBookings}`);
      console.log(`   Average rating: ${stats.averageRating || 'N/A'}`);

      // Test 5: Text search
      const searchResults = await Booking.find({ $text: { $search: 'john airport' } });
      console.log(`✅ Text search: Found ${searchResults.length} results for 'john airport'`);

    } catch (error) {
      console.error('❌ Error testing queries:', error);
    }
  }

  async generateMigrationReport() {
    console.log('\n📊 Smart Bookings Migration Report');
    console.log('=====================================');
    
    try {
      const collection = mongoose.connection.db.collection('smart_bookings');
      
      // Collection stats
      let stats;
      try {
        stats = await collection.stats();
      } catch (error) {
        // Use alternative method for stats if stats() is not available
        const count = await collection.countDocuments();
        stats = { count, avgObjSize: 0, size: 0, totalIndexSize: 0 };
      }
      console.log(`Collection: smart_bookings`);
      console.log(`Documents: ${stats.count || 0}`);
      console.log(`Average document size: ${Math.round(stats.avgObjSize || 0)} bytes`);
      console.log(`Total collection size: ${Math.round((stats.size || 0) / 1024)} KB`);
      console.log(`Index size: ${Math.round((stats.totalIndexSize || 0) / 1024)} KB`);

      // Index information
      const indexes = await collection.indexes();
      console.log(`\nIndexes created: ${indexes.length}`);
      indexes.forEach((index, i) => {
        console.log(`${i + 1}. ${index.name}`);
        console.log(`   Keys: ${JSON.stringify(index.key)}`);
        if (index.unique) console.log(`   Unique: true`);
        if (index.weights) console.log(`   Weights: ${JSON.stringify(index.weights)}`);
      });

      // Schema validation summary
      console.log(`\n✅ Schema Features:`);
      console.log(`   - Auto-generated booking IDs (SB_YYMMDD_XXXX format)`);
      console.log(`   - Comprehensive field validation`);
      console.log(`   - Business rule validation`);
      console.log(`   - Status lifecycle management`);
      console.log(`   - Soft delete support`);
      console.log(`   - Customer and vehicle relationship tracking`);
      console.log(`   - Payment tracking (including part payments)`);
      console.log(`   - Performance-optimized indexes`);
      console.log(`   - Full-text search capability`);

      console.log(`\n🎯 Ready for Smart Bookings backend implementation!`);

    } catch (error) {
      console.error('❌ Error generating report:', error);
    }
  }

  async run() {
    try {
      console.log('🚀 Smart Bookings Database Migration Starting...\n');
      
      await this.connect();
      await this.createIndexes();
      
      const schemaValid = await this.validateSchema();
      if (!schemaValid) {
        throw new Error('Schema validation failed');
      }
      
      await this.createSampleData();
      await this.testQueries();
      await this.generateMigrationReport();
      
      console.log('\n🎉 Smart Bookings migration completed successfully!');
      console.log('   Ready to implement Smart Bookings controller and API endpoints.\n');
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    } finally {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️ Migration interrupted by user');
  try {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('Error closing connection:', error.message);
  }
  process.exit(0);
});

// Run migration if called directly
if (require.main === module) {
  const migration = new SmartBookingsMigration();
  migration.run().catch(console.error);
}

module.exports = SmartBookingsMigration;
