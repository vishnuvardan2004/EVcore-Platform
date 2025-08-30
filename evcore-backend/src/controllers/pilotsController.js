const { catchAsync, AppError } = require('../middleware/errorHandler');
const DatabaseService = require('../services/databaseService');
const AuditService = require('../services/auditService');
const User = require('../models/User');
const RolePermission = require('../models/RolePermission');
const logger = require('../utils/logger');

const databaseService = DatabaseService.getInstance();

// @desc    Get all pilots
// @route   GET /api/pilots
// @access  Private
const getAllPilots = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = { isActive: true };
  
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { pilotId: { $regex: search, $options: 'i' } },
      { licenseNumber: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.currentStatus = status;
  }

  const result = await databaseService.getPaginatedResults(
    'Pilot',
    query,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    }
  );

  res.status(200).json({
    success: true,
    message: 'Pilots retrieved successfully',
    data: result.data,
    pagination: result.pagination
  });
});

// @desc    Get single pilot
// @route   GET /api/pilots/:id
// @access  Private
const getPilot = catchAsync(async (req, res, next) => {
  const pilot = await databaseService.findByIdWithValidation('Pilot', req.params.id);

  if (!pilot) {
    return next(new AppError('Pilot not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Pilot retrieved successfully',
    data: pilot
  });
});

// @desc    Create new pilot (now automatically creates user account for authentication)
// @route   POST /api/pilots
// @access  Private
const createPilot = catchAsync(async (req, res, next) => {
  const pilotData = {
    ...req.body,
    createdBy: req.user.id,
    updatedBy: req.user.id
  };

  // Create pilot record first
  const pilot = await databaseService.createDocument('Pilot', pilotData);

  // Automatically create User account for authentication
  try {
    // Check if user account already exists
    const existingUser = await User.findOne({ email: pilotData.email });
    
    if (!existingUser) {
      // Generate unique evzipId and username
      const timestamp = Date.now().toString().slice(-6);
      const username = pilotData.fullName ? pilotData.fullName.toLowerCase().replace(/\s+/g, '') + 'pilot' : 'pilot' + timestamp;
      
      const userData = {
        fullName: pilotData.fullName,
        email: pilotData.email,
        mobileNumber: pilotData.mobileNumber || '0000000000', // Default if not provided
        username: username.substring(0, 20), // Limit username length
        evzipId: pilot.pilotId || `EVZ_${timestamp}`,
        role: 'pilot',
        password: 'Pilot123', // Default password
        passwordConfirm: 'Pilot123',
        active: true,
        isTemporaryPassword: true,
        mustChangePassword: true,
        department: 'Operations',
        designation: 'Pilot/Driver',
        licenseNumber: pilotData.licenseNumber,
        licenseExpiry: pilotData.licenseExpiry,
        experienceYears: pilotData.experience || 0,
        vehicleTypes: pilotData.vehicleTypes || ['EV'],
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Family',
          phone: pilotData.mobileNumber || '0000000000'
        },
        createdBy: req.user.id
      };

      const user = await User.create(userData);
      
      logger.info(`User account created automatically for pilot: ${user.email}`);

      // Create default role permissions if they don't exist
      let rolePermissions = await RolePermission.findOne({ role: 'pilot' });
      if (!rolePermissions) {
        const defaultPermissions = RolePermission.getDefaultPermissions('pilot');
        if (defaultPermissions) {
          rolePermissions = await RolePermission.create({
            role: 'pilot',
            modules: defaultPermissions.modules,
            createdBy: user._id
          });
        }
      }
    } else {
      logger.info(`User account already exists for pilot: ${existingUser.email}`);
    }
  } catch (userError) {
    // Log the error but don't fail the pilot creation
    logger.error(`Failed to create user account for pilot ${pilotData.email}: ${userError.message}`);
  }

  // Log audit trail
  await AuditService.logAction({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'CREATE_DOCUMENT',
    platform: 'pilot',
    documentId: pilot._id,
    details: pilotData,
    result: { success: true, recordsAffected: 1 },
    req
  });

  res.status(201).json({
    success: true,
    message: 'Pilot created successfully with user account',
    data: pilot
  });
});

