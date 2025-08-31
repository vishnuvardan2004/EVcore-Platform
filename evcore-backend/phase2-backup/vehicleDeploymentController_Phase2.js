/**
 * Vehicle Deployment Controller
 * Handles all vehicle deployment operations including CRUD operations for vehicles, deployments, and maintenance
 */

const mongoose = require('mongoose');
const { 
  VehicleDeployment: Vehicle, 
  Deployment, 
  DeploymentHistory, 
  VehicleMaintenanceLog 
} = require('../models/vehicleDeploymentModels');
const User = require('../models/User');
const VehicleDeploymentService = require('../services/vehicleDeploymentService');
// Import Data Hub service lazily to avoid initialization issues
const getDataHubService = () => require('../services/dataHubService');
const { catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * ========================================
 * VEHICLE MANAGEMENT ENDPOINTS
 * ========================================
 */

/**
 * @desc    Get all vehicles with filtering and pagination
 * @route   GET /api/vehicle-deployment/vehicles
 * @access  Private (Vehicle Deployment Module)
 */
exports.getVehicles = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    make, 
    model, 
    currentHub, 
    batteryLevel,
    search 
  } = req.query;

  // Build filter object
  const filter = { isActive: true };
  
  if (status) filter.status = status;
  if (make) filter.make = new RegExp(make, 'i');
  if (model) filter.model = new RegExp(model, 'i');
  if (currentHub) filter.currentHub = new RegExp(currentHub, 'i');
  
  if (batteryLevel) {
    const level = parseInt(batteryLevel);
    if (level) filter['batteryStatus.currentLevel'] = { $gte: level };
  }

  // Search functionality
  if (search) {
    filter.$or = [
      { vehicleId: new RegExp(search, 'i') },
      { registrationNumber: new RegExp(search, 'i') },
      { make: new RegExp(search, 'i') },
      { model: new RegExp(search, 'i') }
    ];
  }

  const skip = (page - 1) * limit;
  
  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter)
      .populate('createdBy', 'fullName email')
      .populate('lastUpdatedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Vehicle.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      vehicles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    },
    message: `Retrieved ${vehicles.length} vehicles successfully`
  });
});

/**
 * @desc    Get a single vehicle by ID
 * @route   GET /api/vehicle-deployment/vehicles/:id
 * @access  Private (Vehicle Deployment Module)
 */
exports.getVehicle = catchAsync(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate('createdBy', 'fullName email role')
    .populate('lastUpdatedBy', 'fullName email role');

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { vehicle },
    message: 'Vehicle retrieved successfully'
  });
});

/**
 * @desc    Get a single vehicle by registration number (with Data Hub validation)
 * @route   GET /api/vehicle-deployment/vehicles/registration/:registrationNumber
 * @access  Private (Vehicle Deployment Module)
 */
exports.getVehicleByRegistration = catchAsync(async (req, res) => {
  const { registrationNumber } = req.params;
  
  // Use Data Hub service for vehicle validation and lookup
  const dataHubService = getDataHubService();
  const validationResult = await dataHubService.validateVehicleForDeployment(registrationNumber);

  if (!validationResult.valid) {
    return res.status(404).json({
      success: false,
      message: validationResult.error,
      suggestion: validationResult.suggestion,
      code: 'VEHICLE_NOT_FOUND_IN_DATA_HUB'
    });
  }

  // Return vehicle data with validation status
  res.status(200).json({
    success: true,
    data: { 
      vehicle: validationResult.vehicle,
      validation: {
        deployable: validationResult.valid,
        warnings: validationResult.warnings || []
      },
      source: 'data-hub'
    },
    message: 'Vehicle retrieved and validated from Data Hub',
    timestamp: new Date()
  });
});

/**
 * ========================================
 * DATA HUB INTEGRATION ENDPOINTS
 * ========================================
 */

/**
 * @desc    Get all available vehicles from Data Hub for deployment
 * @route   GET /api/vehicle-deployment/data-hub/vehicles
 * @access  Private (Vehicle Deployment Module)
 */
