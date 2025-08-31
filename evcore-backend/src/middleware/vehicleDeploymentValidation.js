/**
 * Input validation middleware for Vehicle Deployment API endpoints
 */

const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * ========================================
 * VEHICLE VALIDATION RULES
 * ========================================
 */

const validateCreateVehicle = [
  body('vehicleId')
    .optional()
    .matches(/^(EVZ_VEH_\d{3}|TEST_VEH_\d{3})$/)
    .withMessage('Vehicle ID must follow format: EVZ_VEH_XXX or TEST_VEH_XXX'),
    
  body('registrationNumber')
    .notEmpty()
    .withMessage('Registration number is required')
    .isLength({ min: 4, max: 15 })
    .withMessage('Registration number must be 4-15 characters'),
    
  body('make')
    .notEmpty()
    .withMessage('Make is required')
    .isIn(['Tata', 'Mahindra', 'Hyundai', 'MG', 'BMW', 'Mercedes', 'Audi', 'Jaguar'])
    .withMessage('Invalid vehicle make'),
    
  body('model')
    .notEmpty()
    .withMessage('Model is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Model must be 2-50 characters'),
    
  body('year')
    .isInt({ min: 2020, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be between 2020 and current year + 1'),
    
  body('color')
    .notEmpty()
    .withMessage('Color is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Color must be 3-20 characters'),
    
  body('batteryCapacity')
    .isFloat({ min: 20, max: 200 })
    .withMessage('Battery capacity must be between 20-200 kWh'),
    
  body('range')
    .isInt({ min: 100, max: 1000 })
    .withMessage('Range must be between 100-1000 km'),
    
  body('chargingType')
    .isIn(['AC', 'DC', 'Both'])
    .withMessage('Charging type must be AC, DC, or Both'),
    
  body('seatingCapacity')
    .isInt({ min: 2, max: 8 })
    .withMessage('Seating capacity must be between 2-8'),
    
  body('currentHub')
    .notEmpty()
    .withMessage('Current hub is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Current hub must be 2-50 characters'),
    
  handleValidationErrors
];

const validateUpdateVehicle = [
  param('id')
    .isMongoId()
    .withMessage('Invalid vehicle ID'),
    
  body('registrationNumber')
    .optional()
    .isLength({ min: 4, max: 15 })
    .withMessage('Registration number must be 4-15 characters'),
    
  body('status')
    .optional()
    .isIn(['available', 'deployed', 'maintenance', 'out_of_service'])
    .withMessage('Invalid status'),
    
  body('batteryCapacity')
    .optional()
    .isFloat({ min: 20, max: 200 })
    .withMessage('Battery capacity must be between 20-200 kWh'),
    
  body('range')
    .optional()
    .isInt({ min: 100, max: 1000 })
    .withMessage('Range must be between 100-1000 km'),
    
  body('currentHub')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Current hub must be 2-50 characters'),
    
  body('batteryStatus.currentLevel')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Battery level must be between 0-100%'),
    
  handleValidationErrors
];

/**
 * ========================================
 * DEPLOYMENT VALIDATION RULES
 * ========================================
 */

const validateCreateDeployment = [
  body('deploymentId')
    .optional()
    .matches(/^(DEP_\d{3}_\d{6}|TEST_DEP_\d{3}_\d{6})$/)
    .withMessage('Deployment ID must follow format: DEP_XXX_YYMMDD or TEST_DEP_XXX_YYMMDD'),
    
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle ID is required')
    .isMongoId()
    .withMessage('Invalid vehicle ID format'),
    
  body('pilotId')
    .notEmpty()
    .withMessage('Pilot ID is required')
    .isMongoId()
    .withMessage('Invalid pilot ID format'),
    
  body('startTime')
    .isISO8601()
    .withMessage('Invalid start time format')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime < now && Math.abs(startTime - now) > 60000) { // Allow 1 minute tolerance
        throw new Error('Start time cannot be in the past');
      }
      return true;
    }),
    
  body('estimatedEndTime')
    .isISO8601()
    .withMessage('Invalid estimated end time format')
    .custom((value, { req }) => {
      const endTime = new Date(value);
      const startTime = new Date(req.body.startTime);
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
      const maxDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (endTime - startTime > maxDuration) {
        throw new Error('Deployment duration cannot exceed 24 hours');
      }
      return true;
    }),
    
  body('startLocation')
    .notEmpty()
    .withMessage('Start location is required'),
    
  body('startLocation.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
    
  body('startLocation.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
    
  body('startLocation.address')
    .notEmpty()
    .withMessage('Start location address is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be 10-200 characters'),
    
  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Purpose must be 5-200 characters'),
    
  body('endLocation.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid end location latitude'),
    
  body('endLocation.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid end location longitude'),
    
  handleValidationErrors
];

const validateUpdateDeployment = [
  param('id')
    .isMongoId()
    .withMessage('Invalid deployment ID'),
    
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
    
  body('estimatedEndTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid estimated end time format'),
    
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid end time format'),
    
  body('actualDistance')
    .optional()
    .isFloat({ min: 0, max: 2000 })
    .withMessage('Actual distance must be between 0-2000 km'),
    
  body('endLocation.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid end location latitude'),
    
  body('endLocation.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid end location longitude'),
    
  handleValidationErrors
];

const validateCancelDeployment = [
  param('id')
    .isMongoId()
    .withMessage('Invalid deployment ID'),
    
  body('reason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be 10-500 characters'),
    
  handleValidationErrors
];

/**
 * ========================================
 * MAINTENANCE VALIDATION RULES
 * ========================================
 */

const validateCreateMaintenance = [
  body('maintenanceId')
    .optional()
    .matches(/^(MAINT_\d{6}_\d{3}|TEST_MAINT_\d{6}_\d{3})$/)
    .withMessage('Maintenance ID must follow format: MAINT_YYMMDD_XXX or TEST_MAINT_YYMMDD_XXX'),
    
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle ID is required')
    .isMongoId()
    .withMessage('Invalid vehicle ID format'),
    
  body('maintenanceType')
    .isIn(['routine_service', 'battery_check', 'tire_replacement', 'brake_service', 'emergency_repair', 'software_update'])
    .withMessage('Invalid maintenance type'),
    
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be 10-500 characters'),
    
  body('scheduledDate')
    .isISO8601()
    .withMessage('Invalid scheduled date format')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate < now) {
        throw new Error('Scheduled date cannot be in the past');
      }
      return true;
    }),
    
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1, max: 72 })
    .withMessage('Estimated duration must be between 1-72 hours'),
    
  body('serviceProvider.name')
    .notEmpty()
    .withMessage('Service provider name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Service provider name must be 2-100 characters'),
    
  body('serviceProvider.contactInfo')
    .notEmpty()
    .withMessage('Service provider contact is required')
    .matches(/^(\+\d{1,3}[- ]?)?\d{10}$|^[\w\.-]+@[\w\.-]+\.\w+$/)
    .withMessage('Invalid contact format (phone or email required)'),
    
  handleValidationErrors
];

