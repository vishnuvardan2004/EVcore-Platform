/**
 * Vehicle Deployment Service
 * Business logic layer for vehicle deployment operations
 */

const mongoose = require('mongoose');
const { 
  Vehicle, 
  Deployment, 
  DeploymentHistory, 
  VehicleMaintenanceLog 
} = require('../models/vehicleDeploymentModels');
const User = require('../models/User');
const logger = require('../utils/logger');

class VehicleDeploymentService {
  
  /**
   * ========================================
   * DEPLOYMENT OPTIMIZATION SERVICES
   * ========================================
   */

  /**
   * Find optimal vehicle for deployment based on criteria
   */
  static async findOptimalVehicle(criteria = {}) {
    const {
      location = null,
      minBatteryLevel = 30,
      maxDistanceKm = 50,
      preferredMake = null,
      requiresSpecialEquipment = false
    } = criteria;

    let filter = {
      status: 'available',
      isActive: true,
      'batteryStatus.currentLevel': { $gte: minBatteryLevel }
    };

    if (preferredMake) {
      filter.make = preferredMake;
    }

    if (requiresSpecialEquipment) {
      filter['specialEquipment.0'] = { $exists: true };
    }

    let vehicles = await Vehicle.find(filter)
      .select('vehicleId registrationNumber make model batteryStatus location currentHub')
      .lean();

    // If location provided, calculate distances and filter
    if (location && location.latitude && location.longitude) {
      vehicles = vehicles.map(vehicle => {
        if (vehicle.location && vehicle.location.latitude && vehicle.location.longitude) {
          const distance = this.calculateDistance(
            location.latitude, location.longitude,
            vehicle.location.latitude, vehicle.location.longitude
          );
          return { ...vehicle, distanceKm: distance };
        }
        return { ...vehicle, distanceKm: null };
      });

      // Filter by max distance and sort by closest
      vehicles = vehicles
        .filter(v => v.distanceKm === null || v.distanceKm <= maxDistanceKm)
        .sort((a, b) => {
          // Prioritize: battery level (40%) + proximity (30%) + special equipment (30%)
          const aScore = (a.batteryStatus.currentLevel * 0.4) + 
                        ((maxDistanceKm - (a.distanceKm || 0)) * 0.3) +
                        ((a.specialEquipment?.length || 0) * 10 * 0.3);
          const bScore = (b.batteryStatus.currentLevel * 0.4) + 
                        ((maxDistanceKm - (b.distanceKm || 0)) * 0.3) +
                        ((b.specialEquipment?.length || 0) * 10 * 0.3);
          return bScore - aScore;
        });
    } else {
      // Sort by battery level if no location provided
      vehicles.sort((a, b) => b.batteryStatus.currentLevel - a.batteryStatus.currentLevel);
    }

    return vehicles.slice(0, 5); // Return top 5 matches
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * ========================================
   * DEPLOYMENT ANALYTICS SERVICES
   * ========================================
   */

  /**
   * Get deployment analytics for a date range
   */
  static async getDeploymentAnalytics(startDate, endDate, filters = {}) {
    const matchStage = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (filters.pilotId) matchStage.pilotId = new mongoose.Types.ObjectId(filters.pilotId);
    if (filters.vehicleId) matchStage.vehicleId = new mongoose.Types.ObjectId(filters.vehicleId);
    if (filters.status) matchStage.status = filters.status;

    const analytics = await Deployment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalDeployments: { $sum: 1 },
          completedDeployments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledDeployments: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          averageDuration: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ['$endTime', null] }, { $ne: ['$startTime', null] }] },
                { $subtract: ['$endTime', '$startTime'] },
                null
              ]
            }
          },
          totalDistance: { $sum: '$actualDistance' }
        }
      }
    ]);

    // Get top performing pilots
    const topPilots = await Deployment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$pilotId',
          deploymentCount: { $sum: 1 },
          completionRate: {
            $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalDistance: { $sum: '$actualDistance' }
        }
      },
      { $sort: { deploymentCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'pilot'
        }
      },
      { $unwind: '$pilot' },
      {
        $project: {
          pilotName: '$pilot.fullName',
          deploymentCount: 1,
          completionRate: { $multiply: ['$completionRate', 100] },
          totalDistance: 1
        }
      }
    ]);

    // Get vehicle utilization
    const vehicleUtilization = await Deployment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$vehicleId',
          deploymentCount: { $sum: 1 },
          totalHours: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$endTime', null] }, { $ne: ['$startTime', null] }] },
                { $divide: [{ $subtract: ['$endTime', '$startTime'] }, 3600000] },
                0
              ]
            }
          }
        }
      },
      { $sort: { deploymentCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $project: {
          vehicleId: '$vehicle.vehicleId',
          make: '$vehicle.make',
          model: '$vehicle.model',
          deploymentCount: 1,
          totalHours: { $round: ['$totalHours', 2] }
        }
      }
    ]);

    return {
      summary: analytics[0] || {
        totalDeployments: 0,
        completedDeployments: 0,
        cancelledDeployments: 0,
        averageDuration: 0,
        totalDistance: 0
      },
      topPilots,
      vehicleUtilization
    };
  }

  /**
   * ========================================
   * MAINTENANCE SCHEDULING SERVICES
   * ========================================
   */

  /**
   * Get vehicles due for maintenance
   */
  static async getVehiclesDueForMaintenance(daysAhead = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    // Get vehicles that need scheduled maintenance
    const dueMaintenance = await VehicleMaintenanceLog.find({
      status: 'scheduled',
      scheduledDate: { $lte: cutoffDate }
    })
    .populate('vehicleId', 'vehicleId registrationNumber make model status')
    .sort({ scheduledDate: 1 })
    .lean();

    // Get vehicles with high mileage/usage that might need maintenance
    const highUsageVehicles = await Vehicle.find({
      status: { $in: ['available', 'deployed'] },
      $or: [
        { 'mileage.total': { $gte: 10000 } },
        { 'batteryStatus.healthPercentage': { $lte: 80 } }
      ]
    })
    .select('vehicleId registrationNumber make model mileage batteryStatus')
    .lean();

    return {
      scheduledMaintenance: dueMaintenance,
      highUsageVehicles,
      totalDue: dueMaintenance.length
    };
  }

  /**
   * Auto-schedule routine maintenance based on vehicle usage
   */
  static async autoScheduleMaintenance(vehicleId, maintenanceType = 'routine_service') {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    // Check if maintenance already scheduled
    const existingMaintenance = await VehicleMaintenanceLog.findOne({
      vehicleId: vehicleId,
      maintenanceType,
      status: { $in: ['scheduled', 'in_progress'] }
    });

    if (existingMaintenance) {
      return { 
        scheduled: false, 
        reason: 'Maintenance already scheduled',
        existingMaintenanceId: existingMaintenance.maintenanceId 
      };
    }

    // Calculate next maintenance date based on usage
    let daysFromNow = 30; // Default
    
    if (vehicle.mileage.total > 15000) daysFromNow = 7;
    else if (vehicle.mileage.total > 10000) daysFromNow = 14;
    else if (vehicle.batteryStatus.healthPercentage < 85) daysFromNow = 14;

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);

    const maintenance = new VehicleMaintenanceLog({
      vehicleId: vehicleId,
      maintenanceType,
      description: `Auto-scheduled ${maintenanceType} based on usage patterns`,
      scheduledDate,
      serviceProvider: {
        name: 'EVZIP Service Center',
        contactInfo: '+91-1234567890'
      },
      estimatedDuration: maintenanceType === 'battery_check' ? 2 : 4,
      createdBy: vehicle.createdBy // Use vehicle creator as fallback
    });

    await maintenance.save();

    return {
      scheduled: true,
      maintenanceId: maintenance.maintenanceId,
      scheduledDate,
      daysFromNow
    };
  }

  /**
   * ========================================
   * REAL-TIME TRACKING SERVICES
   * ========================================
   */

  /**
   * Update deployment location and status in real-time
   */
  static async updateDeploymentTracking(deploymentId, trackingData) {
    const { 
      currentLocation, 
      batteryLevel, 
      speed, 
      status,
      odometer,
      timestamp = new Date()
    } = trackingData;

    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) throw new Error('Deployment not found');

    // Update deployment history with real-time data
    const history = await DeploymentHistory.findOne({ deploymentId });
    if (history) {
      // Add location update
      if (currentLocation) {
        history.locationHistory.push({
          coordinates: currentLocation,
          timestamp,
          speed: speed || 0
        });
      }

      // Add telemetry data
      if (batteryLevel !== undefined || odometer !== undefined) {
        history.telemetryData.push({
          timestamp,
          batteryLevel: batteryLevel || null,
          speed: speed || 0,
          odometer: odometer || null
        });
      }

      // Add status change if provided
      if (status && status !== deployment.status) {
        history.statusChanges.push({
          fromStatus: deployment.status,
          toStatus: status,
          changedAt: timestamp,
          reason: 'Real-time update'
        });

        deployment.status = status;
        if (status === 'completed') {
          deployment.endTime = timestamp;
        }
      }

      // Update current location in deployment
      if (currentLocation) {
        deployment.currentLocation = currentLocation;
      }

      await Promise.all([
        history.save(),
        deployment.save()
      ]);

      return {
        success: true,
        deployment: deployment.toObject(),
        historyUpdated: true
      };
    }

    throw new Error('Deployment history not found');
  }

  /**
   * ========================================
   * ADVANCED ANALYTICS SERVICES
   * ========================================
   */

  /**
   * Generate comprehensive deployment report
   */
  static async generateDeploymentReport(filters = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate = new Date(),
      vehicleIds = [],
      pilotIds = [],
      includeDetails = true
    } = filters;

    const matchStage = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (vehicleIds.length > 0) {
      matchStage.vehicleId = { $in: vehicleIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (pilotIds.length > 0) {
      matchStage.pilotId = { $in: pilotIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Executive Summary
    const summary = await Deployment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalDeployments: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          totalDistance: { $sum: '$actualDistance' },
          averageDistance: { $avg: '$actualDistance' },
          totalRevenue: { $sum: '$financials.revenue' },
          totalCosts: { $sum: '$financials.operationalCosts' }
        }
      }
    ]);

    // Daily breakdown
    const dailyBreakdown = await Deployment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          revenue: { $sum: '$financials.revenue' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Vehicle performance
    const vehiclePerformance = await Deployment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$vehicleId',
          deploymentCount: { $sum: 1 },
          completionRate: { $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalDistance: { $sum: '$actualDistance' },
          totalRevenue: { $sum: '$financials.revenue' }
        }
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $project: {
          vehicleId: '$vehicle.vehicleId',
          make: '$vehicle.make',
          model: '$vehicle.model',
          deploymentCount: 1,
          completionRate: { $multiply: ['$completionRate', 100] },
          totalDistance: 1,
          totalRevenue: 1,
          avgRevenuePerDeployment: { $divide: ['$totalRevenue', '$deploymentCount'] }
        }
      },
      { $sort: { deploymentCount: -1 } }
    ]);

    const report = {
      reportGenerated: new Date(),
      period: { startDate, endDate },
      summary: summary[0] || {},
      dailyBreakdown,
      vehiclePerformance
    };

    if (includeDetails) {
      const detailedDeployments = await Deployment.find(matchStage)
        .populate('vehicleId', 'vehicleId registrationNumber make model')
        .populate('pilotId', 'fullName email')
        .sort({ createdAt: -1 })
        .lean();
      
      report.detailedDeployments = detailedDeployments;
    }

    return report;
  }

  /**
   * ========================================
   * FLEET OPTIMIZATION SERVICES
   * ========================================
   */

  /**
   * Analyze fleet utilization and provide recommendations
   */
  static async analyzeFleetUtilization() {
    const vehicles = await Vehicle.find({ isActive: true })
      .select('vehicleId make model status batteryStatus mileage createdAt')
      .lean();

    // Get deployment stats for each vehicle (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const vehicleStats = await Promise.all(
      vehicles.map(async (vehicle) => {
        const deployments = await Deployment.countDocuments({
          vehicleId: vehicle._id,
          createdAt: { $gte: thirtyDaysAgo }
        });

        const activeHours = await Deployment.aggregate([
          {
            $match: {
              vehicleId: vehicle._id,
              createdAt: { $gte: thirtyDaysAgo },
              status: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              totalHours: {
                $sum: {
                  $divide: [{ $subtract: ['$endTime', '$startTime'] }, 3600000]
                }
              }
            }
          }
        ]);

        const utilizationHours = activeHours[0]?.totalHours || 0;
        const utilizationRate = Math.round((utilizationHours / (30 * 24)) * 100);

        return {
          ...vehicle,
          thirtyDayStats: {
            deployments,
            utilizationHours: Math.round(utilizationHours * 100) / 100,
            utilizationRate
          }
        };
      })
    );

    // Generate recommendations
    const recommendations = [];
    
    vehicleStats.forEach(vehicle => {
      if (vehicle.thirtyDayStats.utilizationRate < 20) {
        recommendations.push({
          type: 'LOW_UTILIZATION',
          vehicleId: vehicle.vehicleId,
          message: `Vehicle ${vehicle.vehicleId} has low utilization (${vehicle.thirtyDayStats.utilizationRate}%). Consider reassigning or maintenance.`,
          priority: 'medium'
        });
      }
      
      if (vehicle.batteryStatus.healthPercentage < 80) {
        recommendations.push({
          type: 'BATTERY_HEALTH',
          vehicleId: vehicle.vehicleId,
          message: `Vehicle ${vehicle.vehicleId} battery health is at ${vehicle.batteryStatus.healthPercentage}%. Schedule battery maintenance.`,
          priority: 'high'
        });
      }
      
      if (vehicle.mileage.total > 15000) {
        recommendations.push({
          type: 'HIGH_MILEAGE',
          vehicleId: vehicle.vehicleId,
          message: `Vehicle ${vehicle.vehicleId} has high mileage (${vehicle.mileage.total}km). Schedule comprehensive maintenance.`,
          priority: 'high'
        });
      }
    });

    return {
      totalVehicles: vehicles.length,
      averageUtilization: Math.round(
        vehicleStats.reduce((sum, v) => sum + v.thirtyDayStats.utilizationRate, 0) / vehicles.length
      ),
      vehicleStats,
      recommendations: recommendations.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      })
    };
  }

  /**
   * ========================================
   * NOTIFICATION SERVICES
   * ========================================
   */

  /**
   * Get important notifications for dashboard
   */
  static async getNotifications() {
    const [
      urgentMaintenance,
      lowBatteryVehicles,
      overdueDeployments,
      upcomingDeployments
    ] = await Promise.all([
      // Urgent maintenance (due within 24 hours)
      VehicleMaintenanceLog.find({
        status: 'scheduled',
        scheduledDate: { 
          $lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      })
      .populate('vehicleId', 'vehicleId registrationNumber')
      .select('maintenanceId maintenanceType scheduledDate vehicleId')
      .lean(),

      // Low battery vehicles
      Vehicle.find({
        'batteryStatus.currentLevel': { $lte: 20 },
        status: { $in: ['available', 'deployed'] },
        isActive: true
      })
      .select('vehicleId registrationNumber batteryStatus.currentLevel')
      .lean(),

      // Overdue deployments (past estimated end time)
      Deployment.find({
        status: 'in_progress',
        estimatedEndTime: { $lt: new Date() }
      })
      .populate('vehicleId', 'vehicleId registrationNumber')
      .populate('pilotId', 'fullName')
      .select('deploymentId vehicleId pilotId estimatedEndTime')
      .lean(),

      // Upcoming deployments (next 2 hours)
      Deployment.find({
        status: 'scheduled',
        startTime: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 2 * 60 * 60 * 1000)
        }
      })
      .populate('vehicleId', 'vehicleId registrationNumber')
      .populate('pilotId', 'fullName')
      .select('deploymentId vehicleId pilotId startTime')
      .lean()
    ]);

    return {
      urgentMaintenance: urgentMaintenance.map(m => ({
        type: 'URGENT_MAINTENANCE',
        message: `${m.maintenanceType} scheduled for ${m.vehicleId.vehicleId} within 24 hours`,
        priority: 'high',
        data: m
      })),
      lowBatteryVehicles: lowBatteryVehicles.map(v => ({
        type: 'LOW_BATTERY',
        message: `${v.vehicleId} battery at ${v.batteryStatus.currentLevel}%`,
        priority: 'medium',
        data: v
      })),
      overdueDeployments: overdueDeployments.map(d => ({
        type: 'OVERDUE_DEPLOYMENT',
        message: `Deployment ${d.deploymentId} is overdue (pilot: ${d.pilotId.fullName})`,
        priority: 'high',
        data: d
      })),
      upcomingDeployments: upcomingDeployments.map(d => ({
        type: 'UPCOMING_DEPLOYMENT',
        message: `Deployment ${d.deploymentId} starts soon (pilot: ${d.pilotId.fullName})`,
        priority: 'medium',
        data: d
      }))
    };
  }
}

module.exports = VehicleDeploymentService;
