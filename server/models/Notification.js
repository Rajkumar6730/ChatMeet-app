// server/models/Notification.js
const mongoose = require('mongoose');

/**
 * Notification Schema - Manages user notifications
 * Stores all types of notifications with priority levels
 */
const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'message',
            'group_invite',
            'group_request',
            'mention',
            'call',
            'friend_request',
            'friend_accept',
            'reaction',
            'reply',
            'system'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    body: {
        type: String,
        required: true,
        maxlength: [500, 'Body cannot exceed 500 characters']
    },
    data: {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat'
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        },
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        actionUrl: String,
        extraData: mongoose.Schema.Types.Mixed
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    isClicked: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: function() {
            // Default expiry: 30 days from creation
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
    },
    metadata: {
        deviceId: String,
        platform: {
            type: String,
            enum: ['web', 'mobile', 'desktop']
        },
        version: String
    }
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
    if (!this.isRead) {
        this.isRead = true;
        this.readAt = new Date();
        await this.save();
    }
    return this;
};

// Method to mark notification as clicked
notificationSchema.methods.markAsClicked = async function() {
    if (!this.isClicked) {
        this.isClicked = true;
        await this.save();
    }
    return this;
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
    return this.countDocuments({
        user: userId,
        isRead: false,
        expiresAt: { $gt: new Date() }
    });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;