exports.getDataHubVehicles = catchAsync(async (req, res) => {
  const { status, hub, limit } = req.query;
  
  const filters = {};
  if (status) filters.status = status;
  if (hub) filters.hub = hub;
  if (limit) filters.limit = parseInt(limit);

  const dataHubService = getDataHubService();
  const vehicles = await dataHubService.getAvailableVehicles(filters);

  res.status(200).json({
    success: true,
    data: { 
      vehicles,
      count: vehicles.length,
      source: 'data-hub'
    },
    message: 'Available vehicles retrieved from Data Hub',
    timestamp: new Date()
  });
});

/**
 * @desc    Validate vehicle registration for deployment
 * @route   POST /api/vehicle-deployment/data-hub/validate-vehicle
 * @access  Private (Vehicle Deployment Module)
 */
exports.validateVehicleForDeployment = catchAsync(async (req, res) => {
  const { registrationNumber } = req.body;

  if (!registrationNumber) {
    return res.status(400).json({
      success: false,
      message: 'Registration number is required for validation'
    });
  }

  const dataHubService = getDataHubService();
  const validationResult = await dataHubService.validateVehicleForDeployment(registrationNumber);

  const statusCode = validationResult.valid ? 200 : 422;

  res.status(statusCode).json({
    success: validationResult.valid,
    data: {
      valid: validationResult.valid,
      vehicle: validationResult.vehicle,
      error: validationResult.error,
      warnings: validationResult.warnings || [],
      source: 'data-hub'
    },
    message: validationResult.valid 
      ? 'Vehicle is valid and available for deployment'
      : 'Vehicle validation failed',
    timestamp: new Date()
  });
});

/**
 * @desc    Get available pilots from Data Hub
 * @route   GET /api/vehicle-deployment/data-hub/pilots
 * @access  Private (Vehicle Deployment Module)
 */
exports.getDataHubPilots = catchAsync(async (req, res) => {
  const dataHubService = getDataHubService();
  const pilots = await dataHubService.getAvailablePilots();

  res.status(200).json({
    success: true,
    data: { 
      pilots,
      count: pilots.length,
      source: 'data-hub'
    },
    message: 'Available pilots retrieved from Data Hub',
    timestamp: new Date()
  });
});

/**
 * @desc    Get Data Hub service health status
 * @route   GET /api/vehicle-deployment/data-hub/health
 * @access  Private (Admin only)
 */
exports.getDataHubHealth = catchAsync(async (req, res) => {
  // Check admin access
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.'
    });
  }

  const dataHubService = getDataHubService();
  const health = await dataHubService.getServiceHealth();

  res.status(health.status === 'healthy' ? 200 : 503).json({
    success: health.status === 'healthy',
    data: health,
    message: `Data Hub service is ${health.status}`,
    timestamp: new Date()
  });
});

/**
 * @desc    Create a new vehicle
 * @route   POST /api/vehicle-deployment/vehicles
 * @access  Private (Admin/Super Admin only)
 */
exports.createVehicle = catchAsync(async (req, res) => {
  // Check if user has permission to create vehicles
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can create vehicles.'
    });
  }

  const vehicleData = {
    ...req.body,
    createdBy: req.user._id,
    lastUpdatedBy: req.user._id
  };

  const vehicle = new Vehicle(vehicleData);
  await vehicle.save();

  await vehicle.populate('createdBy', 'fullName email role');

  logger.info(`New vehicle created: ${vehicle.vehicleId} by ${req.user.fullName}`, {
    vehicleId: vehicle.vehicleId,
    userId: req.user._id,
    action: 'CREATE_VEHICLE'
  });

  res.status(201).json({
    success: true,
    data: { vehicle },
    message: `Vehicle ${vehicle.vehicleId} created successfully`
  });
});

/**
 * @desc    Update a vehicle
 * @route   PUT /api/vehicle-deployment/vehicles/:id
 * @access  Private (Admin/Super Admin only)
 */
exports.updateVehicle = catchAsync(async (req, res) => {
  // Check if user has permission to update vehicles
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can update vehicles.'
    });
  }

  const vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Store old status for comparison
  const oldStatus = vehicle.status;
  
  // Update vehicle with new data
  Object.assign(vehicle, req.body);
  vehicle.lastUpdatedBy = req.user._id;
  vehicle.updatedAt = new Date();
  
  await vehicle.save();
  await vehicle.populate([
    { path: 'createdBy', select: 'fullName email role' },
    { path: 'lastUpdatedBy', select: 'fullName email role' }
  ]);

  logger.info(`Vehicle updated: ${vehicle.vehicleId} by ${req.user.fullName}`, {
    vehicleId: vehicle.vehicleId,
    userId: req.user._id,
    action: 'UPDATE_VEHICLE',
    statusChange: oldStatus !== vehicle.status ? { from: oldStatus, to: vehicle.status } : null
  });

  res.status(200).json({
    success: true,
    data: { vehicle },
    message: `Vehicle ${vehicle.vehicleId} updated successfully`
  });
});

