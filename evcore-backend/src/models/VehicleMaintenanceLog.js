const mongoose = require('mongoose');

const vehicleMaintenanceLogSchema = new mongoose.Schema({
  // Vehicle Reference
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle reference is required']
  },
  
  // Maintenance Identity
  maintenanceId: {
    type: String,
    required: [true, 'Maintenance ID is required'],
    unique: true,
    trim: true,
    match: [/^(MAINT_|TEST_MAINT_)\d{6}_\d{3}$/, 'Maintenance ID must follow format: MAINT_YYMMDD_XXX or TEST_MAINT_YYMMDD_XXX']
  },
  
  // Maintenance Classification
  maintenanceType: {
    type: String,
    required: [true, 'Maintenance type is required'],
    enum: {
      values: [
        'routine_service', 
        'battery_check', 
        'tire_replacement', 
        'brake_service', 
        'emergency_repair',
        'software_update',
        'charging_system_check',
        'motor_service',
        'body_repair',
        'electrical_repair'
      ],
      message: 'Please select a valid maintenance type'
    }
  },
  
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical', 'emergency'],
      message: 'Priority must be low, medium, high, critical, or emergency'
    },
    default: 'medium'
  },
  
  // Maintenance Details
  description: {
    type: String,
    required: [true, 'Maintenance description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  symptoms: [{
    type: String,
    trim: true,
    maxlength: [200, 'Symptom description cannot exceed 200 characters']
  }],
  
  // Financial Information
  estimatedCost: {
    type: Number,
    min: [0, 'Estimated cost cannot be negative']
  },
  
  actualCost: {
    type: Number,
    min: [0, 'Actual cost cannot be negative']
  },
  
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  
  // Service Provider Information
  serviceProvider: {
    name: {
      type: String,
      required: [true, 'Service provider name is required'],
      trim: true,
      maxlength: [100, 'Service provider name cannot exceed 100 characters']
    },
    contactNumber: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid contact number']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    certifications: [String],
    rating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    }
  },
  
  // Scheduling Information
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  
  estimatedDuration: {
    type: Number, // in hours
    min: [0.5, 'Estimated duration must be at least 0.5 hours'],
    max: [168, 'Estimated duration cannot exceed 168 hours (1 week)']
  },
  
  // Execution Information
  startedAt: {
    type: Date
  },
  
  completedAt: {
    type: Date,
    validate: {
      validator: function(completedAt) {
        return !completedAt || !this.startedAt || completedAt >= this.startedAt;
      },
      message: 'Completion time must be after start time'
    }
  },
  
  actualDuration: {
    type: Number, // in hours
    min: [0, 'Actual duration cannot be negative']
  },
  
  // Vehicle Availability Impact
  vehicleUnavailableFrom: {
    type: Date,
    required: [true, 'Vehicle unavailable from date is required']
  },
  
  vehicleUnavailableTo: {
    type: Date,
    required: [true, 'Vehicle unavailable to date is required'],
    validate: {
      validator: function(unavailableTo) {
        return unavailableTo > this.vehicleUnavailableFrom;
      },
      message: 'Vehicle unavailable to date must be after from date'
    }
  },
  
  // Parts & Components
  partsReplaced: [{
    partName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Part name cannot exceed 100 characters']
    },
    partNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Part number cannot exceed 50 characters']
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    cost: {
      type: Number,
      min: [0, 'Part cost cannot be negative']
    },
    warranty: {
      duration: {
        type: Number, // in months
        min: [0, 'Warranty duration cannot be negative']
      },
      terms: {
        type: String,
        trim: true,
        maxlength: [500, 'Warranty terms cannot exceed 500 characters']
      }
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters']
    }
  }],
  
  // Service Details
  serviceNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Service notes cannot exceed 2000 characters']
  },
  
  diagnosticResults: [{
    component: {
      type: String,
      required: true,
      enum: ['battery', 'motor', 'brakes', 'tires', 'charging_system', 'electronics', 'body', 'software']
    },
    status: {
      type: String,
      required: true,
      enum: ['excellent', 'good', 'fair', 'poor', 'failed']
    },
    details: {
      type: String,
      trim: true,
      maxlength: [500, 'Diagnostic details cannot exceed 500 characters']
    },
    recommendedAction: {
      type: String,
      enum: ['none', 'monitor', 'schedule_maintenance', 'immediate_attention', 'replace']
    }
  }],
  
  // Quality Assurance
  qualityCheck: {
    passed: {
      type: Boolean,
      default: false
    },
    checkedBy: {
      type: String,
      trim: true,
      maxlength: [100, 'Quality checker name cannot exceed 100 characters']
    },
    checkedAt: {
      type: Date
    },
    issues: [{
      description: String,
      severity: {
        type: String,
        enum: ['minor', 'major', 'critical']
      },
      resolved: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // Warranty Information
  warrantyInfo: {
    covered: {
      type: Boolean,
      default: false
    },
    warrantyProvider: {
      type: String,
      trim: true
    },
    claimNumber: {
      type: String,
      trim: true
    },
    coveragePercentage: {
      type: Number,
      min: [0, 'Coverage percentage cannot be negative'],
      max: [100, 'Coverage percentage cannot exceed 100']
    }
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'in_progress', 'completed', 'cancelled', 'delayed', 'failed'],
      message: 'Invalid maintenance status'
    },
    default: 'scheduled'
  },
  
  // Next Maintenance Prediction
  nextMaintenanceRecommendation: {
    type: {
      type: String,
      enum: ['routine_service', 'battery_check', 'tire_replacement', 'brake_service']
    },
    estimatedDate: {
      type: Date
    },
    basedOn: {
      type: String,
      enum: ['mileage', 'time', 'condition', 'manufacturer_schedule']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Next maintenance notes cannot exceed 500 characters']
    }
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
  
  // Documentation
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['image', 'pdf', 'document', 'video']
    },
    fileUrl: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'File description cannot exceed 200 characters']
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (maintenanceId index is automatically created by unique: true)
vehicleMaintenanceLogSchema.index({ vehicleId: 1 });
vehicleMaintenanceLogSchema.index({ status: 1 });
vehicleMaintenanceLogSchema.index({ scheduledDate: 1 });
vehicleMaintenanceLogSchema.index({ maintenanceType: 1 });
vehicleMaintenanceLogSchema.index({ createdAt: -1 });

