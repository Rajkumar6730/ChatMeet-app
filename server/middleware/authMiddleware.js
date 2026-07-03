// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Access denied.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.userId)
            .select('-password -refreshToken -__v');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Invalid token.'
            });
        }

        // Check if user is blocked or deleted
        if (user.isDeleted) {
            return res.status(403).json({
                success: false,
                message: 'User account is deactivated.'
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

/**
 * Optional Authentication Middleware (KEPT from OLD)
 * Verifies token if present but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const user = await User.findById(decoded.userId)
                .select('-password -refreshToken -__v');
            
            if (user && !user.isDeleted) {
                req.user = user;
                req.userId = user._id;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

/**
 * Role-based Authorization (KEPT from OLD)
 * Checks if user has required role
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions.'
            });
        }

        next();
    };
};

// ==================== NEW BLOCKING MIDDLEWARE ====================

/**
 * NEW: Check if user is blocked by target user
 * This middleware checks if the authenticated user is blocked by the target user
 * @param {Function|string} getTargetUserId - Function to get target ID or string
 * @returns {Function} Express middleware
 */
const checkBlocked = (getTargetUserId) => {
    return async (req, res, next) => {
        try {
            const userId = req.userId;
            
            // Get target user ID
            let targetId;
            if (typeof getTargetUserId === 'function') {
                targetId = getTargetUserId(req);
            } else if (typeof getTargetUserId === 'string') {
                // Check if it's a param name
                targetId = req.params[getTargetUserId] || req.body[getTargetUserId] || req.query[getTargetUserId];
            } else {
                targetId = req.params.userId || req.body.userId || req.query.userId;
            }

            if (!targetId) {
                return next();
            }

            // Get target user
            const targetUser = await User.findById(targetId);
            if (!targetUser) {
                return next();
            }

            // Check if target user has blocked the current user
            if (targetUser.blockedUsers && targetUser.blockedUsers.includes(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'You are blocked by this user',
                    blocked: true,
                    blockedBy: targetId
                });
            }

            // Check if current user has blocked the target user
            const currentUser = await User.findById(userId);
            if (currentUser && currentUser.blockedUsers && currentUser.blockedUsers.includes(targetId)) {
                return res.status(403).json({
                    success: false,
                    message: 'You have blocked this user',
                    blocked: true,
                    blockedUser: targetId
                });
            }

            // Check if it's a mutual block
            if (targetUser.blockedUsers && targetUser.blockedUsers.includes(userId) && 
                currentUser && currentUser.blockedUsers && currentUser.blockedUsers.includes(targetId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Mutual block detected',
                    blocked: true,
                    mutual: true
                });
            }

            next();
        } catch (error) {
            console.error('Check blocked error:', error);
            // Continue to next middleware even on error
            next();
        }
    };
};

/**
 * NEW: Check if user has blocked target user
 * @param {Function|string} getTargetUserId - Function to get target ID or string
 * @returns {Function} Express middleware
 */
const checkIfBlocked = (getTargetUserId) => {
    return async (req, res, next) => {
        try {
            const userId = req.userId;
            
            let targetId;
            if (typeof getTargetUserId === 'function') {
                targetId = getTargetUserId(req);
            } else if (typeof getTargetUserId === 'string') {
                targetId = req.params[getTargetUserId] || req.body[getTargetUserId] || req.query[getTargetUserId];
            } else {
                targetId = req.params.userId || req.body.userId || req.query.userId;
            }

            if (!targetId) {
                return next();
            }

            const currentUser = await User.findById(userId);
            if (currentUser && currentUser.blockedUsers && currentUser.blockedUsers.includes(targetId)) {
                return res.status(403).json({
                    success: false,
                    message: 'You have blocked this user',
                    blocked: true
                });
            }

            next();
        } catch (error) {
            console.error('Check if blocked error:', error);
            next();
        }
    };
};

/**
 * NEW: Check if user is blocked by target user
 * @param {Function|string} getTargetUserId - Function to get target ID or string
 * @returns {Function} Express middleware
 */
const checkIfBlockedBy = (getTargetUserId) => {
    return async (req, res, next) => {
        try {
            const userId = req.userId;
            
            let targetId;
            if (typeof getTargetUserId === 'function') {
                targetId = getTargetUserId(req);
            } else if (typeof getTargetUserId === 'string') {
                targetId = req.params[getTargetUserId] || req.body[getTargetUserId] || req.query[getTargetUserId];
            } else {
                targetId = req.params.userId || req.body.userId || req.query.userId;
            }

            if (!targetId) {
                return next();
            }

            const targetUser = await User.findById(targetId);
            if (targetUser && targetUser.blockedUsers && targetUser.blockedUsers.includes(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'You are blocked by this user',
                    blocked: true
                });
            }

            next();
        } catch (error) {
            console.error('Check if blocked by error:', error);
            next();
        }
    };
};

/**
 * NEW: Check if users can interact (no blocks either way)
 * @param {Function|string} getTargetUserId - Function to get target ID or string
 * @returns {Function} Express middleware
 */
const checkCanInteract = (getTargetUserId) => {
    return async (req, res, next) => {
        try {
            const userId = req.userId;
            
            let targetId;
            if (typeof getTargetUserId === 'function') {
                targetId = getTargetUserId(req);
            } else if (typeof getTargetUserId === 'string') {
                targetId = req.params[getTargetUserId] || req.body[getTargetUserId] || req.query[getTargetUserId];
            } else {
                targetId = req.params.userId || req.body.userId || req.query.userId;
            }

            if (!targetId) {
                return next();
            }

            const [currentUser, targetUser] = await Promise.all([
                User.findById(userId),
                User.findById(targetId)
            ]);

            if (!currentUser || !targetUser) {
                return next();
            }

            const isBlocked = currentUser.blockedUsers && currentUser.blockedUsers.includes(targetId);
            const isBlockedBy = targetUser.blockedUsers && targetUser.blockedUsers.includes(userId);

            if (isBlocked || isBlockedBy) {
                return res.status(403).json({
                    success: false,
                    message: isBlocked && isBlockedBy ? 'Mutual block detected' : 
                             isBlocked ? 'You have blocked this user' : 'You are blocked by this user',
                    blocked: true,
                    blockedBy: isBlockedBy,
                    blockedUser: isBlocked
                });
            }

            next();
        } catch (error) {
            console.error('Check can interact error:', error);
            next();
        }
    };
};

/**
 * NEW: Enhanced auth middleware with block check
 * Combines authentication with block checking
 */
const authWithBlockCheck = (getTargetUserId) => {
    return async (req, res, next) => {
        // First run auth middleware
        await authMiddleware(req, res, async (err) => {
            if (err) return next(err);
            // Then check blocks
            await checkBlocked(getTargetUserId)(req, res, next);
        });
    };
};

module.exports = {
    // Old exports (KEPT)
    authMiddleware,
    optionalAuth,
    authorize,
    
    // New exports
    checkBlocked,
    checkIfBlocked,
    checkIfBlockedBy,
    checkCanInteract,
    authWithBlockCheck,
};