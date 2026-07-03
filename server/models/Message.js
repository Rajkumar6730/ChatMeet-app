// server/models/Message.js
const mongoose = require('mongoose');

/**
 * Message Schema - Stores all messages in the system
 * Supports different message types and read receipts
 */
const messageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: function() {
            return !this.group;
        }
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: function() {
            return !this.chat;
        }
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: function() {
            return this.type === 'text';
        },
        trim: true,
        maxlength: [5000, 'Message content cannot exceed 5000 characters']
    },
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'document', 'file'],
        default: 'text'
    },
    media: {
        url: {
            type: String,
            required: function() {
                return this.type !== 'text';
            }
        },
        fileName: String,
        fileSize: Number,
        mimeType: String,
        duration: Number, // For audio/video
        width: Number, // For images
        height: Number, // For images
        thumbnail: String // For images/videos
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    deliveredTo: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        deliveredAt: {
            type: Date,
            default: Date.now
        }
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    },

    editHistory: [{
        content: String,
        editedAt: Date
    }],
    
    // ✅ Image caption
    caption: {
        type: String,
        maxlength: [1000, 'Caption cannot exceed 1000 characters'],
        default: null
    },
    
    // ✅ Multiple images support
    images: [{
        url: String,
        caption: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
        width: Number,
        height: Number
    }],

    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reaction: {
            type: String,
            enum: ['❤️', '👍', '😂', '😮', '😢', '😡'],
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    starredBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    }],
    metadata: {
        ipAddress: String,
        userAgent: String,
        isForwarded: {
            type: Boolean,
            default: false
        },
        forwardedFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        }
    }
}, {
    timestamps: true
});

// Indexes
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ 'deliveredTo.user': 1 });

// Method to mark message as read by user
messageSchema.methods.markAsRead = function(userId) {
    if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });
    }
    return this.save();
};

// Method to mark message as delivered
messageSchema.methods.markAsDelivered = function(userId) {
    if (!this.deliveredTo.some(d => d.user.toString() === userId.toString())) {
        this.deliveredTo.push({
            user: userId,
            deliveredAt: new Date()
        });
    }
    return this.save();
};

// Method to check if user has read the message
messageSchema.methods.isReadBy = function(userId) {
    return this.readBy.some(r => r.user.toString() === userId.toString());
};

// Method to star/unstar message
messageSchema.methods.toggleStar = function(userId) {
    const index = this.starredBy.findIndex(s => s.toString() === userId.toString());
    if (index > -1) {
        this.starredBy.splice(index, 1);
    } else {
        this.starredBy.push(userId);
    }
    return this.save();
};

// Method to check if starred by user
messageSchema.methods.isStarredBy = function(userId) {
    return this.starredBy.some(s => s.toString() === userId.toString());
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;