/**
 * Vehicle Deployment API Error Handler
 * Specialized error handling for vehicle deployment operations
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Custom error class for Vehicle Deployment operations
 */
class VehicleDeploymentError extends Error {
  constructor(message, statusCode = 500, errorCode = 'VEHICLE_DEPLOYMENT_ERROR') {
    super(message);
    this.name = 'VehicleDeploymentError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Vehicle not found error
 */
class VehicleNotFoundError extends VehicleDeploymentError {
  constructor(vehicleId) {
    super(`Vehicle with ID ${vehicleId} not found`, 404, 'VEHICLE_NOT_FOUND');
    this.vehicleId = vehicleId;
  }
}

/**
 * Vehicle unavailable error
 */
class VehicleUnavailableError extends VehicleDeploymentError {
  constructor(vehicleId, reason) {
    super(`Vehicle ${vehicleId} is unavailable: ${reason}`, 409, 'VEHICLE_UNAVAILABLE');
    this.vehicleId = vehicleId;
    this.reason = reason;
  }
}

/**
 * Deployment conflict error
 */
class DeploymentConflictError extends VehicleDeploymentError {
  constructor(message, conflictDetails) {
    super(message, 409, 'DEPLOYMENT_CONFLICT');
    this.conflictDetails = conflictDetails;
  }
}

/**
 * Maintenance required error
 */
class MaintenanceRequiredError extends VehicleDeploymentError {
  constructor(vehicleId, maintenanceDetails) {
    super(`Vehicle ${vehicleId} requires maintenance before deployment`, 422, 'MAINTENANCE_REQUIRED');
    this.vehicleId = vehicleId;
    this.maintenanceDetails = maintenanceDetails;
  }
}

/**
 * Insufficient battery error
 */
class InsufficientBatteryError extends VehicleDeploymentError {
  constructor(vehicleId, currentLevel, requiredLevel) {
    super(`Vehicle ${vehicleId} has insufficient battery: ${currentLevel}% (required: ${requiredLevel}%)`, 422, 'INSUFFICIENT_BATTERY');
    this.vehicleId = vehicleId;
    this.currentLevel = currentLevel;
    this.requiredLevel = requiredLevel;
  }
}

/**
 * Distance too far error
 */
class DistanceTooFarError extends VehicleDeploymentError {
  constructor(vehicleId, distance, maxDistance) {
    super(`Vehicle ${vehicleId} is too far: ${distance}km (max allowed: ${maxDistance}km)`, 422, 'DISTANCE_TOO_FAR');
    this.vehicleId = vehicleId;
    this.distance = distance;
    this.maxDistance = maxDistance;
  }
}

/**
 * Pilot unavailable error
 */
class PilotUnavailableError extends VehicleDeploymentError {
  constructor(pilotId, reason) {
    super(`Pilot ${pilotId} is unavailable: ${reason}`, 409, 'PILOT_UNAVAILABLE');
    this.pilotId = pilotId;
    this.reason = reason;
  }
}

/**
 * Authorization error for vehicle deployment operations
 */
class DeploymentAuthorizationError extends VehicleDeploymentError {
  constructor(action, userRole) {
    super(`Insufficient permissions to ${action}. Required role permissions not met.`, 403, 'DEPLOYMENT_AUTHORIZATION_ERROR');
    this.action = action;
    this.userRole = userRole;
  }
}

/**
 * Database connection specific error handler
 */
const handleDatabaseError = (error) => {
  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    return new VehicleDeploymentError(
      `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`,
      409,
      'DUPLICATE_KEY_ERROR'
    );
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return new VehicleDeploymentError(
      `Validation failed: ${messages.join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  // MongoDB cast error
  if (error.name === 'CastError') {
    return new VehicleDeploymentError(
      `Invalid ${error.path}: ${error.value}`,
      400,
      'CAST_ERROR'
    );
  }

  return error;
};

/**
 * Main error handler middleware for vehicle deployment routes
 */
const vehicleDeploymentErrorHandler = (err, req, res, next) => {
  // Handle operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.vehicleId && { vehicleId: err.vehicleId }),
        ...(err.pilotId && { pilotId: err.pilotId }),
        ...(err.conflictDetails && { conflictDetails: err.conflictDetails }),
        ...(err.maintenanceDetails && { maintenanceDetails: err.maintenanceDetails }),
        ...(err.currentLevel !== undefined && { currentLevel: err.currentLevel }),
        ...(err.requiredLevel !== undefined && { requiredLevel: err.requiredLevel }),
        ...(err.distance !== undefined && { distance: err.distance }),
        ...(err.maxDistance !== undefined && { maxDistance: err.maxDistance }),
        ...(err.reason && { reason: err.reason }),
        ...(err.action && { action: err.action }),
        ...(err.userRole && { userRole: err.userRole })
      }
    });
  }

  // Handle database errors
  if (err.name === 'MongoError' || err.name === 'ValidationError' || err.name === 'CastError' || err.code) {
    const dbError = handleDatabaseError(err);
    if (dbError.isOperational) {
      return res.status(dbError.statusCode).json({
        success: false,
        error: {
          code: dbError.errorCode,
          message: dbError.message
        }
      });
    }
  }

  // Log unexpected errors
  logger.error('Unexpected error in vehicle deployment API:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Generic error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred while processing your request'
    }
  });
};

/**
 * Async error wrapper for vehicle deployment routes
 */
const catchDeploymentAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware to log API requests for debugging
 */
const logDeploymentRequest = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Vehicle Deployment API Request:', {
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    userRole: req.user?.role,
    body: req.method !== 'GET' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    timestamp: new Date().toISOString()
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Vehicle Deployment API Response:', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

/**
 * Rate limiting for resource-intensive operations
 */
const rateLimitIntensive = (req, res, next) => {
  // This is a placeholder - in production, implement proper rate limiting
  // using redis or memory store based on user ID and endpoint
  
  const intensiveOperations = [
    '/analytics/deployments',
    '/analytics/fleet-utilization',
    '/reports/deployments'
  ];
  
  const isIntensive = intensiveOperations.some(op => 
    req.route.path.includes(op.split('/').pop())
  );
  
  if (isIntensive) {
    // Add rate limiting logic here
    logger.info('Intensive operation requested:', {
      path: req.route.path,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  // Error classes
  VehicleDeploymentError,
  VehicleNotFoundError,
  VehicleUnavailableError,
  DeploymentConflictError,
  MaintenanceRequiredError,
  InsufficientBatteryError,
  DistanceTooFarError,
  PilotUnavailableError,
  DeploymentAuthorizationError,
  
  // Middleware
  vehicleDeploymentErrorHandler,
  catchDeploymentAsync,
  logDeploymentRequest,
  rateLimitIntensive,
  
  // Utilities
  handleDatabaseError
};
