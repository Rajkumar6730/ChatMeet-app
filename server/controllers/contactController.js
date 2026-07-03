// server/controllers/contactController.js
const User = require('../models/User');
const ContactRequest = require('../models/ContactRequest');

/**
 * @desc    Send contact request
 * @route   POST /api/contacts/request
 * @access  Private
 */
exports.sendRequest = async (req, res) => {
    try {
        const { userId, message } = req.body;
        const fromUserId = req.userId;

        if (userId === fromUserId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot send request to yourself'
            });
        }

        // Check if user exists
        const toUser = await User.findById(userId);
        if (!toUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already contacts
        const currentUser = await User.findById(fromUserId);
        if (currentUser.contacts.some(c => c.user.toString() === userId)) {
            return res.status(400).json({
                success: false,
                message: 'Already in contacts'
            });
        }

        // Check if request already exists
        const existingRequest = await ContactRequest.findOne({
            from: fromUserId,
            to: userId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Request already sent'
            });
        }

        const request = await ContactRequest.create({
            from: fromUserId,
            to: userId,
            message: message || ''
        });

        // Emit socket event
        const io = req.app.get('io');
        io.to(`user:${userId}`).emit('newContactRequest', {
            requestId: request._id,
            from: {
                _id: fromUserId,
                username: req.user.username,
                profilePicture: req.user.profilePicture
            },
            message: request.message,
            createdAt: request.createdAt
        });

        res.status(201).json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Send request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error sending request'
        });
    }
};

/**
 * @desc    Accept contact request
 * @route   PUT /api/contacts/request/:id/accept
 * @access  Private
 */
exports.acceptRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const request = await ContactRequest.findOne({
            _id: id,
            to: userId,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed'
            });
        }

        await request.accept();

        // Get updated users
        const fromUser = await User.findById(request.from).select('username profilePicture');
        const toUser = await User.findById(request.to).select('username profilePicture');

        // Emit socket events
        const io = req.app.get('io');
        io.to(`user:${request.from}`).emit('contactRequestAccepted', {
            requestId: request._id,
            user: toUser
        });
        io.to(`user:${request.to}`).emit('contactRequestAccepted', {
            requestId: request._id,
            user: fromUser
        });

        res.json({
            success: true,
            message: 'Contact request accepted'
        });
    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error accepting request'
        });
    }
};

/**
 * @desc    Reject contact request
 * @route   PUT /api/contacts/request/:id/reject
 * @access  Private
 */
exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const request = await ContactRequest.findOne({
            _id: id,
            to: userId,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed'
            });
        }

        await request.reject();

        // Emit socket event
        const io = req.app.get('io');
        io.to(`user:${request.from}`).emit('contactRequestRejected', {
            requestId: request._id,
            userId: request.to
        });

        res.json({
            success: true,
            message: 'Contact request rejected'
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error rejecting request'
        });
    }
};

/**
 * @desc    Get pending contact requests
 * @route   GET /api/contacts/requests
 * @access  Private
 */
exports.getRequests = async (req, res) => {
    try {
        const userId = req.userId;

        const requests = await ContactRequest.find({
            to: userId,
            status: 'pending'
        }).populate('from', 'username profilePicture email status lastSeen');

        const sentRequests = await ContactRequest.find({
            from: userId,
            status: 'pending'
        }).populate('to', 'username profilePicture email status lastSeen');

        res.json({
            success: true,
            data: {
                received: requests,
                sent: sentRequests
            }
        });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching requests'
        });
    }
};

/**
 * @desc    Get contacts list
 * @route   GET /api/contacts
 * @access  Private
 */
exports.getContacts = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId)
            .populate('contacts.user', 'username profilePicture email status lastSeen bio');

        res.json({
            success: true,
            data: user.contacts || []
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching contacts'
        });
    }
};

/**
 * @desc    Remove contact
 * @route   DELETE /api/contacts/:userId
 * @access  Private
 */
exports.removeContact = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        const user = await User.findById(currentUserId);
        user.contacts = user.contacts.filter(c => c.user.toString() !== userId);
        await user.save();

        // Also remove from other user's contacts
        const otherUser = await User.findById(userId);
        if (otherUser) {
            otherUser.contacts = otherUser.contacts.filter(c => c.user.toString() !== currentUserId);
            await otherUser.save();
        }

        // Emit socket event
        const io = req.app.get('io');
        io.to(`user:${userId}`).emit('contactRemoved', {
            removedBy: currentUserId,
            userId: userId
        });

        res.json({
            success: true,
            message: 'Contact removed'
        });
    } catch (error) {
        console.error('Remove contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing contact'
        });
    }
};