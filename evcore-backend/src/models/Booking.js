/**
 * Smart Bookings - Booking Model
 * 
 * This model handles all booking-related data for the Smart Bookings module.
 * It is completely isolated from Vehicle Deployment and Data Hub models.
 */

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  // Primary booking identifier
  bookingId: {
    type: String,
    unique: true,
    trim: true,
    match: [/^(SB_\d{6}_\d{4}|TEST_SB_\d{6}_\d{4})$/, 'Booking ID must follow format: SB_YYMMDD_XXXX or TEST_SB_YYMMDD_XXXX']
    // Auto-generated in pre-save middleware, so not required here
    // Unique index will be created via schema.index() method below
  },

  // Customer Information
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Customer name must be at least 2 characters'],
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },

  customerPhone: {
    type: String,
    required: [true, 'Customer phone number is required'],
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian mobile number']
    // Index will be created via schema.index() method below
  },

  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },

  // Booking Type and Category
  bookingType: {
    type: String,
    required: [true, 'Booking type is required'],
    enum: {
      values: ['airport', 'rental', 'subscription'],
      message: 'Booking type must be airport, rental, or subscription'
    }
    // Index will be created via compound indexes below
  },

  subType: {
    type: String,
    enum: {
      values: ['pickup', 'drop', 'package', 'monthly', 'quarterly', 'yearly'],
      message: 'Invalid sub-type for the selected booking type'
    }
  },

  // Location Information
  pickupLocation: {
    type: String,
    required: function() {
      return this.bookingType === 'airport' || this.bookingType === 'rental';
    },
    trim: true,
    maxlength: [200, 'Pickup location cannot exceed 200 characters']
  },

  dropLocation: {
    type: String,
    required: function() {
      return this.bookingType === 'airport' && this.subType === 'drop';
    },
    trim: true,
    maxlength: [200, 'Drop location cannot exceed 200 characters']
  },

  // Scheduling Information
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
    validate: {
      validator: function(date) {
        // Allow current date and future dates only
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      message: 'Scheduled date cannot be in the past'
    }
    // Index will be created via compound indexes below
  },

  scheduledTime: {
    type: String,
    required: [true, 'Scheduled time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format (24-hour)']
  },

  // Vehicle and Driver Assignment
  vehicleNumber: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/, 'Please provide a valid vehicle registration number']
    // Index will be created via compound indexes below
  },

  pilotName: {
    type: String,
    trim: true,
    maxlength: [100, 'Pilot name cannot exceed 100 characters']
  },

  pilotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to User model for pilot information
  },

  // Cost and Payment Information
  estimatedCost: {
    type: Number,
    required: [true, 'Estimated cost is required'],
    min: [0, 'Estimated cost cannot be negative'],
    validate: {
      validator: function(cost) {
        return cost > 0;
      },
      message: 'Estimated cost must be greater than 0'
    }
  },

  actualCost: {
    type: Number,
    min: [0, 'Actual cost cannot be negative'],
    validate: {
      validator: function(cost) {
        return !cost || cost > 0;
      },
      message: 'Actual cost must be greater than 0 if provided'
    }
  },

  paymentMode: {
    type: String,
    required: [true, 'Payment mode is required'],
    enum: {
      values: ['Cash', 'UPI', 'Part Payment', 'Card', 'Wallet'],
      message: 'Payment mode must be Cash, UPI, Part Payment, Card, or Wallet'
    },
    default: 'Cash'
  },

  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: ['pending', 'paid', 'partial', 'failed', 'refunded'],
      message: 'Invalid payment status'
    },
    default: 'pending'
  },

  // Part Payment Details (for Part Payment mode)
  partPaymentCash: {
    type: Number,
    min: [0, 'Part payment cash amount cannot be negative'],
    validate: {
      validator: function(amount) {
        return this.paymentMode !== 'Part Payment' || (amount && amount > 0);
      },
      message: 'Cash amount is required for part payment mode'
    }
  },

  partPaymentUPI: {
    type: Number,
    min: [0, 'Part payment UPI amount cannot be negative'],
    validate: {
      validator: function(amount) {
        return this.paymentMode !== 'Part Payment' || (amount && amount > 0);
      },
      message: 'UPI amount is required for part payment mode'
    }
  },

  // Booking Status and Lifecycle
  status: {
    type: String,
    required: [true, 'Booking status is required'],
    enum: {
      values: ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'],
      message: 'Invalid booking status'
    },
    default: 'pending'
    // Index will be created via compound indexes below
  },

  // Trip Details
  distance: {
    type: Number,
    min: [0, 'Distance cannot be negative'],
    validate: {
      validator: function(dist) {
        return !dist || dist > 0;
      },
      message: 'Distance must be greater than 0 if provided'
    }
  },

  duration: {
    type: Number, // Duration in minutes
    min: [0, 'Duration cannot be negative'],
    validate: {
      validator: function(dur) {
        return !dur || dur > 0;
      },
      message: 'Duration must be greater than 0 if provided'
    }
  },

  // Trip Start and End Times
  actualStartTime: {
    type: Date,
    validate: {
      validator: function(startTime) {
        return !startTime || !this.actualEndTime || startTime <= this.actualEndTime;
      },
      message: 'Actual start time cannot be after end time'
    }
  },

  actualEndTime: {
    type: Date,
    validate: {
      validator: function(endTime) {
        return !endTime || !this.actualStartTime || this.actualStartTime <= endTime;
      },
      message: 'Actual end time cannot be before start time'
    }
  },

  // Additional Information
  specialRequirements: {
    type: String,
    trim: true,
    maxlength: [500, 'Special requirements cannot exceed 500 characters']
  },

  // Customer Feedback
  rating: {
    type: Number,
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5'],
    validate: {
      validator: function(rating) {
        return !rating || Number.isInteger(rating);
      },
      message: 'Rating must be a whole number'
    }
  },

  feedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },

  // Administrative Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user ID is required']
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Cancellation Information
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    required: function() {
      return this.status === 'cancelled';
    }
  },

  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.status === 'cancelled';
    }
  },

  cancelledAt: {
    type: Date,
    required: function() {
      return this.status === 'cancelled';
    }
  },

  // Soft Delete Support
  isActive: {
    type: Boolean,
    default: true
    // Index will be created via compound indexes below
  }

}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'smart_bookings' // Explicit collection name to avoid conflicts
});

