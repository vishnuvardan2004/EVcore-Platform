const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  // Deployment Identity
  deploymentId: {
    type: String,
    required: [true, 'Deployment ID is required'],
    unique: true,
    trim: true,
    match: [/^(DEP_|TEST_DEP_)\d{3}_\d{6}$/, 'Deployment ID must follow format: DEP_XXX_YYMMDD or TEST_DEP_XXX_YYMMDD']
  },
  
  // Vehicle & Pilot Assignment
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle assignment is required']
  },
  
  pilotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Pilot assignment is required']
  },
  
  // Deployment Timing
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  
  estimatedEndTime: {
    type: Date,
    required: [true, 'Estimated end time is required'],
    validate: {
      validator: function(endTime) {
        return endTime > this.startTime;
      },
      message: 'Estimated end time must be after start time'
    }
  },
  
  actualEndTime: {
    type: Date,
    validate: {
      validator: function(endTime) {
        return !endTime || endTime >= this.startTime;
      },
      message: 'Actual end time must be after start time'
    }
  },
  
  // Route Information
  startLocation: {
    latitude: {
      type: Number,
      required: [true, 'Start location latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: [true, 'Start location longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    address: {
      type: String,
      required: [true, 'Start location address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    }
  },
  
  endLocation: {
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
    }
  },
  
  // Trip Details
  purpose: {
    type: String,
    required: [true, 'Deployment purpose is required'],
    enum: {
      values: ['passenger_trip', 'delivery', 'maintenance', 'testing', 'relocation', 'emergency'],
      message: 'Please select a valid deployment purpose'
    }
  },
  
  tripDistance: {
    type: Number,
    min: [0, 'Trip distance cannot be negative'],
    max: [1000, 'Trip distance cannot exceed 1000 km']
  },
  
  passengerCount: {
    type: Number,
    default: 0,
    min: [0, 'Passenger count cannot be negative'],
    max: [8, 'Passenger count cannot exceed 8']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'in_progress', 'completed', 'cancelled', 'emergency_stop'],
      message: 'Invalid deployment status'
    },
    default: 'scheduled'
  },
  
  // Real-time Location Data
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
      type: Date
    }
  },
  
  currentSpeed: {
    type: Number,
    min: [0, 'Speed cannot be negative'],
    max: [200, 'Speed cannot exceed 200 km/h']
  },
  
  batteryLevel: {
    type: Number,
    min: [0, 'Battery level cannot be below 0%'],
    max: [100, 'Battery level cannot exceed 100%']
  },
  
  // Completion Details
  endReason: {
    type: String,
    enum: {
      values: ['completed_normally', 'emergency', 'breakdown', 'cancelled_by_admin', 'pilot_request', 'battery_depleted'],
      message: 'Please select a valid end reason'
    }
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Financial Information
  estimatedCost: {
    type: Number,
    min: [0, 'Estimated cost cannot be negative']
  },
  
  actualCost: {
    type: Number,
    min: [0, 'Actual cost cannot be negative']
  },
  
  fuelSavings: {
    type: Number,
    min: [0, 'Fuel savings cannot be negative'],
    default: 0
  },
  
  // Approval & Management
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: {
    type: Date
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Priority must be low, medium, high, or critical'
    },
    default: 'medium'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (deploymentId index is automatically created by unique: true)
deploymentSchema.index({ vehicleId: 1 });
deploymentSchema.index({ pilotId: 1 });
deploymentSchema.index({ status: 1 });
deploymentSchema.index({ startTime: -1 });
deploymentSchema.index({ createdAt: -1 });
deploymentSchema.index({ 'startLocation.latitude': 1, 'startLocation.longitude': 1 });

// Compound indexes for common queries
deploymentSchema.index({ status: 1, startTime: 1 });
deploymentSchema.index({ vehicleId: 1, status: 1 });
deploymentSchema.index({ pilotId: 1, status: 1 });

// Virtual for deployment duration
deploymentSchema.virtual('duration').get(function() {
  const endTime = this.actualEndTime || this.estimatedEndTime;
  if (!endTime) return null;
  return Math.round((endTime - this.startTime) / (1000 * 60)); // Duration in minutes
});

// Virtual for checking if deployment is overdue
deploymentSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  return new Date() > this.estimatedEndTime;
});

// Virtual for deployment progress percentage
deploymentSchema.virtual('progressPercentage').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'cancelled' || this.status === 'emergency_stop') return 0;
  
  const now = new Date();
  const totalDuration = this.estimatedEndTime - this.startTime;
  const elapsedDuration = now - this.startTime;
  
  if (elapsedDuration <= 0) return 0;
  if (elapsedDuration >= totalDuration) return 100;
  
  return Math.round((elapsedDuration / totalDuration) * 100);
});