/**
 * @desc    Delete (deactivate) a vehicle
 * @route   DELETE /api/vehicle-deployment/vehicles/:id
 * @access  Private (Super Admin only)
 */
exports.deleteVehicle = catchAsync(async (req, res) => {
  // Check if user has permission to delete vehicles
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only super administrators can delete vehicles.'
    });
  }

  const vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if vehicle has active deployments
  const activeDeployments = await Deployment.countDocuments({
    vehicleId: vehicle._id,
    status: { $in: ['scheduled', 'in_progress'] }
  });

  if (activeDeployments > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete vehicle with active deployments. Please complete or cancel all deployments first.'
    });
  }

  // Soft delete
  vehicle.isActive = false;
  vehicle.status = 'decommissioned';
  vehicle.lastUpdatedBy = req.user._id;
  vehicle.updatedAt = new Date();
  
  await vehicle.save();

  logger.warn(`Vehicle deleted: ${vehicle.vehicleId} by ${req.user.fullName}`, {
    vehicleId: vehicle.vehicleId,
    userId: req.user._id,
    action: 'DELETE_VEHICLE'
  });

  res.status(200).json({
    success: true,
    message: `Vehicle ${vehicle.vehicleId} deactivated successfully`
  });
});

/**
 * ========================================
 * DEPLOYMENT MANAGEMENT ENDPOINTS
 * ========================================
 */

/**
 * @desc    Get all deployments with filtering and pagination
 * @route   GET /api/vehicle-deployment/deployments
 * @access  Private (Vehicle Deployment Module)
 */
exports.getDeployments = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    pilotId, 
    vehicleId,
    startDate,
    endDate,
    search 
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (status) filter.status = status;
  if (pilotId) filter.pilotId = pilotId;
  if (vehicleId) filter.vehicleId = vehicleId;
  
  // Date range filtering
  if (startDate || endDate) {
    filter.startTime = {};
    if (startDate) filter.startTime.$gte = new Date(startDate);
    if (endDate) filter.startTime.$lte = new Date(endDate);
  }

  // Search functionality
  if (search) {
    filter.$or = [
      { deploymentId: new RegExp(search, 'i') },
      { purpose: new RegExp(search, 'i') },
      { 'startLocation.address': new RegExp(search, 'i') }
    ];
  }

  const skip = (page - 1) * limit;
  
  const [deployments, total] = await Promise.all([
    Deployment.find(filter)
      .populate('vehicleId', 'vehicleId registrationNumber make model status')
      .populate('pilotId', 'fullName email mobileNumber role')
      .populate('createdBy', 'fullName email')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Deployment.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      deployments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    },
    message: `Retrieved ${deployments.length} deployments successfully`
  });
});

/**
 * @desc    Get a single deployment by ID
 * @route   GET /api/vehicle-deployment/deployments/:id
 * @access  Private (Vehicle Deployment Module)
 */
exports.getDeployment = catchAsync(async (req, res) => {
  const deployment = await Deployment.findById(req.params.id)
    .populate('vehicleId', 'vehicleId registrationNumber make model status batteryStatus')
    .populate('pilotId', 'fullName email mobileNumber role profile')
    .populate('createdBy', 'fullName email role');

  if (!deployment) {
    return res.status(404).json({
      success: false,
      message: 'Deployment not found'
    });
  }

  // Get deployment history
  const history = await DeploymentHistory.findOne({ deploymentId: deployment._id })
    .select('statusChanges locationHistory telemetryData')
    .lean();

  res.status(200).json({
    success: true,
    data: { 
      deployment,
      history
    },
    message: 'Deployment retrieved successfully'
  });
});

/**
 * @desc    Create a new deployment
 * @route   POST /api/vehicle-deployment/deployments
 * @access  Private (Admin/Super Admin/Pilot)
 */