// ========================================
// MONGODB INDEXES FOR PERFORMANCE
// ========================================

// Compound index for status and date queries (most common query pattern)
BookingSchema.index({ status: 1, scheduledDate: 1 });

// Compound index for vehicle-based queries
BookingSchema.index({ vehicleNumber: 1, status: 1 });

// Index for customer phone lookup
BookingSchema.index({ customerPhone: 1 });

// Compound index for booking type and date filtering
BookingSchema.index({ bookingType: 1, scheduledDate: 1 });

// Index for active bookings (soft delete support)
BookingSchema.index({ isActive: 1, status: 1 });

// Compound index for date range queries with status
BookingSchema.index({ scheduledDate: 1, status: 1, isActive: 1 });

// Text index for search functionality (customer name, locations)
BookingSchema.index({ 
  customerName: 'text', 
  pickupLocation: 'text', 
  dropLocation: 'text' 
}, {
  weights: {
    customerName: 10,
    pickupLocation: 5,
    dropLocation: 5
  },
  name: 'booking_search_index'
});

// ========================================
// INSTANCE METHODS
// ========================================

// Generate booking ID automatically
BookingSchema.methods.generateBookingId = function() {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format
  const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
  this.bookingId = `SB_${dateStr}_${randomNum}`;
  return this.bookingId;
};