// @desc    Update pilot
// @route   PUT /api/pilots/:id
// @access  Private
const updatePilot = catchAsync(async (req, res, next) => {
  const updateData = {
    ...req.body,
    updatedBy: req.user.id
  };

  const originalPilot = await databaseService.findByIdWithValidation('Pilot', req.params.id);
  if (!originalPilot) {
    return next(new AppError('Pilot not found', 404));
  }

  const pilot = await databaseService.updateDocument('Pilot', req.params.id, updateData);

  // Log audit trail
  await AuditService.logAction({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'UPDATE_DOCUMENT',
    platform: 'pilot',
    documentId: pilot._id,
    details: { updateData, previousData: originalPilot },
    result: { success: true, recordsAffected: 1 },
    req
  });

  res.status(200).json({
    success: true,
    message: 'Pilot updated successfully',
    data: pilot
  });
});

// @desc    Update pilot status
// @route   PUT /api/pilots/:id/status
// @access  Private
const updatePilotStatus = catchAsync(async (req, res, next) => {
  const { currentStatus } = req.body;

  if (!['available', 'on_trip', 'off_duty'].includes(currentStatus)) {
    return next(new AppError('Invalid status. Must be available, on_trip, or off_duty', 400));
  }

  const originalPilot = await databaseService.findByIdWithValidation('Pilot', req.params.id);
  if (!originalPilot) {
    return next(new AppError('Pilot not found', 404));
  }

  const pilot = await databaseService.updateDocument('Pilot', req.params.id, {
    currentStatus,
    updatedBy: req.user.id
  });

  // Log audit trail
  await AuditService.logAction({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'UPDATE_DOCUMENT',
    platform: 'pilot',
    documentId: pilot._id,
    details: { 
      changes: { currentStatus },
      previousData: { currentStatus: originalPilot.currentStatus }
    },
    result: { success: true, recordsAffected: 1 },
    req
  });

  res.status(200).json({
    success: true,
    message: 'Pilot status updated successfully',
    data: { pilot, previousStatus: originalPilot.currentStatus }
  });
});

// @desc    Delete pilot (soft delete)
// @route   DELETE /api/pilots/:id
// @access  Private
const deletePilot = catchAsync(async (req, res, next) => {
  const originalPilot = await databaseService.findByIdWithValidation('Pilot', req.params.id);
  if (!originalPilot) {
    return next(new AppError('Pilot not found', 404));
  }

  await databaseService.updateDocument('Pilot', req.params.id, {
    isActive: false,
    updatedBy: req.user.id
  });

  // Log audit trail
  await AuditService.logAction({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'DELETE_DOCUMENT',
    platform: 'pilot',
    documentId: req.params.id,
    details: { 
      changes: { isActive: false },
      previousData: originalPilot
    },
    result: { success: true, recordsAffected: 1 },
    req
  });

  res.status(200).json({
    success: true,
    message: 'Pilot deleted successfully'
  });
});

// @desc    Get pilot statistics
// @route   GET /api/pilots/stats
// @access  Private
const getPilotStats = catchAsync(async (req, res, next) => {
  const stats = await databaseService.getCollectionStats('Pilot', {
    groupBy: 'currentStatus',
    additionalStats: {
      totalPilots: { isActive: true },
      activePilots: { isActive: true, currentStatus: { $ne: 'off_duty' } },
      availablePilots: { isActive: true, currentStatus: 'available' },
      onTripPilots: { isActive: true, currentStatus: 'on_trip' },
      offDutyPilots: { isActive: true, currentStatus: 'off_duty' }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Pilot statistics retrieved successfully',
    data: stats
  });
});

module.exports = {
  getAllPilots,
  getPilot,
  createPilot,
  updatePilot,
  updatePilotStatus,
  deletePilot,
  getPilotStats
};
