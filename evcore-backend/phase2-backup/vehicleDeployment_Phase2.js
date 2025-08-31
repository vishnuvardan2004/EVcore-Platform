const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { requireSpecificModule } = require('../middleware/moduleAuth');
const { catchAsync } = require('../middleware/errorHandler');
const vehicleDeploymentController = require('../controllers/vehicleDeploymentController');
const {
  validateCreateVehicle,
  validateUpdateVehicle,
  validateCreateDeployment,
  validateCreateDeploymentByRegistration,
  validateUpdateDeployment,
  validateCancelDeployment,
  validateCreateMaintenance,
  validateTrackingUpdate,
  validatePagination,
  validateDateRange,
  validateOptimalVehicle
} = require('../middleware/vehicleDeploymentValidation');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Apply module-specific authorization
router.use(requireSpecificModule('vehicle_deployment'));

/**
 * ========================================
 * VEHICLE MANAGEMENT ROUTES
 * ========================================
 */

/**
 * @route   GET /api/vehicle-deployment/vehicles
 * @desc    Get all vehicles with filtering and pagination
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/vehicles', validatePagination, vehicleDeploymentController.getVehicles);

/**
 * @route   GET /api/vehicle-deployment/vehicles/available
 * @desc    Get available vehicles for deployment
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/vehicles/available', validatePagination, vehicleDeploymentController.getAvailableVehicles);

/**
 * @route   GET /api/vehicle-deployment/vehicles/:id
 * @desc    Get a single vehicle by ID
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/vehicles/:id', vehicleDeploymentController.getVehicle);

/**
 * @route   GET /api/vehicle-deployment/vehicles/registration/:registrationNumber
 * @desc    Get a single vehicle by registration number
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/vehicles/registration/:registrationNumber', vehicleDeploymentController.getVehicleByRegistration);

/**
 * @route   POST /api/vehicle-deployment/vehicles
 * @desc    Create a new vehicle
 * @access  Private (Admin/Super Admin only)
 */
router.post('/vehicles', validateCreateVehicle, vehicleDeploymentController.createVehicle);

/**
 * @route   PUT /api/vehicle-deployment/vehicles/:id
 * @desc    Update vehicle information
 * @access  Private (Admin/Super Admin only)
 */
router.put('/vehicles/:id', validateUpdateVehicle, vehicleDeploymentController.updateVehicle);

/**
 * @route   DELETE /api/vehicle-deployment/vehicles/:id
 * @desc    Delete (deactivate) a vehicle
 * @access  Private (Super Admin only)
 */
router.delete('/vehicles/:id', vehicleDeploymentController.deleteVehicle);

/**
 * ========================================
 * DATA HUB INTEGRATION ROUTES (Phase 2)
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
 * DEPLOYMENT MANAGEMENT ROUTES
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
 * @route   POST /api/vehicle-deployment/deployments
 * @desc    Create a new deployment
 * @access  Private (Admin/Super Admin/Pilot)
 */
router.post('/deployments', validateCreateDeployment, vehicleDeploymentController.createDeployment);

/**
 * @route   POST /api/vehicle-deployment/deployments/by-registration
 * @desc    Create a new deployment using vehicle registration number
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
 * @route   POST /api/vehicle-deployment/deployments/:id/cancel
 * @desc    Cancel a deployment
 * @access  Private (Admin/Super Admin/Assigned Pilot)
 */
router.post('/deployments/:id/cancel', validateCancelDeployment, vehicleDeploymentController.cancelDeployment);

/**
 * ========================================
 * MAINTENANCE MANAGEMENT ROUTES
 * ========================================
 */

/**
 * @route   GET /api/vehicle-deployment/maintenance
 * @desc    Get all maintenance logs with filtering
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/maintenance', validatePagination, validateDateRange, vehicleDeploymentController.getMaintenanceLogs);

/**
 * @route   POST /api/vehicle-deployment/maintenance
 * @desc    Create maintenance log
 * @access  Private (Admin/Super Admin)
 */
router.post('/maintenance', validateCreateMaintenance, vehicleDeploymentController.createMaintenanceLog);

/**
 * ========================================
 * DASHBOARD & ANALYTICS ROUTES
 * ========================================
 */

/**
 * @route   GET /api/vehicle-deployment/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/dashboard', vehicleDeploymentController.getDashboardStats);

/**
 * @route   GET /api/vehicle-deployment/pilots/available
 * @desc    Get eligible pilots for deployment
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/pilots/available', vehicleDeploymentController.getAvailablePilots);

/**
 * ========================================
 * ADVANCED ANALYTICS ROUTES
 * ========================================
 */

/**
 * @route   POST /api/vehicle-deployment/vehicles/optimal
 * @desc    Get optimal vehicle recommendations
 * @access  Private (Vehicle Deployment Module)
 */
router.post('/vehicles/optimal', validateOptimalVehicle, vehicleDeploymentController.getOptimalVehicles);

/**
 * @route   GET /api/vehicle-deployment/analytics/deployments
 * @desc    Get deployment analytics
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/analytics/deployments', vehicleDeploymentController.getDeploymentAnalytics);

/**
 * @route   GET /api/vehicle-deployment/analytics/fleet-utilization
 * @desc    Get fleet utilization analysis
 * @access  Private (Admin/Super Admin only)
 */
router.get('/analytics/fleet-utilization', vehicleDeploymentController.getFleetUtilization);

/**
 * @route   POST /api/vehicle-deployment/reports/deployments
 * @desc    Generate comprehensive deployment report
 * @access  Private (Admin/Super Admin only)
 */
router.post('/reports/deployments', vehicleDeploymentController.generateDeploymentReport);

/**
 * ========================================
 * MAINTENANCE OPTIMIZATION ROUTES
 * ========================================
 */

/**
 * @route   GET /api/vehicle-deployment/maintenance/due
 * @desc    Get vehicles due for maintenance
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/maintenance/due', vehicleDeploymentController.getMaintenanceDue);

/**
 * @route   POST /api/vehicle-deployment/maintenance/auto-schedule
 * @desc    Auto-schedule maintenance for a vehicle
 * @access  Private (Admin/Super Admin only)
 */
router.post('/maintenance/auto-schedule', vehicleDeploymentController.autoScheduleMaintenance);

/**
 * ========================================
 * REAL-TIME TRACKING ROUTES
 * ========================================
 */

/**
 * @route   PUT /api/vehicle-deployment/deployments/:id/tracking
 * @desc    Update deployment tracking data
 * @access  Private (Admin/Super Admin/Assigned Pilot)
 */
router.put('/deployments/:id/tracking', validateTrackingUpdate, vehicleDeploymentController.updateDeploymentTracking);

/**
 * @route   GET /api/vehicle-deployment/deployments/:id/history
 * @desc    Get deployment history with real-time data
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/deployments/:id/history', vehicleDeploymentController.getDeploymentHistory);

/**
 * ========================================
 * NOTIFICATION ROUTES
 * ========================================
 */

/**
 * @route   GET /api/vehicle-deployment/notifications
 * @desc    Get dashboard notifications
 * @access  Private (Vehicle Deployment Module)
 */
router.get('/notifications', vehicleDeploymentController.getNotifications);

module.exports = router;
