// server/controllers/messageController.js
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Group = require('../models/Group');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sanitizeHtml = require('sanitize-html');

/**
 * @desc    Get messages for a chat or group
 * @route   GET /api/messages/chat/:chatId
 * @route   GET /api/messages/group/:groupId
 * @access  Private
 */
exports.getMessages = async (req, res) => {
    try {
        const { chatId, groupId } = req.params;
        const userId = req.userId;
        const { page = 1, limit = 50 } = req.query;

        const query = {};
        let entityId;

        if (chatId) {
            query.chat = chatId;
            entityId = chatId;
            
            const chat = await Chat.findOne({
                _id: chatId,
                participants: userId,
                'metadata.isDeleted': false
            });
            
            if (!chat) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat not found'
                });
            }
        } else if (groupId) {
            query.group = groupId;
            entityId = groupId;
            
            const group = await Group.findOne({
                _id: groupId,
                'members.user': userId,
                'metadata.isDeleted': false
            });
            
            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Group not found'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Chat ID or Group ID is required'
            });
        }

        // Filter out soft-deleted messages for everyone and messages deleted for this specific user
        query.isDeleted = { $ne: true };
        query.deletedFor = { $ne: userId };

        const messages = await Message.find(query)
            .populate('sender', 'username profilePicture status')
            .populate('replyTo', 'content sender type media')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Mark delivered
        const messageIds = messages.map(m => m._id);
        await Message.updateMany(
            {
                _id: { $in: messageIds },
                'deliveredTo.user': { $ne: userId }
            },
            {
                $push: {
                    deliveredTo: {
                        user: userId,
                        deliveredAt: new Date()
                    }
                }
            }
        );

        // Mark read for chat
        if (chatId) {
            await Message.updateMany(
                {
                    chat: chatId,
                    'readBy.user': { $ne: userId }
                },
                {
                    $push: {
                        readBy: {
                            user: userId,
                            readAt: new Date()
                        }
                    }
                }
            );
            await Chat.findOneAndUpdate(
                { _id: chatId },
                { $addToSet: { readBy: { user: userId } } }
            );
        }

        res.json({
            success: true,
            data: {
                messages: messages.reverse(),
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching messages'
        });
    }
};

/**
 * @desc    Send a new message (KEPT from OLD)
 * @route   POST /api/messages
 * @access  Private
 */
