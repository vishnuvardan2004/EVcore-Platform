const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const DatabaseController = require('../controllers/databaseController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Role-based access control middleware (will be enhanced later with dynamic roles)
const requireDatabaseAccess = (req, res, next) => {
  const allowedRoles = ['super_admin', 'admin', 'db_manager'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Database management permissions required.',
      requiredRoles: allowedRoles,
      userRole: req.user.role
    });
  }
  
  next();
};

const requireAdminAccess = (req, res, next) => {
  const allowedRoles = ['super_admin', 'admin'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrative permissions required.',
      requiredRoles: allowedRoles,
      userRole: req.user.role
    });
  }
  
  next();
};

// Validation schemas
const platformNameValidation = param('platform')
  .isString()
  .isLength({ min: 1, max: 50 })
  .matches(/^[a-zA-Z][a-zA-Z0-9_]*$/)
  .withMessage('Platform name must start with a letter and contain only letters, numbers, and underscores');

const objectIdValidation = param('documentId')
  .isString()
  .isLength({ min: 24, max: 24 })
  .matches(/^[0-9a-fA-F]{24}$/)
  .withMessage('Document ID must be a valid MongoDB ObjectId');

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be a positive integer up to 10000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Schema definition validation for creating platforms
const schemaDefinitionValidation = body('schemaDefinition')
  .isObject()
  .withMessage('Schema definition must be an object')
  .custom((value) => {
    if (!value.name || typeof value.name !== 'string') {
      throw new Error('Schema must have a valid name');
    }
    
    if (!value.fields || typeof value.fields !== 'object') {
      throw new Error('Schema must have a fields object');
    }
    
    if (Object.keys(value.fields).length === 0) {
      throw new Error('Schema must have at least one field');
    }
    
    // Validate field definitions
    for (const [fieldName, fieldDef] of Object.entries(value.fields)) {
      if (!fieldName.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
        throw new Error(`Field name '${fieldName}' is invalid. Must start with letter and contain only letters, numbers, underscores`);
      }
      
      if (typeof fieldDef === 'object' && fieldDef.type) {
        const validTypes = ['String', 'Number', 'Date', 'Boolean', 'Array', 'Object', 'ObjectId'];
        if (!validTypes.includes(fieldDef.type)) {
          throw new Error(`Invalid field type '${fieldDef.type}' for field '${fieldName}'`);
        }
      }
    }
    
    return true;
  });

