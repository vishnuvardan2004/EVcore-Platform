/**
 * Vehicle Deployment Controller - Phase 3: Pure Data Hub Reference Architecture
 * All vehicle operations now reference Database Management (Data Hub) directly
 * No local vehicle storage - single source of truth
 */

const mongoose = require('mongoose');
const { 
  Deployment, 
  DeploymentHistory 
} = require('../models/vehicleDeploymentModels');
const User = require('../models/User');
// Import Data Hub service lazily to avoid initialization issues
const getDataHubService = () => require('../services/dataHubService');
const { catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * ========================================
 * DATA HUB VEHICLE OPERATIONS
 * ========================================
 */

/**
 * @desc    Get all available vehicles from Data Hub with filtering
 * @route   GET /api/vehicle-deployment/vehicles
 * @access  Private (Vehicle Deployment Module)
 */
exports.getVehicles = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    brand, 
    model, 
    currentHub, 
    search 
  } = req.query;

  const filters = {};
  
  if (status) filters.status = status;
  if (currentHub) filters.hub = currentHub;
  if (limit) filters.limit = parseInt(limit);

  const dataHubService = getDataHubService();
  let vehicles = await dataHubService.getAvailableVehicles(filters);

  // Apply additional filtering that Data Hub service doesn't handle
  if (brand) {
    vehicles = vehicles.filter(v => 
      v.brand && v.brand.toLowerCase().includes(brand.toLowerCase())
    );
  }
  
  if (model) {
    vehicles = vehicles.filter(v => 
      v.model && v.model.toLowerCase().includes(model.toLowerCase())
    );
  }

  if (search) {
    vehicles = vehicles.filter(v => 
      (v.registrationNumber && v.registrationNumber.toLowerCase().includes(search.toLowerCase())) ||
      (v.brand && v.brand.toLowerCase().includes(search.toLowerCase())) ||
      (v.model && v.model.toLowerCase().includes(search.toLowerCase())) ||
      (v.vehicleId && v.vehicleId.toLowerCase().includes(search.toLowerCase()))
    );
  }

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedVehicles = vehicles.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    data: {
      vehicles: paginatedVehicles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(vehicles.length / limit),
        totalItems: vehicles.length,
        itemsPerPage: parseInt(limit),
        hasNextPage: endIndex < vehicles.length,
        hasPreviousPage: startIndex > 0
      },
      source: 'data-hub'
    },
    message: 'Vehicles retrieved from Data Hub successfully',
    timestamp: new Date()
  });
});

/**
 * @desc    Get available vehicles for deployment (optimized)
 * @route   GET /api/vehicle-deployment/vehicles/available
 * @access  Private (Vehicle Deployment Module)
 */
exports.getAvailableVehicles = catchAsync(async (req, res) => {
  const { limit = 50, hub, status = 'Active' } = req.query;

  const filters = {
    status,
    limit: parseInt(limit)
  };
  
  if (hub) filters.hub = hub;

  const dataHubService = getDataHubService();
  const vehicles = await dataHubService.getAvailableVehicles(filters);

  // Filter out vehicles that are currently deployed
  const deployedVehicleIds = await Deployment.distinct('dataHubVehicleId', {
    status: 'in_progress',
    actualEndTime: null
  });

  const availableVehicles = vehicles.filter(vehicle => 
    !deployedVehicleIds.some(id => id.toString() === vehicle.dataHubId)
  );

  res.status(200).json({
    success: true,
    data: {
      vehicles: availableVehicles,
      totalAvailable: availableVehicles.length,
      totalInHub: vehicles.length,
      deployedCount: deployedVehicleIds.length,
      source: 'data-hub'
    },
    message: 'Available vehicles for deployment retrieved successfully',
    timestamp: new Date()
  });
});

