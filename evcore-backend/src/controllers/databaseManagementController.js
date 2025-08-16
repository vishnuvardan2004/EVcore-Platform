const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Admin Logs Model for audit trail
const AdminLog = mongoose.model('AdminLog', new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminEmail: { type: String, required: true },
  action: { type: String, required: true },
  collectionName: { type: String },
  documentId: { type: String },
  details: { type: Object },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
  userAgent: { type: String }
}, { suppressReservedKeysWarning: true }));

// Constants
const MAX_DOCUMENTS_PER_REQUEST = 50;
const SYSTEM_COLLECTIONS = ['admin_logs', 'sessions']; // Collections to exclude from operations

/**
 * Log admin action for audit trail
 */
const logAdminAction = async (req, action, collection = null, documentId = null, details = {}) => {
  try {
    await AdminLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action,
      collection,
      documentId,
      details,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    logger.error('Failed to log admin action:', error);
  }
};

/**
 * @desc    Get all collections with document counts
 * @route   GET /api/database/collections
 * @access  Private (Super Admin only)
 */
const getCollections = catchAsync(async (req, res, next) => {
  // Get all collection names
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  // Get document counts for each collection
  const collectionsWithCounts = await Promise.all(
    collections.map(async (collection) => {
      try {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        return {
          name: collection.name,
          type: collection.type,
          count,
          isSystemCollection: SYSTEM_COLLECTIONS.includes(collection.name)
        };
      } catch (error) {
        return {
          name: collection.name,
          type: collection.type,
          count: 0,
          error: 'Unable to count documents',
          isSystemCollection: SYSTEM_COLLECTIONS.includes(collection.name)
        };
      }
    })
  );

  // Sort collections by name
  collectionsWithCounts.sort((a, b) => a.name.localeCompare(b.name));

  await logAdminAction(req, 'VIEW_COLLECTIONS', null, null, { 
    totalCollections: collectionsWithCounts.length 
  });

  res.status(200).json({
    success: true,
    data: {
      collections: collectionsWithCounts,
      totalCollections: collectionsWithCounts.length,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @desc    Get documents from a specific collection with pagination
 * @route   GET /api/database/collections/:collectionName/documents
 * @access  Private (Super Admin only)
 */
const getDocuments = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { collectionName } = req.params;
  const { page = 1, limit = 10, sortBy = '_id', sortOrder = 'desc' } = req.query;

  // Validate collection name
  if (!collectionName || collectionName.trim() === '') {
    return next(new AppError('Collection name is required', 400));
  }

  // Security check: prevent access to sensitive collections
  if (SYSTEM_COLLECTIONS.includes(collectionName)) {
    return next(new AppError('Access to system collections is restricted', 403));
  }

  // Validate and sanitize pagination parameters
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(MAX_DOCUMENTS_PER_REQUEST, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Validate sort parameters
  const validSortOrders = ['asc', 'desc', 1, -1];
  const sortOrderValue = validSortOrders.includes(sortOrder) ? 
    (sortOrder === 'asc' || sortOrder === 1 ? 1 : -1) : -1;

  try {
    const collection = mongoose.connection.db.collection(collectionName);
    
    // Check if collection exists
    const collectionExists = await mongoose.connection.db.listCollections({ name: collectionName }).hasNext();
    if (!collectionExists) {
      return next(new AppError(`Collection '${collectionName}' does not exist`, 404));
    }

    // Get total count
    const totalDocuments = await collection.countDocuments();

    // Get documents with pagination and sorting
    const sortObj = {};
    sortObj[sortBy] = sortOrderValue;
    
    const documents = await collection
      .find({})
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Calculate pagination info
    const totalPages = Math.ceil(totalDocuments / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    await logAdminAction(req, 'VIEW_DOCUMENTS', collectionName, null, {
      page: pageNum,
      limit: limitNum,
      totalDocuments,
      documentsReturned: documents.length
    });

    res.status(200).json({
      success: true,
      data: {
        documents,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalDocuments,
          documentsPerPage: limitNum,
          hasNextPage,
          hasPrevPage,
          documentsReturned: documents.length
        },
        collectionName: collectionName,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(`Error fetching documents from collection ${collectionName}:`, error);
    return next(new AppError(`Failed to fetch documents from collection '${collectionName}'`, 500));
  }
});

/**
 * @desc    Search documents in a collection by key-value match
 * @route   POST /api/database/collections/:collectionName/search
 * @access  Private (Super Admin only)
 */
const searchDocuments = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { collectionName } = req.params;
  const { searchKey, searchValue, searchType = 'exact', page = 1, limit = 10 } = req.body;

  // Security check
  if (SYSTEM_COLLECTIONS.includes(collectionName)) {
    return next(new AppError('Access to system collections is restricted', 403));
  }

  // Validate search parameters
  if (!searchKey || searchValue === undefined || searchValue === null) {
    return next(new AppError('searchKey and searchValue are required', 400));
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(MAX_DOCUMENTS_PER_REQUEST, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  try {
    const collection = mongoose.connection.db.collection(collectionName);
    
    // Build search query based on type
    let searchQuery = {};
    
    switch (searchType) {
      case 'regex':
        searchQuery[searchKey] = { $regex: searchValue, $options: 'i' };
        break;
      case 'contains':
        searchQuery[searchKey] = { $regex: `.*${searchValue}.*`, $options: 'i' };
        break;
      case 'startsWith':
        searchQuery[searchKey] = { $regex: `^${searchValue}`, $options: 'i' };
        break;
      case 'exact':
      default:
        searchQuery[searchKey] = searchValue;
        break;
    }

    // Get total count for the search
    const totalDocuments = await collection.countDocuments(searchQuery);

    // Get matching documents
    const documents = await collection
      .find(searchQuery)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const totalPages = Math.ceil(totalDocuments / limitNum);

    await logAdminAction(req, 'SEARCH_DOCUMENTS', collectionName, null, {
      searchKey,
      searchValue,
      searchType,
      resultsFound: documents.length,
      totalMatches: totalDocuments
    });

    res.status(200).json({
      success: true,
      data: {
        documents,
        searchCriteria: {
          searchKey,
          searchValue,
          searchType
        },
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalDocuments,
          documentsPerPage: limitNum,
          documentsReturned: documents.length
        },
        collectionName: collectionName,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(`Error searching documents in collection ${collectionName}:`, error);
    return next(new AppError('Failed to search documents', 500));
  }
});

/**
 * @desc    Insert a new document into a collection
 * @route   POST /api/database/collections/:collectionName/documents
 * @access  Private (Super Admin only)
 */
const insertDocument = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { collectionName } = req.params;
  const { document } = req.body;

  // Security check
  if (SYSTEM_COLLECTIONS.includes(collectionName)) {
    return next(new AppError('Cannot insert into system collections', 403));
  }

  // Validate document
  if (!document || typeof document !== 'object') {
    return next(new AppError('Valid document object is required', 400));
  }

  try {
    const collection = mongoose.connection.db.collection(collectionName);
    
    // Add metadata
    const documentToInsert = {
      ...document,
      createdAt: new Date(),
      createdBy: req.user._id
    };

    const result = await collection.insertOne(documentToInsert);

    await logAdminAction(req, 'INSERT_DOCUMENT', collectionName, result.insertedId.toString(), {
      documentSize: JSON.stringify(document).length
    });

    res.status(201).json({
      success: true,
      data: {
        insertedId: result.insertedId,
        document: documentToInsert,
        collectionName: collectionName,
        timestamp: new Date().toISOString()
      },
      message: 'Document inserted successfully'
    });

  } catch (error) {
    logger.error(`Error inserting document into collection ${collectionName}:`, error);
    return next(new AppError('Failed to insert document', 500));
  }
});

/**
 * @desc    Update a document by ID
 * @route   PUT /api/database/collections/:collectionName/documents/:documentId
 * @access  Private (Super Admin only)
 */
const updateDocument = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { collectionName, documentId } = req.params;
  const { updates } = req.body;

  // Security check
  if (SYSTEM_COLLECTIONS.includes(collectionName)) {
    return next(new AppError('Cannot update system collections', 403));
  }

  // Validate updates
  if (!updates || typeof updates !== 'object') {
    return next(new AppError('Valid updates object is required', 400));
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    return next(new AppError('Invalid document ID', 400));
  }

  try {
    const collection = mongoose.connection.db.collection(collectionName);
    
    // Check if document exists
    const existingDocument = await collection.findOne({ _id: new mongoose.Types.ObjectId(documentId) });
    if (!existingDocument) {
      return next(new AppError('Document not found', 404));
    }

    // Prepare updates with metadata
    const updateData = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: req.user._id
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(documentId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return next(new AppError('No changes were made to the document', 400));
    }

    // Get updated document
    const updatedDocument = await collection.findOne({ _id: new mongoose.Types.ObjectId(documentId) });

    await logAdminAction(req, 'UPDATE_DOCUMENT', collectionName, documentId, {
      updatedFields: Object.keys(updates),
      modifiedCount: result.modifiedCount
    });

    res.status(200).json({
      success: true,
      data: {
        document: updatedDocument,
        modifiedCount: result.modifiedCount,
        collectionName: collectionName,
        timestamp: new Date().toISOString()
      },
      message: 'Document updated successfully'
    });

  } catch (error) {
    logger.error(`Error updating document ${documentId} in collection ${collectionName}:`, error);
    return next(new AppError('Failed to update document', 500));
  }
});

/**
 * @desc    Delete a document by ID
 * @route   DELETE /api/database/collections/:collectionName/documents/:documentId
 * @access  Private (Super Admin only)
 */
const deleteDocument = catchAsync(async (req, res, next) => {
  const { collectionName, documentId } = req.params;

  // Security check
  if (SYSTEM_COLLECTIONS.includes(collectionName)) {
    return next(new AppError('Cannot delete from system collections', 403));
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    return next(new AppError('Invalid document ID', 400));
  }

  try {
    const collection = mongoose.connection.db.collection(collectionName);
    
    // Get document before deletion for logging
    const documentToDelete = await collection.findOne({ _id: new mongoose.Types.ObjectId(documentId) });
    if (!documentToDelete) {
      return next(new AppError('Document not found', 404));
    }

    const result = await collection.deleteOne({ _id: new mongoose.Types.ObjectId(documentId) });

    await logAdminAction(req, 'DELETE_DOCUMENT', collectionName, documentId, {
      deletedCount: result.deletedCount,
      documentPreview: JSON.stringify(documentToDelete).substring(0, 200) + '...'
    });

    res.status(200).json({
      success: true,
      data: {
        deletedId: documentId,
        deletedCount: result.deletedCount,
        collectionName: collectionName,
        timestamp: new Date().toISOString()
      },
      message: 'Document deleted successfully'
    });

  } catch (error) {
    logger.error(`Error deleting document ${documentId} from collection ${collectionName}:`, error);
    return next(new AppError('Failed to delete document', 500));
  }
});

/**
 * @desc    Backup database - Export all collections as JSON
 * @route   GET /api/database/backup
 * @access  Private (Super Admin only)
 */
const backupDatabase = catchAsync(async (req, res, next) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backup = {
      metadata: {
        backupDate: new Date().toISOString(),
        databaseName: mongoose.connection.name,
        createdBy: req.user.email,
        totalCollections: collections.length
      },
      collections: {}
    };

    // Export all collections except system ones
    for (const collectionInfo of collections) {
      if (!SYSTEM_COLLECTIONS.includes(collectionInfo.name)) {
        const collection = mongoose.connection.db.collection(collectionInfo.name);
        const documents = await collection.find({}).toArray();
        backup.collections[collectionInfo.name] = {
          documents,
          count: documents.length,
          exportedAt: new Date().toISOString()
        };
      }
    }

    await logAdminAction(req, 'BACKUP_DATABASE', null, null, {
      collectionsBackedUp: Object.keys(backup.collections).length,
      totalDocuments: Object.values(backup.collections).reduce((sum, col) => sum + col.count, 0)
    });

    // Set headers for file download
    const filename = `database_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).json(backup);

  } catch (error) {
    logger.error('Error creating database backup:', error);
    return next(new AppError('Failed to create database backup', 500));
  }
});

/**
 * @desc    Restore database from JSON backup
 * @route   POST /api/database/restore
 * @access  Private (Super Admin only)
 */
const restoreDatabase = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { backupData, overwriteExisting = false } = req.body;

  // Validate backup data structure
  if (!backupData || !backupData.collections || typeof backupData.collections !== 'object') {
    return next(new AppError('Invalid backup data format', 400));
  }

  const results = {
    restored: [],
    skipped: [],
    errors: [],
    totalProcessed: 0
  };

  try {
    for (const [collectionName, collectionData] of Object.entries(backupData.collections)) {
      // Security check
      if (SYSTEM_COLLECTIONS.includes(collectionName)) {
        results.skipped.push({
          collectionName: collectionName,
          reason: 'System collection - skipped for security'
        });
        continue;
      }

      try {
        const collection = mongoose.connection.db.collection(collectionName);
        
        // Check if collection exists and has documents
        const existingCount = await collection.countDocuments();
        
        if (existingCount > 0 && !overwriteExisting) {
          results.skipped.push({
            collectionName: collectionName,
            reason: 'Collection exists and overwrite not enabled',
            existingDocuments: existingCount
          });
          continue;
        }

        // Clear collection if overwriting
        if (existingCount > 0 && overwriteExisting) {
          await collection.deleteMany({});
        }

        // Insert documents
        if (collectionData.documents && collectionData.documents.length > 0) {
          const documentsToInsert = collectionData.documents.map(doc => ({
            ...doc,
            restoredAt: new Date(),
            restoredBy: req.user._id
          }));

          const insertResult = await collection.insertMany(documentsToInsert);
          
          results.restored.push({
            collectionName: collectionName,
            documentsRestored: insertResult.insertedCount,
            originalCount: collectionData.count || collectionData.documents.length
          });
          
          results.totalProcessed += insertResult.insertedCount;
        }

      } catch (collectionError) {
        results.errors.push({
          collectionName: collectionName,
          error: collectionError.message
        });
      }
    }

    await logAdminAction(req, 'RESTORE_DATABASE', null, null, {
      collectionsRestored: results.restored.length,
      collectionsSkipped: results.skipped.length,
      collectionsWithErrors: results.errors.length,
      totalDocumentsRestored: results.totalProcessed,
      overwriteExisting
    });

    res.status(200).json({
      success: true,
      data: results,
      message: 'Database restore completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error restoring database:', error);
    return next(new AppError('Failed to restore database', 500));
  }
});

/**
 * @desc    Get admin logs for audit trail
 * @route   GET /api/database/admin-logs
 * @access  Private (Super Admin only)
 */
const getAdminLogs = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, action, collection, adminId } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Build filter query
  const filter = {};
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (collection) filter.collection = collection;
  if (adminId && mongoose.Types.ObjectId.isValid(adminId)) filter.adminId = new mongoose.Types.ObjectId(adminId);

  try {
    const totalLogs = await AdminLog.countDocuments(filter);
    const logs = await AdminLog.find(filter)
      .populate('adminId', 'fullName email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalPages = Math.ceil(totalLogs / limitNum);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalLogs,
          logsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching admin logs:', error);
    return next(new AppError('Failed to fetch admin logs', 500));
  }
});

module.exports = {
  getCollections,
  getDocuments,
  searchDocuments,
  insertDocument,
  updateDocument,
  deleteDocument,
  backupDatabase,
  restoreDatabase,
  getAdminLogs
};