exports.sendMessage = async (req, res) => {
    try {
        const { chatId, groupId, content, type = 'text', media, replyToId } = req.body;
        const userId = req.userId;

        if (!chatId && !groupId) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID or Group ID is required'
            });
        }

        if (type === 'text' && !content) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        if (type !== 'text' && !media) {
            return res.status(400).json({
                success: false,
                message: 'Media is required for non-text messages'
            });
        }

        // Check if replying to existing message
        if (replyToId) {
            const replyTo = await Message.findById(replyToId);
            if (!replyTo) {
                return res.status(404).json({
                    success: false,
                    message: 'Message to reply to not found'
                });
            }
        }

        // Create message data
        const messageData = {
            sender: userId,
            type,
            content: type === 'text' ? sanitizeHtml(content, {
                allowedTags: [], // No HTML tags allowed
                allowedAttributes: {}
            }) : '',
            media: media || {},
            replyTo: replyToId || null
        };

        // Assign chat or group
        if (chatId) {
            // Verify chat exists and user is participant
            const chat = await Chat.findOne({
                _id: chatId,
                participants: userId,
                'metadata.isDeleted': false
            });
            if (!chat) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat not found'
                });
            }
            messageData.chat = chatId;
        } else if (groupId) {
            // Verify group exists and user is member
            const group = await Group.findOne({
                _id: groupId,
                'members.user': userId,
                'metadata.isDeleted': false
            });
            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Group not found'
                });
            }
            messageData.group = groupId;
        }

        const message = await Message.create(messageData);
        await message.populate('sender', 'username profilePicture status');

        // Update chat/group with last message
        // Update chat/group with last message and unread counts
        const io = req.app.get('io');
        if (chatId) {
            const chat = await Chat.findById(chatId);
            chat.lastMessage = message._id;
            chat.lastMessageTime = new Date();
            
            const recipients = chat.participants.filter(p => p.toString() !== userId);
            for (const recipientId of recipients) {
                const recipient = await User.findById(recipientId);
                if (recipient && recipient.blockedUsers && recipient.blockedUsers.includes(userId)) {
                    continue;
                }
                await chat.incrementUnread(recipientId);
                if (io) {
                    io.to(`user:${recipientId}`).emit('unreadCountUpdate', {
                        chatId,
                        unreadCount: chat.unreadCount
                    });
                }
            }
            await chat.save();
            
            if (io) {
                io.to(`chat:${chatId}`).emit('newMessage', message);
            }
        } else if (groupId) {
            const group = await Group.findById(groupId);
            group.lastMessage = message._id;
            group.lastMessageTime = new Date();
            
            const recipients = group.members.filter(m => m.user.toString() !== userId);
            for (const member of recipients) {
                await group.incrementUnread(member.user);
                if (io) {
                    io.to(`user:${member.user}`).emit('unreadCountUpdate', {
                        groupId,
                        unreadCount: group.getUnreadCount(member.user)
                    });
                }
            }
            await group.save();
            
            if (io) {
                io.to(`group:${groupId}`).emit('newMessage', message);
            }
        }

        // Send notifications to other participants
        let recipients = [];
        if (chatId) {
            const chat = await Chat.findById(chatId).populate('participants', 'status');
            recipients = chat.participants.filter(p => p._id.toString() !== userId);
        } else if (groupId) {
            const group = await Group.findById(groupId).populate('members.user', 'status');
            recipients = group.members
                .filter(m => m.user._id.toString() !== userId)
                .map(m => m.user);
        }

        const notifications = recipients.map(recipient => ({
            user: recipient._id,
            type: 'message',
            title: `New message from ${req.user.username}`,
            body: type === 'text' ? content : `📎 ${type} message`,
            data: {
                chatId: chatId || null,
                groupId: groupId || null,
                messageId: message._id,
                senderId: userId
            },
            priority: 'high'
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        recipients.forEach(recipient => {
            io.to(`user:${recipient._id}`).emit('newNotification', {
                count: 1
            });
        });

        res.status(201).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error sending message'
        });
    }
};

/**
 * @desc    Edit a message (UPDATED with edit history)
 * @route   PUT /api/messages/:id
 * @access  Private
 */
exports.editMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        const message = await Message.findOne({
            _id: id,
            sender: userId
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or unauthorized'
            });
        }

        // Only text messages can be edited
        if (message.type !== 'text') {
            return res.status(400).json({
                success: false,
                message: 'Only text messages can be edited'
            });
        }

        // Removed 5-minute edit restriction so user can edit any time

        // Save edit history (NEW FEATURE)
        if (!message.editHistory) message.editHistory = [];
        message.editHistory.push({
            content: message.content,
            editedAt: new Date()
        });

        // Update message
        message.content = content.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        // Populate sender for response
        await message.populate('sender', 'username profilePicture status');

        // Emit socket event
        const io = req.app.get('io');
        const room = message.chat || message.group;
        io.to(room).emit('messageEdited', {
            messageId: id,
            content: message.content,
            isEdited: true,
            editedAt: message.editedAt,
            chatId: message.chat || null,
            groupId: message.group || null
        });

        res.json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error editing message'
        });
    }
};

/**
 * @desc    Get message edit history (NEW FEATURE)
 * @route   GET /api/messages/:id/history
 * @access  Private
 */
exports.getMessageEditHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const message = await Message.findOne({
            _id: id,
            $or: [
                { sender: userId },
                { chat: { $exists: true } },
                { group: { $exists: true } }
            ]
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if user has access to this message
        if (message.chat) {
            const chat = await Chat.findOne({
                _id: message.chat,
                participants: userId,
                'metadata.isDeleted': false
            });
            if (!chat) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        } else if (message.group) {
            const group = await Group.findOne({
                _id: message.group,
                'members.user': userId,
                'metadata.isDeleted': false
            });
            if (!group) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        res.json({
            success: true,
            data: {
                current: {
                    content: message.content,
                    editedAt: message.editedAt,
                    isEdited: message.isEdited
                },
                history: message.editHistory || [],
                totalEdits: (message.editHistory || []).length
            }
        });
    } catch (error) {
        console.error('Get edit history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching edit history'
        });
    }
};