exports.createDeployment = catchAsync(async (req, res) => {
  const deploymentData = {
    ...req.body,
    createdBy: req.user._id
  };

  const deployment = new Deployment(deploymentData);
  await deployment.save();

  await deployment.populate([
    { path: 'vehicleId', select: 'vehicleId registrationNumber make model' },
    { path: 'pilotId', select: 'fullName email mobileNumber' },
    { path: 'createdBy', select: 'fullName email role' }
  ]);

  // Create deployment history entry
  const history = new DeploymentHistory({
    deploymentId: deployment._id
  });
  await history.save();

  logger.info(`New deployment created: ${deployment.deploymentId} by ${req.user.fullName}`, {
    deploymentId: deployment.deploymentId,
    vehicleId: deployment.vehicleId.vehicleId,
    pilotId: deployment.pilotId._id,
    userId: req.user._id,
    action: 'CREATE_DEPLOYMENT'
  });

  res.status(201).json({
    success: true,
    data: { deployment },
    message: `Deployment ${deployment.deploymentId} created successfully`
  });
});

/**
 * @desc    Create a new deployment using registration number (with Data Hub validation)
 * @route   POST /api/vehicle-deployment/deployments/by-registration
 * @access  Private (Admin/Super Admin/Pilot)
 */
exports.createDeploymentByRegistration = catchAsync(async (req, res) => {
  const { registrationNumber, ...deploymentData } = req.body;
  
  // Validate vehicle using Data Hub service
  const dataHubService = getDataHubService();
  const validationResult = await dataHubService.validateVehicleForDeployment(registrationNumber);
  
  if (!validationResult.valid) {
    return res.status(422).json({
      success: false,
      message: validationResult.error,
      suggestion: validationResult.suggestion,
      code: 'VEHICLE_VALIDATION_FAILED'
    });
  }

  const vehicle = validationResult.vehicle;

  // For Phase 2: Create deployment record that REFERENCES the Data Hub vehicle
  // Instead of using vehicle._id from Vehicle Deployment collection,
  // we'll store the Data Hub reference and registration number
  const deployment = new Deployment({
    ...deploymentData,
    // Store Data Hub reference instead of local vehicle ID
    dataHubVehicleId: vehicle.dataHubId, // MongoDB ObjectId from Data Hub
    vehicleRegistration: vehicle.registrationNumber, // For quick lookup
    vehicleDetails: {
      // Cache essential vehicle info for performance
      brand: vehicle.brand,
      model: vehicle.model,
      vehicleId: vehicle.vehicleId,
      registrationNumber: vehicle.registrationNumber
    },
    createdBy: req.user._id,
    source: 'data-hub-reference' // Track that this references Data Hub
  });
  
  await deployment.save();

  // Populate user details
  await deployment.populate([
    { path: 'pilotId', select: 'fullName email mobileNumber' },
    { path: 'createdBy', select: 'fullName email role' }
  ]);

  // Create deployment history entry
  const history = new DeploymentHistory({
    deploymentId: deployment._id,
    vehicleReference: {
      dataHubId: vehicle.dataHubId,
      registrationNumber: vehicle.registrationNumber,
      source: 'data-hub'
    }
  });
  await history.save();
  
  // NOTE: In Phase 2, we don't update the Vehicle Deployment collection
  // because we're referencing Data Hub vehicles, not creating local copies

  logger.info(`New deployment created via Data Hub reference: ${deployment.deploymentId} for vehicle ${registrationNumber} by ${req.user.fullName}`, {
    deploymentId: deployment.deploymentId,
    dataHubVehicleId: vehicle.dataHubId,
    vehicleId: vehicle.vehicleId,
    registrationNumber: registrationNumber,
    pilotId: deployment.pilotId._id,
    userId: req.user._id,
    source: 'data-hub-reference',
    action: 'CREATE_DEPLOYMENT_BY_DATA_HUB_REFERENCE'
  });

  res.status(201).json({
    success: true,
    data: { deployment },
    message: `Deployment ${deployment.deploymentId} created successfully for vehicle ${registrationNumber}`
  });
});

/**
 * @desc    Update a deployment
 * @route   PUT /api/vehicle-deployment/deployments/:id
 * @access  Private (Admin/Super Admin/Assigned Pilot)
 */
