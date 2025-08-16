const { catchAsync, AppError } = require('../middleware/errorHandler');
const DatabaseService = require('../services/databaseService');
const AuditService = require('../services/auditService');
const logger = require('../utils/logger');

const databaseService = new DatabaseService();

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
  await AuditService.logDatabaseAction({
    action: 'UPDATE',
    collection: 'pilots',
    documentId: pilot._id,
    changes: { currentStatus, statusUpdateSource: 'driver_induction' },
    previousData: { currentStatus: originalPilot.currentStatus },
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
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
  await AuditService.logDatabaseAction({
    action: 'DELETE',
    collection: 'pilots',
    documentId: req.params.id,
    changes: { isActive: false, deletionSource: 'driver_induction' },
    previousData: originalPilot,
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({
    success: true,
    message: 'Driver induction pilot deleted successfully'
  });
});

module.exports = {
  getDriverInductionPilots,
  getDriverInductionPilot,
  updateDriverInductionPilotStatus,
  deleteDriverInductionPilot
};
