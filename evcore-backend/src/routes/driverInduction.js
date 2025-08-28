const express = require('express');
const { body, param } = require('express-validator');
const driverInductionController = require('../controllers/driverInductionController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Validation rules
const inductionSubmissionValidation = [
  body('personalInfo.fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('personalInfo.emailId')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('personalInfo.mobileNumber')
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid mobile number'),
    
  body('drivingInfo.licenseNumber')
    .trim()
    .isLength({ min: 5, max: 30 })
    .withMessage('License number must be between 5 and 30 characters'),
];

const statusUpdateValidation = [
  body('status')
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be active, inactive, or pending')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid pilot ID')
];

// Routes

// Submit driver induction (creates pilot profile and user account with 'pilot' role)
router.post('/submit', 
  authorize(['super_admin', 'admin', 'employee']), 
  inductionSubmissionValidation, 
  validateRequest, 
  driverInductionController.submitDriverInduction
);

// Get all pilots for driver induction
router.get('/pilots', 
  authorize(['super_admin', 'admin', 'employee']), 
  driverInductionController.getDriverInductionPilots
);

// Get single pilot for driver induction
router.get('/pilots/:id', 
  authorize(['super_admin', 'admin', 'employee']), 
  idValidation, 
  validateRequest, 
  driverInductionController.getDriverInductionPilot
);

// Update pilot status for driver induction
router.put('/pilots/:id/status', 
  authorize(['super_admin', 'admin', 'employee']), 
  idValidation, 
  statusUpdateValidation, 
  validateRequest, 
  driverInductionController.updateDriverInductionPilotStatus
);

// Delete pilot from driver induction
router.delete('/pilots/:id', 
  authorize(['super_admin', 'admin']), 
  idValidation, 
  validateRequest, 
  driverInductionController.deleteDriverInductionPilot
);

module.exports = router;
