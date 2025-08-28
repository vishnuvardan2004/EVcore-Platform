const express = require('express');
const { body } = require('express-validator');
const { verifyToken, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const User = require('../models/User');

const router = express.Router();

// Validation rules for employee creation/update
const employeeValidation = [
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
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  body('role')
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

const updateEmployeeValidation = [
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
    .withMessage('Designation cannot exceed 50 characters'),
  
  body('salary')
    .optional()
    .isNumeric()
    .withMessage('Salary must be a number'),
  
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean')
];

// Apply authentication to all routes
router.use(verifyToken);

// @desc    Get all employees (excluding pilots - they have separate management)
// @route   GET /api/employees
// @access  Private (admin)
router.get('/', 
  authorize(['super_admin', 'admin']),
  async (req, res) => {
    try {
      const employees = await User.find({ 
        role: { $in: ['super_admin', 'admin', 'employee'] }, // Exclude pilots
        active: true 
      }).select('-password -refreshTokens');

      res.json({
        success: true,
        data: employees,
        total: employees.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching employees',
        error: error.message
      });
    }
  }
);

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private (admin or self)
router.get('/:id',
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)
        .select('-password -refreshTokens');

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Check if user can access this employee
      if (req.user.role !== 'super_admin' && 
          req.user.role !== 'admin' && 
          req.user.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this employee'
        });
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching employee',
        error: error.message
      });
    }
  }
);

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (admin)
router.post('/',
  authorize(['super_admin', 'admin']),
  employeeValidation,
  validateRequest,
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        mobileNumber,
        password,
        passwordConfirm,
        role,
        department,
        designation,
        employeeId,
        salary
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmailOrMobile(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or mobile number already exists'
        });
      }

      // Create new employee
      const newEmployee = await User.create({
        fullName,
        email,
        mobileNumber,
        password,
        passwordConfirm,
        role: role || 'employee',
        department,
        designation,
        employeeId,
        salary
      });

      // Remove password from response
      newEmployee.password = undefined;
      newEmployee.refreshTokens = undefined;

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: newEmployee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating employee',
        error: error.message
      });
    }
  }
);

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (admin or self)
router.put('/:id',
  updateEmployeeValidation,
  validateRequest,
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Check if user can update this employee
      if (req.user.role !== 'super_admin' && 
          req.user.role !== 'admin' && 
          req.user.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this employee'
        });
      }

      // Update employee
      const updatedEmployee = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).select('-password -refreshTokens');

      res.json({
        success: true,
        message: 'Employee updated successfully',
        data: updatedEmployee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating employee',
        error: error.message
      });
    }
  }
);

// @desc    Delete employee (soft delete)
// @route   DELETE /api/employees/:id
// @access  Private (admin only)
router.delete('/:id',
  authorize(['super_admin', 'admin']),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Soft delete by setting active to false
      employee.active = false;
      await employee.save();

      res.json({
        success: true,
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting employee',
        error: error.message
      });
    }
  }
);

module.exports = router;
