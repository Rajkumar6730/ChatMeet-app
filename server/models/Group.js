// server/models/Group.js
const mongoose = require('mongoose');

/**
 * Group Schema - Represents group chat conversations
 * Manages group members, admins, and settings
 */
const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Group name is required'],
        trim: true,
        maxlength: [100, 'Group name cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    groupPicture: {
        type: String,
        default: 'default-group.png'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'moderator', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        isMuted: {
            type: Boolean,
            default: false
        },
        muteUntil: {
            type: Date,
            default: null
        },
        unreadCount: {
            type: Number,
            default: 0
        }
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    typingUsers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        startedAt: {
            type: Date,
            default: Date.now
        }
    }],
    onlineMembers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        lastActive: {
            type: Date,
            default: Date.now
        }
    }],

    pendingRequests: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        requestedAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    settings: {
        allowMedia: {
            type: Boolean,
            default: true
        },
        allowLinks: {
            type: Boolean,
            default: true
        },
        onlyAdminsCanSend: {
            type: Boolean,
            default: false
        },
        approvalRequired: {
            type: Boolean,
            default: false
        }
    },
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

// Indexes
groupSchema.index({ members: 1 });
groupSchema.index({ createdBy: 1 });
groupSchema.index({ lastMessageTime: -1 });
groupSchema.index({ name: 'text' });

// Method to check if user is group admin
groupSchema.methods.isAdmin = function(userId) {
    return this.admins.some(admin => 
        admin.toString() === userId.toString()
    );
};

// Method to check if user is group member
groupSchema.methods.isMember = function(userId) {
    return this.members.some(member => 
        member.user.toString() === userId.toString()
    );
};

// Method to add member
groupSchema.methods.addMember = async function(userId, role = 'member') {
    if (!this.isMember(userId)) {
        this.members.push({
            user: userId,
            role: role,
            joinedAt: new Date()
        });
        if (role === 'admin' && !this.isAdmin(userId)) {
            this.admins.push(userId);
        }
        await this.save();
    }
    return this;
};

// Method to increment unread count for all members except sender
groupSchema.methods.incrementUnread = async function(excludeUserId) {
    this.members.forEach(member => {
        if (member.user.toString() !== excludeUserId.toString()) {
            member.unreadCount = (member.unreadCount || 0) + 1;
        }
    });
    return this.save();
};

// Method to mark chat as read for a user
groupSchema.methods.markAsRead = async function(userId) {
    const member = this.members.find(m => m.user.toString() === userId.toString());
    if (member && member.unreadCount > 0) {
        member.unreadCount = 0;
        await this.save();
    }
    return this;
};

// Method to get unread count for a user
groupSchema.methods.getUnreadCount = function(userId) {
    const member = this.members.find(m => m.user.toString() === userId.toString());
    return member ? (member.unreadCount || 0) : 0;
};

// Method to mark message as seen (placeholder for future implementation if needed on Group model)
groupSchema.methods.markAsSeen = async function(userId, messageId) {
    // If you want to track last seen message per user in the group
    return this.markAsRead(userId);
};
groupSchema.methods.removeMember = async function(userId) {
    this.members = this.members.filter(member => 
        member.user.toString() !== userId.toString()
    );
    this.admins = this.admins.filter(admin => 
        admin.toString() !== userId.toString()
    );
    await this.save();
    return this;
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;