const logger = require('../utils/logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: req.query,
    body: req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' 
      ? sanitizeBody(req.body) 
      : undefined,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log response details
    logger.logRequest(req, res, responseTime);
    
    // Call original end function
    originalEnd.call(res, chunk, encoding);
  };

  next();
};

// Sanitize request body for logging (remove sensitive data)
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = ['password', 'confirmPassword', 'token', 'secret'];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

module.exports = requestLogger;
