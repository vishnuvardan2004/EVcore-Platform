const mongoose = require('mongoose');

const deploymentHistorySchema = new mongoose.Schema({
  // Reference to the deployment
  deploymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment',
    required: [true, 'Deployment reference is required']
  },
  
  // Status Change Tracking
  statusChanges: [{
    previousStatus: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'emergency_stop']
    },
    newStatus: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'emergency_stop'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    systemGenerated: {
      type: Boolean,
      default: false
    }
  }],
  
  // Location Tracking History
  locationHistory: [{
    latitude: {
      type: Number,
      required: true,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: true,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    batteryLevel: {
      type: Number,
      min: [0, 'Battery level cannot be below 0%'],
      max: [100, 'Battery level cannot exceed 100%']
    },
    speed: {
      type: Number,
      min: [0, 'Speed cannot be negative'],
      max: [200, 'Speed cannot exceed 200 km/h']
    },
    accuracy: {
      type: Number,
      min: [0, 'Accuracy cannot be negative']
    },
    altitude: {
      type: Number
    }
  }],
  
  // Performance Metrics (calculated at deployment completion)
  metrics: {
    totalDistance: {
      type: Number,
      min: [0, 'Total distance cannot be negative']
    },
    averageSpeed: {
      type: Number,
      min: [0, 'Average speed cannot be negative']
    },
    maxSpeed: {
      type: Number,
      min: [0, 'Maximum speed cannot be negative']
    },
    batteryUsed: {
      type: Number,
      min: [0, 'Battery used cannot be negative'],
      max: [100, 'Battery used cannot exceed 100%']
    },
    energyEfficiency: {
      type: Number,
      min: [0, 'Energy efficiency cannot be negative']
    },
    carbonFootprintSaved: {
      type: Number,
      min: [0, 'Carbon footprint saved cannot be negative']
    },
    totalDuration: {
      type: Number, // in minutes
      min: [0, 'Duration cannot be negative']
    },
    idleTime: {
      type: Number, // in minutes
      min: [0, 'Idle time cannot be negative']
    }
  },
  
  // Incident Reports
  incidents: [{
    type: {
      type: String,
      enum: ['emergency_stop', 'breakdown', 'accident', 'battery_depleted', 'route_deviation', 'other'],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Incident description cannot exceed 1000 characters']
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution notes cannot exceed 1000 characters']
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    }
  }],
  
  // Communication Logs
  communications: [{
    type: {
      type: String,
      enum: ['pilot_message', 'admin_message', 'system_alert', 'emergency_alert'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  }],
  
  // Data Quality Metrics
  dataQuality: {
    locationUpdates: {
      type: Number,
      default: 0
    },
    averageLocationAccuracy: {
      type: Number
    },
    dataGaps: [{
      startTime: Date,
      endTime: Date,
      duration: Number, // in minutes
      reason: String
    }],
    signalQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
deploymentHistorySchema.index({ deploymentId: 1 });
deploymentHistorySchema.index({ 'statusChanges.changedAt': -1 });
deploymentHistorySchema.index({ 'locationHistory.timestamp': -1 });
deploymentHistorySchema.index({ createdAt: -1 });

// Compound indexes
deploymentHistorySchema.index({ deploymentId: 1, 'locationHistory.timestamp': -1 });
deploymentHistorySchema.index({ deploymentId: 1, 'statusChanges.changedAt': -1 });

// Static method to create status change entry
deploymentHistorySchema.statics.logStatusChange = async function(deploymentId, previousStatus, newStatus, changedBy, reason = '', systemGenerated = false) {
  try {
    let history = await this.findOne({ deploymentId });
    
    if (!history) {
      history = new this({ 
        deploymentId,
        statusChanges: [],
        locationHistory: [],
        incidents: [],
        communications: []
      });
    }
    
    history.statusChanges.push({
      previousStatus,
      newStatus,
      changedBy,
      changedAt: new Date(),
      reason,
      systemGenerated
    });
    
    return await history.save();
  } catch (error) {
    console.error('Error logging status change:', error);
    throw error;
  }
};

// Static method to log location update
deploymentHistorySchema.statics.logLocationUpdate = async function(deploymentId, locationData) {
  try {
    let history = await this.findOne({ deploymentId });
    
    if (!history) {
      history = new this({ 
        deploymentId,
        statusChanges: [],
        locationHistory: [],
        incidents: [],
        communications: []
      });
    }
    
    history.locationHistory.push({
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address,
      timestamp: new Date(),
      batteryLevel: locationData.batteryLevel,
      speed: locationData.speed,
      accuracy: locationData.accuracy,
      altitude: locationData.altitude
    });
    
    // Update data quality metrics
    history.dataQuality.locationUpdates = (history.dataQuality.locationUpdates || 0) + 1;
    
    if (locationData.accuracy) {
      const totalAccuracy = (history.dataQuality.averageLocationAccuracy || 0) * (history.dataQuality.locationUpdates - 1);
      history.dataQuality.averageLocationAccuracy = (totalAccuracy + locationData.accuracy) / history.dataQuality.locationUpdates;
    }
    
    return await history.save();
  } catch (error) {
    console.error('Error logging location update:', error);
    throw error;
  }
};

// Static method to log incident
deploymentHistorySchema.statics.logIncident = async function(deploymentId, incidentData) {
  try {
    let history = await this.findOne({ deploymentId });
    
    if (!history) {
      history = new this({ 
        deploymentId,
        statusChanges: [],
        locationHistory: [],
        incidents: [],
        communications: []
      });
    }
    
    history.incidents.push({
      type: incidentData.type,
      description: incidentData.description,
      location: incidentData.location,
      timestamp: new Date(),
      reportedBy: incidentData.reportedBy,
      severity: incidentData.severity || 'medium'
    });
    
    return await history.save();
  } catch (error) {
    console.error('Error logging incident:', error);
    throw error;
  }
};

// Static method to calculate deployment metrics
deploymentHistorySchema.statics.calculateMetrics = async function(deploymentId) {
  try {
    const history = await this.findOne({ deploymentId });
    if (!history || history.locationHistory.length < 2) return null;
    
    const locations = history.locationHistory.sort((a, b) => a.timestamp - b.timestamp);
    let totalDistance = 0;
    let totalDuration = 0;
    let maxSpeed = 0;
    let totalSpeed = 0;
    let speedReadings = 0;
    let batteryStart = null;
    let batteryEnd = null;
    
    // Calculate distance and other metrics
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
      totalDistance += distance;
      
      // Track speed
      if (curr.speed !== null && curr.speed !== undefined) {
        maxSpeed = Math.max(maxSpeed, curr.speed);
        totalSpeed += curr.speed;
        speedReadings++;
      }
      
      // Track battery levels
      if (batteryStart === null && prev.batteryLevel !== null) {
        batteryStart = prev.batteryLevel;
      }
      if (curr.batteryLevel !== null) {
        batteryEnd = curr.batteryLevel;
      }
    }
    
    // Calculate total duration
    if (locations.length > 0) {
      totalDuration = (locations[locations.length - 1].timestamp - locations[0].timestamp) / (1000 * 60); // minutes
    }
    
    const averageSpeed = speedReadings > 0 ? totalSpeed / speedReadings : 0;
    const batteryUsed = (batteryStart !== null && batteryEnd !== null) ? batteryStart - batteryEnd : 0;
    const energyEfficiency = batteryUsed > 0 ? totalDistance / batteryUsed : 0;
    
    // Estimate carbon footprint saved (assuming 1 km = 0.2 kg CO2 saved vs petrol car)
    const carbonFootprintSaved = totalDistance * 0.2;
    
    // Update metrics in history
    history.metrics = {
      totalDistance: Math.round(totalDistance * 100) / 100,
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      maxSpeed,
      batteryUsed,
      energyEfficiency: Math.round(energyEfficiency * 100) / 100,
      carbonFootprintSaved: Math.round(carbonFootprintSaved * 100) / 100,
      totalDuration: Math.round(totalDuration),
      idleTime: 0 // To be calculated based on speed = 0 periods
    };
    
    await history.save();
    return history.metrics;
    
  } catch (error) {
    console.error('Error calculating metrics:', error);
    throw error;
  }
};

// Instance method to get deployment summary
deploymentHistorySchema.methods.getDeploymentSummary = function() {
  return {
    deploymentId: this.deploymentId,
    totalStatusChanges: this.statusChanges.length,
    totalLocationUpdates: this.locationHistory.length,
    totalIncidents: this.incidents.length,
    metrics: this.metrics,
    dataQuality: this.dataQuality,
    lastLocationUpdate: this.locationHistory.length > 0 ? 
      this.locationHistory[this.locationHistory.length - 1].timestamp : null,
    lastStatusChange: this.statusChanges.length > 0 ? 
      this.statusChanges[this.statusChanges.length - 1].changedAt : null
  };
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

const DeploymentHistory = mongoose.model('DeploymentHistory', deploymentHistorySchema);

module.exports = DeploymentHistory;