// Pre-save middleware to generate deployment ID
deploymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.deploymentId) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format
      
      // Count deployments created today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      const todayCount = await mongoose.model('Deployment').countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      });
      
      const deploymentNumber = (todayCount + 1).toString().padStart(3, '0');
      this.deploymentId = `DEP_${deploymentNumber}_${dateStr}`;
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

// Pre-save validation for business rules
deploymentSchema.pre('save', async function(next) {
  try {
    // Check vehicle availability for new deployments
    if (this.isNew) {
      const Vehicle = mongoose.model('Vehicle');
      const vehicle = await Vehicle.findById(this.vehicleId);
      
      if (!vehicle) {
        return next(new Error('Vehicle not found'));
      }
      
      if (vehicle.status !== 'available') {
        return next(new Error('Vehicle is not available for deployment'));
      }
      
      // Check for overlapping deployments
      const overlappingDeployment = await mongoose.model('Deployment').findOne({
        vehicleId: this.vehicleId,
        status: { $in: ['scheduled', 'in_progress'] },
        $or: [
          {
            startTime: { $lte: this.startTime },
            estimatedEndTime: { $gte: this.startTime }
          },
          {
            startTime: { $lte: this.estimatedEndTime },
            estimatedEndTime: { $gte: this.estimatedEndTime }
          }
        ]
      });
      
      if (overlappingDeployment) {
        return next(new Error('Vehicle has overlapping deployment schedule'));
      }
      
      // Check pilot availability
      const User = mongoose.model('User');
      const pilot = await User.findById(this.pilotId);
      
      if (!pilot) {
        return next(new Error('Pilot not found'));
      }
      
      if (!['pilot', 'admin', 'super_admin'].includes(pilot.role)) {
        return next(new Error('Assigned user is not authorized to pilot vehicles'));
      }
      
      // Check for pilot's overlapping deployments
      const pilotOverlap = await mongoose.model('Deployment').findOne({
        pilotId: this.pilotId,
        status: { $in: ['scheduled', 'in_progress'] },
        $or: [
          {
            startTime: { $lte: this.startTime },
            estimatedEndTime: { $gte: this.startTime }
          },
          {
            startTime: { $lte: this.estimatedEndTime },
            estimatedEndTime: { $gte: this.estimatedEndTime }
          }
        ]
      });
      
      if (pilotOverlap) {
        return next(new Error('Pilot has overlapping deployment schedule'));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get active deployments
deploymentSchema.statics.getActiveDeployments = function() {
  return this.find({
    status: { $in: ['scheduled', 'in_progress'] }
  })
  .populate('vehicleId', 'vehicleId registrationNumber make model')
  .populate('pilotId', 'fullName email mobileNumber')
  .sort({ startTime: 1 });
};

// Static method to get pilot's deployments
deploymentSchema.statics.getPilotDeployments = function(pilotId, status = null) {
  const query = { pilotId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('vehicleId', 'vehicleId registrationNumber make model')
    .sort({ startTime: -1 });
};

// Static method to get vehicle's deployment history
deploymentSchema.statics.getVehicleDeployments = function(vehicleId, limit = 10) {
  return this.find({ vehicleId })
    .populate('pilotId', 'fullName email')
    .sort({ startTime: -1 })
    .limit(limit);
};

// Instance method to update location
deploymentSchema.methods.updateLocation = function(latitude, longitude, address, speed = null, batteryLevel = null) {
  this.currentLocation = {
    latitude,
    longitude,
    address,
    lastUpdated: new Date()
  };
  
  if (speed !== null) this.currentSpeed = speed;
  if (batteryLevel !== null) this.batteryLevel = batteryLevel;
  
  return this.save();
};

// Instance method to update status with validation
deploymentSchema.methods.updateStatus = function(newStatus, reason = '', updatedBy = null) {
  const validTransitions = {
    'scheduled': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'emergency_stop', 'cancelled'],
    'completed': [], // No transitions from completed
    'cancelled': [], // No transitions from cancelled
    'emergency_stop': ['completed', 'cancelled']
  };
  
  if (!validTransitions[this.status] || !validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  const previousStatus = this.status;
  this.status = newStatus;
  
  if (newStatus === 'completed' || newStatus === 'cancelled' || newStatus === 'emergency_stop') {
    this.actualEndTime = new Date();
    if (reason) this.endReason = reason;
  }
  
  if (updatedBy) this.updatedBy = updatedBy;
  
  // Log the status change
  console.log(`Deployment ${this.deploymentId} status changed from ${previousStatus} to ${newStatus}. Reason: ${reason}`);
  
  return this.save();
};

const Deployment = mongoose.model('Deployment', deploymentSchema);

module.exports = Deployment;
