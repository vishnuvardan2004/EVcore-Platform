const { catchAsync, AppError } = require('../middleware/errorHandler');
const DatabaseService = require('../services/databaseService');
const AuditService = require('../services/auditService');
const logger = require('../utils/logger');

const databaseService = new DatabaseService();

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

// @desc    Create new pilot
// @route   POST /api/pilots
// @access  Private
const createPilot = catchAsync(async (req, res, next) => {
  const pilotData = {
    ...req.body,
    createdBy: req.user.id,
    updatedBy: req.user.id
  };

  const pilot = await databaseService.createDocument('Pilot', pilotData);

  // Log audit trail
  await AuditService.logDatabaseAction({
    action: 'CREATE',
    collection: 'pilots',
    documentId: pilot._id,
    changes: pilotData,
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    message: 'Pilot created successfully',
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
  await AuditService.logDatabaseAction({
    action: 'UPDATE',
    collection: 'pilots',
    documentId: pilot._id,
    changes: updateData,
    previousData: originalPilot,
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
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
  await AuditService.logDatabaseAction({
    action: 'UPDATE',
    collection: 'pilots',
    documentId: pilot._id,
    changes: { currentStatus },
    previousData: { currentStatus: originalPilot.currentStatus },
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
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
  await AuditService.logDatabaseAction({
    action: 'DELETE',
    collection: 'pilots',
    documentId: req.params.id,
    changes: { isActive: false },
    previousData: originalPilot,
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
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