// Compound indexes
vehicleMaintenanceLogSchema.index({ vehicleId: 1, status: 1 });
vehicleMaintenanceLogSchema.index({ vehicleId: 1, scheduledDate: -1 });
vehicleMaintenanceLogSchema.index({ status: 1, scheduledDate: 1 });

// Virtual for maintenance duration
vehicleMaintenanceLogSchema.virtual('duration').get(function() {
  if (!this.startedAt || !this.completedAt) return null;
  return Math.round((this.completedAt - this.startedAt) / (1000 * 60 * 60 * 100)) / 100; // Hours with 2 decimal places
});

// Virtual for cost variance
vehicleMaintenanceLogSchema.virtual('costVariance').get(function() {
  if (!this.estimatedCost || !this.actualCost) return null;
  return Math.round((this.actualCost - this.estimatedCost) * 100) / 100;
});

// Virtual for cost variance percentage
vehicleMaintenanceLogSchema.virtual('costVariancePercentage').get(function() {
  if (!this.estimatedCost || !this.actualCost || this.estimatedCost === 0) return null;
  return Math.round(((this.actualCost - this.estimatedCost) / this.estimatedCost) * 10000) / 100;
});

// Virtual for checking if maintenance is overdue
vehicleMaintenanceLogSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  return new Date() > this.scheduledDate;
});

