/**
 * Smart Bookings Routes
 * 
 * This file defines all the REST API endpoints for Smart Bookings functionality.
 * Routes are organized by functionality and include proper middleware integration.
 * 
 * Base URL: /api/smart-bookings
 * 
 * Endpoints:
 * - CRUD Operations: Create, Read, Update, Delete bookings
 * - Search & Filter: Advanced booking queries
 * - Analytics: Statistics and trends
 * - Customer Management: Customer-specific bookings
 * - Vehicle Management: Vehicle-specific bookings
 */

const express = require('express');
const router = express.Router();

// Middleware imports
const { verifyToken } = require('../middleware/auth');
const { requireSpecificModule } = require('../middleware/moduleAuth');
const { catchAsync } = require('../middleware/errorHandler');

// Controller imports
const smartBookingsController = require('../controllers/smartBookingsController');

// Validation imports
const { body, param, query, validationResult } = require('express-validator');

/**
 * ========================================
 * MIDDLEWARE SETUP
 * ========================================
 */

// Apply authentication to all routes
router.use(verifyToken);

// Apply module-specific authorization
router.use(requireSpecificModule('smart_bookings'));

/**
 * Validation middleware to check for validation errors
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * ========================================
 * VALIDATION SCHEMAS
 * ========================================
 */

const createBookingValidation = [
  body('customerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('customerPhone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid phone number format'),
  
  body('customerEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('bookingType')
    .isIn(['airport', 'rental', 'subscription'])
    .withMessage('Invalid booking type'),
  
  body('scheduledDate')
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value < new Date()) {
        throw new Error('Scheduled date cannot be in the past');
      }
      return true;
    }),
  
  body('scheduledTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  
  body('pickupLocation')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Pickup location must be between 5 and 200 characters'),
  
  body('dropLocation')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Drop location must be between 5 and 200 characters'),
  
  body('estimatedDistance')
    .optional()
    .isFloat({ min: 0.1, max: 2000 })
    .withMessage('Estimated distance must be between 0.1 and 2000 km'),
  
  body('estimatedCost')
    .isFloat({ min: 50, max: 50000 })
    .withMessage('Estimated cost must be between ₹50 and ₹50,000'),
  
  body('paymentMode')
    .isIn(['Cash', 'UPI', 'Card', 'Part Payment'])
    .withMessage('Invalid payment mode'),
  
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),
  
  body('vehicleNumber')
    .optional()
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/)
    .withMessage('Invalid vehicle number format'),
];

