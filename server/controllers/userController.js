const User = require('../models/User');
const Chat = require('../models/Chat');
const Group = require('../models/Group');
const Message = require('../models/Message');
const bcrypt = require('bcryptjs');

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * @desc    Get all users (excluding current user)
 * @route   GET /api/users
 * @access  Private
 */
exports.getUsers = async (req, res) => {
    try {
        const userId = req.userId;
        const { search } = req.query;

        let query = {
            _id: { $ne: userId },
            isDeleted: { $ne: true }
        };

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('username email profilePicture status lastSeen phoneNumber')
            .limit(50)
            .sort({ username: 1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users'
        });
    }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const user = await User.findById(id)
            .select('username email profilePicture status lastSeen phoneNumber bio');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if blocked
        const currentUser = await User.findById(userId);
        if (currentUser && currentUser.blockedUsers && currentUser.blockedUsers.includes(id)) {
            return res.status(403).json({
                success: false,
                message: 'User is blocked'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user'
        });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { username, bio, phoneNumber, email } = req.body;

        const updateData = {};
        if (username) updateData.username = username;
        if (bio !== undefined) updateData.bio = bio;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (email) updateData.email = email;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -refreshToken -__v');

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating profile'
        });
    }
};

/**
 * @desc    Update profile picture
 * @route   PUT /api/users/profile-picture
 * @access  Private
 */
exports.updateProfilePicture = async (req, res) => {
    try {
        const userId = req.userId;
        const { profilePicture } = req.body;

        if (!profilePicture) {
            return res.status(400).json({
                success: false,
                message: 'Profile picture URL is required'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { profilePicture },
            { new: true }
        ).select('-password -refreshToken -__v');

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Update profile picture error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating profile picture'
        });
    }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/account
 * @access  Private
 */
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.userId;

        // Soft delete user
        await User.findByIdAndUpdate(userId, { isDeleted: true });

        // Delete all user's messages
        await Message.deleteMany({ sender: userId });

        // Remove user from all chats
        await Chat.updateMany(
            { participants: userId },
            { $pull: { participants: userId } }
        );

        // Remove user from all groups
        await Group.updateMany(
            { 'members.user': userId },
            { $pull: { members: { user: userId } } }
        );

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting account'
        });
    }
};

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private
 */
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.userId;

        if (!q || q.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const users = await User.find({
            _id: { $ne: userId },
            isDeleted: { $ne: true },
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { phoneNumber: { $regex: q, $options: 'i' } }
            ]
        })
        .select('username email profilePicture status lastSeen')
        .limit(20);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error searching users'
        });
    }
};

/**
 * @desc    Get user status
 * @route   GET /api/users/status
 * @access  Private
 */
exports.getUserStatus = async (req, res) => {
    try {
        const userId = req.userId;

        const chats = await Chat.find({
            participants: userId,
            'metadata.isDeleted': false
        });

        const userIds = chats.reduce((acc, chat) => {
            const otherUser = chat.participants.find(
                p => p.toString() !== userId
            );
            if (otherUser) acc.push(otherUser);
            return acc;
        }, []);

        const users = await User.find({
            _id: { $in: userIds }
        }).select('_id status lastSeen');

        const statusMap = {};
        users.forEach(user => {
            statusMap[user._id] = {
                status: user.status,
                lastSeen: user.lastSeen
            };
        });

        res.json({
            success: true,
            data: statusMap
        });
    } catch (error) {
        console.error('Get user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user status'
        });
    }
};

/**
 * @desc    Update user status
 * @route   PUT /api/users/status
 * @access  Private
 */
exports.updateUserStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const { status } = req.body;

        if (!['online', 'offline', 'away'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { 
                status,
                lastSeen: new Date()
            },
            { new: true }
        ).select('status lastSeen');

        const io = req.app.get('io');
        io.emit('userStatusChanged', {
            userId,
            status,
            lastSeen: user.lastSeen
        });

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating status'
        });
    }
};

// ============================================
// FAVORITES
// ============================================

/**
 * @desc    Add user to favorites
 * @route   PUT /api/users/favorites/:userId
 * @access  Private
 */
exports.addToFavorites = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        if (userId === currentUserId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add yourself to favorites'
            });
        }

        const user = await User.findById(currentUserId);
        
        if (!user.favorites.includes(userId)) {
            user.favorites.push(userId);
            await user.save();
        }

        res.json({
            success: true,
            message: 'User added to favorites'
        });
    } catch (error) {
        console.error('Add to favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding to favorites'
        });
    }
};

/**
 * @desc    Remove user from favorites
 * @route   DELETE /api/users/favorites/:userId
 * @access  Private
 */
exports.removeFromFavorites = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        const user = await User.findById(currentUserId);
        user.favorites = user.favorites.filter(
            id => id.toString() !== userId
        );
        await user.save();

        res.json({
            success: true,
            message: 'User removed from favorites'
        });
    } catch (error) {
        console.error('Remove from favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing from favorites'
        });
    }
};

// ============================================
// BLOCK/UNBLOCK METHODS
// ============================================

/**
 * @desc    Block a user
 * @route   PUT /api/users/block/:userId
 * @access  Private
 */
