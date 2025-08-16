const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const config = require('../config');

// Rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General rate limit
const generalRateLimit = createRateLimit(
  config.security.rateLimitWindow * 60 * 1000, // Convert minutes to milliseconds
  config.security.rateLimitMax,
  'Too many requests from this IP, please try again later.'
);

// Auth rate limit (more strict)
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts from this IP, please try again after 15 minutes.'
);

// Upload rate limit
const uploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many upload attempts from this IP, please try again after an hour.'
);

// Security headers
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
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Data sanitization against NoSQL query injection
const dataSanitization = mongoSanitize();

// Compression middleware
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
});

module.exports = {
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  securityHeaders,
  dataSanitization,
  compressionMiddleware,
};
