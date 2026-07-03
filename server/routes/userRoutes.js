const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    getUsers,
    getUserById,
    updateProfile,
    updateProfilePicture,
    deleteAccount,
    searchUsers,
    getUserStatus,
    updateUserStatus,
    addToFavorites,
    removeFromFavorites,
    blockUser,
    unblockUser,
    getBlockedUsers,
    updateSettings,
    checkBlockStatus,
    updateTheme,
    uploadWallpaper
} = require('../controllers/userController');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/users
 * @desc    Get all users (excluding current user)
 * @access  Private
 */
router.get('/', getUsers);

/**
 * @route   GET /api/users/search
 * @desc    Search users by username or email
 * @access  Private
 */
router.get('/search', searchUsers);

/**
 * @route   GET /api/users/status
 * @desc    Get all users status
 * @access  Private
 */
router.get('/status', getUserStatus);

/**
 * @route   PUT /api/users/status
 * @desc    Update user status (online/offline/away)
 * @access  Private
 */
router.put('/status', updateUserStatus);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', updateProfile);

/**
 * @route   PUT /api/users/profile-picture
 * @desc    Update profile picture
 * @access  Private
 */
router.put('/profile-picture', updateProfilePicture);


/**
 * @route   PUT /api/users/favorites/:userId
 * @desc    Add user to favorites
 * @access  Private
 */
router.put('/favorites/:userId', addToFavorites);

/**
 * @route   DELETE /api/users/favorites/:userId
 * @desc    Remove user from favorites
 * @access  Private
 */
router.delete('/favorites/:userId', removeFromFavorites);

/**
 * @route   PUT /api/users/block/:userId
 * @desc    Block a user
 * @access  Private
 */
router.put('/block/:userId', blockUser);

/**
 * @route   DELETE /api/users/block/:userId
 * @desc    Unblock a user
 * @access  Private
 */
router.delete('/block/:userId', unblockUser);

/**
 * @route   GET /api/users/blocked
 * @desc    Get blocked users
 * @access  Private
 */
router.get('/blocked', getBlockedUsers);

/**
 * @route   PUT /api/users/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put('/settings', updateSettings);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', deleteAccount);

/**
 * @route   PUT /api/users/theme
 * @desc    Update user theme
 * @access  Private
 */
router.put('/theme', updateTheme);

/**
 * @route   POST /api/users/wallpaper
 * @desc    Upload wallpaper
 * @access  Private
 */
router.post('/wallpaper', uploadWallpaper);

/**
 * @route   GET /api/users/block/status/:userId
 * @desc    Check block status between current user and target user
 * @access  Private
 */
router.get('/block/status/:userId', checkBlockStatus);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', getUserById);

module.exports = router;