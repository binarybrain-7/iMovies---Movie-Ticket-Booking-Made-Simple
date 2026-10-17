const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.statusCode = err.statusCode || 500;
  error.code = err.code || 'INTERNAL_ERROR';

  // Log error with route and method
  logger.error(`[Error] ${req.method} ${req.originalUrl} - ${err.message}`, err);

  // Mongoose bad ObjectId CastError
  if (err.name === 'CastError') {
    const message = `Invalid resource identifier: ${err.value}`;
    return sendError(res, message, 400, 'INVALID_ID');
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `A record with this ${field} already exists`;
    return sendError(res, message, 409, 'DUPLICATE_KEY', { field });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    const message =
      errors.length > 0
        ? `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        : 'Validation failed';
    return sendError(res, message, 400, 'VALIDATION_ERROR', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired', 401, 'EXPIRED_TOKEN');
  }

  // Application custom errors
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code, err.errors);
  }

  // Generic 500 fallback
  const isProduction = process.env.NODE_ENV === 'production';
  return sendError(
    res,
    isProduction ? 'Internal server error' : err.message || 'Internal server error',
    error.statusCode,
    'INTERNAL_SERVER_ERROR'
  );
};

module.exports = errorHandler;
