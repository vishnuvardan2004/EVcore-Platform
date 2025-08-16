const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const RolePermission = require('../models/RolePermission');
const config = require('../config');
const logger = require('../utils/logger');

// Helper function to create and send token
const createSendToken = async (user, statusCode, res, message = 'Success') => {
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  
  await user.save({ validateBeforeSave: false });

  // Remove password from output
  user.password = undefined;
  user.refreshTokens = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        department: user.department,
        designation: user.designation,
        verified: user.verified,
        lastLogin: user.lastLogin
      }
    }
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public (but restricted in production)
const register = catchAsync(async (req, res, next) => {
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
    return next(new AppError('User with this email or mobile number already exists', 400));
  }

  // In production, only super_admin can create other users
  if (config.isProduction && req.user && req.user.role !== 'super_admin') {
    return next(new AppError('Only super admin can register new users', 403));
  }

  // Create new user
  const newUser = await User.create({
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

  logger.info('New user registered', {
    userId: newUser._id,
    email: newUser.email,
    role: newUser.role,
    registeredBy: req.user ? req.user.id : 'self'
  });

  // Create default role permissions if they don't exist
  let rolePermissions = await RolePermission.findOne({ role: newUser.role });
  if (!rolePermissions) {
    const defaultPermissions = RolePermission.getDefaultPermissions(newUser.role);
    if (defaultPermissions) {
      rolePermissions = await RolePermission.create({
        role: newUser.role,
        modules: defaultPermissions.modules,
        createdBy: newUser._id
      });
    }
  }

  createSendToken(newUser, 201, res, 'User registered successfully');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists and password is correct
  const user = await User.findByEmailOrMobile(email).select('+password +active +loginAttempts +lockUntil');

  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Check if account is locked
  if (user.isLocked) {
    return next(new AppError('Account temporarily locked due to too many failed login attempts', 423));
  }

  // 4) Check if account is active
  if (!user.active) {
    return next(new AppError('Your account has been deactivated. Please contact administrator.', 401));
  }

  // 5) Verify password
  const isPasswordCorrect = await user.correctPassword(password, user.password);

  if (!isPasswordCorrect) {
    // Increment login attempts
    await user.incLoginAttempts();
    
    logger.warn('Failed login attempt', {
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      attempts: user.loginAttempts + 1
    });

    return next(new AppError('Incorrect email or password', 401));
  }

  // 6) If password is correct, reset login attempts and update last login
  if (user.loginAttempts && user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info('User logged in', {
    userId: user._id,
    email: user.email,
    role: user.role,
    ip: req.ip
  });

  // 7) Send token
  createSendToken(user, 200, res, 'Login successful');
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id).select('+refreshTokens +active');

    if (!user) {
      return next(new AppError('Invalid refresh token', 401));
    }

    if (!user.active) {
      return next(new AppError('Account deactivated', 401));
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(token => token.token === refreshToken);
    
    if (!tokenExists) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new tokens
    const newToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    // Remove old refresh token
    user.invalidateRefreshToken(refreshToken);

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove specific refresh token
    req.user.invalidateRefreshToken(refreshToken);
  } else {
    // Remove all refresh tokens
    req.user.invalidateAllRefreshTokens();
  }

  await req.user.save({ validateBeforeSave: false });

  logger.info('User logged out', {
    userId: req.user._id,
    email: req.user.email
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        department: user.department,
        designation: user.designation,
        employeeId: user.employeeId,
        joiningDate: user.joiningDate,
        verified: user.verified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = catchAsync(async (req, res, next) => {
  const {
    fullName,
    mobileNumber,
    department,
    designation
  } = req.body;

  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (mobileNumber) updateData.mobileNumber = mobileNumber;
  if (department) updateData.department = department;
  if (designation) updateData.designation = designation;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  logger.info('User profile updated', {
    userId: user._id,
    email: user.email,
    updatedFields: Object.keys(updateData)
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return next(new AppError('Please provide current password, new password and confirm password', 400));
  }

  if (newPassword !== newPasswordConfirm) {
    return next(new AppError('New password and confirm password do not match', 400));
  }

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isCurrentPasswordCorrect = await user.correctPassword(currentPassword, user.password);
  
  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  
  // Invalidate all refresh tokens to force re-login
  user.invalidateAllRefreshTokens();
  
  await user.save();

  logger.info('User password changed', {
    userId: user._id,
    email: user.email
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in again.'
  });
});

// @desc    Verify token (for frontend to check if token is valid)
// @route   GET /api/auth/verify
// @access  Private
const verifyToken = catchAsync(async (req, res, next) => {
  // Get user role permissions
  const rolePermissions = await RolePermission.findOne({ role: req.user.role });

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        permissions: rolePermissions ? rolePermissions.modules : []
      }
    }
  });
});

// @desc    Verify token endpoint (standalone token verification)
// @route   GET /api/auth/verify
// @access  Public (handles its own token verification)
const verifyTokenEndpoint = catchAsync(async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please log in to get access.'
      });
    }

    // 2) Verification token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      });
    }

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+active');
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // 4) Check if user account is active
    if (!currentUser.active) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // 5) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'User recently changed password! Please log in again.'
      });
    }

    // 6) Get user role permissions
    const rolePermissions = await RolePermission.findOne({ role: currentUser.role });

    // 7) Return success response
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: currentUser._id,
          fullName: currentUser.fullName,
          email: currentUser.email,
          role: currentUser.role,
          permissions: rolePermissions ? rolePermissions.modules : []
        }
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token verification.'
    });
  }
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  verifyToken,
  verifyTokenEndpoint
};
