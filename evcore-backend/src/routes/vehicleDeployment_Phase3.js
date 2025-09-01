const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { requireSpecificModule } = require('../middleware/moduleAuth');
const { catchAsync } = require('../middleware/errorHandler');
// Phase 3: Use the new Data Hub reference controller
const vehicleDeploymentController = require('../controllers/vehicleDeploymentController_Phase3');
const {
  validateCreateDeploymentByRegistration,
  validateUpdateDeployment,
  validateCancelDeployment,
  validateCreateMaintenance,
  validateTrackingUpdate,
  validatePagination,
  validateDateRange
} = require('../middleware/vehicleDeploymentValidation');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Apply module-specific authorization
router.use(requireSpecificModule('vehicle_deployment'));

/**
 * ========================================
 * PHASE 3: DATA HUB VEHICLE OPERATIONS
 * All vehicle data now comes from Database Management (Data Hub)
 * No local vehicle CRUD operations
 * ========================================
 */

/**
 * @route   GET /api/vehicle-deployment/vehicles
 * @desc    Get all vehicles from Data Hub with filtering and pagination
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/vehicles', validatePagination, vehicleDeploymentController.getVehicles);

/**
 * @route   GET /api/vehicle-deployment/vehicles/available
 * @desc    Get available vehicles for deployment from Data Hub
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/vehicles/available', validatePagination, vehicleDeploymentController.getAvailableVehicles);

/**
 * @route   GET /api/vehicle-deployment/vehicles/registration/:registrationNumber
 * @desc    Get a single vehicle by registration number from Data Hub
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/vehicles/registration/:registrationNumber', vehicleDeploymentController.getVehicleByRegistration);

/**
 * @route   GET /api/vehicle-deployment/vehicles/autocomplete
 * @desc    Get registration number suggestions for autocomplete
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/vehicles/autocomplete', vehicleDeploymentController.getRegistrationSuggestions);

// Phase 3: Removed vehicle CRUD operations (POST, PUT, DELETE /vehicles)
// All vehicle management now happens in Database Management module

/**
 * ========================================
 * DATA HUB INTEGRATION ROUTES (Phase 3)
 * ========================================
 */

/**
 * @route   GET /api/vehicle-deployment/data-hub/vehicles
 * @desc    Get all available vehicles from Data Hub for deployment
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/data-hub/vehicles', validatePagination, vehicleDeploymentController.getDataHubVehicles);

/**
 * @route   POST /api/vehicle-deployment/data-hub/validate-vehicle
 * @desc    Validate vehicle registration for deployment
 * @access  Private (Vehicle Deployment Module)
 */
router.post('/data-hub/validate-vehicle', vehicleDeploymentController.validateVehicleForDeployment);

/**
 * @route   GET /api/vehicle-deployment/data-hub/pilots
 * @desc    Get available pilots from Data Hub
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/data-hub/pilots', vehicleDeploymentController.getDataHubPilots);

/**
 * @route   GET /api/vehicle-deployment/data-hub/health
 * @desc    Get Data Hub service health status
 * @access  Private (Admin only)
 */
router.get('/data-hub/health', vehicleDeploymentController.getDataHubHealth);

/**
 * ========================================
 * DEPLOYMENT MANAGEMENT ROUTES (Phase 3)
 * Pure Data Hub Reference Architecture
 * ========================================
 */

/**
 * @route   GET /api/vehicle-deployment/deployments
 * @desc    Get all deployments with filtering and pagination
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/deployments', validatePagination, validateDateRange, vehicleDeploymentController.getDeployments);

/**
 * @route   GET /api/vehicle-deployment/deployments/:id
 * @desc    Get a single deployment by ID
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/deployments/:id', vehicleDeploymentController.getDeployment);

/**
 * @route   POST /api/vehicle-deployment/deployments/by-registration
 * @desc    Create a new deployment using vehicle registration number (Phase 3: Pure Data Hub Reference)
 * @access  Private (Admin/Super Admin/Pilot)
 */
router.post('/deployments/by-registration', validateCreateDeploymentByRegistration, vehicleDeploymentController.createDeploymentByRegistration);

/**
 * @route   PUT /api/vehicle-deployment/deployments/:id
 * @desc    Update a deployment
 * @access  Private (Admin/Super Admin/Assigned Pilot)
 */
router.put('/deployments/:id', validateUpdateDeployment, vehicleDeploymentController.updateDeployment);

/**
 * @route   PATCH /api/vehicle-deployment/deployments/:id/complete
 * @desc    Complete a deployment
 * @access  Private (Admin/Super Admin/Assigned Pilot)
 */
router.patch('/deployments/:id/complete', vehicleDeploymentController.completeDeployment);

// Phase 3: Legacy deployment creation (POST /deployments) removed
// Only registration-based deployment creation supported

/**
 * ========================================
 * MAINTENANCE AND TRACKING ROUTES
 * (Maintenance logs still supported but reference Data Hub vehicles)
 * ========================================
 */

// TODO: Add maintenance endpoints that work with Data Hub references
// These would be implemented in Phase 3.1 if needed

/**
 * ========================================
 * LEGACY ROUTE DEPRECATION NOTICES
 * ========================================
 */

// Middleware to handle deprecated vehicle CRUD routes
const deprecationWarning = (req, res) => {
  res.status(410).json({
    success: false,
    message: 'This endpoint has been deprecated in Phase 3',
    reason: 'Vehicle CRUD operations have been moved to Database Management module',
    migration: {
      alternative: 'Use Database Management module for vehicle creation, updates, and deletion',
      dataAccess: 'Vehicle data is available through Data Hub integration endpoints',
      phase: 'phase-3'
    },
    timestamp: new Date()
  });
};

// Deprecated vehicle CRUD routes
router.post('/vehicles', deprecationWarning);
router.put('/vehicles/:id', deprecationWarning);
router.delete('/vehicles/:id', deprecationWarning);

module.exports = router;