/**
 * @desc    Delete a message (KEPT from OLD)
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteForEveryone = false } = req.query;
        const userId = req.userId;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check authorization: sender or admin
        const isSender = message.sender.toString() === userId.toString();
        const isAdmin = await checkIfAdmin(message, userId);

        // If deleteForEveryone is true, only sender or admin can do it
        if (deleteForEveryone === 'true' || deleteForEveryone === true) {
            if (!isSender && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this message for everyone'
                });
            }

            // HARD DELETE for everyone
            await message.deleteOne();

            // Update lastMessage of chat or group if it was the deleted message
            let previousMessage = null;
            if (message.chat) {
                const chat = await Chat.findById(message.chat);
                if (chat && chat.lastMessage && chat.lastMessage.toString() === id) {
                    previousMessage = await Message.findOne({ chat: message.chat, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
                    chat.lastMessage = previousMessage ? previousMessage._id : null;
                    if (previousMessage) {
                        chat.lastMessageTime = previousMessage.createdAt;
                    }
                    await chat.save();
                }
            } else if (message.group) {
                const group = await Group.findById(message.group);
                if (group && group.lastMessage && group.lastMessage.toString() === id) {
                    previousMessage = await Message.findOne({ group: message.group, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
                    group.lastMessage = previousMessage ? previousMessage._id : null;
                    if (previousMessage) {
                        group.lastMessageTime = previousMessage.createdAt;
                    }
                    await group.save();
                }
            }

            const io = req.app.get('io');
            const room = message.chat || message.group;
            io.to(room).emit('messageDeleted', {
                messageId: id,
                chatId: message.chat || null,
                groupId: message.group || null,
                deleteForEveryone: true
            });

            return res.json({
                success: true,
                message: 'Message deleted for everyone successfully'
            });
        } else {
            // Delete for self (add to deletedFor array)
            if (!message.deletedFor) message.deletedFor = [];
            message.deletedFor.push(userId);
            await message.save();

            // Emit to self only
            const io = req.app.get('io');
            io.to(`user:${userId}`).emit('messageDeleted', {
                messageId: id,
                chatId: message.chat || null,
                groupId: message.group || null,
                deleteForEveryone: false
            });

            return res.json({
                success: true,
                message: 'Message deleted for you successfully'
            });
        }
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting message'
        });
    }
};

/**
 * Helper function to check if user is admin in group
 */
async function checkIfAdmin(message, userId) {
    if (message.group) {
        const group = await Group.findById(message.group);
        if (group) {
            return group.isAdmin(userId);
        }
    }
    return false;
}

/**
 * @desc    Mark message as read (KEPT from OLD)
 * @route   PUT /api/messages/:id/read
 * @access  Private
 */
exports.markMessageAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        await message.markAsRead(userId);

        const io = req.app.get('io');
        const room = message.chat || message.group;
        io.to(room).emit('messageRead', {
            messageId: id,
            userId,
            readAt: new Date()
        });

        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Mark message as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking message as read'
        });
    }
};

/**
 * @desc    Mark message as delivered (KEPT from OLD)
 * @route   PUT /api/messages/:id/delivered
 * @access  Private
 */
exports.markMessageAsDelivered = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        await message.markAsDelivered(userId);
        res.json({
            success: true,
            message: 'Message marked as delivered'
        });
    } catch (error) {
        console.error('Mark message as delivered error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking message as delivered'
        });
    }
};

/**
 * @desc    React to message (KEPT from OLD)
 * @route   POST /api/messages/:id/react
 * @access  Private
 */
