import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

// Renders the API error contract:
// { success:false, message, error:{ code, details } }
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      error: { code: err.code, details: err.details || {} },
    });
  }

  // Mongoose duplicate key.
  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: { code: 'DUPLICATE', details: err.keyValue || {} },
    });
  }

  // Mongoose validation.
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: { code: 'VALIDATION', details: Object.keys(err.errors || {}) },
    });
  }

  logger.error('Unhandled error:', err.message, err.stack);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: { code: 'INTERNAL', details: {} },
  });
}
