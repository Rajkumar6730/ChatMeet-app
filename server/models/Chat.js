// server/models/Chat.js
const mongoose = require('mongoose');

/**
 * Chat Schema - Represents one-to-one chat conversations
 * Stores chat metadata and references to participants
 */
const chatSchema = new mongoose.Schema({
    // Participants in the chat
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],

    // ✅ Track which users have cleared the chat
    clearedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Last message reference
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    
    // Last message timestamp
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    
    // Chat settings
    isArchived: {
        type: Boolean,
        default: false
    },
    isMuted: {
        type: Boolean,
        default: false
    },
    muteUntil: {
        type: Date,
        default: null
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    
    // UNREAD TRACKING - Store per participant (UPDATED)
    unreadCount: {
        type: Number,
        default: 0
    },
    
    // Track last read message per user (UPDATED)
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        },
        lastReadMessageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        }
    }],
    
    // NEW: Track last seen message per user
    seenBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        seenAt: {
            type: Date,
            default: Date.now
        },
        lastSeenMessageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        }
    }],
    
    // Additional metadata (KEPT from OLD)
    metadata: {
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
});

// ==================== INDEXES ====================

// Compound index for participants (KEPT from OLD)
chatSchema.index({ participants: 1 });
chatSchema.index({ participants: 1, lastMessageTime: -1 });
chatSchema.index({ lastMessageTime: -1 });

// NEW: Indexes for readBy and seenBy
chatSchema.index({ 'readBy.user': 1 });
chatSchema.index({ 'seenBy.user': 1 });

// ==================== METHODS ====================

/**
 * Get unread count for a specific user (UPDATED from OLD)
 * @param {string} userId - User ID to check unread count for
 * @returns {number} - Number of unread messages
 */
chatSchema.methods.getUnreadCount = function(userId) {
    // Check if user has read the chat
    const readEntry = this.readBy.find(r => 
        r.user.toString() === userId.toString()
    );
    
    if (readEntry) {
        return 0; // User has read the chat
    }
    
    return this.unreadCount || 0;
};

/**
 * Mark chat as read for a user (UPDATED from OLD)
 * @param {string} userId - User ID marking the chat as read
 * @returns {Promise<Chat>} - Updated chat document
 */
chatSchema.methods.markAsRead = async function(userId) {
    // Check if user already has a read entry
    const existingRead = this.readBy.find(r => 
        r.user.toString() === userId.toString()
    );
    
    if (existingRead) {
        // Update existing read entry
        existingRead.readAt = new Date();
        existingRead.lastReadMessageId = this.lastMessage;
    } else {
        // Create new read entry
        this.readBy.push({
            user: userId,
            readAt: new Date(),
            lastReadMessageId: this.lastMessage
        });
    }
    
    // Reset unread count
    this.unreadCount = 0;
    await this.save();
    return this;
};

/**
 * NEW: Mark chat as unread for a user
 * @param {string} userId - User ID to mark as unread
 * @returns {Promise<Chat>} - Updated chat document
 */
chatSchema.methods.markAsUnread = async function(userId) {
    // Remove user from readBy array
    this.readBy = this.readBy.filter(r => 
        r.user.toString() !== userId.toString()
    );
    
    // Set unread count if there are messages
    if (this.lastMessage) {
        this.unreadCount = 1;
    }
    
    await this.save();
    return this;
};

/**
 * NEW: Increment unread count for a user
 * @param {string} userId - User ID to increment unread count for
 * @returns {Promise<Chat>} - Updated chat document
 */
chatSchema.methods.incrementUnread = async function(userId) {
    // Check if user has read the chat
    const hasRead = this.readBy.some(r => 
        r.user.toString() === userId.toString()
    );
    
    if (!hasRead) {
        this.unreadCount = (this.unreadCount || 0) + 1;
        await this.save();
    }
    
    return this;
};

/**
 * NEW: Mark message as seen for a user
 * @param {string} userId - User ID marking the message as seen
 * @param {string} messageId - Message ID that was seen
 * @returns {Promise<Chat>} - Updated chat document
 */
chatSchema.methods.markAsSeen = async function(userId, messageId) {
    const existingSeen = this.seenBy.find(s => 
        s.user.toString() === userId.toString()
    );
    
    if (existingSeen) {
        existingSeen.seenAt = new Date();
        existingSeen.lastSeenMessageId = messageId;
    } else {
        this.seenBy.push({
            user: userId,
            seenAt: new Date(),
            lastSeenMessageId: messageId
        });
    }
    
    await this.save();
    return this;
};

/**
 * NEW: Get last read message ID for a user
 * @param {string} userId - User ID to get last read message for
 * @returns {string|null} - Last read message ID or null
 */
