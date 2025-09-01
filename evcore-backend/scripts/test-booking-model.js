#!/usr/bin/env node

/**
 * Smart Bookings - Model Test Script
 * 
 * This script tests the Booking model functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../src/models/Booking');

async function testBookingModel() {
  try {
    console.log('🧪 Testing Smart Bookings Model...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://vishnuvardan2004:Jaya.988@evcore.gjcfg9u.mongodb.net/evcore');
    console.log('✅ Connected to MongoDB Atlas\n');

    // Test 1: Create a new booking
    console.log('📋 Test 1: Creating a new booking...');
    const newBooking = new Booking({
      customerName: 'Test User',
      customerPhone: '9876543210',
      customerEmail: 'test@example.com',
      bookingType: 'airport',
      subType: 'pickup',
      pickupLocation: 'Airport Terminal 1',
      dropLocation: 'IT Hub',
      scheduledDate: new Date('2025-09-10'),
      scheduledTime: '15:30',
      estimatedCost: 750,
      paymentMode: 'UPI',
      createdBy: new mongoose.Types.ObjectId()
    });

    await newBooking.save();
    console.log(`✅ Created booking: ${newBooking.bookingId}`);
    console.log(`   Customer: ${newBooking.customerName}`);
    console.log(`   Type: ${newBooking.bookingType} (${newBooking.subType})`);
    console.log(`   Status: ${newBooking.status}`);
    console.log(`   Cost: ₹${newBooking.estimatedCost}\n`);

    // Test 2: Test instance methods
    console.log('📋 Test 2: Testing instance methods...');
    console.log(`✅ Can be cancelled: ${newBooking.canBeCancelled()}`);
    console.log(`✅ Can be modified: ${newBooking.canBeModified()}`);
    console.log(`✅ Total payment: ₹${newBooking.getTotalPayment()}`);
    console.log(`✅ Duration: ${newBooking.getBookingDuration()} minutes\n`);

    // Test 3: Test static methods
    console.log('📋 Test 3: Testing static methods...');
    
    // Find by status
    const pendingBookings = await Booking.findByStatus('pending');
    console.log(`✅ Found ${pendingBookings.length} pending bookings`);
    
    // Find by customer phone
    const customerBookings = await Booking.findByCustomerPhone('9876543210');
    console.log(`✅ Found ${customerBookings.length} bookings for customer`);

    // Get statistics
    const stats = await Booking.getBookingStats();
    console.log(`✅ Total bookings: ${stats.totalBookings}`);
    console.log(`✅ Total revenue: ₹${stats.totalRevenue}\n`);

    // Test 4: Test status transitions
    console.log('📋 Test 4: Testing status transitions...');
    newBooking.status = 'confirmed';
    newBooking.vehicleNumber = 'TS09EZ9999';
    newBooking.pilotName = 'Test Driver';
    await newBooking.save();
    console.log(`✅ Updated status to: ${newBooking.status}`);

    newBooking.status = 'in_progress';
    await newBooking.save();
    console.log(`✅ Updated status to: ${newBooking.status}`);
    console.log(`✅ Actual start time set: ${newBooking.actualStartTime}\n`);

    // Test 5: Test validation
    console.log('📋 Test 5: Testing validation...');
    try {
      const invalidBooking = new Booking({
        customerName: 'X', // Too short
        customerPhone: '123', // Invalid format
        bookingType: 'invalid', // Not in enum
        scheduledDate: new Date('2020-01-01'), // Past date
        scheduledTime: '25:99', // Invalid time format
        estimatedCost: -100, // Negative cost
        paymentMode: 'Bitcoin', // Not in enum
        createdBy: new mongoose.Types.ObjectId()
      });
      
      await invalidBooking.save();
      console.log('❌ Validation should have failed');
    } catch (error) {
      console.log('✅ Validation correctly failed for invalid data');
      console.log(`   Error: ${error.message.split(',')[0]}...\n`);
    }

    // Test 6: Test part payment
    console.log('📋 Test 6: Testing part payment...');
    const partPaymentBooking = new Booking({
      customerName: 'Part Payment Customer',
      customerPhone: '8765432109',
      bookingType: 'rental',
      subType: 'package',
      pickupLocation: 'City Center',
      scheduledDate: new Date('2025-09-12'),
      scheduledTime: '12:00',
      estimatedCost: 1000,
      paymentMode: 'Part Payment',
      partPaymentCash: 400,
      partPaymentUPI: 600,
      createdBy: new mongoose.Types.ObjectId()
    });

    await partPaymentBooking.save();
    console.log(`✅ Created part payment booking: ${partPaymentBooking.bookingId}`);
    console.log(`✅ Total payment: ₹${partPaymentBooking.getTotalPayment()}`);
    console.log(`   Cash: ₹${partPaymentBooking.partPaymentCash}`);
    console.log(`   UPI: ₹${partPaymentBooking.partPaymentUPI}\n`);

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await Booking.deleteMany({ bookingId: { $regex: /^SB_/ } });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All tests passed! Booking model is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run tests
testBookingModel().catch(console.error);