exports.updateDeployment = catchAsync(async (req, res) => {
  const deployment = await Deployment.findById(req.params.id)
    .populate('pilotId', '_id');
  
  if (!deployment) {
    return res.status(404).json({
      success: false,
      message: 'Deployment not found'
    });
  }

  // Check permissions
  const canUpdate = ['admin', 'super_admin'].includes(req.user.role) || 
                   deployment.pilotId._id.toString() === req.user._id.toString();
  
  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own deployments or you must be an administrator.'
    });
  }

  const oldStatus = deployment.status;
  
  // Update deployment
  Object.assign(deployment, req.body);
  deployment.updatedAt = new Date();
  
  await deployment.save();
  await deployment.populate([
    { path: 'vehicleId', select: 'vehicleId registrationNumber make model status' },
    { path: 'pilotId', select: 'fullName email mobileNumber role' },
    { path: 'createdBy', select: 'fullName email role' }
  ]);

  logger.info(`Deployment updated: ${deployment.deploymentId} by ${req.user.fullName}`, {
    deploymentId: deployment.deploymentId,
    userId: req.user._id,
    action: 'UPDATE_DEPLOYMENT',
    statusChange: oldStatus !== deployment.status ? { from: oldStatus, to: deployment.status } : null
  });

  res.status(200).json({
    success: true,
    data: { deployment },
    message: `Deployment ${deployment.deploymentId} updated successfully`
  });
});

/**
 * @desc    Cancel a deployment
 * @route   POST /api/vehicle-deployment/deployments/:id/cancel
 * @access  Private (Admin/Super Admin/Assigned Pilot)
 */
