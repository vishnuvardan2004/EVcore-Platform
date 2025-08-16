const databaseService = require('../services/databaseService');
const auditService = require('../services/auditService');
const { validationResult } = require('express-validator');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Database Management Controller
 * Handles all database management operations for sub-platforms
 */
class DatabaseController {
  /**
   * @desc    Get all available sub-platforms
   * @route   GET /api/database-mgmt/platforms
   * @access  Private (Authenticated users with DB access)
   */
  static getSubPlatforms = catchAsync(async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      const platforms = databaseService.getSubPlatforms();
      
      // Log audit action
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'VIEW_PLATFORMS',
        details: { platformsCount: platforms.length },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: true, recordsAffected: platforms.length },
        req
      });

      res.status(200).json({
        success: true,
        data: {
          platforms,
          totalPlatforms: platforms.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'VIEW_PLATFORMS',
        details: { error: error.message },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: false, errorMessage: error.message },
        req
      });
      throw error;
    }
  });

  /**
   * @desc    Create a new sub-platform (collection)
   * @route   POST /api/database-mgmt/platforms
   * @access  Private (Super Admin only)
   */
  static createSubPlatform = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const startTime = Date.now();
    
    try {
      const { schemaDefinition } = req.body;
      
      const result = databaseService.registerSchema(schemaDefinition);
      
      // Log audit action
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'CREATE_PLATFORM',
        platform: schemaDefinition.name,
        details: { 
          schemaFields: Object.keys(schemaDefinition.fields),
          fieldsCount: Object.keys(schemaDefinition.fields).length
        },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: true, recordsAffected: 1 },
        req
      });

      res.status(201).json({
        success: true,
        data: result,
        message: `Sub-platform '${schemaDefinition.name}' created successfully`
      });
    } catch (error) {
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'CREATE_PLATFORM',
        platform: req.body.schemaDefinition?.name,
        details: { error: error.message },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: false, errorMessage: error.message },
        req
      });
      throw error;
    }
  });

  /**
   * @desc    Get documents from a sub-platform
   * @route   GET /api/database-mgmt/platforms/:platform/documents
   * @access  Private (Authenticated users with DB access)
   */
  static getDocuments = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const startTime = Date.now();
    const { platform } = req.params;
    
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 10, 50),
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        filter: req.query.filter ? JSON.parse(req.query.filter) : {},
        populate: req.query.populate ? req.query.populate.split(',') : []
      };

      const result = await databaseService.getDocuments(platform, options);
      
      // Log audit action
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'VIEW_DOCUMENTS',
        platform,
        details: { 
          page: options.page,
          limit: options.limit,
          filter: options.filter
        },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: true, recordsAffected: result.documents.length },
        req
      });

      res.status(200).json({
        success: true,
        data: {
          ...result,
          platform,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'VIEW_DOCUMENTS',
        platform,
        details: { error: error.message },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: false, errorMessage: error.message },
        req
      });
      throw error;
    }
  });

  /**
   * @desc    Create a new document in a sub-platform
   * @route   POST /api/database-mgmt/platforms/:platform/documents
   * @access  Private (Authenticated users with DB access)
   */
  static createDocument = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const startTime = Date.now();
    const { platform } = req.params;
    
    try {
      const { document } = req.body;
      
      const createdDocument = await databaseService.createDocument(
        platform,
        document,
        req.user._id
      );
      
      // Log audit action
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'CREATE_DOCUMENT',
        platform,
        documentId: createdDocument._id.toString(),
        details: { 
          documentFields: Object.keys(document),
          documentSize: JSON.stringify(document).length
        },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: true, recordsAffected: 1 },
        req
      });

      res.status(201).json({
        success: true,
        data: {
          document: createdDocument,
          platform,
          timestamp: new Date().toISOString()
        },
        message: 'Document created successfully'
      });
    } catch (error) {
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'CREATE_DOCUMENT',
        platform,
        details: { error: error.message },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: false, errorMessage: error.message },
        req
      });
      throw error;
    }
  });

  /**
   * @desc    Update a document in a sub-platform
   * @route   PUT /api/database-mgmt/platforms/:platform/documents/:documentId
   * @access  Private (Authenticated users with DB access)
   */
  static updateDocument = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const startTime = Date.now();
    const { platform, documentId } = req.params;
    
    try {
      const { updates } = req.body;
      
      const updatedDocument = await databaseService.updateDocument(
        platform,
        documentId,
        updates,
        req.user._id
      );
      
      // Log audit action
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'UPDATE_DOCUMENT',
        platform,
        documentId,
        details: { 
          updatedFields: Object.keys(updates),
          updateSize: JSON.stringify(updates).length
        },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: true, recordsAffected: 1 },
        req
      });

      res.status(200).json({
        success: true,
        data: {
          document: updatedDocument,
          platform,
          timestamp: new Date().toISOString()
        },
        message: 'Document updated successfully'
      });
    } catch (error) {
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'UPDATE_DOCUMENT',
        platform,
        documentId,
        details: { error: error.message },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: false, errorMessage: error.message },
        req
      });
      throw error;
    }
  });

  /**
   * @desc    Delete a document from a sub-platform
   * @route   DELETE /api/database-mgmt/platforms/:platform/documents/:documentId
   * @access  Private (Authenticated users with DB access)
   */
  static deleteDocument = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const startTime = Date.now();
    const { platform, documentId } = req.params;
    
    try {
      const deletedDocument = await databaseService.deleteDocument(
        platform,
        documentId,
        req.user._id
      );
      
      // Log audit action
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'DELETE_DOCUMENT',
        platform,
        documentId,
        details: { 
          deletedDocumentPreview: JSON.stringify(deletedDocument).substring(0, 200)
        },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: true, recordsAffected: 1 },
        req
      });

      res.status(200).json({
        success: true,
        data: {
          deletedDocument,
          platform,
          timestamp: new Date().toISOString()
        },
        message: 'Document deleted successfully'
      });
    } catch (error) {
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'DELETE_DOCUMENT',
        platform,
        documentId,
        details: { error: error.message },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: false, errorMessage: error.message },
        req
      });
      throw error;
    }
  });

  /**
   * @desc    Search documents in a sub-platform
   * @route   POST /api/database-mgmt/platforms/:platform/search
   * @access  Private (Authenticated users with DB access)
   */
  static searchDocuments = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const startTime = Date.now();
    const { platform } = req.params;
    
    try {
      const { searchCriteria, options = {} } = req.body;
      
      const result = await databaseService.searchDocuments(
        platform,
        searchCriteria,
        options
      );
      
      // Log audit action
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'SEARCH_DOCUMENTS',
        platform,
        details: { 
          searchCriteria,
          resultsFound: result.documents.length
        },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: true, recordsAffected: result.documents.length },
        req
      });

      res.status(200).json({
        success: true,
        data: {
          ...result,
          platform,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'SEARCH_DOCUMENTS',
        platform,
        details: { error: error.message },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: false, errorMessage: error.message },
        req
      });
      throw error;
    }
  });

  /**
   * @desc    Export data from a sub-platform
   * @route   GET /api/database-mgmt/platforms/:platform/export
   * @access  Private (Authenticated users with DB access)
   */
  static exportPlatformData = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const startTime = Date.now();
    const { platform } = req.params;
    const { format = 'json', filter = {} } = req.query;
    
    try {
      let exportData;
      let contentType;
      let filename;

      if (format === 'csv') {
        const tempDir = path.join(process.cwd(), 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        
        const filePath = path.join(tempDir, `${platform}_export_${Date.now()}.csv`);
        
        const result = await databaseService.exportToCSV(
          platform,
          filter ? JSON.parse(filter) : {},
          filePath
        );
        
        exportData = await fs.readFile(filePath);
        contentType = 'text/csv';
        filename = `${platform}_export_${new Date().toISOString().split('T')[0]}.csv`;
        
        // Clean up temp file
        await fs.unlink(filePath);
      } else {
        exportData = await databaseService.exportToJSON(
          platform,
          filter ? JSON.parse(filter) : {}
        );
        
        contentType = 'application/json';
        filename = `${platform}_export_${new Date().toISOString().split('T')[0]}.json`;
      }
      
      // Log audit action
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'EXPORT_DATA',
        platform,
        details: { 
          format,
          filter,
          recordsExported: format === 'json' ? exportData.totalRecords : exportData.recordsExported
        },
        metadata: { performanceTime: Date.now() - startTime },
        result: { 
          success: true, 
          recordsAffected: format === 'json' ? exportData.totalRecords : exportData.recordsExported 
        },
        req
      });

      // Set response headers for download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (format === 'csv') {
        res.send(exportData);
      } else {
        res.json(exportData);
      }
    } catch (error) {
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'EXPORT_DATA',
        platform,
        details: { error: error.message, format, filter },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: false, errorMessage: error.message },
        req
      });
      throw error;
    }
  });

  /**
   * @desc    Import data to a sub-platform
   * @route   POST /api/database-mgmt/platforms/:platform/import
   * @access  Private (Authenticated users with DB access)
   */
  static importPlatformData = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const startTime = Date.now();
    const { platform } = req.params;
    
    try {
      const { data, options = {} } = req.body;
      
      const result = await databaseService.importFromJSON(
        platform,
        data,
        req.user._id,
        options
      );
      
      // Log audit action
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'IMPORT_DATA',
        platform,
        details: { 
          totalRecords: result.total,
          successfulImports: result.successful,
          failedImports: result.failed,
          options
        },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: true, recordsAffected: result.successful },
        req
      });

      res.status(200).json({
        success: true,
        data: {
          ...result,
          platform,
          timestamp: new Date().toISOString()
        },
        message: `Import completed: ${result.successful} successful, ${result.failed} failed`
      });
    } catch (error) {
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'IMPORT_DATA',
        platform,
        details: { error: error.message },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: false, errorMessage: error.message },
        req
      });
      throw error;
    }
  });

  /**
   * @desc    Get platform statistics
   * @route   GET /api/database-mgmt/platforms/:platform/stats
   * @access  Private (Authenticated users with DB access)
   */
  static getPlatformStats = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const startTime = Date.now();
    const { platform } = req.params;
    
    try {
      const stats = await databaseService.getPlatformStats(platform);
      
      // Log audit action
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'VIEW_STATS',
        platform,
        details: { statsGenerated: true },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: true, recordsAffected: 0 },
        req
      });

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      await auditService.logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'VIEW_STATS',
        platform,
        details: { error: error.message },
        metadata: { performanceTime: Date.now() - startTime },
        result: { success: false, errorMessage: error.message },
        req
      });
      throw error;
    }
  });

  /**
   * @desc    Get audit logs
   * @route   GET /api/database-mgmt/audit-logs
   * @access  Private (Admin users only)
   */
  static getAuditLogs = catchAsync(async (req, res, next) => {
    const filters = {
      userId: req.query.userId,
      action: req.query.action,
      platform: req.query.platform,
      success: req.query.success !== undefined ? req.query.success === 'true' : undefined,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 20, 50),
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await auditService.getAuditLogs(filters, options);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * @desc    Get audit statistics
   * @route   GET /api/database-mgmt/audit-stats
   * @access  Private (Admin users only)
   */
  static getAuditStats = catchAsync(async (req, res, next) => {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const stats = await auditService.getAuditStats(filters);

    res.status(200).json({
      success: true,
      data: stats
    });
  });
}

module.exports = DatabaseController;