/**
 * @desc    Get a single vehicle by registration number (with deployment status)
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

  // Check current deployment status
  const currentDeployment = await Deployment.findOne({
    vehicleRegistration: registrationNumber,
    status: 'in_progress',
    actualEndTime: null
  }).populate('pilotId', 'fullName email role');

  const vehicle = validationResult.vehicle;
  vehicle.deploymentStatus = currentDeployment ? {
    isDeployed: true,
    deploymentId: currentDeployment.deploymentId,
    pilotName: currentDeployment.pilotId?.fullName,
    startTime: currentDeployment.startTime,
    estimatedEndTime: currentDeployment.estimatedEndTime
  } : {
    isDeployed: false
  };

  res.status(200).json({
    success: true,
    data: { 
      vehicle,
      validation: {
        deployable: validationResult.valid && !currentDeployment,
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

  // Additional check for current deployments
  if (validationResult.valid) {
    const currentDeployment = await Deployment.findOne({
      vehicleRegistration: registrationNumber,
      status: 'in_progress',
      actualEndTime: null
    });

    if (currentDeployment) {
      validationResult.warnings = validationResult.warnings || [];
      validationResult.warnings.push('Vehicle is currently deployed');
    }
  }

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
      ? 'Vehicle is valid for deployment'
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
 * ========================================
 * DEPLOYMENT MANAGEMENT - PURE DATA HUB REFERENCE
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
    startDate,
    endDate,
    vehicleRegistration
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (status) filter.status = status;
  if (pilotId) filter.pilotId = pilotId;
  if (vehicleRegistration) filter.vehicleRegistration = new RegExp(vehicleRegistration, 'i');
  
  // Date range filtering
  if (startDate || endDate) {
    filter.startTime = {};
    if (startDate) filter.startTime.$gte = new Date(startDate);
    if (endDate) filter.startTime.$lte = new Date(endDate);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'pilotId', select: 'fullName email mobileNumber role profile' },
      { path: 'createdBy', select: 'fullName email role' }
    ]
  };

  const deployments = await Deployment.paginate(filter, options);

  // Enrich with real-time Data Hub vehicle information
  const dataHubService = getDataHubService();
  for (let deployment of deployments.docs) {
    if (deployment.vehicleRegistration) {
      try {
        const vehicle = await dataHubService.findVehicleByRegistration(deployment.vehicleRegistration);
        if (vehicle) {
          deployment._doc.currentVehicleInfo = {
            status: vehicle.status,
            currentHub: vehicle.currentHub,
            batteryCapacity: vehicle.batteryCapacity,
            lastSynced: new Date()
          };
        }
      } catch (error) {
        // Log but don't fail the request
        logger.warn(`Could not fetch current info for vehicle ${deployment.vehicleRegistration}:`, error.message);
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      deployments: deployments.docs,
      pagination: {
        currentPage: deployments.page,
        totalPages: deployments.totalPages,
        totalItems: deployments.totalDocs,
        itemsPerPage: deployments.limit,
        hasNextPage: deployments.hasNextPage,
        hasPreviousPage: deployments.hasPrevPage
      },
      source: 'data-hub-reference'
    },
    message: 'Deployments retrieved successfully with Data Hub sync',
    timestamp: new Date()
  });
});

/**
 * @desc    Get a single deployment by ID
 * @route   GET /api/vehicle-deployment/deployments/:id
 * @access  Private (Vehicle Deployment Module)
 */
exports.getDeployment = catchAsync(async (req, res) => {
  const deployment = await Deployment.findById(req.params.id)
    .populate('pilotId', 'fullName email mobileNumber role profile')
    .populate('createdBy', 'fullName email role');

  if (!deployment) {
    return res.status(404).json({
      success: false,
      message: 'Deployment not found'
    });
  }

  // Get real-time vehicle information from Data Hub
  let currentVehicleInfo = null;
  if (deployment.vehicleRegistration) {
    try {
      const dataHubService = getDataHubService();
      const vehicle = await dataHubService.findVehicleByRegistration(deployment.vehicleRegistration);
      if (vehicle) {
        currentVehicleInfo = vehicle;
      }
    } catch (error) {
      logger.warn(`Could not fetch current vehicle info for ${deployment.vehicleRegistration}:`, error.message);
    }
  }

  // Get deployment history
  const history = await DeploymentHistory.findOne({ deploymentId: deployment._id })
    .select('statusChanges locationHistory telemetryData vehicleReference')
    .lean();

  res.status(200).json({
    success: true,
    data: { 
      deployment: {
        ...deployment.toObject(),
        currentVehicleInfo
      },
      history,
      source: 'data-hub-reference'
    },
    message: 'Deployment retrieved successfully with real-time Data Hub sync',
    timestamp: new Date()
  });
});

