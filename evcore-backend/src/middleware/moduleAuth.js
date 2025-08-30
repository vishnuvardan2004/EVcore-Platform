const { AppError, catchAsync } = require('./errorHandler');
const RolePermission = require('../models/RolePermission');
const logger = require('../utils/logger');

/**
 * Module-based authorization middleware
 * Maps API endpoints to platform modules and enforces access control
 */

// Module mapping - Maps API endpoints to platform modules
const MODULE_ENDPOINT_MAPPING = {
  // Core 6 Platform Modules
  'vehicle_deployment': [
    '/api/vehicle-deployment'
  ],
  'smart_bookings': [
    '/api/smart-bookings',
    '/api/bookings',
    '/api/offline-bookings'
  ],
  'data_hub': [
    '/api/data-hub',
    '/api/database-mgmt',
    '/api/analytics/data'
  ],
  'driver_onboarding': [
    '/api/driver-onboarding',
    '/api/driver-induction',
    '/api/drivers',
    '/api/onboarding'
  ],
  'trip_analytics': [
    '/api/trip-analytics',
    '/api/trips',
    '/api/analytics/trips',
    '/api/trip-details'
  ],
  'energy_management': [
    '/api/energy-management',
    '/api/energy-management',
    '/api/charging-tracker',
    '/api/energy',
    '/api/battery-management'
  ],
  // Administrative Modules
  'audit_logs': [
    '/api/audit-logs',
    '/api/audit',
    '/api/logs'
  ],
  'admin_settings': [
    '/api/admin',
    '/api/settings/admin',
    '/api/system-config'
  ],
  // Legacy modules
  'database_management': [
    '/api/database-mgmt'
  ]
};

// HTTP Method to Permission mapping
const HTTP_METHOD_PERMISSION_MAP = {
  'GET': 'read',
  'POST': 'create',
  'PUT': 'update',
  'PATCH': 'update',
  'DELETE': 'delete'
};

/**
 * Get the module name for a given API endpoint
 * @param {string} endpoint - The API endpoint
 * @returns {string|null} - The module name or null if not found
 */
const getModuleForEndpoint = (endpoint) => {
  for (const [moduleName, endpoints] of Object.entries(MODULE_ENDPOINT_MAPPING)) {
    const matchingEndpoint = endpoints.find(ep => endpoint.startsWith(ep));
    if (matchingEndpoint) {
      return moduleName;
    }
  }
  return null;
};

/**
 * Check if user has access to a specific module
 * @param {Object} user - User object
 * @param {string} moduleName - Module name to check
 * @returns {Promise<boolean>} - Whether user has access
 */
const hasModuleAccess = async (user, moduleName) => {
  try {
    // Super admin has access to everything
    if (user.role === 'super_admin') {
      return true;
    }

    // Get role permissions from database
    const rolePermissions = await RolePermission.findOne({ role: user.role });
    
    if (!rolePermissions) {
      logger.warn(`No role permissions found for role: ${user.role}`);
      return false;
    }

    // Check if module is enabled for this role
    const modulePermission = rolePermissions.modules.find(m => m.name === moduleName);
    return modulePermission && modulePermission.enabled;
  } catch (error) {
    logger.error('Error checking module access:', error);
    return false;
  }
};

/**
 * Check if user has specific permission within a module
 * @param {Object} user - User object
 * @param {string} moduleName - Module name
 * @param {string} permission - Permission to check (create, read, update, delete, export)
 * @returns {Promise<boolean>} - Whether user has permission
 */
const hasModulePermission = async (user, moduleName, permission) => {
  try {
    // Super admin has all permissions
    if (user.role === 'super_admin') {
      return true;
    }

    // Get role permissions from database
    const rolePermissions = await RolePermission.findOne({ role: user.role });
    
    if (!rolePermissions) {
      return false;
    }

    // Check specific permission within the module
    const modulePermission = rolePermissions.modules.find(m => m.name === moduleName);
    return modulePermission && 
           modulePermission.enabled && 
           modulePermission.permissions.includes(permission);
  } catch (error) {
    logger.error('Error checking module permission:', error);
    return false;
  }
};

