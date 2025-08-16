const express = require('express');
const { body, param } = require('express-validator');
const driverInductionController = require('../controllers/driverInductionController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Validation rules
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