exports.reactToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { reaction } = req.body;
        const userId = req.userId;

        if (!reaction) {
            return res.status(400).json({
                success: false,
                message: 'Reaction is required'
            });
        }

        const validReactions = ['❤️', '👍', '😂', '😮', '😢', '😡'];
        if (!validReactions.includes(reaction)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reaction'
            });
        }

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Remove existing reaction from this user
        message.reactions = message.reactions.filter(
            r => r.user.toString() !== userId
        );
        message.reactions.push({
            user: userId,
            reaction,
            createdAt: new Date()
        });
        await message.save();

        const io = req.app.get('io');
        const room = message.chat || message.group;
        io.to(room).emit('messageReacted', {
            messageId: id,
            reaction,
            user: userId
        });

        res.json({
            success: true,
            data: message.reactions
        });
    } catch (error) {
        console.error('React to message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding reaction'
        });
    }
};

/**
 * @desc    Remove reaction (KEPT from OLD)
 * @route   DELETE /api/messages/:id/react
 * @access  Private
 */
exports.removeReaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        message.reactions = message.reactions.filter(
            r => r.user.toString() !== userId
        );
        await message.save();
        res.json({
            success: true,
            message: 'Reaction removed'
        });
    } catch (error) {
        console.error('Remove reaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing reaction'
        });
    }
};

/**
 * @desc    Get message reactions (KEPT from OLD)
 * @route   GET /api/messages/:id/reactions
 * @access  Private
 */
exports.getMessageReactions = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findById(id)
            .populate('reactions.user', 'username profilePicture');
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        res.json({
            success: true,
            data: message.reactions
        });
    } catch (error) {
        console.error('Get message reactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching reactions'
        });
    }
};

/**
 * @desc    Forward a single message (KEPT from OLD)
 * @route   POST /api/messages/:id/forward
 * @access  Private
 */
exports.forwardMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { chatId, groupId } = req.body;
        const userId = req.userId;

        if (!chatId && !groupId) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID or Group ID is required'
            });
        }

        const originalMessage = await Message.findById(id);
        if (!originalMessage) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        const forwardedMessage = await Message.create({
            sender: userId,
            chat: chatId || null,
            group: groupId || null,
            content: originalMessage.content,
            type: originalMessage.type,
            media: originalMessage.media,
            metadata: {
                isForwarded: true,
                forwardedFrom: id
            }
        });

        if (chatId) {
            await Chat.findByIdAndUpdate(chatId, {
                lastMessage: forwardedMessage._id,
                lastMessageTime: new Date(),
                $inc: { unreadCount: 1 }
            });
        } else if (groupId) {
            await Group.findByIdAndUpdate(groupId, {
                lastMessage: forwardedMessage._id,
                lastMessageTime: new Date(),
                $inc: { unreadCount: 1 }
            });
        }

        const io = req.app.get('io');
        const room = chatId || groupId;
        io.to(room).emit('receiveMessage', {
            message: forwardedMessage,
            chatId: chatId || null,
            groupId: groupId || null
        });

        res.status(201).json({
            success: true,
            data: forwardedMessage
        });
    } catch (error) {
        console.error('Forward message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error forwarding message'
        });
    }
};

/**
 * @desc    Forward multiple messages to multiple chats/groups (NEW FEATURE)
 * @route   POST /api/messages/forward-bulk
 * @access  Private
 */