exports.cancelDeployment = catchAsync(async (req, res) => {
  const deployment = await Deployment.findById(req.params.id)
    .populate('pilotId', '_id fullName')
    .populate('vehicleId', '_id vehicleId');
  
  if (!deployment) {
    return res.status(404).json({
      success: false,
      message: 'Deployment not found'
    });
  }

  // Check permissions
  const canCancel = ['admin', 'super_admin'].includes(req.user.role) || 
                   deployment.pilotId._id.toString() === req.user._id.toString();
  
  if (!canCancel) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only cancel your own deployments or you must be an administrator.'
    });
  }

  // Check if deployment can be cancelled
  if (['completed', 'cancelled'].includes(deployment.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel deployment that is already ${deployment.status}`
    });
  }

  const { reason } = req.body;
  
  deployment.status = 'cancelled';
  deployment.endTime = new Date();
  deployment.cancellationReason = reason;
  deployment.cancelledBy = req.user._id;
  deployment.updatedAt = new Date();
  
  await deployment.save();

  logger.warn(`Deployment cancelled: ${deployment.deploymentId} by ${req.user.fullName}`, {
    deploymentId: deployment.deploymentId,
    reason,
    userId: req.user._id,
    action: 'CANCEL_DEPLOYMENT'
  });

  res.status(200).json({
    success: true,
    message: `Deployment ${deployment.deploymentId} cancelled successfully`,
    data: { deployment }
  });
});

/**
 * ========================================
 * MAINTENANCE MANAGEMENT ENDPOINTS
 * ========================================
 */

/**
 * @desc    Get all maintenance logs with filtering
 * @route   GET /api/vehicle-deployment/maintenance
 * @access  Private (Vehicle Deployment Module)
 */
exports.getMaintenanceLogs = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    vehicleId, 
    status, 
    maintenanceType,
    dueSoon = false
  } = req.query;

  let filter = {};
  
  if (vehicleId) filter.vehicleId = vehicleId;
  if (status) filter.status = status;
  if (maintenanceType) filter.maintenanceType = maintenanceType;
  
  // Filter for maintenance due soon
  if (dueSoon === 'true') {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    filter.scheduledDate = { $lte: nextWeek };
    filter.status = { $in: ['scheduled', 'in_progress'] };
  }

  const skip = (page - 1) * limit;
  
  const [maintenance, total] = await Promise.all([
    VehicleMaintenanceLog.find(filter)
      .populate('vehicleId', 'vehicleId registrationNumber make model')
      .populate('createdBy', 'fullName email')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    VehicleMaintenanceLog.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      maintenance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    },
    message: `Retrieved ${maintenance.length} maintenance records successfully`
  });
});

/**
 * @desc    Create maintenance log
 * @route   POST /api/vehicle-deployment/maintenance
 * @access  Private (Admin/Super Admin)
 */
exports.createMaintenanceLog = catchAsync(async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can schedule maintenance.'
    });
  }

  const maintenanceData = {
    ...req.body,
    createdBy: req.user._id
  };

  const maintenance = new VehicleMaintenanceLog(maintenanceData);
  await maintenance.save();

  await maintenance.populate([
    { path: 'vehicleId', select: 'vehicleId registrationNumber make model' },
    { path: 'createdBy', select: 'fullName email role' }
  ]);

  logger.info(`Maintenance scheduled: ${maintenance.maintenanceId} by ${req.user.fullName}`, {
    maintenanceId: maintenance.maintenanceId,
    vehicleId: maintenance.vehicleId.vehicleId,
    maintenanceType: maintenance.maintenanceType,
    userId: req.user._id,
    action: 'CREATE_MAINTENANCE'
  });

  res.status(201).json({
    success: true,
    data: { maintenance },
    message: `Maintenance ${maintenance.maintenanceId} scheduled successfully`
  });
});

/**
 * ========================================
 * DASHBOARD & ANALYTICS ENDPOINTS
 * ========================================
 */

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/vehicle-deployment/dashboard
 * @access  Private (Vehicle Deployment Module)
 */
exports.getDashboardStats = catchAsync(async (req, res) => {
  const [
    totalVehicles,
    availableVehicles,
    deployedVehicles,
    maintenanceVehicles,
    activeDeployments,
    scheduledDeployments,
    dueMaintenance,
    completedDeploymentsToday
  ] = await Promise.all([
    Vehicle.countDocuments({ isActive: true }),
    Vehicle.countDocuments({ status: 'available', isActive: true }),
    Vehicle.countDocuments({ status: 'deployed', isActive: true }),
    Vehicle.countDocuments({ status: 'maintenance', isActive: true }),
    Deployment.countDocuments({ status: 'in_progress' }),
    Deployment.countDocuments({ status: 'scheduled' }),
    VehicleMaintenanceLog.countDocuments({ 
      status: 'scheduled',
      scheduledDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    }),
    Deployment.countDocuments({ 
      status: 'completed',
      endTime: { 
        $gte: new Date().setHours(0, 0, 0, 0),
        $lte: new Date().setHours(23, 59, 59, 999)
      }
    })
  ]);

  const stats = {
    vehicles: {
      total: totalVehicles,
      available: availableVehicles,
      deployed: deployedVehicles,
      maintenance: maintenanceVehicles,
      utilizationRate: totalVehicles > 0 ? Math.round((deployedVehicles / totalVehicles) * 100) : 0
    },
    deployments: {
      active: activeDeployments,
      scheduled: scheduledDeployments,
      completedToday: completedDeploymentsToday
    },
    maintenance: {
      dueSoon: dueMaintenance
    }
  };

  res.status(200).json({
    success: true,
    data: { stats },
    message: 'Dashboard statistics retrieved successfully'
  });
});

/**
 * @desc    Get available vehicles for deployment
 * @route   GET /api/vehicle-deployment/vehicles/available
 * @access  Private (Vehicle Deployment Module)
 */
exports.getAvailableVehicles = catchAsync(async (req, res) => {
  const { hub, minBatteryLevel = 20 } = req.query;
  
  const filter = {
    status: 'available',
    isActive: true,
    'batteryStatus.currentLevel': { $gte: parseInt(minBatteryLevel) }
  };
  
  if (hub) {
    filter.currentHub = new RegExp(hub, 'i');
  }

  const vehicles = await Vehicle.find(filter)
    .select('vehicleId registrationNumber make model year batteryStatus currentHub location')
    .sort({ 'batteryStatus.currentLevel': -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: { vehicles },
    message: `Found ${vehicles.length} available vehicles`
  });
});

/**
 * @desc    Get eligible pilots for deployment
 * @route   GET /api/vehicle-deployment/pilots/available
 * @access  Private (Vehicle Deployment Module)
 */
exports.getAvailablePilots = catchAsync(async (req, res) => {
  const { date, startTime, endTime } = req.query;
  
  // Get all pilots
  const pilots = await User.find({
    role: 'pilot',
    isActive: true
  }).select('fullName email mobileNumber profile').lean();

  // If date/time filters provided, check for conflicts
  let availablePilots = pilots;
  
  if (date && startTime && endTime) {
    const searchDate = new Date(date);
    const searchStart = new Date(`${date}T${startTime}`);
    const searchEnd = new Date(`${date}T${endTime}`);
    
    // Find pilots with conflicting deployments
    const conflictingDeployments = await Deployment.find({
      status: { $in: ['scheduled', 'in_progress'] },
      $or: [
        {
          startTime: { $lte: searchStart },
          estimatedEndTime: { $gte: searchStart }
        },
        {
          startTime: { $lte: searchEnd },
          estimatedEndTime: { $gte: searchEnd }
        }
      ]
    }).select('pilotId').lean();
    
    const busyPilotIds = conflictingDeployments.map(d => d.pilotId.toString());
    
    availablePilots = pilots.filter(pilot => 
      !busyPilotIds.includes(pilot._id.toString())
    );
  }

  res.status(200).json({
    success: true,
    data: { pilots: availablePilots },
    message: `Found ${availablePilots.length} available pilots`
  });
});

/**
 * ========================================
 * ADVANCED ANALYTICS ENDPOINTS
 * ========================================
 */

/**
 * @desc    Get optimal vehicle recommendations for deployment
 * @route   POST /api/vehicle-deployment/vehicles/optimal
 * @access  Private (Vehicle Deployment Module)
 */
exports.getOptimalVehicles = catchAsync(async (req, res) => {
  const criteria = req.body;
  
  const optimalVehicles = await VehicleDeploymentService.findOptimalVehicle(criteria);
  
  res.status(200).json({
    success: true,
    data: { 
      vehicles: optimalVehicles,
      criteria: criteria
    },
    message: `Found ${optimalVehicles.length} optimal vehicles for your criteria`
  });
});

/**
 * @desc    Get deployment analytics
 * @route   GET /api/vehicle-deployment/analytics/deployments
 * @access  Private (Vehicle Deployment Module)
 */
exports.getDeploymentAnalytics = catchAsync(async (req, res) => {
  const { 
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
    endDate = new Date().toISOString(),
    pilotId,
    vehicleId,
    status
  } = req.query;
  
  const filters = {};
  if (pilotId) filters.pilotId = pilotId;
  if (vehicleId) filters.vehicleId = vehicleId;
  if (status) filters.status = status;
  
  const analytics = await VehicleDeploymentService.getDeploymentAnalytics(
    startDate, 
    endDate, 
    filters
  );
  
  res.status(200).json({
    success: true,
    data: { 
      analytics,
      period: { startDate, endDate },
      filters
    },
    message: 'Deployment analytics retrieved successfully'
  });
});

/**
 * @desc    Get fleet utilization analysis
 * @route   GET /api/vehicle-deployment/analytics/fleet-utilization
 * @access  Private (Vehicle Deployment Module - Admin/Super Admin)
 */
exports.getFleetUtilization = catchAsync(async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can view fleet utilization analysis.'
    });
  }
  
  const utilization = await VehicleDeploymentService.analyzeFleetUtilization();
  
  res.status(200).json({
    success: true,
    data: { utilization },
    message: 'Fleet utilization analysis retrieved successfully'
  });
});

/**
 * @desc    Generate comprehensive deployment report
 * @route   POST /api/vehicle-deployment/reports/deployments
 * @access  Private (Vehicle Deployment Module - Admin/Super Admin)
 */
exports.generateDeploymentReport = catchAsync(async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can generate reports.'
    });
  }
  
  const filters = req.body;
  const report = await VehicleDeploymentService.generateDeploymentReport(filters);
  
  logger.info(`Deployment report generated by ${req.user.fullName}`, {
    userId: req.user._id,
    reportPeriod: report.period,
    action: 'GENERATE_REPORT'
  });
  
  res.status(200).json({
    success: true,
    data: { report },
    message: 'Deployment report generated successfully'
  });
});

/**
 * ========================================
 * MAINTENANCE OPTIMIZATION ENDPOINTS
 * ========================================
 */

/**
 * @desc    Get vehicles due for maintenance
 * @route   GET /api/vehicle-deployment/maintenance/due
 * @access  Private (Vehicle Deployment Module)
 */
exports.getMaintenanceDue = catchAsync(async (req, res) => {
  const { daysAhead = 7 } = req.query;
  
  const maintenanceDue = await VehicleDeploymentService.getVehiclesDueForMaintenance(
    parseInt(daysAhead)
  );
  
  res.status(200).json({
    success: true,
    data: { maintenanceDue },
    message: `Found ${maintenanceDue.totalDue} vehicles due for maintenance`
  });
});

/**
 * @desc    Auto-schedule maintenance for a vehicle
 * @route   POST /api/vehicle-deployment/maintenance/auto-schedule
 * @access  Private (Admin/Super Admin only)
 */
exports.autoScheduleMaintenance = catchAsync(async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can schedule maintenance.'
    });
  }
  
  const { vehicleId, maintenanceType } = req.body;
  
  const result = await VehicleDeploymentService.autoScheduleMaintenance(
    vehicleId, 
    maintenanceType
  );
  
  if (result.scheduled) {
    logger.info(`Auto-maintenance scheduled by ${req.user.fullName}`, {
      maintenanceId: result.maintenanceId,
      vehicleId,
      maintenanceType,
      userId: req.user._id,
      action: 'AUTO_SCHEDULE_MAINTENANCE'
    });
  }
  
  res.status(result.scheduled ? 201 : 200).json({
    success: true,
    data: { result },
    message: result.scheduled 
      ? `Maintenance ${result.maintenanceId} scheduled successfully`
      : result.reason
  });
});

/**
 * ========================================
 * REAL-TIME TRACKING ENDPOINTS
 * ========================================
 */

/**
 * @desc    Update deployment tracking data
 * @route   PUT /api/vehicle-deployment/deployments/:id/tracking
 * @access  Private (Admin/Super Admin/Assigned Pilot)
 */
exports.updateDeploymentTracking = catchAsync(async (req, res) => {
  const deploymentId = req.params.id;
  const trackingData = req.body;
  
  // Check if user has permission to update this deployment
  const deployment = await Deployment.findById(deploymentId)
    .populate('pilotId', '_id');
  
  if (!deployment) {
    return res.status(404).json({
      success: false,
      message: 'Deployment not found'
    });
  }
  
  const canUpdate = ['admin', 'super_admin'].includes(req.user.role) || 
                   deployment.pilotId._id.toString() === req.user._id.toString();
  
  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update tracking for your own deployments.'
    });
  }
  
  const result = await VehicleDeploymentService.updateDeploymentTracking(
    deploymentId, 
    trackingData
  );
  
  res.status(200).json({
    success: true,
    data: { result },
    message: 'Deployment tracking updated successfully'
  });
});

/**
 * @desc    Get deployment history with real-time data
 * @route   GET /api/vehicle-deployment/deployments/:id/history
 * @access  Private (Vehicle Deployment Module)
 */
exports.getDeploymentHistory = catchAsync(async (req, res) => {
  const deploymentId = req.params.id;
  
  const history = await DeploymentHistory.findOne({ deploymentId })
    .populate({
      path: 'deploymentId',
      select: 'deploymentId vehicleId pilotId status startTime endTime',
      populate: [
        { path: 'vehicleId', select: 'vehicleId registrationNumber make model' },
        { path: 'pilotId', select: 'fullName email' }
      ]
    })
    .lean();
  
  if (!history) {
    return res.status(404).json({
      success: false,
      message: 'Deployment history not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: { history },
    message: 'Deployment history retrieved successfully'
  });
});

/**
 * ========================================
 * NOTIFICATION ENDPOINTS
 * ========================================
 */

/**
 * @desc    Get dashboard notifications
 * @route   GET /api/vehicle-deployment/notifications
 * @access  Private (Vehicle Deployment Module)
 */
exports.getNotifications = catchAsync(async (req, res) => {
  const notifications = await VehicleDeploymentService.getNotifications();
  
  // Flatten all notifications into a single array
  const allNotifications = [
    ...notifications.urgentMaintenance,
    ...notifications.lowBatteryVehicles,
    ...notifications.overdueDeployments,
    ...notifications.upcomingDeployments
  ];
  
  res.status(200).json({
    success: true,
    data: { 
      notifications: {
        all: allNotifications,
        byType: notifications,
        total: allNotifications.length
      }
    },
    message: `Found ${allNotifications.length} notifications`
  });
});

// Note: All functions are already exported using exports.functionName = ... syntax above
// No need for additional module.exports as it would override the individual exports