/**
 * ========================================
 * TRACKING VALIDATION RULES
 * ========================================
 */

const validateTrackingUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid deployment ID'),
    
  body('currentLocation.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
    
  body('currentLocation.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
    
  body('batteryLevel')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Battery level must be between 0-100%'),
    
  body('speed')
    .optional()
    .isFloat({ min: 0, max: 200 })
    .withMessage('Speed must be between 0-200 km/h'),
    
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
    
  body('odometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Odometer must be non-negative'),
    
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Invalid timestamp format'),
    
  handleValidationErrors
];

/**
 * ========================================
 * QUERY VALIDATION RULES
 * ========================================
 */

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1-1000'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100'),
    
  handleValidationErrors
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
        const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year
        if (endDate - startDate > maxRange) {
          throw new Error('Date range cannot exceed 1 year');
        }
      }
      return true;
    }),
    
  handleValidationErrors
];

const validateOptimalVehicle = [
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
    
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
    
  body('minBatteryLevel')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Min battery level must be between 0-100'),
    
  body('maxDistanceKm')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Max distance must be between 1-500 km'),
    
  body('preferredMake')
    .optional()
    .isIn(['Tata', 'Mahindra', 'Hyundai', 'MG', 'BMW', 'Mercedes', 'Audi', 'Jaguar'])
    .withMessage('Invalid preferred make'),
    
  body('requiresSpecialEquipment')
    .optional()
    .isBoolean()
    .withMessage('Requires special equipment must be boolean'),
    
  handleValidationErrors
];

module.exports = {
  // Vehicle validations
  validateCreateVehicle,
  validateUpdateVehicle,
  
  // Deployment validations
  validateCreateDeployment,
  validateUpdateDeployment,
  validateCancelDeployment,
  
  // Maintenance validations
  validateCreateMaintenance,
  
  // Tracking validations
  validateTrackingUpdate,
  
  // Query validations
  validatePagination,
  validateDateRange,
  validateOptimalVehicle,
  
  // Utility
  handleValidationErrors
};
