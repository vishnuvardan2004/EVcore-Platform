const jwt = require('jsonwebtoken');
const { AppError, catchAsync } = require('./errorHandler');
const User = require('../models/User');
const RolePermission = require('../models/RolePermission');
const config = require('../config');

// Verify JWT Token (supports both cookies and bearer tokens)
const verifyToken = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  
  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in httpOnly cookies (more secure)
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verification token
  const decoded = jwt.verify(token, config.jwt.secret);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id).select('+active');
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // 4) Check if user account is active
  if (!currentUser.active) {
    return next(new AppError('Your account has been deactivated. Please contact administrator.', 401));
  }

  // 5) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

// Authorize based on roles
const authorize = (...roles) => {
  return (req, res, next) => {
    // Flatten the roles array in case it's passed as a single array argument
    const flatRoles = roles.flat();
    
    console.log('🔐 Authorization check:', {
      userRole: req.user?.role,
      userEmail: req.user?.email,
      allowedRoles: flatRoles,
      endpoint: req.path
    });

    if (!req.user) {
      console.log('❌ No user found in request');
      return next(new AppError('Authentication required', 401));
    }

    if (!flatRoles.includes(req.user.role)) {
      console.log('❌ Authorization failed:', {
        userRole: req.user.role,
        allowedRoles: flatRoles,
        message: `User with role '${req.user.role}' not in allowed roles: [${flatRoles.join(', ')}]`
      });
      return next(new AppError(`Access denied. Required roles: ${flatRoles.join(', ')}. Your role: ${req.user.role}`, 403));
    }

    console.log('✅ Authorization successful for role:', req.user.role);
    next();
  };
};

// Check if user can access specific modules based on role permissions
const checkModuleAccess = (moduleName) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;
    
    // Super admin has access to everything
    if (user.role === 'super_admin') {
      return next();
    }

    // Check if user's role has access to this module
    const rolePermissions = await RolePermission.findOne({ role: user.role });
    
    if (!rolePermissions) {
      return next(new AppError('Role permissions not found', 403));
    }

    const moduleAccess = rolePermissions.modules.find(m => m.name === moduleName);
    
    if (!moduleAccess || !moduleAccess.enabled) {
      return next(new AppError(`Access denied to ${moduleName} module`, 403));
    }

    // Check specific permissions within the module
    req.modulePermissions = moduleAccess.permissions;
    next();
  });
};

// Check specific permission within a module
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.modulePermissions || !req.modulePermissions.includes(permission)) {
      return next(new AppError(`Insufficient permissions for ${permission}`, 403));
    }
    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const currentUser = await User.findById(decoded.id).select('+active');
      
      if (currentUser && currentUser.active && !currentUser.changedPasswordAfter(decoded.iat)) {
        req.user = currentUser;
      }
    } catch (error) {
      // Token invalid, but we don't fail - just continue without user
    }
  }

  next();
});

module.exports = {
  verifyToken,
  authorize,
  checkModuleAccess,
  checkPermission,
  optionalAuth,
};