// Pre-save middleware to generate maintenance ID
vehicleMaintenanceLogSchema.pre('save', async function(next) {
  if (this.isNew && !this.maintenanceId) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format
      
      // Count maintenance records created today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      const todayCount = await mongoose.model('VehicleMaintenanceLog').countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      });
      
      const maintenanceNumber = (todayCount + 1).toString().padStart(3, '0');
      this.maintenanceId = `MAINT_${dateStr}_${maintenanceNumber}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Calculate actual duration if completed
  if (this.status === 'completed' && this.startedAt && this.completedAt && !this.actualDuration) {
    this.actualDuration = Math.round((this.completedAt - this.startedAt) / (1000 * 60 * 60 * 100)) / 100; // Hours
  }
  
  // Update the updatedBy field if it's being modified
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  
  next();
});

// Pre-save validation
vehicleMaintenanceLogSchema.pre('save', async function(next) {
  try {
    // Validate that vehicle exists
    if (this.isNew) {
      const Vehicle = mongoose.model('Vehicle');
      const vehicle = await Vehicle.findById(this.vehicleId);
      
      if (!vehicle) {
        return next(new Error('Vehicle not found'));
      }
      
      // Check for overlapping maintenance schedules
      const overlappingMaintenance = await mongoose.model('VehicleMaintenanceLog').findOne({
        vehicleId: this.vehicleId,
        status: { $in: ['scheduled', 'in_progress'] },
        $or: [
          {
            vehicleUnavailableFrom: { $lte: this.vehicleUnavailableFrom },
            vehicleUnavailableTo: { $gte: this.vehicleUnavailableFrom }
          },
          {
            vehicleUnavailableFrom: { $lte: this.vehicleUnavailableTo },
            vehicleUnavailableTo: { $gte: this.vehicleUnavailableTo }
          }
        ]
      });
      
      if (overlappingMaintenance) {
        return next(new Error('Vehicle has overlapping maintenance schedule'));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get due maintenance
vehicleMaintenanceLogSchema.statics.getDueMaintenance = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'scheduled',
    scheduledDate: { $lte: futureDate }
  })
  .populate('vehicleId', 'vehicleId registrationNumber make model')
  .populate('createdBy', 'fullName email')
  .sort({ scheduledDate: 1 });
};

// Static method to get vehicle maintenance history
vehicleMaintenanceLogSchema.statics.getVehicleHistory = function(vehicleId, limit = 10) {
  return this.find({ vehicleId })
    .populate('createdBy', 'fullName email')
    .populate('approvedBy', 'fullName email')
    .sort({ scheduledDate: -1 })
    .limit(limit);
};

// Static method to get maintenance statistics
vehicleMaintenanceLogSchema.statics.getMaintenanceStats = async function(startDate, endDate) {
  try {
    const matchStage = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$maintenanceType',
          count: { $sum: 1 },
          totalCost: { $sum: '$actualCost' },
          avgCost: { $avg: '$actualCost' },
          avgDuration: { $avg: '$actualDuration' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    return stats;
  } catch (error) {
    console.error('Error getting maintenance statistics:', error);
    throw error;
  }
};

// Instance method to update status
vehicleMaintenanceLogSchema.methods.updateStatus = function(newStatus, updatedBy = null, notes = '') {
  const validTransitions = {
    'scheduled': ['in_progress', 'cancelled', 'delayed'],
    'in_progress': ['completed', 'failed', 'delayed'],
    'completed': [], // No transitions from completed
    'cancelled': ['scheduled'], // Can reschedule cancelled maintenance
    'delayed': ['scheduled', 'in_progress', 'cancelled'],
    'failed': ['scheduled', 'cancelled'] // Can reschedule failed maintenance
  };
  
  if (!validTransitions[this.status] || !validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  const previousStatus = this.status;
  this.status = newStatus;
  
  // Set timestamps based on status
  if (newStatus === 'in_progress' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  if ((newStatus === 'completed' || newStatus === 'failed') && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  if (updatedBy) this.updatedBy = updatedBy;
  if (notes) this.serviceNotes = (this.serviceNotes || '') + `\n[${new Date().toISOString()}] Status change: ${previousStatus} → ${newStatus}. ${notes}`;
  
  console.log(`Maintenance ${this.maintenanceId} status changed from ${previousStatus} to ${newStatus}`);
  
  return this.save();
};

// Instance method to add diagnostic result
vehicleMaintenanceLogSchema.methods.addDiagnosticResult = function(component, status, details, recommendedAction = 'none') {
  this.diagnosticResults.push({
    component,
    status,
    details,
    recommendedAction
  });
  
  return this.save();
};

// Instance method to calculate total parts cost
vehicleMaintenanceLogSchema.methods.getTotalPartsCost = function() {
  return this.partsReplaced.reduce((total, part) => total + (part.cost || 0), 0);
};

const VehicleMaintenanceLog = mongoose.model('VehicleMaintenanceLog', vehicleMaintenanceLogSchema);

module.exports = VehicleMaintenanceLog;
