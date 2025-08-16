const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken, authorize } = require('../middleware/auth');
const {
  getCollections,
  getDocuments,
  searchDocuments,
  insertDocument,
  updateDocument,
  deleteDocument,
  backupDatabase,
  restoreDatabase,
  getAdminLogs
} = require('../controllers/databaseManagementController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Apply super admin authorization to all routes
router.use(authorize('super_admin'));

/**
 * @route   GET /api/database/collections
 * @desc    Get all collections with document counts
 * @access  Private (Super Admin only)
 */
router.get('/collections', getCollections);

/**
 * @route   GET /api/database/collections/:collectionName/documents
 * @desc    Get documents from a specific collection with pagination
 * @access  Private (Super Admin only)
 */
router.get('/collections/:collectionName/documents', [
  param('collectionName')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Collection name must contain only alphanumeric characters, underscores, and hyphens'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be a positive integer up to 10000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('sortBy')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort field must be a valid string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc', '1', '-1'])
    .withMessage('Sort order must be asc, desc, 1, or -1')
], getDocuments);

/**
 * @route   POST /api/database/collections/:collectionName/search
 * @desc    Search documents in a collection
 * @access  Private (Super Admin only)
 */
router.post('/collections/:collectionName/search', [
  param('collectionName')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Collection name must contain only alphanumeric characters, underscores, and hyphens'),
  body('searchKey')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search key is required and must be a valid string'),
  body('searchValue')
    .notEmpty()
    .withMessage('Search value is required'),
  body('searchType')
    .optional()
    .isIn(['exact', 'regex', 'contains', 'startsWith'])
    .withMessage('Search type must be exact, regex, contains, or startsWith'),
  body('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be a positive integer'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], searchDocuments);

/**
 * @route   POST /api/database/collections/:collectionName/documents
 * @desc    Insert a new document into a collection
 * @access  Private (Super Admin only)
 */
router.post('/collections/:collectionName/documents', [
  param('collectionName')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Collection name must contain only alphanumeric characters, underscores, and hyphens'),
  body('document')
    .isObject()
    .withMessage('Document must be a valid object')
    .custom((value) => {
      // Check if document is not empty
      if (Object.keys(value).length === 0) {
        throw new Error('Document cannot be empty');
      }
      
      // Check document size (limit to reasonable size)
      const documentSize = JSON.stringify(value).length;
      if (documentSize > 1024 * 1024) { // 1MB limit
        throw new Error('Document size cannot exceed 1MB');
      }
      
      return true;
    })
], insertDocument);

/**
 * @route   PUT /api/database/collections/:collectionName/documents/:documentId
 * @desc    Update a document by ID
 * @access  Private (Super Admin only)
 */
router.put('/collections/:collectionName/documents/:documentId', [
  param('collectionName')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Collection name must contain only alphanumeric characters, underscores, and hyphens'),
  param('documentId')
    .isString()
    .isLength({ min: 24, max: 24 })
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Document ID must be a valid 24-character ObjectId'),
  body('updates')
    .isObject()
    .withMessage('Updates must be a valid object')
    .custom((value) => {
      // Check if updates object is not empty
      if (Object.keys(value).length === 0) {
        throw new Error('Updates object cannot be empty');
      }
      
      // Prevent updating certain system fields
      const restrictedFields = ['_id', 'createdAt', 'createdBy'];
      const hasRestrictedFields = restrictedFields.some(field => value.hasOwnProperty(field));
      if (hasRestrictedFields) {
        throw new Error('Cannot update restricted fields: _id, createdAt, createdBy');
      }
      
      // Check updates size
      const updatesSize = JSON.stringify(value).length;
      if (updatesSize > 1024 * 1024) { // 1MB limit
        throw new Error('Updates size cannot exceed 1MB');
      }
      
      return true;
    })
], updateDocument);

/**
 * @route   DELETE /api/database/collections/:collectionName/documents/:documentId
 * @desc    Delete a document by ID
 * @access  Private (Super Admin only)
 */
router.delete('/collections/:collectionName/documents/:documentId', [
  param('collectionName')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Collection name must contain only alphanumeric characters, underscores, and hyphens'),
  param('documentId')
    .isString()
    .isLength({ min: 24, max: 24 })
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Document ID must be a valid 24-character ObjectId')
], deleteDocument);

/**
 * @route   GET /api/database/backup
 * @desc    Backup entire database as JSON
 * @access  Private (Super Admin only)
 */
router.get('/backup', backupDatabase);

/**
 * @route   POST /api/database/restore
 * @desc    Restore database from JSON backup
 * @access  Private (Super Admin only)
 */
router.post('/restore', [
  body('backupData')
    .isObject()
    .withMessage('Backup data must be a valid object')
    .custom((value) => {
      // Validate backup data structure
      if (!value.collections || typeof value.collections !== 'object') {
        throw new Error('Backup data must contain a collections object');
      }
      
      // Check backup data size (limit to reasonable size)
      const backupSize = JSON.stringify(value).length;
      if (backupSize > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('Backup data size cannot exceed 100MB');
      }
      
      return true;
    }),
  body('overwriteExisting')
    .optional()
    .isBoolean()
    .withMessage('overwriteExisting must be a boolean value')
], restoreDatabase);

/**
 * @route   GET /api/database/admin-logs
 * @desc    Get admin logs for audit trail
 * @access  Private (Super Admin only)
 */
router.get('/admin-logs', [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('action')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Action filter must be a valid string'),
  query('collection')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Collection filter must be a valid string'),
  query('adminId')
    .optional()
    .isString()
    .isLength({ min: 24, max: 24 })
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Admin ID must be a valid ObjectId')
], getAdminLogs);

module.exports = router;
