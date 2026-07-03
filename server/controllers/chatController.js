const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');

/**
 * @desc    Get all chats for user
 * @route   GET /api/chats
 * @access  Private
 */
exports.getChats = async (req, res) => {
    try {
        const userId = req.userId;

        const chats = await Chat.find({
            participants: userId,
            'metadata.isDeleted': false
        })
        .populate('participants', 'username email profilePicture status lastSeen')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'username profilePicture'
            }
        })
        .sort({ lastMessageTime: -1, updatedAt: -1 });

        // Format chats for response
        const formattedChats = chats.map(chat => {
            const otherParticipant = chat.participants.find(
                p => p._id.toString() !== userId.toString()
            );

            const unreadCount = chat.readBy.some(
                r => r.user.toString() === userId.toString()
            ) ? 0 : chat.unreadCount || 0;

            return {
                id: chat._id,
                participant: otherParticipant,
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime,
                unreadCount,
                isArchived: chat.isArchived,
                isMuted: chat.isMuted,
                isPinned: chat.isPinned
            };
        });

        res.json({
            success: true,
            data: formattedChats
        });
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching chats'
        });
    }
};

/**
 * @desc    Get chat by ID
 * @route   GET /api/chats/:id
 * @access  Private
 */
exports.getChatById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId,
            'metadata.isDeleted': false
        })
        .populate('participants', 'username email profilePicture status lastSeen')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'username profilePicture'
            }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Get unread count
        const unreadCount = chat.readBy.some(
            r => r.user.toString() === userId.toString()
        ) ? 0 : chat.unreadCount || 0;

        const otherParticipant = chat.participants.find(
            p => p._id.toString() !== userId.toString()
        );

        res.json({
            success: true,
            data: {
                id: chat._id,
                participant: otherParticipant,
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime,
                unreadCount,
                isArchived: chat.isArchived,
                isMuted: chat.isMuted,
                isPinned: chat.isPinned,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt
            }
        });
    } catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching chat'
        });
    }
};

/**
 * @desc    Create a new chat
 * @route   POST /api/chats
 * @access  Private
 */
exports.createChat = async (req, res) => {
    try {
        const { participantId } = req.body;
        const userId = req.userId;

        if (!participantId) {
            return res.status(400).json({
                success: false,
                message: 'Participant ID is required'
            });
        }

        if (participantId === userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create chat with yourself'
            });
        }

        // Check if participant exists
        const participant = await User.findById(participantId);
        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if chat already exists
        let chat = await Chat.findOne({
            participants: { $all: [userId, participantId] },
            'metadata.isDeleted': false
        });

        if (chat) {
            // Reactivate if archived
            if (chat.isArchived) {
                chat.isArchived = false;
                await chat.save();
            }

            return res.json({
                success: true,
                message: 'Chat already exists',
                data: { chatId: chat._id }
            });
        }

        // Create new chat
        chat = await Chat.create({
            participants: [userId, participantId],
            readBy: [{ user: userId }],
            unreadCount: 0
        });

        res.status(201).json({
            success: true,
            message: 'Chat created successfully',
            data: { chatId: chat._id }
        });
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating chat'
        });
    }
};

/**
 * @desc    Delete chat
 * @route   DELETE /api/chats/:id
 * @access  Private
 */
exports.deleteChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Soft delete
        chat.metadata.isDeleted = true;
        chat.metadata.deletedAt = new Date();
        await chat.save();

        res.json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting chat'
        });
    }
};

/**
 * @desc    Archive chat
 * @route   PUT /api/chats/:id/archive
 * @access  Private
 */
exports.archiveChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        chat.isArchived = true;
        await chat.save();

        res.json({
            success: true,
            message: 'Chat archived successfully'
        });
    } catch (error) {
        console.error('Archive chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error archiving chat'
        });
    }
};

/**
 * @desc    Unarchive chat
 * @route   PUT /api/chats/:id/unarchive
 * @access  Private
 */
exports.unarchiveChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        chat.isArchived = false;
        await chat.save();

        res.json({
            success: true,
            message: 'Chat unarchived successfully'
        });
    } catch (error) {
        console.error('Unarchive chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error unarchiving chat'
        });
    }
};

/**
 * @desc    Mute chat
 * @route   PUT /api/chats/:id/mute
 * @access  Private
 */