/**
 * Module authorization middleware
 * Automatically determines the required module based on the API endpoint
 */
const requireModuleAccess = () => {
  return catchAsync(async (req, res, next) => {
    // Get the module name from the endpoint
    const moduleName = getModuleForEndpoint(req.path);
    
    if (!moduleName) {
      logger.warn(`No module mapping found for endpoint: ${req.path}`);
      // Allow access if no module mapping exists (for auth routes, etc.)
      return next();
    }

    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401));
    }

    // Check if user has access to this module
    const hasAccess = await hasModuleAccess(user, moduleName);
    
    if (!hasAccess) {
      logger.warn(`Access denied: User ${user.email} (${user.role}) attempted to access ${moduleName} module`);
      return next(new AppError(
        `Access denied. You don't have permission to access the ${moduleName.replace('_', ' ')} module.`, 
        403
      ));
    }

    // Check specific permission based on HTTP method
    const requiredPermission = HTTP_METHOD_PERMISSION_MAP[req.method];
    if (requiredPermission) {
      const hasPermission = await hasModulePermission(user, moduleName, requiredPermission);
      
      if (!hasPermission) {
        logger.warn(`Permission denied: User ${user.email} (${user.role}) lacks ${requiredPermission} permission for ${moduleName} module`);
        return next(new AppError(
          `Access denied. You don't have ${requiredPermission} permission for the ${moduleName.replace('_', ' ')} module.`, 
          403
        ));
      }
    }

    // Add module info to request for downstream use
    req.authorizedModule = {
      name: moduleName,
      permission: requiredPermission
    };

    logger.info(`Access granted: User ${user.email} (${user.role}) accessing ${moduleName} module with ${requiredPermission} permission`);
    next();
  });
};

/**
 * Specific module access middleware
 * @param {string} moduleName - Name of the module to check
 * @param {string} permission - Optional specific permission to check
 */
const requireSpecificModule = (moduleName, permission = null) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401));
    }

    // Check module access
    const hasAccess = await hasModuleAccess(user, moduleName);
    if (!hasAccess) {
      return next(new AppError(
        `Access denied. You don't have permission to access the ${moduleName.replace('_', ' ')} module.`, 
        403
      ));
    }

    // Check specific permission if provided
    if (permission) {
      const hasPermission = await hasModulePermission(user, moduleName, permission);
      if (!hasPermission) {
        return next(new AppError(
          `Access denied. You don't have ${permission} permission for the ${moduleName.replace('_', ' ')} module.`, 
          403
        ));
      }
    }

    req.authorizedModule = {
      name: moduleName,
      permission: permission
    };

    next();
  });
};

/**
 * Role hierarchy middleware - checks if user has minimum required role level
 * @param {string[]} allowedRoles - Array of allowed roles in ascending order of hierarchy
 */
const requireRoleLevel = (allowedRoles) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401));
    }

    const roleHierarchy = {
      'pilot': 1,
      'employee': 2,
      'admin': 3,
      'super_admin': 4
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const minRequiredLevel = Math.min(...allowedRoles.map(role => roleHierarchy[role] || 0));

    if (userLevel < minRequiredLevel) {
      return next(new AppError(
        `Access denied. Required role level: ${allowedRoles.join(' or ')}, your role: ${user.role}`, 
        403
      ));
    }

    next();
  });
};

/**
 * Audit logs access middleware - special handling for audit logs
 */
const requireAuditAccess = () => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401));
    }

    // Only super_admin can access audit logs
    if (user.role !== 'super_admin') {
      logger.warn(`Audit access denied: User ${user.email} (${user.role}) attempted to access audit logs`);
      return next(new AppError('Access denied. Only Super Administrators can access audit logs.', 403));
    }

    next();
  });
};

module.exports = {
  requireModuleAccess,
  requireSpecificModule,
  requireRoleLevel,
  requireAuditAccess,
  hasModuleAccess,
  hasModulePermission,
  getModuleForEndpoint,
  MODULE_ENDPOINT_MAPPING
};
