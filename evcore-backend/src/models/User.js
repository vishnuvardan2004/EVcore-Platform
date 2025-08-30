const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

const userSchema = new mongoose.Schema({
  // Personal Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please provide a valid mobile number']
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Password Security Fields
  isTemporaryPassword: {
    type: Boolean,
    default: false
  },
  
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  
  passwordHistory: [{
    password: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Role and Permissions
  // Employees can have: super_admin, admin, employee (default)
  // Pilots always have: pilot (set automatically)
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'employee', 'pilot'],
    default: 'employee',
    required: true
  },
  
  // Employee Details
  employeeId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values to be non-unique
    trim: true
  },
  
  // EVZIP Unique Identifier (auto-generated)
  evzipId: {
    type: String,
    unique: true,
    required: [true, 'EVZIP ID is required'],
    trim: true,
    index: true
  },
  
  // Username for login (auto-generated)
  username: {
    type: String,
    unique: true,
    required: [true, 'Username is required'],
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  
  // Reference to Employee document
  employeeRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    sparse: true
  },
  
  // Reference to Pilot document  
  pilotRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pilot',
    sparse: true
  },
  
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot exceed 50 characters']
  },
  
  designation: {
    type: String,
    trim: true,
    maxlength: [50, 'Designation cannot exceed 50 characters']
  },
  
  joiningDate: {
    type: Date,
    default: Date.now
  },
  
  salary: {
    type: Number,
    min: [0, 'Salary cannot be negative']
  },
  
  // Status and Flags
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Metadata
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: Date,
  
  // Refresh Token for JWT
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days in seconds
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  suppressReservedKeysWarning: true
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  console.log('🔒 Password Hashing Middleware:', {
    email: this.email,
    role: this.role,
    originalPassword: this.password,
    isNewUser: this.isNew,
    passwordModified: this.isModified('password')
  });

  // Save previous password to history (keep last 5)
  if (!this.isNew && this.password) {
    this.passwordHistory.push({
      password: this.password,
      createdAt: new Date()
    });
    
    // Keep only last 5 passwords
    if (this.passwordHistory.length > 5) {
      this.passwordHistory = this.passwordHistory.slice(-5);
    }
  }

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, config.security.bcryptRounds);

  console.log('🔐 Password Hashed Successfully:', {
    email: this.email,
    hashedPasswordLength: this.password.length,
    bcryptRounds: config.security.bcryptRounds
  });

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// Pre-save middleware to set passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  
  // Reset temporary password flags when password is changed
  if (this.isTemporaryPassword || this.mustChangePassword) {
    this.isTemporaryPassword = false;
    this.mustChangePassword = false;
  }
  
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  console.log('🔐 Password Comparison Debug:', {
    candidatePassword: candidatePassword,
    candidatePasswordLength: candidatePassword ? candidatePassword.length : 0,
    userPasswordHash: userPassword ? userPassword.substring(0, 20) + '...' : 'null',
    userPasswordLength: userPassword ? userPassword.length : 0,
    userEmail: this.email,
    userRole: this.role,
    isTemporaryPassword: this.isTemporaryPassword
  });
  
  const result = await bcrypt.compare(candidatePassword, userPassword);
  
  console.log('🔐 Password Comparison Result:', {
    userEmail: this.email,
    candidatePassword: candidatePassword,
    passwordMatches: result
  });
  
  return result;
};

// Instance method to check if password was used recently
userSchema.methods.isPasswordReused = async function(newPassword) {
  for (const oldPasswordEntry of this.passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, oldPasswordEntry.password);
    if (isMatch) {
      return true;
    }
  }
  return false;
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
    fullName: this.fullName
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    { id: this._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpire }
  );

  // Add to user's refresh tokens array
  this.refreshTokens.push({ token: refreshToken });

  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }

  return refreshToken;
};

// Instance method to invalidate refresh token
userSchema.methods.invalidateRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(
    refreshToken => refreshToken.token !== token
  );
};

// Instance method to invalidate all refresh tokens
userSchema.methods.invalidateAllRefreshTokens = function() {
  this.refreshTokens = [];
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Instance method to create email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Instance method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find user by email or mobile
userSchema.statics.findByEmailOrMobile = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier },
      { mobileNumber: identifier }
    ]
  });
};

// Static method to validate employee roles
userSchema.statics.validateEmployeeRole = function(role) {
  const allowedEmployeeRoles = ['super_admin', 'admin', 'employee'];
  return allowedEmployeeRoles.includes(role);
};

// Static method to get allowed employee roles
userSchema.statics.getAllowedEmployeeRoles = function() {
  return ['super_admin', 'admin', 'employee'];
};

// Static method to generate EVZIP ID
userSchema.statics.generateEVZIPId = async function(role) {
  const prefixes = {
    super_admin: 'EVSA',
    admin: 'EVAD', 
    employee: 'EVEM',
    pilot: 'EVPI'
  };
  
  const prefix = prefixes[role] || 'EVEM';
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.random().toString(36).substr(2, 4).toUpperCase(); // Random 4 chars
  
  let evzipId;
  let attempts = 0;
  const maxAttempts = 10;
  
  // Ensure uniqueness
  do {
    evzipId = `${prefix}${timestamp}${random}${attempts.toString().padStart(2, '0')}`;
    const existing = await this.findOne({ evzipId });
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique EVZIP ID');
  }
  
  return evzipId;
};