// Check if booking can be cancelled
BookingSchema.methods.canBeCancelled = function() {
  const allowedStatuses = ['pending', 'confirmed', 'assigned'];
  return allowedStatuses.includes(this.status);
};

// Check if booking can be modified
BookingSchema.methods.canBeModified = function() {
  const allowedStatuses = ['pending', 'confirmed'];
  return allowedStatuses.includes(this.status);
};

// Calculate total payment amount
BookingSchema.methods.getTotalPayment = function() {
  if (this.paymentMode === 'Part Payment') {
    return (this.partPaymentCash || 0) + (this.partPaymentUPI || 0);
  }
  return this.actualCost || this.estimatedCost;
};

// Get booking duration in minutes
BookingSchema.methods.getBookingDuration = function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.floor((this.actualEndTime - this.actualStartTime) / (1000 * 60));
  }
  return this.duration || 0;
};

// ========================================
// STATIC METHODS
// ========================================

// Find bookings by status
BookingSchema.statics.findByStatus = function(status, options = {}) {
  const query = { status, isActive: true };
  return this.find(query, null, options);
};

// Find bookings for a specific date range
BookingSchema.statics.findByDateRange = function(startDate, endDate, options = {}) {
  const query = {
    scheduledDate: { $gte: startDate, $lte: endDate },
    isActive: true
  };
  return this.find(query, null, options);
};

// Find bookings by vehicle
BookingSchema.statics.findByVehicle = function(vehicleNumber, options = {}) {
  const query = { vehicleNumber: vehicleNumber.toUpperCase(), isActive: true };
  return this.find(query, null, options);
};

// Find bookings by customer phone
BookingSchema.statics.findByCustomerPhone = function(phone, options = {}) {
  const query = { customerPhone: phone, isActive: true };
  return this.find(query, null, options);
};

// Get booking statistics
BookingSchema.statics.getBookingStats = async function(dateFrom, dateTo) {
  const matchCondition = { isActive: true };
  
  if (dateFrom && dateTo) {
    matchCondition.scheduledDate = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
  }

  const stats = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        averageRating: { $avg: '$rating' },
        bookingsByType: {
          $push: '$bookingType'
        },
        bookingsByStatus: {
          $push: '$status'
        }
      }
    }
  ]);

  return stats[0] || {
    totalBookings: 0,
    totalRevenue: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    averageRating: 0,
    bookingsByType: [],
    bookingsByStatus: []
  };
};

// ========================================
// MIDDLEWARE HOOKS
// ========================================

// Pre-save middleware to auto-generate booking ID
BookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingId) {
    this.generateBookingId();
  }
  next();
});

// Pre-save middleware for status transitions
BookingSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    // Set timestamps for specific status changes
    if (this.status === 'in_progress' && !this.actualStartTime) {
      this.actualStartTime = new Date();
    } else if (this.status === 'completed' && !this.actualEndTime) {
      this.actualEndTime = new Date();
    } else if (this.status === 'cancelled' && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
  next();
});

// Pre-save validation for business rules
BookingSchema.pre('save', function(next) {
  // Validate part payment amounts
  if (this.paymentMode === 'Part Payment') {
    const cashAmount = this.partPaymentCash || 0;
    const upiAmount = this.partPaymentUPI || 0;
    const totalPartPayment = cashAmount + upiAmount;
    
    if (totalPartPayment <= 0) {
      return next(new Error('Part payment amounts must be greater than 0'));
    }
    
    if (this.estimatedCost && totalPartPayment > this.estimatedCost) {
      return next(new Error('Total part payment cannot exceed estimated cost'));
    }
  }

  // Validate booking date is not too far in the future (optional business rule)
  const maxAdvanceBookingDays = 90; // 3 months
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxAdvanceBookingDays);
  
  if (this.scheduledDate > maxDate) {
    return next(new Error(`Booking cannot be scheduled more than ${maxAdvanceBookingDays} days in advance`));
  }

  next();
});

// Create and export the model
const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