/**
 * @desc    Create a new deployment using registration number (Phase 3: Pure Data Hub Reference)
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

  // Check if vehicle is currently deployed
  const existingDeployment = await Deployment.findOne({
    vehicleRegistration: registrationNumber,
    status: 'in_progress',
    actualEndTime: null
  });

  if (existingDeployment) {
    return res.status(409).json({
      success: false,
      message: `Vehicle ${registrationNumber} is already deployed`,
      data: {
        existingDeploymentId: existingDeployment.deploymentId,
        conflictType: 'VEHICLE_ALREADY_DEPLOYED'
      }
    });
  }

  // Phase 3: Create pure Data Hub reference deployment
  const deployment = new Deployment({
    ...deploymentData,
    // Store Data Hub reference (primary)
    dataHubVehicleId: vehicle.dataHubId,
    vehicleRegistration: vehicle.registrationNumber,
    vehicleDetails: {
      // Cache essential vehicle info for performance
      brand: vehicle.brand,
      model: vehicle.model,
      vehicleId: vehicle.vehicleId,
      registrationNumber: vehicle.registrationNumber,
      vinNumber: vehicle.vinNumber,
      currentHub: vehicle.currentHub
    },
    source: 'data-hub-reference',
    createdBy: req.user._id
  });
  
  await deployment.save();

  // Populate user details
  await deployment.populate([
    { path: 'pilotId', select: 'fullName email mobileNumber' },
    { path: 'createdBy', select: 'fullName email role' }
  ]);

  // Create deployment history entry with Data Hub reference
  const history = new DeploymentHistory({
    deploymentId: deployment._id,
    vehicleReference: {
      dataHubId: vehicle.dataHubId,
      registrationNumber: vehicle.registrationNumber,
      source: 'data-hub'
    }
  });
  await history.save();

  logger.info(`Phase 3 deployment created: ${deployment.deploymentId} for Data Hub vehicle ${registrationNumber} by ${req.user.fullName}`, {
    deploymentId: deployment.deploymentId,
    dataHubVehicleId: vehicle.dataHubId,
    dataHubVehicleIdString: vehicle.vehicleId,
    registrationNumber: registrationNumber,
    pilotId: deployment.pilotId._id,
    userId: req.user._id,
    source: 'data-hub-reference',
    phase: 'phase-3',
    action: 'CREATE_DEPLOYMENT_DATA_HUB_REFERENCE'
  });

  res.status(201).json({
    success: true,
    data: { 
      deployment: {
        ...deployment.toObject(),
        vehicleInfo: vehicle // Include full vehicle info from Data Hub
      },
      source: 'data-hub-reference',
      phase: 'phase-3'
    },
    message: `Deployment created successfully for Data Hub vehicle ${registrationNumber}`,
    timestamp: new Date()
  });
});

/**
 * @desc    Update a deployment
 * @route   PUT /api/vehicle-deployment/deployments/:id
 * @access  Private (Admin/Super Admin/Assigned Pilot)
 */
exports.updateDeployment = catchAsync(async (req, res) => {
  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return res.status(404).json({
      success: false,
      message: 'Deployment not found'
    });
  }

  // Authorization check
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const isPilot = req.user._id.equals(deployment.pilotId);
  
  if (!isAdmin && !isPilot) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators or the assigned pilot can update this deployment.'
    });
  }

  // Update deployment
  const updatedData = {
    ...req.body,
    lastUpdatedBy: req.user._id,
    updatedAt: new Date()
  };

  const updatedDeployment = await Deployment.findByIdAndUpdate(
    req.params.id,
    updatedData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'pilotId', select: 'fullName email mobileNumber' },
    { path: 'createdBy', select: 'fullName email role' },
    { path: 'lastUpdatedBy', select: 'fullName email role' }
  ]);

  // Log the update
  logger.info(`Deployment updated: ${updatedDeployment.deploymentId} by ${req.user.fullName}`, {
    deploymentId: updatedDeployment.deploymentId,
    registrationNumber: updatedDeployment.vehicleRegistration,
    updatedBy: req.user._id,
    changes: Object.keys(req.body),
    action: 'UPDATE_DEPLOYMENT'
  });

  res.status(200).json({
    success: true,
    data: { 
      deployment: updatedDeployment,
      source: 'data-hub-reference'
    },
    message: 'Deployment updated successfully',
    timestamp: new Date()
  });
});

