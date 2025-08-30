const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Account Creation Service
 * Handles automatic user account creation for Employees and Pilots
 */
class AccountCreationService {
  
  /**
   * Create user account when new employee is added
   */
  static async createEmployeeAccount(employeeData, createdBy) {
    try {
      console.log('🚀 AccountCreationService.createEmployeeAccount called:', {
        employeeName: employeeData.fullName,
        employeeEmail: employeeData.email,
        employeeRole: employeeData.role,
        createdBy: createdBy,
        timestamp: new Date().toISOString()
      });

      logger.info(`Creating user account for employee: ${employeeData.fullName}`);
      
      // Check if user already exists with this email
      const existingUser = await User.findOne({ 
        $or: [
          { email: employeeData.email },
          { employeeRef: employeeData._id }
        ]
      });
      
      if (existingUser) {
        logger.warn(`User account already exists for employee: ${employeeData.email}`);
        return {
          success: false,
          message: 'User account already exists for this employee',
          existingUser
        };
      }
      
      // Create the user account
      const result = await User.createAccountForEmployee(employeeData, createdBy);
      
      logger.info(`User account created successfully for employee: ${result.credentials.evzipId}`);
      
      return {
        success: true,
        message: 'Employee user account created successfully',
        ...result
      };
      
    } catch (error) {
      logger.error('Error creating employee user account:', error);
      throw new Error(`Failed to create employee account: ${error.message}`);
    }
  }
  
  /**
   * Create user account when new pilot is added
   */
  static async createPilotAccount(pilotData, createdBy) {
    try {
      logger.info(`Creating user account for pilot: ${pilotData.fullName}`);
      
      // Check if user already exists with this email
      const existingUser = await User.findOne({
        $or: [
          { email: pilotData.email },
          { pilotRef: pilotData._id }
        ]
      });
      
      if (existingUser) {
        logger.warn(`User account already exists for pilot: ${pilotData.email}`);
        return {
          success: false,
          message: 'User account already exists for this pilot',
          existingUser
        };
      }
      
      // Create the user account
      const result = await User.createAccountForPilot(pilotData, createdBy);
      
      logger.info(`User account created successfully for pilot: ${result.credentials.evzipId}`);
      
      return {
        success: true,
        message: 'Pilot user account created successfully',
        ...result
      };
      
    } catch (error) {
      logger.error('Error creating pilot user account:', error);
      throw new Error(`Failed to create pilot account: ${error.message}`);
    }
  }
  
  /**
   * Get user credentials for a specific Employee or Pilot
   */
  static async getUserCredentials(entityId, entityType = 'employee') {
    try {
      let user;
      
      if (entityType === 'employee') {
        user = await User.findOne({ employeeRef: entityId }).select('evzipId username email role isTemporaryPassword mustChangePassword');
      } else if (entityType === 'pilot') {
        user = await User.findOne({ pilotRef: entityId }).select('evzipId username email role isTemporaryPassword mustChangePassword');
      }
      
      if (!user) {
        return {
          success: false,
          message: `No user account found for this ${entityType}`
        };
      }
      
      return {
        success: true,
        credentials: {
          evzipId: user.evzipId,
          username: user.username,
          email: user.email,
          role: user.role,
          isTemporaryPassword: user.isTemporaryPassword,
          mustChangePassword: user.mustChangePassword
        }
      };
      
    } catch (error) {
      logger.error('Error fetching user credentials:', error);
      throw new Error(`Failed to get user credentials: ${error.message}`);
    }
  }
  
  /**
   * Update user account when Employee/Pilot data is modified
   */
  static async updateUserAccount(entityId, entityType, updateData, updatedBy) {
    try {
      let user;
      
      if (entityType === 'employee') {
        user = await User.findOne({ employeeRef: entityId });
      } else if (entityType === 'pilot') {
        user = await User.findOne({ pilotRef: entityId });
      }
      
      if (!user) {
        logger.warn(`No user account found to update for ${entityType}: ${entityId}`);
        return {
          success: false,
          message: `No user account found for this ${entityType}`
        };
      }
      
      // Update relevant fields
      const allowedUpdates = {
        fullName: updateData.fullName,
        email: updateData.email,
        department: updateData.department,
        designation: updateData.position || updateData.designation,
        mobileNumber: updateData.contactNumber,
        updatedBy
      };
      
      // Only update fields that are provided
      Object.keys(allowedUpdates).forEach(key => {
        if (allowedUpdates[key] !== undefined && allowedUpdates[key] !== null) {
          user[key] = allowedUpdates[key];
        }
      });
      
      await user.save();
      
      logger.info(`User account updated successfully for ${entityType}: ${user.evzipId}`);
      
      return {
        success: true,
        message: `${entityType} user account updated successfully`,
        user
      };
      
    } catch (error) {
      logger.error(`Error updating user account for ${entityType}:`, error);
      throw new Error(`Failed to update user account: ${error.message}`);
    }
  }
  
  /**
   * Deactivate user account when Employee/Pilot is deactivated
   */
  static async deactivateUserAccount(entityId, entityType, deactivatedBy) {
    try {
      let user;
      
      if (entityType === 'employee') {
        user = await User.findOne({ employeeRef: entityId });
      } else if (entityType === 'pilot') {
        user = await User.findOne({ pilotRef: entityId });
      }
      
      if (!user) {
        return {
          success: false,
          message: `No user account found for this ${entityType}`
        };
      }
      
      user.active = false;
      user.updatedBy = deactivatedBy;
      await user.save();
      
      logger.info(`User account deactivated for ${entityType}: ${user.evzipId}`);
      
      return {
        success: true,
        message: `${entityType} user account deactivated successfully`
      };
      
    } catch (error) {
      logger.error(`Error deactivating user account for ${entityType}:`, error);
      throw new Error(`Failed to deactivate user account: ${error.message}`);
    }
  }
  
  /**
   * Get all user credentials for management purposes
   */
  static async getAllUserCredentials(page = 1, limit = 50, role = null) {
    try {
      const filter = {};
      if (role) {
        filter.role = role;
      }
      
      const skip = (page - 1) * limit;
      
      const [users, totalCount] = await Promise.all([
        User.find(filter)
          .select('evzipId username email fullName role active isTemporaryPassword mustChangePassword lastLogin createdAt')
          .populate('employeeRef', 'employeeId fullName department position')
          .populate('pilotRef', 'pilotId fullName licenseNumber currentStatus')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter)
      ]);
      
      return {
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalUsers: totalCount,
            hasNextPage: page < Math.ceil(totalCount / limit),
            hasPrevPage: page > 1
          }
        }
      };
      
    } catch (error) {
      logger.error('Error fetching all user credentials:', error);
      throw new Error(`Failed to get user credentials: ${error.message}`);
    }
  }
  
  /**
   * Reset user password (generate new temporary password)
   */
  static async resetUserPassword(userId, resetBy) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      const newPassword = User.generateDefaultPassword();
      
      user.password = newPassword;
      user.passwordConfirm = newPassword;
      user.isTemporaryPassword = true;
      user.mustChangePassword = true;
      user.updatedBy = resetBy;
      
      await user.save();
      
      logger.info(`Password reset for user: ${user.evzipId}`);
      
      return {
        success: true,
        message: 'Password reset successfully',
        newPassword
      };
      
    } catch (error) {
      logger.error('Error resetting user password:', error);
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  }
}

module.exports = AccountCreationService;
