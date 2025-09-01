/**
 * Smart Bookings Controller
 * 
 * This controller handles all Smart Bookings operations using the Booking model.
 * It provides CRUD operations, business logic, and integrates with MongoDB Atlas.
 * 
 * Features:
 * - Complete CRUD operations with validation
 * - Business rule enforcement
 * - Advanced filtering and search
 * - Booking statistics and analytics
 * - Error handling and logging
 * - Production-ready implementation
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * ========================================
 * BOOKING CRUD OPERATIONS
 * ========================================
 */

/**
 * @desc    Create a new booking
 * @route   POST /api/smart-bookings
 * @access  Private (Smart Bookings Module)
 */
exports.createBooking = catchAsync(async (req, res) => {
  logger.info('Creating new booking', { userId: req.user._id, data: req.body });

  // Extract booking data from request
  const bookingData = {
    ...req.body,
    createdBy: req.user._id,
    status: 'pending' // Always start as pending
  };

  // Create booking instance (booking ID will be auto-generated)
  const booking = new Booking(bookingData);

  // Save to database with validation
  await booking.save();

  // Populate created by user info for response
  await booking.populate('createdBy', 'fullName email role');

  logger.info('Booking created successfully', { 
    bookingId: booking.bookingId,
    customer: booking.customerName,
    userId: req.user._id 
  });

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking
  });
});

/**
 * @desc    Get all bookings with filtering and pagination
 * @route   GET /api/smart-bookings
 * @access  Private (Smart Bookings Module)
 */
exports.getBookings = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    bookingType,
    customerPhone,
    vehicleNumber,
    dateFrom,
    dateTo,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = { isActive: true };

  // Status filter
  if (status) {
    if (status.includes(',')) {
      filter.status = { $in: status.split(',') };
    } else {
      filter.status = status;
    }
  }

  // Booking type filter
  if (bookingType) {
    filter.bookingType = bookingType;
  }

  // Customer phone filter
  if (customerPhone) {
    filter.customerPhone = customerPhone;
  }

  // Vehicle filter
  if (vehicleNumber) {
    filter.vehicleNumber = vehicleNumber.toUpperCase();
  }

  // Date range filter
  if (dateFrom || dateTo) {
    filter.scheduledDate = {};
    if (dateFrom) {
      filter.scheduledDate.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      filter.scheduledDate.$lte = new Date(dateTo);
    }
  }

  // Text search filter
  if (search) {
    filter.$text = { $search: search };
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Execute query with population
  const [bookings, totalCount] = await Promise.all([
    Booking.find(filter)
      .populate('createdBy', 'fullName email role')
      .populate('updatedBy', 'fullName email role')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / parseInt(limit));

  logger.info('Bookings retrieved', { 
    count: bookings.length, 
    totalCount, 
    page: parseInt(page),
    userId: req.user._id 
  });

  res.json({
    success: true,
    data: bookings,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      hasMore: parseInt(page) < totalPages,
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Get a single booking by ID
 * @route   GET /api/smart-bookings/:id
 * @access  Private (Smart Bookings Module)
 */
exports.getBookingById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID format'
    });
  }

  // Find booking with populated references
  const booking = await Booking.findOne({ _id: id, isActive: true })
    .populate('createdBy', 'fullName email role')
    .populate('updatedBy', 'fullName email role')
    .populate('cancelledBy', 'fullName email role');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  logger.info('Booking retrieved by ID', { 
    bookingId: booking.bookingId,
    userId: req.user._id 
  });

  res.json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Get booking by booking ID (string format)
 * @route   GET /api/smart-bookings/booking-id/:bookingId
 * @access  Private (Smart Bookings Module)
 */
exports.getBookingByBookingId = catchAsync(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findOne({ bookingId, isActive: true })
    .populate('createdBy', 'fullName email role')
    .populate('updatedBy', 'fullName email role')
    .populate('cancelledBy', 'fullName email role');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  logger.info('Booking retrieved by booking ID', { 
    bookingId: booking.bookingId,
    userId: req.user._id 
  });

  res.json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Update booking details
 * @route   PUT /api/smart-bookings/:id
 * @access  Private (Smart Bookings Module)
 */
exports.updateBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID format'
    });
  }

  // Find existing booking
  const booking = await Booking.findOne({ _id: id, isActive: true });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking can be modified based on current status
  if (!booking.canBeModified() && !updateData.status) {
    return res.status(400).json({
      success: false,
      message: `Booking cannot be modified in '${booking.status}' status`
    });
  }

  // Validate status transitions
  if (updateData.status && updateData.status !== booking.status) {
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['assigned', 'cancelled'],
      'assigned': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[booking.status].includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${booking.status}' to '${updateData.status}'`
      });
    }
  }

  // Handle status-specific validations
  if (updateData.status === 'assigned' && !updateData.vehicleNumber && !booking.vehicleNumber) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle number is required for assigned status'
    });
  }

  if (updateData.status === 'completed' && !updateData.actualCost && !booking.actualCost) {
    return res.status(400).json({
      success: false,
      message: 'Actual cost is required for completed status'
    });
  }

  // Add audit fields
  updateData.updatedBy = req.user._id;

  // Apply updates
  Object.assign(booking, updateData);

  // Save with validation
  await booking.save();

  // Populate references for response
  await booking.populate('createdBy', 'fullName email role');
  await booking.populate('updatedBy', 'fullName email role');

  logger.info('Booking updated successfully', {
    bookingId: booking.bookingId,
    previousStatus: booking.status,
    newStatus: updateData.status,
    userId: req.user._id
  });

  res.json({
    success: true,
    message: 'Booking updated successfully',
    data: booking
  });
});

