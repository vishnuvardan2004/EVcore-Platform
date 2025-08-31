const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken, authorize } = require('../middleware/auth');
const { 
  authRateLimit, 
  authEmailRateLimit, 
  passwordChangeRateLimit,
  requestFingerprint,
  securityAuditLog
} = require('../middleware/securityEnhanced');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('mobileNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid mobile number'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  body('role')
    .optional()
    .isIn(['super_admin', 'admin', 'employee', 'pilot'])
    .withMessage('Invalid role'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department cannot exceed 50 characters'),
  
  body('designation')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Designation cannot exceed 50 characters'),
  
  body('employeeId')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Employee ID cannot exceed 20 characters'),
  
  body('salary')
    .optional()
    .isNumeric()
    .withMessage('Salary must be a number')
];

const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('newPasswordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('mobileNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid mobile number'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department cannot exceed 50 characters'),
  
  body('designation')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Designation cannot exceed 50 characters')
];

// Public routes with enhanced security
router.post('/register', 
  authRateLimit, 
  requestFingerprint,
  securityAuditLog,
  registerValidation, 
  validateRequest, 
  authController.register
);

router.post('/login', 
  authRateLimit, 
  authEmailRateLimit,
  requestFingerprint,
  securityAuditLog,
  loginValidation, 
  validateRequest, 
  authController.login
);

router.post('/refresh', 
  authRateLimit, 
  refreshTokenValidation, 
  validateRequest, 
  authController.refreshToken
);

// Token verification route (needs special handling)
router.get('/verify', authController.verifyTokenEndpoint);

// Protected routes
router.use(verifyToken); // Apply authentication to all routes below

router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.put('/profile', updateProfileValidation, validateRequest, authController.updateProfile);
router.put('/change-password', 
  passwordChangeRateLimit,
  securityAuditLog,
  changePasswordValidation, 
  validateRequest, 
  authController.changePassword
);

router.put('/first-login-password-change', 
  passwordChangeRateLimit,
  securityAuditLog,
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('newPasswordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  validateRequest, 
  authController.firstLoginPasswordChange
);

module.exports = router;
