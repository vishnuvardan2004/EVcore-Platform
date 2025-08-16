const express = require('express');
const { body, param } = require('express-validator');
const pilotsController = require('../controllers/pilotsController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Validation rules
const pilotValidation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('pilotId')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Pilot ID must be between 3 and 20 characters'),
  
  body('licenseNumber')
    .trim()
    .isLength({ min: 5, max: 30 })
    .withMessage('License number must be between 5 and 30 characters'),
  
  body('licenseExpiry')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid license expiry date'),
  
  body('experience')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Experience must be a positive number'),
  
  body('rating')
    .optional()
    .isNumeric()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('vehicleTypes')
    .optional()
    .isArray()
    .withMessage('Vehicle types must be an array'),
  
  body('currentStatus')
    .optional()
    .isIn(['available', 'on_trip', 'off_duty'])
    .withMessage('Status must be available, on_trip, or off_duty'),
  
  body('location.lat')
    .optional()
    .isNumeric()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.lng')
    .optional()
    .isNumeric()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters')
];

const updatePilotValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 30 })
    .withMessage('License number must be between 5 and 30 characters'),
  
  body('licenseExpiry')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid license expiry date'),
  
  body('experience')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Experience must be a positive number'),
  
  body('rating')
    .optional()
    .isNumeric()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('vehicleTypes')
    .optional()
    .isArray()
    .withMessage('Vehicle types must be an array'),
  
  body('currentStatus')
    .optional()
    .isIn(['available', 'on_trip', 'off_duty'])
    .withMessage('Status must be available, on_trip, or off_duty'),
  
  body('location.lat')
    .optional()
    .isNumeric()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.lng')
    .optional()
    .isNumeric()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters')
];

const statusUpdateValidation = [
  body('currentStatus')
    .isIn(['available', 'on_trip', 'off_duty'])
    .withMessage('Status must be available, on_trip, or off_duty')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid pilot ID')
];

// Routes

// Get pilot statistics (before /:id route to avoid conflicts)
router.get('/stats', 
  authorize(['super_admin', 'admin', 'employee']), 
  pilotsController.getPilotStats
);

// Get all pilots
router.get('/', 
  authorize(['super_admin', 'admin', 'employee']), 
  pilotsController.getAllPilots
);

// Get single pilot
router.get('/:id', 
  authorize(['super_admin', 'admin', 'employee']), 
  idValidation, 
  validateRequest, 
  pilotsController.getPilot
);

// Create new pilot
router.post('/', 
  authorize(['super_admin', 'admin']), 
  pilotValidation, 
  validateRequest, 
  pilotsController.createPilot
);

// Update pilot
router.put('/:id', 
  authorize(['super_admin', 'admin']), 
  idValidation, 
  updatePilotValidation, 
  validateRequest, 
  pilotsController.updatePilot
);

// Update pilot status
router.put('/:id/status', 
  authorize(['super_admin', 'admin', 'employee']), 
  idValidation, 
  statusUpdateValidation, 
  validateRequest, 
  pilotsController.updatePilotStatus
);

// Delete pilot (soft delete)
router.delete('/:id', 
  authorize(['super_admin', 'admin']), 
  idValidation, 
  validateRequest, 
  pilotsController.deletePilot
);

module.exports = router;