exports.blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        if (userId === currentUserId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot block yourself'
            });
        }

        const userToBlock = await User.findById(userId);
        if (!userToBlock) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const currentUser = await User.findById(currentUserId);
        
        if (currentUser.blockedUsers && currentUser.blockedUsers.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already blocked'
            });
        }

        await currentUser.blockUser(userId);

        const io = req.app.get('io');
        io.to(`user:${userId}`).emit('userBlocked', {
            blockedBy: currentUserId,
            blockedAt: new Date()
        });
        io.to(`user:${currentUserId}`).emit('userBlocked', {
            blockedUser: userId,
            blockedAt: new Date()
        });

        const updatedUser = await User.findById(currentUserId)
            .select('-password -refreshToken -__v');

        res.json({
            success: true,
            message: 'User blocked successfully',
            data: {
                blockedUser: userId,
                blockedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error blocking user'
        });
    }
};

/**
 * @desc    Unblock a user
 * @route   DELETE /api/users/block/:userId
 * @access  Private
 */
exports.unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        if (userId === currentUserId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot unblock yourself'
            });
        }

        const currentUser = await User.findById(currentUserId);
        
        if (!currentUser.blockedUsers || !currentUser.blockedUsers.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User is not blocked'
            });
        }

        await currentUser.unblockUser(userId);

        const io = req.app.get('io');
        io.to(`user:${userId}`).emit('userUnblocked', {
            unblockedBy: currentUserId,
            unblockedAt: new Date()
        });
        io.to(`user:${currentUserId}`).emit('userUnblocked', {
            unblockedUser: userId,
            unblockedAt: new Date()
        });

        res.json({
            success: true,
            message: 'User unblocked successfully'
        });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error unblocking user'
        });
    }
};

/**
 * @desc    Check block status between current user and target user
 * @route   GET /api/users/block/status/:userId
 * @access  Private
 */
exports.checkBlockStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(userId);

        if (!currentUser || !targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isBlocked = currentUser.blockedUsers?.some(id => id.toString() === userId) || false;
        const isBlockedBy = targetUser.blockedUsers?.some(id => id.toString() === currentUserId) || false;

        res.json({
            success: true,
            data: {
                isBlocked,
                isBlockedBy,
                canInteract: !isBlocked && !isBlockedBy,
                mutual: isBlocked && isBlockedBy
            }
        });
    } catch (error) {
        console.error('Check block status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error checking block status'
        });
    }
};

/**
 * @desc    Get blocked users list
 * @route   GET /api/users/blocked
 * @access  Private
 */
exports.getBlockedUsers = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const user = await User.findById(userId)
            .populate({
                path: 'blockedUsers',
                select: 'username email profilePicture status lastSeen bio'
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const blockedUsers = user.blockedUsers || [];

        res.json({
            success: true,
            data: blockedUsers
        });
    } catch (error) {
        console.error('Get blocked users error:', error);
        require('fs').appendFileSync('error.log', new Date().toISOString() + ' Get blocked users error: ' + (error.stack || error) + '\n');
        res.status(500).json({
            success: false,
            message: 'Server error fetching blocked users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================
// THEME METHODS
// ============================================

/**
 * @desc    Update user theme preferences
 * @route   PUT /api/users/theme
 * @access  Private
 */
exports.updateTheme = async (req, res) => {
    try {
        const userId = req.userId;
        const { theme } = req.body;

        if (!theme) {
            return res.status(400).json({
                success: false,
                message: 'Theme data is required'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { 
                theme: {
                    ...theme,
                    lastUpdated: new Date()
                }
            },
            { new: true, runValidators: true }
        ).select('-password -refreshToken -__v');

        const io = req.app.get('io');
        io.to(`user:${userId}`).emit('themeUpdated', {
            userId: userId,
            theme: user.theme,
            updatedAt: new Date()
        });

        res.json({
            success: true,
            data: user.theme
        });
    } catch (error) {
        console.error('Update theme error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating theme'
        });
    }
};

/**
 * @desc    Upload wallpaper
 * @route   POST /api/users/wallpaper
 * @access  Private
 */
exports.uploadWallpaper = async (req, res) => {
    try {
        const userId = req.userId;
        const { wallpaperUrl } = req.body;

        if (!wallpaperUrl) {
            return res.status(400).json({
                success: false,
                message: 'Wallpaper URL is required'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                'theme.wallpaper': wallpaperUrl,
                'theme.wallpaperType': 'image',
                'theme.lastUpdated': new Date()
            },
            { new: true }
        ).select('-password -refreshToken -__v');

        const io = req.app.get('io');
        io.to(`user:${userId}`).emit('wallpaperUpdated', {
            userId: userId,
            wallpaper: wallpaperUrl,
            updatedAt: new Date()
        });

        res.json({
            success: true,
            data: {
                wallpaper: wallpaperUrl,
                wallpaperType: 'image'
            }
        });
    } catch (error) {
        console.error('Upload wallpaper error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error uploading wallpaper'
        });
    }
};

/**
 * @desc    Update user settings
 * @route   PUT /api/users/settings
 * @access  Private
 */
exports.updateSettings = async (req, res) => {
    try {
        const userId = req.userId;
        const { settings } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { settings },
            { new: true, runValidators: true }
        ).select('settings');

        res.json({
            success: true,
            data: user.settings
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating settings'
        });
    }
};