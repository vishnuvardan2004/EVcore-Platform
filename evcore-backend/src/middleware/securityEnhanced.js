const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const { AppError } = require('./errorHandler');
const config = require('../config');

// Enhanced security configurations

// Adaptive rate limiting based on endpoint sensitivity
const createRateLimit = (windowMs, max, message, keyGenerator = null) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip),
    skip: (req) => {
      // Skip rate limiting for local development
      if (config.isDevelopment && (
        req.ip === '127.0.0.1' || 
        req.ip === '::1' || 
        req.ip === 'localhost' ||
        req.ip?.startsWith('127.0.0.') ||
        req.ip?.startsWith('::ffff:127.0.0.')
      )) {
        return true;
      }
      return false;
    }
  });
};

// General API rate limit
const generalRateLimit = createRateLimit(
  config.security.rateLimitWindow * 60 * 1000, // Convert minutes to milliseconds
  config.security.rateLimitMax,
  'Too many requests from this IP, please try again later.'
);

// Strict authentication rate limit (per IP)
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts from this IP, please try again after 15 minutes.'
);

// Even stricter rate limit for authentication per email
const authEmailRateLimit = createRateLimit(
  30 * 60 * 1000, // 30 minutes
  3, // 3 attempts per email
  'Too many failed login attempts for this email, please try again after 30 minutes.',
  (req) => `${req.ip}-${req.body.email}` // Combine IP and email
);

// Password change rate limit
const passwordChangeRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 password changes per hour
  'Too many password change attempts, please try again after an hour.'
);

// Upload rate limit
const uploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many upload attempts from this IP, please try again after an hour.'
);

// Admin operations rate limit
const adminRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  20, // 20 admin operations per 5 minutes
  'Too many administrative operations, please wait before trying again.'
);

// Enhanced security headers with CSP
const securityHeaders = helmet({
  contentSecurityPolicy: config.isDevelopment ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      childSrc: ["'none'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// Enhanced data sanitization
const dataSanitization = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key, req }) => {
    console.warn(`Sanitized key "${key}" in request from ${req.ip}`);
  }
});

// Compression with security considerations
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Don't compress responses that might contain sensitive data
    if (req.path.includes('/auth/') && req.method === 'POST') {
      return false;
    }
    
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
});

// IP whitelist middleware for super admin operations
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (config.isDevelopment) {
      return next(); // Skip in development
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }
    
    console.warn(`Blocked IP ${clientIP} from accessing restricted endpoint ${req.path}`);
    return next(new AppError('Access denied from this IP address', 403));
  };
};

// Request fingerprinting for enhanced security
const requestFingerprint = (req, res, next) => {
  const fingerprint = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    acceptLanguage: req.get('Accept-Language'),
    acceptEncoding: req.get('Accept-Encoding'),
    timestamp: Date.now()
  };
  
  req.fingerprint = fingerprint;
  next();
};

// Suspicious activity detection
const suspiciousActivityDetection = (req, res, next) => {
  const suspiciousPatterns = [
    /admin/i,
    /password/i,
    /login/i,
    /api\/v\d+/i,
    /\.php$/i,
    /\.asp$/i,
    /wp-admin/i,
    /config/i,
    /database/i
  ];
  
  const path = req.path.toLowerCase();
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(path));
  
  if (isSuspicious && !req.path.startsWith('/api/')) {
    console.warn(`Suspicious request detected: ${req.method} ${req.path} from ${req.ip}`);
  }
  
  next();
};

// Security audit logging
const securityAuditLog = (req, res, next) => {
  // Log sensitive operations
  const sensitiveEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/change-password',
    '/api/admin-settings',
    '/api/database-mgmt'
  ];
  
  if (sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    console.log(`Security Audit: ${req.method} ${req.path} from ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  }
  
  next();
};

module.exports = {
  generalRateLimit,
  authRateLimit,
  authEmailRateLimit,
  passwordChangeRateLimit,
  uploadRateLimit,
  adminRateLimit,
  securityHeaders,
  dataSanitization,
  compressionMiddleware,
  ipWhitelist,
  requestFingerprint,
  suspiciousActivityDetection,
  securityAuditLog
};
