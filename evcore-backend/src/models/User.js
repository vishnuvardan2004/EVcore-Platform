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
  return await bcrypt.compare(candidatePassword, userPassword);
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

module.exports = mongoose.model('User', userSchema);
