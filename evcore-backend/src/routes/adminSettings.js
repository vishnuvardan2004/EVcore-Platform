const express = require('express');
const { body, param } = require('express-validator');
const { verifyToken, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const RolePermission = require('../models/RolePermission');
const logger = require('../utils/logger');

const router = express.Router();

// Validation rules
const updatePermissionsValidation = [
  param('role')
    .isIn(['super_admin', 'admin', 'employee', 'pilot'])
    .withMessage('Invalid role'),
  
  body('modules')
    .isArray()
    .withMessage('Modules must be an array'),
  
  body('modules.*.name')
    .isString()
    .isIn([
      'dashboard',
      'driver_induction', 
      'trip_details',
      'offline_bookings',
      'charging_tracker',
      'vehicle_deployment',
      'database_management',
      'smart_widgets',
      'global_reports',
      'admin_settings',
      'language_settings',
      'audit_logs'
    ])
    .withMessage('Invalid module name'),
  
  body('modules.*.enabled')
    .isBoolean()
    .withMessage('Module enabled must be a boolean'),
  
  body('modules.*.permissions')
    .isArray()
    .withMessage('Permissions must be an array'),
  
  body('modules.*.permissions.*')
    .isIn(['create', 'read', 'update', 'delete', 'export', 'import'])
    .withMessage('Invalid permission type')
];

// @desc    Get all role permissions
// @route   GET /api/admin-settings/permissions
// @access  Super Admin only
router.get('/permissions',
  verifyToken,
  authorize(['super_admin']),
  async (req, res, next) => {
    try {
      logger.info(`Admin Settings: Getting all permissions - requested by ${req.user.email}`);
      
      const rolePermissions = await RolePermission.find({})
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email')
        .sort({ role: 1 });

      // Transform data for frontend consumption
      const permissionsMap = {};
      
      rolePermissions.forEach(rolePermission => {
        const modulePermissions = {};
        
        rolePermission.modules.forEach(module => {
          modulePermissions[module.name] = {
            enabled: module.enabled,
            permissions: module.permissions || []
          };
        });
        
        permissionsMap[rolePermission.role] = {
          role: rolePermission.role,
          modules: modulePermissions,
          lastUpdated: rolePermission.updatedAt,
          lastUpdatedBy: rolePermission.updatedBy
        };
      });

      res.status(200).json({
        success: true,
        message: 'Role permissions retrieved successfully',
        data: {
          permissions: permissionsMap,
          totalRoles: rolePermissions.length
        }
      });

    } catch (error) {
      logger.error('Admin Settings: Error getting permissions:', error);
      next(error);
    }
  }
);

// @desc    Get permissions for a specific role
// @route   GET /api/admin-settings/permissions/:role
// @access  Super Admin only
router.get('/permissions/:role',
  verifyToken,
  authorize(['super_admin']),
  async (req, res, next) => {
    try {
      const { role } = req.params;
      
      logger.info(`Admin Settings: Getting permissions for role ${role} - requested by ${req.user.email}`);
      
      const rolePermission = await RolePermission.findOne({ role })
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email');

      if (!rolePermission) {
        return res.status(404).json({
          success: false,
          message: `Role permissions not found for role: ${role}`
        });
      }

      // Transform data for frontend
      const modulePermissions = {};
      rolePermission.modules.forEach(module => {
        modulePermissions[module.name] = {
          enabled: module.enabled,
          permissions: module.permissions || []
        };
      });

      res.status(200).json({
        success: true,
        message: `Permissions for role ${role} retrieved successfully`,
        data: {
          role: rolePermission.role,
          modules: modulePermissions,
          lastUpdated: rolePermission.updatedAt,
          lastUpdatedBy: rolePermission.updatedBy
        }
      });

    } catch (error) {
      logger.error(`Admin Settings: Error getting permissions for role ${req.params.role}:`, error);
      next(error);
    }
  }
);

// @desc    Update permissions for a specific role
// @route   PUT /api/admin-settings/permissions/:role
// @access  Super Admin only
router.put('/permissions/:role',
  verifyToken,
  authorize(['super_admin']),
  updatePermissionsValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { role } = req.params;
      const { modules } = req.body;
      
      logger.info(`Admin Settings: Updating permissions for role ${role} - by ${req.user.email}`);
      
      // Find existing role permission or create new one
      let rolePermission = await RolePermission.findOne({ role });
      
      if (!rolePermission) {
        rolePermission = new RolePermission({
          role,
          modules: [],
          createdBy: req.user.id,
          updatedBy: req.user.id
        });
      } else {
        rolePermission.updatedBy = req.user.id;
      }

      // Update modules
      rolePermission.modules = modules.map(module => ({
        name: module.name,
        enabled: module.enabled,
        permissions: module.permissions || []
      }));

      await rolePermission.save();

      // Log the change for audit purposes
      logger.info(`Admin Settings: Successfully updated permissions for role ${role}`, {
        role,
        modulesUpdated: modules.length,
        updatedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

      // Return updated data
      const modulePermissions = {};
      rolePermission.modules.forEach(module => {
        modulePermissions[module.name] = {
          enabled: module.enabled,
          permissions: module.permissions || []
        };
      });

      res.status(200).json({
        success: true,
        message: `Permissions for role ${role} updated successfully`,
        data: {
          role: rolePermission.role,
          modules: modulePermissions,
          lastUpdated: rolePermission.updatedAt,
          lastUpdatedBy: req.user.fullName || req.user.email
        }
      });

    } catch (error) {
      logger.error(`Admin Settings: Error updating permissions for role ${req.params.role}:`, error);
      next(error);
    }
  }
);

// @desc    Update a specific module's permissions for a role
// @route   PATCH /api/admin-settings/permissions/:role/modules/:moduleName
// @access  Super Admin only
router.patch('/permissions/:role/modules/:moduleName',
  verifyToken,
  authorize(['super_admin']),
  [
    param('role').isIn(['super_admin', 'admin', 'employee', 'pilot']),
    param('moduleName').isString(),
    body('enabled').optional().isBoolean(),
    body('permissions').optional().isArray()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { role, moduleName } = req.params;
      const { enabled, permissions } = req.body;
      
      logger.info(`Admin Settings: Updating module ${moduleName} for role ${role} - by ${req.user.email}`);
      
      const rolePermission = await RolePermission.findOne({ role });
      
      if (!rolePermission) {
        return res.status(404).json({
          success: false,
          message: `Role permissions not found for role: ${role}`
        });
      }

      // Find the module or create it
      let moduleIndex = rolePermission.modules.findIndex(m => m.name === moduleName);
      
      if (moduleIndex === -1) {
        // Module doesn't exist, create it
        rolePermission.modules.push({
          name: moduleName,
          enabled: enabled !== undefined ? enabled : true,
          permissions: permissions || ['read']
        });
      } else {
        // Update existing module
        if (enabled !== undefined) {
          rolePermission.modules[moduleIndex].enabled = enabled;
        }
        if (permissions !== undefined) {
          rolePermission.modules[moduleIndex].permissions = permissions;
        }
      }

      rolePermission.updatedBy = req.user.id;
      await rolePermission.save();

      logger.info(`Admin Settings: Successfully updated module ${moduleName} for role ${role}`);

      res.status(200).json({
        success: true,
        message: `Module ${moduleName} updated successfully for role ${role}`,
        data: {
          role,
          module: {
            name: moduleName,
            enabled: rolePermission.modules.find(m => m.name === moduleName).enabled,
            permissions: rolePermission.modules.find(m => m.name === moduleName).permissions
          }
        }
      });

    } catch (error) {
      logger.error(`Admin Settings: Error updating module ${req.params.moduleName} for role ${req.params.role}:`, error);
      next(error);
    }
  }
);