/**
 * @desc    Cancel booking (soft delete with reason)
 * @route   DELETE /api/smart-bookings/:id
 * @access  Private (Smart Bookings Module)
 */
exports.cancelBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID format'
    });
  }

  if (!reason || reason.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Cancellation reason is required (minimum 10 characters)'
    });
  }

  // Find booking
  const booking = await Booking.findOne({ _id: id, isActive: true });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking can be cancelled
  if (!booking.canBeCancelled()) {
    return res.status(400).json({
      success: false,
      message: `Booking cannot be cancelled in '${booking.status}' status`
    });
  }

  // Update booking with cancellation details
  booking.status = 'cancelled';
  booking.cancellationReason = reason.trim();
  booking.cancelledBy = req.user._id;
  booking.cancelledAt = new Date();
  booking.updatedBy = req.user._id;

  await booking.save();

  logger.info('Booking cancelled', {
    bookingId: booking.bookingId,
    reason: reason.trim(),
    userId: req.user._id
  });

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: {
      bookingId: booking.bookingId,
      status: booking.status,
      cancelledAt: booking.cancelledAt,
      reason: booking.cancellationReason
    }
  });
});

/**
 * ========================================
 * SPECIALIZED QUERY OPERATIONS
 * ========================================
 */

/**
 * @desc    Get bookings by customer phone
 * @route   GET /api/smart-bookings/customer/:phone
 * @access  Private (Smart Bookings Module)
 */
