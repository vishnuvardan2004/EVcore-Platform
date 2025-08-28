const { catchAsync, AppError } = require('../middleware/errorHandler');
const DatabaseService = require('../services/databaseService');
const AuditService = require('../services/auditService');
const User = require('../models/User');
const RolePermission = require('../models/RolePermission');
const logger = require('../utils/logger');

const databaseService = DatabaseService.getInstance();

// @desc    Submit driver induction (creates pilot profile and user account)
// @route   POST /api/driver-induction/submit
// @access  Private
const submitDriverInduction = catchAsync(async (req, res, next) => {
  const { personalInfo, drivingInfo, identityDocs, bankingDetails, addressDetails, pvcInfo, familyEmergency, medicalInfo } = req.body;

  try {
    // Generate pilot ID (EVZIP format)
    const timestamp = Date.now().toString().slice(-6);
    const pilotId = `EVZIP-${timestamp}`;

    // Create pilot profile first
    const pilotData = {
      pilotId,
      fullName: personalInfo.fullName,
      email: personalInfo.emailId,
      mobileNumber: personalInfo.mobileNumber,
      gender: personalInfo.gender,
      dateOfBirth: personalInfo.dateOfBirth,
      licenseNumber: drivingInfo.licenseNumber,
      licenseExpiry: drivingInfo.licenseExpiry,
      experience: drivingInfo.experience || 0,
      vehicleTypes: drivingInfo.vehicleTypes || ['EV'],
      currentStatus: 'available',
      location: {
        lat: 0,
        lng: 0,
        address: addressDetails?.currentAddress || 'Not specified'
      },
      isActive: true,
      // Additional pilot information
      aadharNumber: identityDocs?.aadharNumber,
      panNumber: identityDocs?.panNumber,
      bankAccountNumber: bankingDetails?.accountNumber,
      ifscCode: bankingDetails?.ifscCode,
      emergencyContactName: familyEmergency?.emergencyContactName,
      emergencyContactNumber: familyEmergency?.emergencyContactNumber,
      medicalCertificate: medicalInfo?.medicalCertificate,
      createdBy: req.user.id,
      updatedBy: req.user.id
    };

    const pilot = await databaseService.createDocument('Pilot', pilotData);

    // Create user account with 'pilot' role
    const defaultPassword = 'EVZIP@123'; // Default password for pilots
    const userData = {
      fullName: personalInfo.fullName,
      email: personalInfo.emailId,
      mobileNumber: personalInfo.mobileNumber,
      password: defaultPassword,
      passwordConfirm: defaultPassword,
      role: 'pilot', // Automatically set to pilot role
      department: 'Operations',
      designation: 'Pilot/Driver',
      employeeId: pilotId,
      isActive: true,
      createdBy: req.user.id
    };

    const user = await User.create(userData);

    // Create default role permissions for pilot
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

    // Log audit trail for pilot creation
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

    // Log audit trail for user creation
    await AuditService.logAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'CREATE_DOCUMENT',
      platform: 'user',
      documentId: user._id,
      details: { ...userData, password: '[REDACTED]', passwordConfirm: '[REDACTED]' },
      result: { success: true, recordsAffected: 1 },
      req
    });

    logger.info('Driver induction completed successfully', {
      pilotId: pilot.pilotId,
      userId: user._id,
      email: user.email,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Driver inducted successfully',
      data: {
        pilot: {
          pilotId: pilot.pilotId,
          fullName: pilot.fullName,
          email: pilot.email,
          mobileNumber: pilot.mobileNumber
        },
        credentials: {
          email: user.email,
          defaultPassword: defaultPassword,
          role: user.role
        }
      }
    });

  } catch (error) {
    // If user creation fails after pilot creation, we should clean up
    if (error.code === 11000) {
      return next(new AppError('User with this email or mobile number already exists', 400));
    }
    
    logger.error('Driver induction failed:', error);
    return next(new AppError('Failed to complete driver induction', 500));
  }
});

// @desc    Get all pilots for driver induction
// @route   GET /api/driver-induction/pilots
// @access  Private
const getDriverInductionPilots = catchAsync(async (req, res, next) => {
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

  // Transform data for driver induction frontend format
  const transformedData = {
    pilots: result.data,
    total: result.pagination.total,
    page: result.pagination.page,
    limit: result.pagination.limit,
    totalPages: result.pagination.totalPages
  };

  res.status(200).json({
    success: true,
    message: 'Driver induction pilots retrieved successfully',
    data: transformedData
  });
});

// @desc    Get single pilot for driver induction
// @route   GET /api/driver-induction/pilots/:id
// @access  Private
const getDriverInductionPilot = catchAsync(async (req, res, next) => {
  const pilot = await databaseService.findByIdWithValidation('Pilot', req.params.id);

  if (!pilot) {
    return next(new AppError('Pilot not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Driver induction pilot retrieved successfully',
    data: pilot
  });
});

// @desc    Update pilot status for driver induction
// @route   PUT /api/driver-induction/pilots/:id/status
// @access  Private
const updateDriverInductionPilotStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  // Map frontend status to backend status
  const statusMapping = {
    'active': 'available',
    'inactive': 'off_duty',
    'pending': 'off_duty'
  };

  const currentStatus = statusMapping[status] || status;

  if (!['available', 'on_trip', 'off_duty'].includes(currentStatus)) {
    return next(new AppError('Invalid status. Must be active, inactive, or pending', 400));
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
    details: { currentStatus, statusUpdateSource: 'driver_induction' },
    result: { success: true, recordsAffected: 1 },
    req
  });

  res.status(200).json({
    success: true,
    message: 'Driver induction pilot status updated successfully',
    data: { 
      pilot, 
      previousStatus: originalPilot.currentStatus,
      newStatus: currentStatus,
      frontendStatus: status
    }
  });
});

// @desc    Delete pilot from driver induction
// @route   DELETE /api/driver-induction/pilots/:id
// @access  Private
const deleteDriverInductionPilot = catchAsync(async (req, res, next) => {
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
    details: { isActive: false, deletionSource: 'driver_induction' },
    result: { success: true, recordsAffected: 1 },
    req
  });

  res.status(200).json({
    success: true,
    message: 'Driver induction pilot deleted successfully'
  });
});

module.exports = {
  submitDriverInduction,
  getDriverInductionPilots,
  getDriverInductionPilot,
  updateDriverInductionPilotStatus,
  deleteDriverInductionPilot
};