exports.muteChat = async (req, res) => {
    try {
        const { id } = req.params;
        const { duration } = req.body; // Duration in minutes, null for forever
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        chat.isMuted = true;
        if (duration) {
            chat.muteUntil = new Date(Date.now() + duration * 60 * 1000);
        } else {
            chat.muteUntil = null;
        }
        await chat.save();

        res.json({
            success: true,
            message: 'Chat muted successfully'
        });
    } catch (error) {
        console.error('Mute chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error muting chat'
        });
    }
};

/**
 * @desc    Unmute chat
 * @route   PUT /api/chats/:id/unmute
 * @access  Private
 */
exports.unmuteChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        chat.isMuted = false;
        chat.muteUntil = null;
        await chat.save();

        res.json({
            success: true,
            message: 'Chat unmuted successfully'
        });
    } catch (error) {
        console.error('Unmute chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error unmuting chat'
        });
    }
};

/**
 * @desc    Pin chat
 * @route   PUT /api/chats/:id/pin
 * @access  Private
 */
exports.pinChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        chat.isPinned = true;
        await chat.save();

        res.json({
            success: true,
            message: 'Chat pinned successfully'
        });
    } catch (error) {
        console.error('Pin chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error pinning chat'
        });
    }
};

/**
 * @desc    Unpin chat
 * @route   PUT /api/chats/:id/unpin
 * @access  Private
 */
exports.unpinChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        chat.isPinned = false;
        await chat.save();

        res.json({
            success: true,
            message: 'Chat unpinned successfully'
        });
    } catch (error) {
        console.error('Unpin chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error unpinning chat'
        });
    }
};

/**
 * @desc    Get total unread count
 * @route   GET /api/chats/unread
 * @access  Private
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.userId;

        const chats = await Chat.find({
            participants: userId,
            'metadata.isDeleted': false
        });

        let totalUnread = 0;
        chats.forEach(chat => {
            const isRead = chat.readBy.some(
                r => r.user.toString() === userId.toString()
            );
            if (!isRead) {
                totalUnread += chat.unreadCount || 0;
            }
        });

        res.json({
            success: true,
            data: { unreadCount: totalUnread }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching unread count'
        });
    }
};

/**
 * @desc    Mark chat as read
 * @route   PUT /api/chats/:id/read
 * @access  Private
 */
exports.markChatAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        await chat.markAsRead(userId);

        res.json({
            success: true,
            message: 'Chat marked as read'
        });
    } catch (error) {
        console.error('Mark chat as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking chat as read'
        });
    }
};

// server/controllers/chatController.js
// Add this function

/**
 * @desc    Mark chat as unread for current user
 * @route   PUT /api/chats/:id/unread
 * @access  Private
 */
exports.markChatAsUnread = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId,
            'metadata.isDeleted': false
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        await chat.markAsUnread(userId);

        // Get updated chat with populated data
        const updatedChat = await Chat.findById(id)
            .populate('participants', 'username email profilePicture status lastSeen')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'sender',
                    select: 'username profilePicture'
                }
            });

        // Emit socket event to update other clients
        const io = req.app.get('io');
        io.to(`user:${userId}`).emit('chatUnread', {
            chatId: id,
            userId: userId,
            unreadCount: updatedChat.unreadCount
        });

        res.json({
            success: true,
            message: 'Chat marked as unread',
            data: {
                chatId: id,
                unreadCount: updatedChat.unreadCount
            }
        });
    } catch (error) {
        console.error('Mark chat as unread error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking chat as unread'
        });
    }
};

// server/controllers/chatController.js

/**
 * @desc    Clear chat for current user
 * @route   POST /api/chats/:id/clear
 * @access  Private
 */
exports.clearChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId,
            'metadata.isDeleted': false
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        await chat.clearChat(userId);

        // Emit socket event to all participants
        const io = req.app.get('io');
        io.to(`chat:${id}`).emit('chatCleared', {
            chatId: id,
            clearedBy: userId,
            clearedAt: new Date()
        });

        // Also notify the user who cleared
        io.to(`user:${userId}`).emit('chatCleared', {
            chatId: id,
            clearedBy: userId,
            clearedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Chat cleared successfully',
            data: {
                chatId: id,
                clearedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Clear chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error clearing chat'
        });
    }
};