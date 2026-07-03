/**
 * API Response Utilities
 * Ensures all API responses follow a consistent format
 */

/**
 * Generate error ID for tracking
 */
const generateErrorId = () => Math.random().toString(36).substr(2, 9).toUpperCase();

/**
 * Success Response
 */
exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Error Response
 */
exports.errorResponse = (res, message, statusCode = 500, details = null) => {
  const errorId = generateErrorId();
  
  // Log error with ID for server-side debugging
  console.error(`[${errorId}] Error (${statusCode}): ${message}`, details);

  res.status(statusCode).json({
    success: false,
    message,
    errorId,
    ...(process.env.NODE_ENV === 'development' && details && { details })
  });
};

/**
 * Validation Error Response
 */
exports.validationError = (res, errors, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    message: 'Validation failed',
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

/**
 * Not Found Response
 */
exports.notFoundResponse = (res, message = 'Resource not found') => {
  res.status(404).json({
    success: false,
    message
  });
};

/**
 * Unauthorized Response
 */
exports.unauthorizedResponse = (res, message = 'Unauthorized access') => {
  res.status(401).json({
    success: false,
    message
  });
};

/**
 * Forbidden Response
 */
exports.forbiddenResponse = (res, message = 'Access forbidden') => {
  res.status(403).json({
    success: false,
    message
  });
};

/**
 * Paginated Response
 */
exports.paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  const pages = Math.ceil(total / limit);
  
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages,
      hasMore: page < pages
    }
  });
};

module.exports = exports;