// @desc    Reset permissions for a role to default
// @route   POST /api/admin-settings/permissions/:role/reset
// @access  Super Admin only
router.post('/permissions/:role/reset',
  verifyToken,
  authorize(['super_admin']),
  async (req, res, next) => {
    try {
      const { role } = req.params;
      
      logger.info(`Admin Settings: Resetting permissions for role ${role} - by ${req.user.email}`);
      
      // Define default permissions based on role
      const getDefaultPermissions = (userRole) => {
        const allModules = [
          'dashboard', 'driver_induction', 'trip_details', 'offline_bookings',
          'charging_tracker', 'vehicle_deployment', 'database_management',
          'smart_widgets', 'global_reports', 'admin_settings', 'language_settings', 'audit_logs'
        ];

        switch (userRole) {
          case 'super_admin':
            return allModules.map(name => ({
              name,
              enabled: true,
              permissions: ['create', 'read', 'update', 'delete', 'export', 'import']
            }));
          case 'admin':
            return allModules.filter(name => name !== 'admin_settings').map(name => ({
              name,
              enabled: true,
              permissions: ['create', 'read', 'update', 'delete', 'export']
            }));
          case 'employee':
            return ['dashboard', 'trip_details', 'offline_bookings', 'language_settings'].map(name => ({
              name,
              enabled: true,
              permissions: ['read', 'update']
            }));
          case 'pilot':
            return ['dashboard', 'trip_details', 'charging_tracker'].map(name => ({
              name,
              enabled: true,
              permissions: ['read', 'update']
            }));
          default:
            return [];
        }
      };

      const defaultModules = getDefaultPermissions(role);
      
      const rolePermission = await RolePermission.findOneAndUpdate(
        { role },
        {
          role,
          modules: defaultModules,
          updatedBy: req.user.id
        },
        { upsert: true, new: true }
      );

      logger.info(`Admin Settings: Successfully reset permissions for role ${role}`);

      res.status(200).json({
        success: true,
        message: `Permissions for role ${role} reset to default`,
        data: {
          role: rolePermission.role,
          modulesReset: defaultModules.length
        }
      });

    } catch (error) {
      logger.error(`Admin Settings: Error resetting permissions for role ${req.params.role}:`, error);
      next(error);
    }
  }
);

module.exports = router;
