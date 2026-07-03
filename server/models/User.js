// server/models/User.js
const mongoose = require('mongoose');

/**
 * User Schema - Represents application users
 */
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    profilePicture: {
        type: String,
        default: 'default-avatar.png'
    },
    bio: {
        type: String,
        maxlength: [200, 'Bio cannot exceed 200 characters'],
        default: ''
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'away'],
        default: 'offline'
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    blockedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    devices: [{
        deviceId: String,
        deviceName: String,
        lastActive: Date,
        isActive: Boolean
    }],
    contacts: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        nickname: {
            type: String,
            maxlength: 50
        },
        isFavorite: {
            type: Boolean,
            default: false
        },
        lastInteraction: {
            type: Date,
            default: Date.now
        }
    }],
    settings: {
        notifications: {
            message: { type: Boolean, default: true },
            group: { type: Boolean, default: true },
            call: { type: Boolean, default: true }
        },
        privacy: {
            lastSeen: {
                type: String,
                enum: ['everyone', 'contacts', 'none'],
                default: 'everyone'
            },
            profilePhoto: {
                type: String,
                enum: ['everyone', 'contacts', 'none'],
                default: 'everyone'
            },
            status: {
                type: String,
                enum: ['everyone', 'contacts', 'none'],
                default: 'everyone'
            }
        }
    },
    theme: {
        mode: {
            type: String,
            enum: ['light', 'dark', 'green', 'blue'],
            default: 'dark'
        },
        wallpaper: {
            type: String,
            default: null
        },
        wallpaperType: {
            type: String,
            enum: ['solid', 'gradient', 'image'],
            default: 'solid'
        },
        accentColor: {
            type: String,
            default: '#25D366'
        },
        bubbleColor: {
            type: String,
            default: '#005C4B'
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    refreshToken: {
        type: String,
        select: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        select: false
    },
    verificationExpires: Date,
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpires: Date
}, {
    timestamps: true
});

// ==================== INDEXES ====================
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastSeen: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ blockedUsers: 1 });
userSchema.index({ blockedBy: 1 });

// ==================== VIRTUALS ====================
userSchema.virtual('fullName').get(function() {
    return this.username;
});

// ==================== METHODS ====================
userSchema.methods.isOnline = function() {
    return this.status === 'online';
};

userSchema.methods.updateLastSeen = function() {
    this.lastSeen = new Date();
    return this.save();
};

userSchema.methods.isBlocked = function(userId) {
    if (!this.blockedUsers) return false;
    return this.blockedUsers.some(id => id.toString() === userId.toString());
};

userSchema.methods.isBlockedBy = function(userId) {
    if (!this.blockedBy) return false;
    return this.blockedBy.some(id => id.toString() === userId.toString());
};

userSchema.methods.blockUser = async function(userId) {
    if (!this.blockedUsers) this.blockedUsers = [];
    if (!this.blockedUsers.includes(userId)) {
        this.blockedUsers.push(userId);
    }
    
    const otherUser = await mongoose.model('User').findById(userId);
    if (otherUser) {
        if (!otherUser.blockedBy) otherUser.blockedBy = [];
        if (!otherUser.blockedBy.includes(this._id)) {
            otherUser.blockedBy.push(this._id);
            await otherUser.save();
        }
    }
    
    await this.save();
    return this;
};

userSchema.methods.unblockUser = async function(userId) {
    if (this.blockedUsers) {
        this.blockedUsers = this.blockedUsers.filter(id => id.toString() !== userId.toString());
    }
    
    const otherUser = await mongoose.model('User').findById(userId);
    if (otherUser && otherUser.blockedBy) {
        otherUser.blockedBy = otherUser.blockedBy.filter(id => id.toString() !== this._id.toString());
        await otherUser.save();
    }
    
    await this.save();
    return this;
};

userSchema.methods.canInteract = function(userId) {
    return !this.isBlocked(userId) && !this.isBlockedBy(userId);
};

userSchema.methods.isFavorite = function(userId) {
    return this.favorites.some(id => id.toString() === userId.toString());
};

userSchema.methods.toggleFavorite = async function(userId) {
    if (this.isFavorite(userId)) {
        this.favorites = this.favorites.filter(id => id.toString() !== userId.toString());
    } else {
        this.favorites.push(userId);
    }
    await this.save();
    return this;
};

userSchema.methods.getStatusForUser = function(viewerId) {
    if (this.isBlocked(viewerId) || this.isBlockedBy(viewerId)) {
        return { status: 'offline', lastSeen: this.lastSeen };
    }
    
    const privacy = this.settings?.privacy?.lastSeen || 'everyone';
    if (privacy === 'everyone') {
        return { status: this.status, lastSeen: this.lastSeen };
    } else if (privacy === 'contacts') {
        const isContact = this.favorites.some(id => id.toString() === viewerId.toString());
        if (isContact) {
            return { status: this.status, lastSeen: this.lastSeen };
        }
        return { status: 'offline', lastSeen: this.lastSeen };
    } else {
        return { status: 'offline', lastSeen: this.lastSeen };
    }
};

// ==================== STATIC METHODS ====================
userSchema.statics.getBlockedUsersForUser = async function(userId) {
    const user = await this.findById(userId);
    if (!user) return [];
    return await user.getBlockedUsers();
};

userSchema.statics.areUsersBlocked = async function(userId1, userId2) {
    const user1 = await this.findById(userId1);
    const user2 = await this.findById(userId2);
    
    if (!user1 || !user2) return { blocked: false, blockedBy: false };
    
    return {
        blocked: user1.isBlocked(userId2),
        blockedBy: user1.isBlockedBy(userId2),
        mutual: user1.isBlocked(userId2) && user2.isBlocked(userId1)
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;