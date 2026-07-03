// server/models/ContactRequest.js
const mongoose = require('mongoose');

const contactRequestSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
    },
    message: {
        type: String,
        maxlength: 200
    },
    readAt: {
        type: Date,
        default: null
    },
    respondedAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        }
    }
}, {
    timestamps: true
});

// Indexes
contactRequestSchema.index({ from: 1, to: 1 });
contactRequestSchema.index({ to: 1, status: 1 });
contactRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to accept request
contactRequestSchema.methods.accept = async function() {
    this.status = 'accepted';
    this.respondedAt = new Date();
    await this.save();
    
    // Add to both users' contacts
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.from, {
        $addToSet: { contacts: { user: this.to, addedAt: new Date() } }
    });
    await User.findByIdAndUpdate(this.to, {
        $addToSet: { contacts: { user: this.from, addedAt: new Date() } }
    });
    
    return this;
};

// Method to reject request
contactRequestSchema.methods.reject = async function() {
    this.status = 'rejected';
    this.respondedAt = new Date();
    await this.save();
    return this;
};

const ContactRequest = mongoose.model('ContactRequest', contactRequestSchema);

module.exports = ContactRequest;