/**
 * @desc    Complete a deployment
 * @route   PATCH /api/vehicle-deployment/deployments/:id/complete
 * @access  Private (Admin/Super Admin/Assigned Pilot)
 */
exports.completeDeployment = catchAsync(async (req, res) => {
  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return res.status(404).json({
      success: false,
      message: 'Deployment not found'
    });
  }

  // Authorization check
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const isPilot = req.user._id.equals(deployment.pilotId);
  
  if (!isAdmin && !isPilot) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators or the assigned pilot can complete this deployment.'
    });
  }

  // Check if already completed
  if (deployment.status === 'completed' || deployment.actualEndTime) {
    return res.status(400).json({
      success: false,
      message: 'Deployment is already completed'
    });
  }

  // Complete the deployment
  deployment.status = 'completed';
  deployment.actualEndTime = new Date();
  deployment.lastUpdatedBy = req.user._id;
  deployment.completionNotes = req.body.completionNotes;

  await deployment.save();

  // Update deployment history
  const history = await DeploymentHistory.findOne({ deploymentId: deployment._id });
  if (history) {
    history.statusChanges.push({
      previousStatus: 'in_progress',
      newStatus: 'completed',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: req.body.completionNotes
    });
    await history.save();
  }

  logger.info(`Deployment completed: ${deployment.deploymentId} by ${req.user.fullName}`, {
    deploymentId: deployment.deploymentId,
    vehicleRegistration: deployment.vehicleRegistration,
    completedBy: req.user._id,
    actualDuration: deployment.actualEndTime - deployment.startTime,
    action: 'COMPLETE_DEPLOYMENT'
  });

  await deployment.populate([
    { path: 'pilotId', select: 'fullName email mobileNumber' },
    { path: 'createdBy', select: 'fullName email role' }
  ]);

  res.status(200).json({
    success: true,
    data: { 
      deployment,
      source: 'data-hub-reference'
    },
    message: 'Deployment completed successfully',
    timestamp: new Date()
  });
});

/**
 * @desc    Get registration number suggestions for autocomplete
 * @route   GET /api/vehicle-deployment/vehicles/autocomplete
 * @access  Private (Vehicle Deployment Module)
 */
exports.getRegistrationSuggestions = catchAsync(async (req, res) => {
  const { q: query, limit = 10 } = req.query;
  
  if (!query || query.length < 1) {
    return res.json({
      success: true,
      data: [],
      message: 'No query provided'
    });
  }

  const dataHubService = getDataHubService();
  
  try {
    // Get all available vehicles from Data Hub
    const vehicles = await dataHubService.getAvailableVehicles();
    
    // Filter vehicles by registration number, brand, or model pattern
    const filteredVehicles = vehicles
      .filter(vehicle => {
        if (!vehicle.registrationNumber || vehicle.isActive === false) return false;
        
        const searchQuery = query.toLowerCase();
        const registration = vehicle.registrationNumber.toLowerCase();
        const brand = (vehicle.brand || '').toLowerCase();
        const model = (vehicle.model || '').toLowerCase();
        
        return registration.includes(searchQuery) || 
               brand.includes(searchQuery) || 
               model.includes(searchQuery);
      })
      .slice(0, parseInt(limit))
      .map(vehicle => ({
        id: vehicle._id?.toString() || vehicle.vehicleId || vehicle.registrationNumber,
        registrationNumber: vehicle.registrationNumber,
        brand: vehicle.brand || 'Unknown',
        model: vehicle.model || 'Unknown',
        year: vehicle.year || vehicle.Year || new Date().getFullYear(),
        status: vehicle.status || vehicle.Status || 'Active',
        currentHub: vehicle.currentHub || vehicle.Current_Hub || 'Unknown'
      }));

    res.json({
      success: true,
      data: filteredVehicles,
      total: filteredVehicles.length,
      query: query,
      message: `Found ${filteredVehicles.length} matching vehicles`
    });
    
  } catch (error) {
    logger.error('Error getting registration suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vehicle suggestions',
      error: error.message
    });
  }
});

module.exports = exports;
