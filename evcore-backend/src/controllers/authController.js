const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const RolePermission = require('../models/RolePermission');
const config = require('../config');
const logger = require('../utils/logger');

// Helper function to create and send token with secure cookies
const createSendToken = async (user, statusCode, res, message = 'Success') => {
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  
  await user.save({ validateBeforeSave: false });

  // Set httpOnly cookies for tokens
  const cookieOptions = {
    httpOnly: true,
    secure: config.isProduction, // Only send over HTTPS in production
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours for access token
  };

  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
  };

  // Set secure cookies
  res.cookie('accessToken', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);

  // Remove password and tokens from output
  user.password = undefined;
  user.refreshTokens = undefined;

  // Check if this is first login (password change required)
  const requirePasswordChange = user.isTemporaryPassword || user.mustChangePassword;

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      // Still send token for non-cookie clients (mobile apps)
      token: config.isDevelopment ? token : undefined,
      refreshToken: config.isDevelopment ? refreshToken : undefined,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        department: user.department,
        designation: user.designation,
        verified: user.verified,
        lastLogin: user.lastLogin,
        requirePasswordChange
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
  let refreshToken = req.body.refreshToken;
  
  // Check for refresh token in cookies if not in body
  if (!refreshToken && req.cookies && req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  }

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
      // Potential token theft - invalidate all refresh tokens
      user.invalidateAllRefreshTokens();
      await user.save({ validateBeforeSave: false });
      
      logger.warn('Potential token theft detected - all refresh tokens invalidated', {
        userId: user._id,
        email: user.email,
        ip: req.ip
      });
      
      return next(new AppError('Invalid refresh token - security breach detected', 401));
    }

    // Generate new tokens (rotation)
    const newToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    // Remove old refresh token
    user.invalidateRefreshToken(refreshToken);

    await user.save({ validateBeforeSave: false });

    // Set new secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };

    const refreshCookieOptions = {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie('accessToken', newToken, cookieOptions);
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    logger.info('Token refreshed successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        // Only send tokens in response for development/mobile
        token: config.isDevelopment ? newToken : undefined,
        refreshToken: config.isDevelopment ? newRefreshToken : undefined
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
  let refreshToken = req.body.refreshToken;
  
  // Check for refresh token in cookies if not in body
  if (!refreshToken && req.cookies && req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  }

  if (refreshToken) {
    // Remove specific refresh token
    req.user.invalidateRefreshToken(refreshToken);
  } else {
    // Remove all refresh tokens
    req.user.invalidateAllRefreshTokens();
  }

  await req.user.save({ validateBeforeSave: false });

  // Clear secure cookies
  const cookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

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
  const user = await User.findById(req.user.id).select('+password +passwordHistory');

  // Check current password (unless it's a temporary password change)
  if (!user.isTemporaryPassword && !user.mustChangePassword) {
    const isCurrentPasswordCorrect = await user.correctPassword(currentPassword, user.password);
    
    if (!isCurrentPasswordCorrect) {
      return next(new AppError('Current password is incorrect', 401));
    }
  }

  // Check if new password was used recently
  const isPasswordReused = await user.isPasswordReused(newPassword);
  if (isPasswordReused) {
    return next(new AppError('You cannot reuse a recent password. Please choose a different password.', 400));
  }

  // Update password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  
  // Invalidate all refresh tokens to force re-login
  user.invalidateAllRefreshTokens();
  
  await user.save();

  logger.info('User password changed', {
    userId: user._id,
    email: user.email,
    wasTemporary: user.isTemporaryPassword || user.mustChangePassword
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in again.'
  });
});

// @desc    First login password change (for temporary passwords)
// @route   PUT /api/auth/first-login-password-change
// @access  Private
const firstLoginPasswordChange = catchAsync(async (req, res, next) => {
  const { newPassword, newPasswordConfirm } = req.body;

  if (!newPassword || !newPasswordConfirm) {
    return next(new AppError('Please provide new password and confirm password', 400));
  }

  if (newPassword !== newPasswordConfirm) {
    return next(new AppError('New password and confirm password do not match', 400));
  }

  // Get user with password
  const user = await User.findById(req.user.id).select('+password +passwordHistory +isTemporaryPassword +mustChangePassword');

  // Verify this is indeed a first login scenario
  if (!user.isTemporaryPassword && !user.mustChangePassword) {
    return next(new AppError('Password change not required for this account', 400));
  }

  // Check if new password was used recently
  const isPasswordReused = await user.isPasswordReused(newPassword);
  if (isPasswordReused) {
    return next(new AppError('You cannot reuse a recent password. Please choose a different password.', 400));
  }

  // Update password and clear temporary flags
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  user.isTemporaryPassword = false;
  user.mustChangePassword = false;
  
  // Invalidate all refresh tokens
  user.invalidateAllRefreshTokens();
  
  await user.save();

  logger.info('First login password changed', {
    userId: user._id,
    email: user.email
  });

  res.status(200).json({
    success: true,
    message: 'Password updated successfully. Please log in with your new password.'
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
  firstLoginPasswordChange,
  verifyToken,
  verifyTokenEndpoint
};