exports.forwardMessages = async (req, res) => {
    try {
        const { messageIds, chatIds, groupIds } = req.body;
        const userId = req.userId;

        if (!messageIds || messageIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No messages to forward'
            });
        }

        if ((!chatIds || chatIds.length === 0) && (!groupIds || groupIds.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'No recipients selected'
            });
        }

        // Get original messages
        const originalMessages = await Message.find({
            _id: { $in: messageIds },
            isDeleted: false
        });

        if (originalMessages.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid messages found'
            });
        }

        const forwardedMessages = [];
        const io = req.app.get('io');
        let totalRecipients = 0;

        // Forward to each chat
        if (chatIds && chatIds.length > 0) {
            for (const chatId of chatIds) {
                // Verify user is in chat
                const chat = await Chat.findOne({
                    _id: chatId,
                    participants: userId,
                    'metadata.isDeleted': false
                });

                if (!chat) continue;

                // Forward each message
                for (const originalMsg of originalMessages) {
                    const forwardedMessage = await Message.create({
                        sender: userId,
                        chat: chatId,
                        content: originalMsg.content,
                        type: originalMsg.type,
                        media: originalMsg.media,
                        metadata: {
                            isForwarded: true,
                            forwardedFrom: originalMsg._id,
                            forwardedAt: new Date()
                        },
                        replyTo: originalMsg.replyTo || null
                    });

                    await forwardedMessage.populate('sender', 'username profilePicture status');
                    forwardedMessages.push(forwardedMessage);

                    // Update chat with last message
                    await Chat.findByIdAndUpdate(chatId, {
                        lastMessage: forwardedMessage._id,
                        lastMessageTime: new Date(),
                        $inc: { unreadCount: 1 }
                    });

                    // Emit to chat room
                    io.to(`chat:${chatId}`).emit('receiveMessage', {
                        message: forwardedMessage,
                        chatId: chatId,
                        groupId: null
                    });
                }
                totalRecipients++;
            }
        }

        // Forward to groups
        if (groupIds && groupIds.length > 0) {
            for (const groupId of groupIds) {
                // Verify user is in group
                const group = await Group.findOne({
                    _id: groupId,
                    'members.user': userId,
                    'metadata.isDeleted': false
                });

                if (!group) continue;

                for (const originalMsg of originalMessages) {
                    const forwardedMessage = await Message.create({
                        sender: userId,
                        group: groupId,
                        content: originalMsg.content,
                        type: originalMsg.type,
                        media: originalMsg.media,
                        metadata: {
                            isForwarded: true,
                            forwardedFrom: originalMsg._id,
                            forwardedAt: new Date()
                        },
                        replyTo: originalMsg.replyTo || null
                    });

                    await forwardedMessage.populate('sender', 'username profilePicture status');
                    forwardedMessages.push(forwardedMessage);

                    await Group.findByIdAndUpdate(groupId, {
                        lastMessage: forwardedMessage._id,
                        lastMessageTime: new Date(),
                        $inc: { unreadCount: 1 }
                    });

                    io.to(`group:${groupId}`).emit('receiveMessage', {
                        message: forwardedMessage,
                        chatId: null,
                        groupId: groupId
                    });
                }
                totalRecipients++;
            }
        }

        // Emit messages forwarded event (NEW)
        io.to(`user:${userId}`).emit('messagesForwarded', {
            messageIds,
            chatIds,
            groupIds,
            forwardedCount: forwardedMessages.length,
            forwardedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: `Forwarded ${originalMessages.length} message(s) to ${totalRecipients} recipient(s)`,
            data: {
                forwardedMessages,
                totalMessages: originalMessages.length,
                totalRecipients
            }
        });
    } catch (error) {
        console.error('Forward messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error forwarding messages'
        });
    }
};

/**
 * @desc    Reply to a message (KEPT from OLD)
 * @route   POST /api/messages/:id/reply
 * @access  Private
 */
exports.replyToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, type = 'text', media } = req.body;
        const userId = req.userId;

        const originalMessage = await Message.findById(id);
        if (!originalMessage) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        const replyData = {
            sender: userId,
            chat: originalMessage.chat || null,
            group: originalMessage.group || null,
            content,
            type,
            media: media || {},
            replyTo: id
        };

        const replyMessage = await Message.create(replyData);
        await replyMessage.populate('sender', 'username profilePicture');

        const chatId = originalMessage.chat;
        const groupId = originalMessage.group;

        if (chatId) {
            await Chat.findByIdAndUpdate(chatId, {
                lastMessage: replyMessage._id,
                lastMessageTime: new Date(),
                $inc: { unreadCount: 1 }
            });
        } else if (groupId) {
            await Group.findByIdAndUpdate(groupId, {
                lastMessage: replyMessage._id,
                lastMessageTime: new Date(),
                $inc: { unreadCount: 1 }
            });
        }

        const io = req.app.get('io');
        const room = chatId || groupId;
        io.to(room).emit('receiveMessage', {
            message: replyMessage,
            chatId: chatId || null,
            groupId: groupId || null
        });

        res.status(201).json({
            success: true,
            data: replyMessage
        });
    } catch (error) {
        console.error('Reply to message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error replying to message'
        });
    }
};

