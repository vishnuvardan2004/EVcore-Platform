const mongoose = require('mongoose');
const config = require('../config');

const vehicleSchema = new mongoose.Schema({
  // Basic Vehicle Information
  vehicleId: {
    type: String,
    required: [true, 'Vehicle ID is required'],
    unique: true,
    trim: true,
    match: [/^(EVZ_VEH_|TEST_VEH_)\d{3}$/, 'Vehicle ID must follow format: EVZ_VEH_XXX or TEST_VEH_XXX']
  },
  
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Registration number cannot exceed 20 characters']
  },
  
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true,
    maxlength: [50, 'Make cannot exceed 50 characters'],
    enum: {
      values: ['Tata', 'Mahindra', 'MG', 'Hyundai', 'BYD', 'Ola', 'TVS', 'Bajaj', 'Other'],
      message: 'Please select a valid vehicle make'
    }
  },
  
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true,
    maxlength: [50, 'Model cannot exceed 50 characters']
  },
  
  year: {
    type: Number,
    required: [true, 'Manufacturing year is required'],
    min: [2015, 'Vehicle must be manufactured after 2015'],
    max: [new Date().getFullYear() + 1, 'Invalid manufacturing year']
  },
  
  color: {
    type: String,
    required: [true, 'Vehicle color is required'],
    trim: true,
    maxlength: [30, 'Color cannot exceed 30 characters']
  },
  
  // Technical Specifications
  batteryCapacity: {
    type: Number,
    required: [true, 'Battery capacity is required'],
    min: [10, 'Battery capacity must be at least 10 kWh'],
    max: [200, 'Battery capacity cannot exceed 200 kWh']
  },
  
  range: {
    type: Number,
    required: [true, 'Vehicle range is required'],
    min: [50, 'Range must be at least 50 km'],
    max: [1000, 'Range cannot exceed 1000 km']
  },
  
  chargingType: {
    type: String,
    required: [true, 'Charging type is required'],
    enum: {
      values: ['AC', 'DC', 'Both'],
      message: 'Charging type must be AC, DC, or Both'
    }
  },
  
  seatingCapacity: {
    type: Number,
    required: [true, 'Seating capacity is required'],
    min: [1, 'Seating capacity must be at least 1'],
    max: [8, 'Seating capacity cannot exceed 8']
  },
  
  // Status & Availability
  status: {
    type: String,
    enum: {
      values: ['available', 'deployed', 'maintenance', 'charging', 'out_of_service'],
      message: 'Invalid vehicle status'
    },
    default: 'available'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Location & Hub Management
  currentHub: {
    type: String,
    required: [true, 'Current hub is required'],
    trim: true,
    maxlength: [100, 'Hub name cannot exceed 100 characters']
  },
  
  currentLocation: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Maintenance & Health Monitoring
  lastMaintenanceDate: {
    type: Date
  },
  
  nextMaintenanceDate: {
    type: Date
  },
  
  mileage: {
    type: Number,
    default: 0,
    min: [0, 'Mileage cannot be negative']
  },
  
  batteryHealth: {
    type: Number,
    min: [0, 'Battery health cannot be below 0%'],
    max: [100, 'Battery health cannot exceed 100%'],
    default: 100
  },
  
  // Purchase & Financial Information
  purchaseDate: {
    type: Date
  },
  
  purchasePrice: {
    type: Number,
    min: [0, 'Purchase price cannot be negative']
  },
  
  warrantyExpiryDate: {
    type: Date
  },
  
  insuranceExpiryDate: {
    type: Date
  },
  
  // Management Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (vehicleId index is automatically created by unique: true)
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ currentHub: 1 });
vehicleSchema.index({ isActive: 1 });
vehicleSchema.index({ createdAt: -1 });

// Virtual for checking if maintenance is due
vehicleSchema.virtual('isMaintenanceDue').get(function() {
  if (!this.nextMaintenanceDate) return false;
  return new Date() >= this.nextMaintenanceDate;
});

// Virtual for vehicle age
vehicleSchema.virtual('vehicleAge').get(function() {
  const currentYear = new Date().getFullYear();
  return currentYear - this.year;
});

// Virtual for battery health status
vehicleSchema.virtual('batteryHealthStatus').get(function() {
  if (this.batteryHealth >= 80) return 'Good';
  if (this.batteryHealth >= 60) return 'Fair';
  if (this.batteryHealth >= 40) return 'Poor';
  return 'Critical';
});

// Pre-save middleware to generate vehicle ID if not provided
vehicleSchema.pre('save', async function(next) {
  if (this.isNew && !this.vehicleId) {
    try {
      const count = await mongoose.model('Vehicle').countDocuments();
      const vehicleNumber = (count + 1).toString().padStart(3, '0');
      this.vehicleId = `EVZ_VEH_${vehicleNumber}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Update the updatedBy field if it's being modified
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  
  next();
});

// Static method to get available vehicles
vehicleSchema.statics.getAvailableVehicles = function(hub = null) {
  const query = { 
    status: 'available', 
    isActive: true 
  };
  
  if (hub) {
    query.currentHub = hub;
  }
  
  return this.find(query).populate('createdBy', 'fullName email');
};

// Static method to get vehicles due for maintenance
vehicleSchema.statics.getVehiclesDueForMaintenance = function() {
  const today = new Date();
  return this.find({
    nextMaintenanceDate: { $lte: today },
    isActive: true
  }).populate('createdBy', 'fullName email');
};

// Instance method to update location
vehicleSchema.methods.updateLocation = function(latitude, longitude, address) {
  this.currentLocation = {
    latitude,
    longitude,
    address,
    lastUpdated: new Date()
  };
  return this.save();
};

// Instance method to update status with validation
vehicleSchema.methods.updateStatus = function(newStatus, reason = '') {
  const validTransitions = {
    'available': ['deployed', 'maintenance', 'charging', 'out_of_service'],
    'deployed': ['available', 'maintenance', 'out_of_service'],
    'maintenance': ['available', 'out_of_service'],
    'charging': ['available'],
    'out_of_service': ['available', 'maintenance']
  };
  
  if (!validTransitions[this.status] || !validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  const previousStatus = this.status;
  this.status = newStatus;
  
  // Log the status change (can be expanded to include audit trail)
  console.log(`Vehicle ${this.vehicleId} status changed from ${previousStatus} to ${newStatus}. Reason: ${reason}`);
  
  return this.save();
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
