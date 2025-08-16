const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Middleware to check validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return next(new AppError('Validation failed', 400, true, errorMessages));
  }
  
  next();
};

module.exports = {
  validateRequest
};