/**
 * @desc    Get media messages (KEPT from OLD)
 * @route   GET /api/messages/media/:chatId
 * @access  Private
 */
exports.getMediaMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userId;
        const { type, limit = 20 } = req.query;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            'metadata.isDeleted': false
        });
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const query = {
            chat: chatId,
            type: { $ne: 'text' },
            isDeleted: false
        };
        if (type) query.type = type;

        const messages = await Message.find(query)
            .populate('sender', 'username profilePicture')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Get media messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching media messages'
        });
    }
};

/**
 * @desc    Star a message (toggle) (KEPT from OLD)
 * @route   PUT /api/messages/star/:id
 * @access  Private
 */
exports.starMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Toggle star: add or remove userId from starredBy array
        if (!message.starredBy) message.starredBy = [];
        const index = message.starredBy.indexOf(userId);
        if (index > -1) {
            message.starredBy.splice(index, 1);
        } else {
            message.starredBy.push(userId);
        }
        await message.save();

        res.status(200).json({
            success: true,
            data: message,
            starred: index === -1 // true if now starred
        });
    } catch (error) {
        console.error('Star message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error toggling star'
        });
    }
};

/**
 * @desc    Get starred messages (NEW FEATURE)
 * @route   GET /api/messages/starred
 * @access  Private
 */
exports.getStarredMessages = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 50, page = 1 } = req.query;

        const messages = await Message.find({
            starredBy: userId,
            isDeleted: false
        })
        .populate('sender', 'username profilePicture status')
        .populate('chat', 'participants')
        .populate('group', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

        const total = await Message.countDocuments({
            starredBy: userId,
            isDeleted: false
        });

        res.json({
            success: true,
            data: {
                messages,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get starred messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching starred messages'
        });
    }
};

/**
 * @desc    Get message by ID (NEW FEATURE)
 * @route   GET /api/messages/:id
 * @access  Private
 */
exports.getMessageById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const message = await Message.findOne({
            _id: id,
            isDeleted: false
        })
        .populate('sender', 'username profilePicture status')
        .populate('replyTo', 'content sender type media')
        .populate('reactions.user', 'username profilePicture');

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if user has access to this message
        if (message.chat) {
            const chat = await Chat.findOne({
                _id: message.chat,
                participants: userId,
                'metadata.isDeleted': false
            });
            if (!chat) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        } else if (message.group) {
            const group = await Group.findOne({
                _id: message.group,
                'members.user': userId,
                'metadata.isDeleted': false
            });
            if (!group) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        res.json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Get message by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching message'
        });
    }
};

/**
 * @desc    Pin/Unpin a message (NEW FEATURE)
 * @route   PUT /api/messages/:id/pin
 * @access  Private
 */
exports.togglePinMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if user is admin (for groups) or participant (for chats)
        if (message.group) {
            const group = await Group.findOne({
                _id: message.group,
                'members.user': userId,
                'members.role': 'admin',
                'metadata.isDeleted': false
            });
            if (!group) {
                return res.status(403).json({
                    success: false,
                    message: 'Only admins can pin messages in groups'
                });
            }
        } else if (message.chat) {
            const chat = await Chat.findOne({
                _id: message.chat,
                participants: userId,
                'metadata.isDeleted': false
            });
            if (!chat) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        // Toggle pin
        message.isPinned = !message.isPinned;
        message.pinnedAt = message.isPinned ? new Date() : null;
        message.pinnedBy = message.isPinned ? userId : null;
        await message.save();

        const io = req.app.get('io');
        const room = message.chat || message.group;
        io.to(room).emit('messagePinned', {
            messageId: id,
            isPinned: message.isPinned,
            userId,
            pinnedAt: message.pinnedAt
        });

        res.json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Toggle pin message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error toggling pin'
        });
    }
};