const documentValidation = body('document')
  .isObject()
  .withMessage('Document must be an object')
  .custom((value) => {
    if (Object.keys(value).length === 0) {
      throw new Error('Document cannot be empty');
    }
    
    const documentSize = JSON.stringify(value).length;
    if (documentSize > 1024 * 1024) { // 1MB limit
      throw new Error('Document size cannot exceed 1MB');
    }
    
    // Prevent setting system fields
    const systemFields = ['_id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
    const hasSystemFields = systemFields.some(field => value.hasOwnProperty(field));
    if (hasSystemFields) {
      throw new Error('Cannot set system fields: _id, createdAt, updatedAt, createdBy, updatedBy');
    }
    
    return true;
  });

const updateValidation = body('updates')
  .isObject()
  .withMessage('Updates must be an object')
  .custom((value) => {
    if (Object.keys(value).length === 0) {
      throw new Error('Updates object cannot be empty');
    }
    
    const updateSize = JSON.stringify(value).length;
    if (updateSize > 1024 * 1024) { // 1MB limit
      throw new Error('Update size cannot exceed 1MB');
    }
    
    // Prevent updating system fields
    const systemFields = ['_id', 'createdAt', 'createdBy'];
    const hasSystemFields = systemFields.some(field => value.hasOwnProperty(field));
    if (hasSystemFields) {
      throw new Error('Cannot update system fields: _id, createdAt, createdBy');
    }
    
    return true;
  });

const searchValidation = [
  body('searchCriteria')
    .isObject()
    .withMessage('Search criteria must be an object')
    .custom((value) => {
      if (Object.keys(value).length === 0) {
        throw new Error('Search criteria cannot be empty');
      }
      return true;
    }),
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object')
];

const importValidation = [
  body('data')
    .isArray()
    .withMessage('Data must be an array')
    .custom((value) => {
      if (value.length === 0) {
        throw new Error('Data array cannot be empty');
      }
      
      if (value.length > 1000) {
        throw new Error('Cannot import more than 1000 documents at once');
      }
      
      const dataSize = JSON.stringify(value).length;
      if (dataSize > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Import data size cannot exceed 10MB');
      }
      
      return true;
    }),
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object')
];

/**
 * @route   GET /api/database-mgmt/platforms
 * @desc    Get all available sub-platforms
 * @access  Private (DB Access Required)
 */
router.get('/platforms', requireDatabaseAccess, DatabaseController.getSubPlatforms);

/**
 * @route   POST /api/database-mgmt/platforms
 * @desc    Create a new sub-platform (collection)
 * @access  Private (Admin Required)
 */
router.post('/platforms', [
  requireAdminAccess,
  schemaDefinitionValidation
], DatabaseController.createSubPlatform);

/**
 * @route   GET /api/database-mgmt/platforms/:platform/documents
 * @desc    Get documents from a sub-platform
 * @access  Private (DB Access Required)
 */
router.get('/platforms/:platform/documents', [
  requireDatabaseAccess,
  platformNameValidation,
  ...paginationValidation,
  query('sortBy')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort field must be a valid string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('filter')
    .optional()
    .isString()
    .custom((value) => {
      try {
        JSON.parse(value);
        return true;
      } catch (error) {
        throw new Error('Filter must be valid JSON');
      }
    }),
  query('populate')
    .optional()
    .isString()
    .withMessage('Populate must be a comma-separated string')
], DatabaseController.getDocuments);

/**
 * @route   POST /api/database-mgmt/platforms/:platform/documents
 * @desc    Create a new document in a sub-platform
 * @access  Private (DB Access Required)
 */
router.post('/platforms/:platform/documents', [
  requireDatabaseAccess,
  platformNameValidation,
  documentValidation
], DatabaseController.createDocument);

/**
 * @route   PUT /api/database-mgmt/platforms/:platform/documents/:documentId
 * @desc    Update a document in a sub-platform
 * @access  Private (DB Access Required)
 */
router.put('/platforms/:platform/documents/:documentId', [
  requireDatabaseAccess,
  platformNameValidation,
  objectIdValidation,
  updateValidation
], DatabaseController.updateDocument);

/**
 * @route   DELETE /api/database-mgmt/platforms/:platform/documents/:documentId
 * @desc    Delete a document from a sub-platform
 * @access  Private (DB Access Required)
 */
router.delete('/platforms/:platform/documents/:documentId', [
  requireDatabaseAccess,
  platformNameValidation,
  objectIdValidation
], DatabaseController.deleteDocument);

/**
 * @route   POST /api/database-mgmt/platforms/:platform/search
 * @desc    Search documents in a sub-platform
 * @access  Private (DB Access Required)
 */
router.post('/platforms/:platform/search', [
  requireDatabaseAccess,
  platformNameValidation,
  ...searchValidation
], DatabaseController.searchDocuments);

/**
 * @route   GET /api/database-mgmt/platforms/:platform/export
 * @desc    Export data from a sub-platform
 * @access  Private (DB Access Required)
 */
router.get('/platforms/:platform/export', [
  requireDatabaseAccess,
  platformNameValidation,
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  query('filter')
    .optional()
    .isString()
    .custom((value) => {
      try {
        JSON.parse(value);
        return true;
      } catch (error) {
        throw new Error('Filter must be valid JSON');
      }
    })
], DatabaseController.exportPlatformData);

/**
 * @route   POST /api/database-mgmt/platforms/:platform/import
 * @desc    Import data to a sub-platform
 * @access  Private (DB Access Required)
 */
router.post('/platforms/:platform/import', [
  requireDatabaseAccess,
  platformNameValidation,
  ...importValidation
], DatabaseController.importPlatformData);

/**
 * @route   GET /api/database-mgmt/platforms/:platform/stats
 * @desc    Get platform statistics
 * @access  Private (DB Access Required)
 */
router.get('/platforms/:platform/stats', [
  requireDatabaseAccess,
  platformNameValidation
], DatabaseController.getPlatformStats);

/**
 * @route   GET /api/database-mgmt/audit-logs
 * @desc    Get audit logs
 * @access  Private (Admin Required)
 */
router.get('/audit-logs', [
  requireAdminAccess,
  ...paginationValidation,
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  query('action')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Action must be a valid string'),
  query('platform')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Platform must be a valid string'),
  query('success')
    .optional()
    .isBoolean()
    .withMessage('Success must be a boolean'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO date')
], DatabaseController.getAuditLogs);

/**
 * @route   GET /api/database-mgmt/audit-stats
 * @desc    Get audit statistics
 * @access  Private (Admin Required)
 */
router.get('/audit-stats', [
  requireAdminAccess,
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO date')
], DatabaseController.getAuditStats);

module.exports = router;