exports.getBookingsByCustomer = catchAsync(async (req, res) => {
  const { phone } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate phone number format
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [bookings, totalCount] = await Promise.all([
    Booking.findByCustomerPhone(phone, { 
      skip, 
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    }).populate('createdBy', 'fullName email role'),
    Booking.countDocuments({ customerPhone: phone, isActive: true })
  ]);

  logger.info('Customer bookings retrieved', { 
    phone, 
    count: bookings.length,
    userId: req.user._id 
  });

  res.json({
    success: true,
    data: bookings,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount,
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Get bookings by vehicle
 * @route   GET /api/smart-bookings/vehicle/:vehicleNumber
 * @access  Private (Smart Bookings Module)
 */
exports.getBookingsByVehicle = catchAsync(async (req, res) => {
  const { vehicleNumber } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  // Validate vehicle number format
  if (!/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(vehicleNumber.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vehicle number format'
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = { vehicleNumber: vehicleNumber.toUpperCase(), isActive: true };
  
  if (status) {
    filter.status = status;
  }

  const [bookings, totalCount] = await Promise.all([
    Booking.find(filter)
      .populate('createdBy', 'fullName email role')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(filter)
  ]);

  logger.info('Vehicle bookings retrieved', { 
    vehicleNumber: vehicleNumber.toUpperCase(), 
    count: bookings.length,
    userId: req.user._id 
  });

  res.json({
    success: true,
    data: bookings,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount,
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Get bookings by status
 * @route   GET /api/smart-bookings/status/:status
 * @access  Private (Smart Bookings Module)
 */
exports.getBookingsByStatus = catchAsync(async (req, res) => {
  const { status } = req.params;
  const { page = 1, limit = 20, dateFrom, dateTo } = req.query;

  // Validate status
  const validStatuses = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking status'
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = { status, isActive: true };

  // Add date range if provided
  if (dateFrom || dateTo) {
    filter.scheduledDate = {};
    if (dateFrom) filter.scheduledDate.$gte = new Date(dateFrom);
    if (dateTo) filter.scheduledDate.$lte = new Date(dateTo);
  }

  const [bookings, totalCount] = await Promise.all([
    Booking.find(filter)
      .populate('createdBy', 'fullName email role')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(filter)
  ]);

  logger.info('Status-based bookings retrieved', { 
    status, 
    count: bookings.length,
    userId: req.user._id 
  });

  res.json({
    success: true,
    data: bookings,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount,
      limit: parseInt(limit)
    }
  });
});

/**
 * ========================================
 * BOOKING ANALYTICS & STATISTICS
 * ========================================
 */

/**
 * @desc    Get booking statistics
 * @route   GET /api/smart-bookings/analytics/stats
 * @access  Private (Smart Bookings Module)
 */
exports.getBookingStats = catchAsync(async (req, res) => {
  const { period = 'all', dateFrom, dateTo } = req.query;

  let startDate, endDate;

  // Calculate date range based on period
  switch (period) {
    case 'today':
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date();
      break;
    case 'month':
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      endDate = new Date();
      break;
    case 'custom':
      startDate = dateFrom ? new Date(dateFrom) : null;
      endDate = dateTo ? new Date(dateTo) : null;
      break;
    default:
      startDate = null;
      endDate = null;
  }

  // Get basic statistics using model static method
  const basicStats = await Booking.getBookingStats(
    startDate?.toISOString().split('T')[0],
    endDate?.toISOString().split('T')[0]
  );

  // Get additional analytics via aggregation
  const matchStage = { isActive: true };
  if (startDate && endDate) {
    matchStage.scheduledDate = { $gte: startDate, $lte: endDate };
  }

  const analytics = await Booking.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } },
        averageCost: { $avg: { $ifNull: ['$actualCost', '$estimatedCost'] } },
        
        // Status breakdown
        pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        confirmedCount: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        assignedCount: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
        inProgressCount: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        
        // Booking type breakdown
        airportCount: { $sum: { $cond: [{ $eq: ['$bookingType', 'airport'] }, 1, 0] } },
        rentalCount: { $sum: { $cond: [{ $eq: ['$bookingType', 'rental'] }, 1, 0] } },
        subscriptionCount: { $sum: { $cond: [{ $eq: ['$bookingType', 'subscription'] }, 1, 0] } },
        
        // Payment mode breakdown
        cashPayments: { $sum: { $cond: [{ $eq: ['$paymentMode', 'Cash'] }, 1, 0] } },
        upiPayments: { $sum: { $cond: [{ $eq: ['$paymentMode', 'UPI'] }, 1, 0] } },
        cardPayments: { $sum: { $cond: [{ $eq: ['$paymentMode', 'Card'] }, 1, 0] } },
        partPayments: { $sum: { $cond: [{ $eq: ['$paymentMode', 'Part Payment'] }, 1, 0] } },
        
        // Rating statistics
        totalRatings: { $sum: { $cond: [{ $ne: ['$rating', null] }, 1, 0] } },
        averageRating: { $avg: '$rating' },
        
        // Vehicle utilization
        uniqueVehicles: { $addToSet: '$vehicleNumber' }
      }
    },
    {
      $project: {
        _id: 0,
        totalBookings: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        averageCost: { $round: ['$averageCost', 2] },
        statusBreakdown: {
          pending: '$pendingCount',
          confirmed: '$confirmedCount',
          assigned: '$assignedCount',
          in_progress: '$inProgressCount',
          completed: '$completedCount',
          cancelled: '$cancelledCount'
        },
        typeBreakdown: {
          airport: '$airportCount',
          rental: '$rentalCount',
          subscription: '$subscriptionCount'
        },
        paymentBreakdown: {
          cash: '$cashPayments',
          upi: '$upiPayments',
          card: '$cardPayments',
          partPayment: '$partPayments'
        },
        ratingStats: {
          totalRatings: '$totalRatings',
          averageRating: { $round: ['$averageRating', 1] }
        },
        vehicleUtilization: {
          uniqueVehicles: { $size: '$uniqueVehicles' }
        }
      }
    }
  ]);

  const stats = analytics[0] || {
    totalBookings: 0,
    totalRevenue: 0,
    averageCost: 0,
    statusBreakdown: {},
    typeBreakdown: {},
    paymentBreakdown: {},
    ratingStats: {},
    vehicleUtilization: { uniqueVehicles: 0 }
  };

  logger.info('Booking statistics retrieved', { 
    period, 
    totalBookings: stats.totalBookings,
    userId: req.user._id 
  });

  res.json({
    success: true,
    data: {
      ...stats,
      period,
      dateRange: {
        from: startDate?.toISOString(),
        to: endDate?.toISOString()
      }
    }
  });
});

/**
 * @desc    Get daily booking trends
 * @route   GET /api/smart-bookings/analytics/trends
 * @access  Private (Smart Bookings Module)
 */
exports.getBookingTrends = catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  startDate.setHours(0, 0, 0, 0);

  const trends = await Booking.aggregate([
    {
      $match: {
        scheduledDate: { $gte: startDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$scheduledDate' },
          month: { $month: '$scheduledDate' },
          day: { $dayOfMonth: '$scheduledDate' }
        },
        bookingsCount: { $sum: 1 },
        revenue: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } },
        completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        bookingsCount: 1,
        revenue: { $round: ['$revenue', 2] },
        completedBookings: 1,
        cancelledBookings: 1,
        successRate: {
          $multiply: [
            { $divide: ['$completedBookings', '$bookingsCount'] },
            100
          ]
        }
      }
    }
  ]);

  logger.info('Booking trends retrieved', { 
    days: parseInt(days),
    dataPoints: trends.length,
    userId: req.user._id 
  });

  res.json({
    success: true,
    data: trends
  });
});

module.exports = exports;