chatSchema.methods.getLastReadMessageId = function(userId) {
    const readEntry = this.readBy.find(r => 
        r.user.toString() === userId.toString()
    );
    return readEntry ? readEntry.lastReadMessageId : null;
};

/**
 * NEW: Get last seen message ID for a user
 * @param {string} userId - User ID to get last seen message for
 * @returns {string|null} - Last seen message ID or null
 */
chatSchema.methods.getLastSeenMessageId = function(userId) {
    const seenEntry = this.seenBy.find(s => 
        s.user.toString() === userId.toString()
    );
    return seenEntry ? seenEntry.lastSeenMessageId : null;
};

/**
 * NEW: Check if user has read the chat
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if user has read the chat
 */
chatSchema.methods.hasUserRead = function(userId) {
    return this.readBy.some(r => 
        r.user.toString() === userId.toString()
    );
};

/**
 * NEW: Check if user has seen the chat
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if user has seen the chat
 */
chatSchema.methods.hasUserSeen = function(userId) {
    return this.seenBy.some(s => 
        s.user.toString() === userId.toString()
    );
};

/**
 * NEW: Remove user from readBy array
 * @param {string} userId - User ID to remove
 * @returns {Promise<Chat>} - Updated chat document
 */
chatSchema.methods.removeReadEntry = async function(userId) {
    this.readBy = this.readBy.filter(r => 
        r.user.toString() !== userId.toString()
    );
    await this.save();
    return this;
};

/**
 * NEW: Remove user from seenBy array
 * @param {string} userId - User ID to remove
 * @returns {Promise<Chat>} - Updated chat document
 */
chatSchema.methods.removeSeenEntry = async function(userId) {
    this.seenBy = this.seenBy.filter(s => 
        s.user.toString() !== userId.toString()
    );
    await this.save();
    return this;
};

/**
 * NEW: Get all users who have read the chat
 * @returns {Array} - Array of user IDs who have read the chat
 */
chatSchema.methods.getReadUsers = function() {
    return this.readBy.map(r => r.user);
};

/**
 * NEW: Get all users who have seen the chat
 * @returns {Array} - Array of user IDs who have seen the chat
 */
chatSchema.methods.getSeenUsers = function() {
    return this.seenBy.map(s => s.user);
};

/**
 * NEW: Get unread count for all participants
 * @param {string} userId - Current user ID
 * @returns {Object} - Unread counts per user
 */
chatSchema.methods.getAllUnreadCounts = function(userId) {
    const counts = {};
    
    this.participants.forEach(participant => {
        const userId = participant.toString();
        const hasRead = this.readBy.some(r => 
            r.user.toString() === userId
        );
        counts[userId] = hasRead ? 0 : this.unreadCount || 0;
    });
    
    return counts;
};

/**
 * NEW: Reset unread count for all users
 * @returns {Promise<Chat>} - Updated chat document
 */
chatSchema.methods.resetAllUnread = async function() {
    this.unreadCount = 0;
    await this.save();
    return this;
};

// ==================== STATIC METHODS ====================

/**
 * NEW: Find or create a chat between users
 * @param {Array} participantIds - Array of user IDs
 * @returns {Promise<Chat>} - Found or created chat
 */
chatSchema.statics.findOrCreate = async function(participantIds) {
    let chat = await this.findOne({
        participants: { $all: participantIds, $size: participantIds.length }
    });
    
    if (!chat) {
        chat = new this({
            participants: participantIds
        });
        await chat.save();
    }
    
    return chat;
};

/**
 * NEW: Get all chats for a user with unread counts
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of chats with unread counts
 */
chatSchema.statics.getChatsForUser = async function(userId) {
    return this.find({
        participants: userId,
        'metadata.isDeleted': false
    })
    .populate('participants', 'username profilePicture status')
    .populate('lastMessage')
    .sort({ lastMessageTime: -1 });
};

// server/models/Chat.js
// Add this method to the chat schema

// ✅ Clear chat for a specific user (hide messages, don't delete)
chatSchema.methods.clearChat = async function(userId) {
    // Add user to clearedBy array
    if (!this.clearedBy) this.clearedBy = [];
    if (!this.clearedBy.includes(userId)) {
        this.clearedBy.push(userId);
    }
    
    // Reset unread count for this user
    this.unreadCount = 0;
    
    // Remove user from readBy
    this.readBy = this.readBy.filter(r => r.user.toString() !== userId.toString());
    
    await this.save();
    return this;
};

// ✅ Check if chat is cleared for a user
chatSchema.methods.isClearedForUser = function(userId) {
    return this.clearedBy && this.clearedBy.includes(userId);
};

// ==================== MODEL ====================

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;