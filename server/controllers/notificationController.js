// server/controllers/notificationController.js
const Notification = require('../models/Notification');

/**
 * @desc    Get all notifications for current user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 50, page = 1 } = req.query;

        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('data.senderId', 'username profilePicture');

        const total = await Notification.countDocuments({ user: userId });

        res.json({
            success: true,
            data: notifications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching notifications'
        });
    }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const notification = await Notification.findOne({
            _id: id,
            user: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.markAsRead();

        const io = req.app.get('io');
        io.to(`user:${userId}`).emit('notificationRead', {
            id: notification._id,
            readAt: notification.readAt
        });

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking notification as read'
        });
    }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.userId;

        const result = await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        const io = req.app.get('io');
        io.to(`user:${userId}`).emit('notificationsReadAll', {
            userId,
            readAt: new Date()
        });

        res.json({
            success: true,
            message: 'All notifications marked as read',
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking notifications as read'
        });
    }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            user: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        const io = req.app.get('io');
        io.to(`user:${userId}`).emit('notificationDeleted', {
            id: notification._id
        });

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting notification'
        });
    }
};