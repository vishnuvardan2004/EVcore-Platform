const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Database Audit Log Schema
 */
const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE_PLATFORM',
      'VIEW_PLATFORMS',
      'VIEW_DOCUMENTS',
      'CREATE_DOCUMENT',
      'UPDATE_DOCUMENT',
      'DELETE_DOCUMENT',
      'SEARCH_DOCUMENTS',
      'EXPORT_DATA',
      'IMPORT_DATA',
      'VIEW_STATS',
      'BULK_OPERATION'
    ]
  },
  platform: {
    type: String,
    required: false // null for platform-level operations
  },
  documentId: {
    type: String,
    required: false // null for bulk operations
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    requestId: String,
    sessionId: String,
    performanceTime: Number // milliseconds
  },
  result: {
    success: {
      type: Boolean,
      required: true
    },
    errorMessage: String,
    recordsAffected: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ platform: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ 'result.success': 1, createdAt: -1 });

const AuditLog = mongoose.model('DatabaseAuditLog', auditLogSchema);

/**
 * Audit Service for Database Management Module
 */
class AuditService {
  /**
   * Log a database management action
   */
  static async logAction(actionData) {
    try {
      const {
        userId,
        userEmail,
        userRole,
        action,
        platform = null,
        documentId = null,
        details = {},
        metadata = {},
        result = { success: true, recordsAffected: 0 },
        req = null
      } = actionData;

      // Extract request metadata if provided
      const requestMetadata = req ? {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestId: req.headers['x-request-id'] || req.id,
        sessionId: req.sessionID
      } : {};

      const auditEntry = new AuditLog({
        userId,
        userEmail,
        userRole,
        action,
        platform,
        documentId,
        details,
        metadata: {
          ...requestMetadata,
          ...metadata
        },
        result
      });

      await auditEntry.save();
      
      // Also log to application logger for monitoring
      logger.info('Database Action Logged', {
        userId,
        action,
        platform,
        success: result.success,
        timestamp: new Date().toISOString()
      });

      return auditEntry;
    } catch (error) {
      logger.error('Failed to log audit action:', error);
      // Don't throw error to avoid breaking the main operation
      return null;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Build filter query
      const query = {};
      
      if (filters.userId) query.userId = filters.userId;
      if (filters.action) query.action = filters.action;
      if (filters.platform) query.platform = filters.platform;
      if (filters.success !== undefined) query['result.success'] = filters.success;
      
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const [logs, totalCount] = await Promise.all([
        AuditLog.find(query)
          .populate('userId', 'fullName email')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalLogs: totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(filters = {}) {
    try {
      const matchStage = {};
      
      if (filters.dateFrom || filters.dateTo) {
        matchStage.createdAt = {};
        if (filters.dateFrom) matchStage.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) matchStage.createdAt.$lte = new Date(filters.dateTo);
      }

      const stats = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalActions: { $sum: 1 },
            successfulActions: {
              $sum: { $cond: [{ $eq: ['$result.success', true] }, 1, 0] }
            },
            failedActions: {
              $sum: { $cond: [{ $eq: ['$result.success', false] }, 1, 0] }
            },
            totalRecordsAffected: { $sum: '$result.recordsAffected' },
            uniqueUsers: { $addToSet: '$userId' },
            uniquePlatforms: { $addToSet: '$platform' }
          }
        },
        {
          $project: {
            _id: 0,
            totalActions: 1,
            successfulActions: 1,
            failedActions: 1,
            successRate: {
              $multiply: [
                { $divide: ['$successfulActions', '$totalActions'] },
                100
              ]
            },
            totalRecordsAffected: 1,
            uniqueUsersCount: { $size: '$uniqueUsers' },
            uniquePlatformsCount: { $size: '$uniquePlatforms' }
          }
        }
      ]);

      // Get action distribution
      const actionStats = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ['$result.success', true] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Get platform distribution
      const platformStats = await AuditLog.aggregate([
        { $match: { ...matchStage, platform: { $ne: null } } },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 },
            recordsAffected: { $sum: '$result.recordsAffected' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        overview: stats[0] || {
          totalActions: 0,
          successfulActions: 0,
          failedActions: 0,
          successRate: 0,
          totalRecordsAffected: 0,
          uniqueUsersCount: 0,
          uniquePlatformsCount: 0
        },
        actionDistribution: actionStats,
        platformDistribution: platformStats,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error generating audit stats:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivity(userId, days = 30) {
    try {
      const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const activity = await AuditLog.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: dateFrom }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              action: '$action'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            actions: {
              $push: {
                action: '$_id.action',
                count: '$count'
              }
            },
            totalActions: { $sum: '$count' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        userId,
        period: `${days} days`,
        activity,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting user activity:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  static async cleanupOldLogs(retentionDays = 365) {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      const result = await AuditLog.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      logger.info(`Cleaned up ${result.deletedCount} old audit logs`);
      return result;
    } catch (error) {
      logger.error('Error cleaning up audit logs:', error);
      throw error;
    }
  }

  /**
   * Export audit logs
   */
  static async exportLogs(filters = {}, format = 'json') {
    try {
      const query = {};
      
      if (filters.userId) query.userId = filters.userId;
      if (filters.action) query.action = filters.action;
      if (filters.platform) query.platform = filters.platform;
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const logs = await AuditLog.find(query)
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 })
        .lean();

      const exportData = {
        exportDate: new Date().toISOString(),
        filters,
        totalRecords: logs.length,
        logs
      };

      return exportData;
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}

module.exports = AuditService;
