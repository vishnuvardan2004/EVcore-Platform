const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken, authorize } = require('../middleware/auth');
const UserAccountController = require('../controllers/userAccountController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Validation middleware
const mongoIdValidation = param('userId').isMongoId().withMessage('Invalid user ID format');
const entityIdValidation = param('entityId').isMongoId().withMessage('Invalid entity ID format');
const entityTypeValidation = param('entityType').isIn(['employee', 'pilot']).withMessage('Entity type must be employee or pilot');
const evzipIdValidation = param('evzipId').isString().isLength({ min: 10, max: 20 }).withMessage('Invalid EVZIP ID format');

const statusUpdateValidation = [
  body('status')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive')
];

const bulkOperationValidation = [
  body('operation')
    .isIn(['activate', 'deactivate', 'reset-password'])
    .withMessage('Invalid operation'),
  body('userIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('UserIds must be an array with 1-50 items'),
  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be a valid MongoDB ID')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['super_admin', 'admin', 'employee', 'pilot'])
    .withMessage('Invalid role filter')
];

/**
 * @route   GET /api/user-accounts/credentials/:entityType/:entityId
 * @desc    Get user credentials for a specific Employee or Pilot
 * @access  Private (Admin/Super Admin)
 */
router.get('/credentials/:entityType/:entityId', [
  authorize(['super_admin', 'admin']),
  entityTypeValidation,
  entityIdValidation
], UserAccountController.getUserCredentials);

/**
 * @route   GET /api/user-accounts/all
 * @desc    Get all user credentials with pagination and filtering
 * @access  Private (Admin/Super Admin)
 */
router.get('/all', [
  authorize(['super_admin', 'admin']),
  ...paginationValidation
], UserAccountController.getAllUserCredentials);

/**
 * @route   POST /api/user-accounts/create/:entityType/:entityId
 * @desc    Manually create user account for existing Employee/Pilot
 * @access  Private (Admin/Super Admin)
 */
router.post('/create/:entityType/:entityId', [
  authorize(['super_admin', 'admin']),
  entityTypeValidation,
  entityIdValidation
], UserAccountController.createUserAccount);

/**
 * @route   POST /api/user-accounts/reset-password/:userId
 * @desc    Reset user password
 * @access  Private (Admin/Super Admin)
 */
router.post('/reset-password/:userId', [
  authorize(['super_admin', 'admin']),
  mongoIdValidation
], UserAccountController.resetUserPassword);

/**
 * @route   PATCH /api/user-accounts/:userId/status
 * @desc    Update user account status (activate/deactivate)
 * @access  Private (Admin/Super Admin)
 */
router.patch('/:userId/status', [
  authorize(['super_admin', 'admin']),
  mongoIdValidation,
  ...statusUpdateValidation
], UserAccountController.updateUserStatus);

/**
 * @route   GET /api/user-accounts/evzip/:evzipId
 * @desc    Get user account details by EVZIP ID
 * @access  Private (Admin/Super Admin)
 */
router.get('/evzip/:evzipId', [
  authorize(['super_admin', 'admin']),
  evzipIdValidation
], UserAccountController.getUserByEVZIPId);

/**
 * @route   GET /api/user-accounts/:userId/activity
 * @desc    Get login activity and account details for a user
 * @access  Private (Admin/Super Admin)
 */
router.get('/:userId/activity', [
  authorize(['super_admin', 'admin']),
  mongoIdValidation
], UserAccountController.getUserActivity);

/**
 * @route   POST /api/user-accounts/bulk-operation
 * @desc    Perform bulk operations on multiple users
 * @access  Private (Super Admin only)
 */
router.post('/bulk-operation', [
  authorize(['super_admin']),
  ...bulkOperationValidation
], UserAccountController.bulkUserOperation);

module.exports = router;
