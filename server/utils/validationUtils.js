/**
 * Input Validation Utilities
 */

/**
 * Validate email format
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
exports.isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate MongoDB ObjectId
 */
exports.isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate username format
 */
exports.isValidUsername = (username) => {
  // Username: 3-30 characters, alphanumeric + underscore/hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

/**
 * Validate phone number (basic)
 */
exports.isValidPhoneNumber = (phone) => {
  // Accept formats like +1234567890, 1234567890, etc
  const phoneRegex = /^[\d+\-\s()]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Sanitize input to prevent injection attacks
 */
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
};

/**
 * Validate message content
 */
exports.isValidMessageContent = (content) => {
  if (typeof content !== 'string') return false;
  if (content.trim().length === 0) return false;
  if (content.length > 5000) return false; // Max 5000 chars
  return true;
};

/**
 * Validate chat/group name
 */
exports.isValidGroupName = (name) => {
  if (typeof name !== 'string') return false;
  if (name.trim().length < 1) return false;
  if (name.length > 100) return false;
  return true;
};

module.exports = exports;