// Static method to generate username
userSchema.statics.generateUsername = async function(fullName, email) {
  const nameParts = fullName.toLowerCase().split(' ').filter(part => part.length > 0);
  const firstName = nameParts[0] || '';
  const lastName = nameParts[nameParts.length - 1] || '';
  const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const baseVariations = [
    `${firstName}.${lastName}`,
    `${firstName}${lastName}`,
    emailPrefix,
    `${firstName}${Math.random().toString(36).substr(2, 3)}`,
    `${emailPrefix}${Math.random().toString(36).substr(2, 2)}`
  ].filter(v => v.length >= 3);
  
  // Try each variation, ensuring uniqueness
  for (const base of baseVariations) {
    let username = base;
    let counter = 0;
    
    while (counter < 10) {
      const existing = await this.findOne({ username });
      if (!existing) {
        return username;
      }
      counter++;
      username = `${base}${counter}`;
    }
  }
  
  // Fallback if all variations are taken
  return `user${Date.now().toString().slice(-8)}`;
};

// Static method to generate unique mobile number
userSchema.statics.generateUniqueMobileNumber = async function() {
  let mobileNumber;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    // Generate a random 10-digit mobile number starting with 6, 7, 8, or 9
    const prefix = [6, 7, 8, 9][Math.floor(Math.random() * 4)];
    const suffix = Math.floor(100000000 + Math.random() * 900000000); // 9 digits
    mobileNumber = `${prefix}${suffix}`;
    
    const existing = await this.findOne({ mobileNumber });
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    // Fallback to timestamp-based number to ensure uniqueness
    const timestamp = Date.now().toString();
    mobileNumber = `9${timestamp.slice(-9)}`;
  }
  
  return mobileNumber;
};

// Static method to generate default password
userSchema.statics.generateDefaultPassword = function() {
  // Use configurable default password from environment variable
  // If not set, fallback to "Welcome123!"
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'Welcome123!';
  
  // Add logging to track password generation
  console.log('🔐 Password Generation:', {
    environmentVariable: process.env.DEFAULT_USER_PASSWORD,
    finalPassword: defaultPassword,
    source: process.env.DEFAULT_USER_PASSWORD ? 'Environment Variable' : 'Fallback Default'
  });
  
  return defaultPassword;
};

// Static method to create user account for Employee
userSchema.statics.createAccountForEmployee = async function(employeeData, createdBy) {
  try {
    console.log('🚀 Starting Employee Account Creation:', {
      employeeName: employeeData.fullName,
      employeeEmail: employeeData.email,
      providedRole: employeeData.role,
      createdBy: createdBy
    });

    // Validate and assign role
    let role = 'employee'; // default role
    if (employeeData.role) {
      if (!this.validateEmployeeRole(employeeData.role)) {
        const allowedRoles = this.getAllowedEmployeeRoles();
        throw new Error(`Invalid role '${employeeData.role}'. Allowed roles for employees: ${allowedRoles.join(', ')}`);
      }
      role = employeeData.role;
    }

    console.log('✅ Role Assignment:', {
      finalRole: role,
      wasRoleProvided: !!employeeData.role,
      originalRole: employeeData.role
    });
    
    const evzipId = await this.generateEVZIPId(role);
    const username = await this.generateUsername(employeeData.fullName, employeeData.email);
    const defaultPassword = this.generateDefaultPassword();
    const mobileNumber = employeeData.contactNumber || await this.generateUniqueMobileNumber();

    console.log('🔑 Account Details Generated:', {
      evzipId,
      username,
      email: employeeData.email,
      role,
      mobileNumber,
      passwordFromGenerator: defaultPassword,
      isTemporaryPassword: true,
      mustChangePassword: true
    });
    
    const userData = {
      evzipId,
      username,
      email: employeeData.email,
      fullName: employeeData.fullName,
      mobileNumber,
      password: defaultPassword,
      passwordConfirm: defaultPassword,
      role,
      employeeId: employeeData.employeeId,
      employeeRef: employeeData._id,
      department: employeeData.department,
      designation: employeeData.position || employeeData.designation,
      isTemporaryPassword: true,
      mustChangePassword: true,
      createdBy
    };
    
    const user = new this(userData);
    await user.save();

    console.log('✅ User Account Created Successfully:', {
      userId: user._id,
      evzipId: user.evzipId,
      username: user.username,
      email: user.email,
      role: user.role,
      isTemporaryPassword: user.isTemporaryPassword,
      mustChangePassword: user.mustChangePassword,
      passwordWasHashed: user.password !== defaultPassword, // Should be true after bcrypt
      originalPassword: defaultPassword
    });
    
    return {
      user,
      credentials: {
        evzipId,
        username,
        email: employeeData.email,
        defaultPassword,
        isTemporaryPassword: true
      }
    };
  } catch (error) {
    throw new Error(`Failed to create user account for employee: ${error.message}`);
  }
};

// Static method to create user account for Pilot
userSchema.statics.createAccountForPilot = async function(pilotData, createdBy) {
  try {
    const role = 'pilot';
    const evzipId = await this.generateEVZIPId(role);
    const username = await this.generateUsername(pilotData.fullName, pilotData.email);
    const defaultPassword = this.generateDefaultPassword();
    const mobileNumber = pilotData.contactNumber || await this.generateUniqueMobileNumber();
    
    const userData = {
      evzipId,
      username, 
      email: pilotData.email,
      fullName: pilotData.fullName,
      mobileNumber,
      password: defaultPassword,
      passwordConfirm: defaultPassword,
      role,
      employeeId: pilotData.pilotId,
      pilotRef: pilotData._id,
      department: 'Operations',
      designation: 'Pilot',
      isTemporaryPassword: true,
      mustChangePassword: true,
      createdBy
    };
    
    const user = new this(userData);
    await user.save();
    
    return {
      user,
      credentials: {
        evzipId,
        username,
        email: pilotData.email,
        defaultPassword,
        isTemporaryPassword: true
      }
    };
  } catch (error) {
    throw new Error(`Failed to create user account for pilot: ${error.message}`);
  }
};

module.exports = mongoose.model('User', userSchema);