const updateBookingValidation = [
  body('customerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('customerPhone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid phone number format'),
  
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid booking status'),
  
  body('vehicleNumber')
    .optional()
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/)
    .withMessage('Invalid vehicle number format'),
  
  body('actualCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual cost must be a positive number'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
];

const cancelBookingValidation = [
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Cancellation reason must be between 10 and 500 characters'),
];

/**
 * ========================================
 * CORE CRUD ROUTES
 * ========================================
 */

/**
 * @route   POST /api/smart-bookings
 * @desc    Create a new booking
 * @access  Private (Smart Bookings Module)
 */
router.post('/', 
  requireSpecificModule('smart_bookings', 'create'),
  createBookingValidation,
  validateRequest,
  smartBookingsController.createBooking
);

/**
 * @route   GET /api/smart-bookings
 * @desc    Get all bookings with filtering and pagination
 * @access  Private (Smart Bookings Module)
 * @query   page, limit, status, bookingType, customerPhone, vehicleNumber, dateFrom, dateTo, search, sortBy, sortOrder
 */
router.get('/', 
  requireSpecificModule('smart_bookings', 'read'),
  smartBookingsController.getBookings
);

/**
 * @route   GET /api/smart-bookings/active
 * @desc    Get all active bookings (non-cancelled)
 * @access  Private (Smart Bookings Module)
 */
router.get('/active', 
  requireSpecificModule('smart_bookings', 'read'),
  catchAsync(async (req, res) => {
    // Set status filter to exclude cancelled bookings
    req.query.status = 'pending,confirmed,assigned,in_progress,completed';
    return smartBookingsController.getBookings(req, res);
  })
);

/**
 * @route   GET /api/smart-bookings/:id
 * @desc    Get a single booking by MongoDB ObjectId
 * @access  Private (Smart Bookings Module)
 */
router.get('/:id', 
  requireSpecificModule('smart_bookings', 'read'),
  param('id').isMongoId().withMessage('Invalid booking ID'),
  validateRequest,
  smartBookingsController.getBookingById
);

/**
 * @route   PUT /api/smart-bookings/:id
 * @desc    Update booking details
 * @access  Private (Smart Bookings Module)
 */
router.put('/:id',
  requireSpecificModule('smart_bookings', 'update'),
  param('id').isMongoId().withMessage('Invalid booking ID'),
  updateBookingValidation,
  validateRequest,
  smartBookingsController.updateBooking
);

/**
 * @route   DELETE /api/smart-bookings/:id
 * @desc    Cancel booking (soft delete with reason)
 * @access  Private (Smart Bookings Module)
 */
router.delete('/:id',
  requireSpecificModule('smart_bookings', 'delete'),
  param('id').isMongoId().withMessage('Invalid booking ID'),
  cancelBookingValidation,
  validateRequest,
  smartBookingsController.cancelBooking
);

/**
 * ========================================
 * SPECIALIZED QUERY ROUTES
 * ========================================
 */

/**
 * @route   GET /api/smart-bookings/booking-id/:bookingId
 * @desc    Get booking by booking ID (string format like SB2025090100001)
 * @access  Private (Smart Bookings Module)
 */
router.get('/booking-id/:bookingId',
  requireSpecificModule('smart_bookings', 'read'),
  param('bookingId')
    .matches(/^SB\d{13}$/)
    .withMessage('Invalid booking ID format'),
  validateRequest,
  smartBookingsController.getBookingByBookingId
);

/**
 * @route   GET /api/smart-bookings/customer/:phone
 * @desc    Get all bookings for a specific customer
 * @access  Private (Smart Bookings Module)
 * @query   page, limit
 */
router.get('/customer/:phone',
  requireSpecificModule('smart_bookings', 'read'),
  param('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid phone number format'),
  validateRequest,
  smartBookingsController.getBookingsByCustomer
);

/**
 * @route   GET /api/smart-bookings/vehicle/:vehicleNumber
 * @desc    Get all bookings for a specific vehicle
 * @access  Private (Smart Bookings Module)
 * @query   page, limit, status
 */
router.get('/vehicle/:vehicleNumber',
  requireSpecificModule('smart_bookings', 'read'),
  param('vehicleNumber')
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/)
    .withMessage('Invalid vehicle number format'),
  validateRequest,
  smartBookingsController.getBookingsByVehicle
);

/**
 * @route   GET /api/smart-bookings/status/:status
 * @desc    Get all bookings by status
 * @access  Private (Smart Bookings Module)
 * @query   page, limit, dateFrom, dateTo
 */
router.get('/status/:status',
  requireSpecificModule('smart_bookings', 'read'),
  param('status')
    .isIn(['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid booking status'),
  validateRequest,
  smartBookingsController.getBookingsByStatus
);

/**
 * ========================================
 * ANALYTICS & STATISTICS ROUTES
 * ========================================
 */

/**
 * @route   GET /api/smart-bookings/analytics/stats
 * @desc    Get comprehensive booking statistics
 * @access  Private (Smart Bookings Module - Analytics Permission)
 */
router.get('/analytics/stats',
  requireSpecificModule('smart_bookings', 'analytics'),
  query('period')
    .optional()
    .isIn(['all', 'today', 'week', 'month', 'custom'])
    .withMessage('Invalid period value'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid dateFrom format'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid dateTo format'),
  validateRequest,
  smartBookingsController.getBookingStats
);

/**
 * @route   GET /api/smart-bookings/analytics/trends
 * @desc    Get daily booking trends
 * @access  Private (Smart Bookings Module - Analytics Permission)
 */
router.get('/analytics/trends',
  requireSpecificModule('smart_bookings', 'analytics'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  validateRequest,
  smartBookingsController.getBookingTrends
);

/**
 * ========================================
 * LEGACY COMPATIBILITY ROUTES
 * ========================================
 */

/**
 * @route   POST /api/smart-bookings/create
 * @desc    Create booking (legacy route for backward compatibility)
 * @access  Private (Smart Bookings Module)
 */
router.post('/create', 
  requireSpecificModule('smart_bookings', 'create'),
  createBookingValidation,
  validateRequest,
  smartBookingsController.createBooking
);

/**
 * @route   GET /api/smart-bookings/offline
 * @desc    Get offline bookings (placeholder for future offline sync feature)
 * @access  Private (Smart Bookings Module)
 */
router.get('/offline', 
  requireSpecificModule('smart_bookings', 'read'),
  catchAsync(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Offline bookings feature will be available in future updates',
      data: {
        offlineBookings: [],
        userRole: req.user.role,
        moduleAccess: req.authorizedModule,
        note: 'This endpoint is reserved for offline sync functionality'
      }
    });
  })
);

module.exports = router;
