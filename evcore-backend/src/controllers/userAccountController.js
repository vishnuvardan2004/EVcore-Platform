const AccountCreationService = require('../services/accountCreationService');
const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * User Account Management Controller
 * Handles user credential management and account operations
 */
class UserAccountController {

  /**
   * @desc    Get user credentials for a specific Employee or Pilot
   * @route   GET /api/user-accounts/credentials/:entityType/:entityId
   * @access  Private (Admin/Super Admin)
   */
  static getUserCredentials = catchAsync(async (req, res, next) => {
    const { entityType, entityId } = req.params;
    
    if (!['employee', 'pilot'].includes(entityType)) {
      return next(new AppError('Invalid entity type. Must be employee or pilot', 400));
    }
    
    try {
      const result = await AccountCreationService.getUserCredentials(entityId, entityType);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message
        });
      }
      
      res.status(200).json({
        success: true,
        data: result.credentials,
        message: `User credentials retrieved for ${entityType}`
      });
      
    } catch (error) {
      logger.error('Error fetching user credentials:', error);
      return next(new AppError(error.message, 500));
    }
  });

  /**
   * @desc    Get all user credentials (paginated)
   * @route   GET /api/user-accounts/all
   * @access  Private (Admin/Super Admin)
   */
  static getAllUserCredentials = catchAsync(async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const role = req.query.role || null;
      
      const result = await AccountCreationService.getAllUserCredentials(page, limit, role);
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'User credentials retrieved successfully'
      });
      
    } catch (error) {
      logger.error('Error fetching all user credentials:', error);
      return next(new AppError(error.message, 500));
    }
  });

  /**
   * @desc    Manually create user account for existing Employee/Pilot
   * @route   POST /api/user-accounts/create/:entityType/:entityId
   * @access  Private (Admin/Super Admin)
   */
  static createUserAccount = catchAsync(async (req, res, next) => {
    const { entityType, entityId } = req.params;
    
    if (!['employee', 'pilot'].includes(entityType)) {
      return next(new AppError('Invalid entity type. Must be employee or pilot', 400));
    }
    
    try {
      // Get the entity data first
      const DatabaseService = require('../services/databaseService');
      const databaseService = DatabaseService.getInstance();
      
      let entityData;
      if (entityType === 'employee') {
        const Model = databaseService.getModel('employee');
        entityData = await Model.findById(entityId);
      } else {
        const Model = databaseService.getModel('pilot');
        entityData = await Model.findById(entityId);
      }
      
      if (!entityData) {
        return next(new AppError(`${entityType} not found`, 404));
      }
      
      let result;
      if (entityType === 'employee') {
        result = await AccountCreationService.createEmployeeAccount(entityData, req.user._id);
      } else {
        result = await AccountCreationService.createPilotAccount(entityData, req.user._id);
      }
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
      res.status(201).json({
        success: true,
        data: {
          userAccount: result.user,
          credentials: result.credentials
        },
        message: `User account created successfully for ${entityType}`
      });
      
    } catch (error) {
      logger.error(`Error creating user account for ${entityType}:`, error);
      return next(new AppError(error.message, 500));
    }
  });

  /**
   * @desc    Reset user password
   * @route   POST /api/user-accounts/reset-password/:userId
   * @access  Private (Admin/Super Admin)
   */
  static resetUserPassword = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    
    try {
      const result = await AccountCreationService.resetUserPassword(userId, req.user._id);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          newPassword: result.newPassword
        },
        message: 'Password reset successfully'
      });
      
    } catch (error) {
      logger.error('Error resetting user password:', error);
      return next(new AppError(error.message, 500));
    }
  });

  /**
   * @desc    Update user account status
   * @route   PATCH /api/user-accounts/:userId/status
   * @access  Private (Admin/Super Admin)
   */
  static updateUserStatus = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }
    
    const { userId } = req.params;
    const { status } = req.body;
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }
      
      user.active = status === 'active';
      user.updatedBy = req.user._id;
      await user.save();
      
      res.status(200).json({
        success: true,
        data: {
          userId: user._id,
          evzipId: user.evzipId,
          status: user.active ? 'active' : 'inactive'
        },
        message: `User status updated to ${status}`
      });
      
    } catch (error) {
      logger.error('Error updating user status:', error);
      return next(new AppError(error.message, 500));
    }
  });

  /**
   * @desc    Get user account details by EVZIP ID
   * @route   GET /api/user-accounts/evzip/:evzipId
   * @access  Private (Admin/Super Admin)
   */
  static getUserByEVZIPId = catchAsync(async (req, res, next) => {
    const { evzipId } = req.params;
    
    try {
      const user = await User.findOne({ evzipId })
        .select('-password')
        .populate('employeeRef', 'fullName employeeId department position')
        .populate('pilotRef', 'fullName pilotId licenseNumber currentStatus');
      
      if (!user) {
        return next(new AppError('User not found with this EVZIP ID', 404));
      }
      
      res.status(200).json({
        success: true,
        data: {
          user
        },
        message: 'User details retrieved successfully'
      });
      
    } catch (error) {
      logger.error('Error fetching user by EVZIP ID:', error);
      return next(new AppError(error.message, 500));
    }
  });

  /**
   * @desc    Get login activity for a user
   * @route   GET /api/user-accounts/:userId/activity
   * @access  Private (Admin/Super Admin)
   */
  static getUserActivity = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    
    try {
      const user = await User.findById(userId)
        .select('evzipId fullName email lastLogin loginAttempts lockUntil active isTemporaryPassword mustChangePassword createdAt');
      
      if (!user) {
        return next(new AppError('User not found', 404));
      }
      
      const activityData = {
        userInfo: {
          evzipId: user.evzipId,
          fullName: user.fullName,
          email: user.email
        },
        loginInfo: {
          lastLogin: user.lastLogin,
          loginAttempts: user.loginAttempts,
          isLocked: user.isLocked,
          lockUntil: user.lockUntil
        },
        accountStatus: {
          active: user.active,
          isTemporaryPassword: user.isTemporaryPassword,
          mustChangePassword: user.mustChangePassword,
          accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)) // days
        }
      };
      
      res.status(200).json({
        success: true,
        data: activityData,
        message: 'User activity retrieved successfully'
      });
      
    } catch (error) {
      logger.error('Error fetching user activity:', error);
      return next(new AppError(error.message, 500));
    }
  });

  /**
   * @desc    Bulk user operations (activate, deactivate, reset passwords)
   * @route   POST /api/user-accounts/bulk-operation
   * @access  Private (Super Admin only)
   */
  static bulkUserOperation = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }
    
    const { operation, userIds } = req.body;
    
    if (!['activate', 'deactivate', 'reset-password'].includes(operation)) {
      return next(new AppError('Invalid operation', 400));
    }
    
    try {
      const results = {
        successful: 0,
        failed: 0,
        results: []
      };
      
      for (const userId of userIds) {
        try {
          let result;
          
          switch (operation) {
            case 'activate':
            case 'deactivate':
              const user = await User.findById(userId);
              if (user) {
                user.active = operation === 'activate';
                user.updatedBy = req.user._id;
                await user.save();
                results.successful++;
                results.results.push({
                  userId,
                  status: 'success',
                  message: `User ${operation}d successfully`
                });
              } else {
                results.failed++;
                results.results.push({
                  userId,
                  status: 'failed',
                  message: 'User not found'
                });
              }
              break;
              
            case 'reset-password':
              result = await AccountCreationService.resetUserPassword(userId, req.user._id);
              if (result.success) {
                results.successful++;
                results.results.push({
                  userId,
                  status: 'success',
                  message: 'Password reset successfully',
                  newPassword: result.newPassword
                });
              } else {
                results.failed++;
                results.results.push({
                  userId,
                  status: 'failed',
                  message: result.message
                });
              }
              break;
          }
        } catch (error) {
          results.failed++;
          results.results.push({
            userId,
            status: 'failed',
            message: error.message
          });
        }
      }
      
      res.status(200).json({
        success: true,
        data: results,
        message: `Bulk ${operation} operation completed`
      });
      
    } catch (error) {
      logger.error('Error in bulk user operation:', error);
      return next(new AppError(error.message, 500));
    }
  });
}

module.exports = UserAccountController;
