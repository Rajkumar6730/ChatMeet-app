// server/socket/socket.js
const socketIO = require('socket.io');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Group = require('../models/Group');
const ContactRequest = require('../models/ContactRequest');
const jwt = require('jsonwebtoken');

const initializeSocket = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
            methods: ['GET', 'POST']
        }
    });

    // Auth middleware (KEPT from OLD)
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication required'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password -refreshToken');
            if (!user) return next(new Error('User not found'));
            socket.user = user;
            socket.userId = user._id.toString();
            next();
        } catch (error) {
            console.error('Socket auth error:', error);
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId} (${socket.user.username})`);
        socket.join(`user:${socket.userId}`);

        // Update status to online (KEPT from OLD)
        User.findByIdAndUpdate(socket.userId, { status: 'online', lastSeen: new Date() })
            .then(() => io.emit('userStatusChanged', {
                userId: socket.userId,
                status: 'online',
                lastSeen: new Date()
            }))
            .catch(err => console.error('Error updating status:', err));

        // ---- Join chat/group rooms (KEPT from OLD) ----
        socket.on('joinChat', async ({ chatId }) => {
            try {
                const chat = await Chat.findOne({ _id: chatId, participants: socket.userId });
                if (chat) {
                    socket.join(`chat:${chatId}`);
                    console.log(`User ${socket.userId} joined chat ${chatId}`);
                }
            } catch (err) {
                console.error('Join chat error:', err);
            }
        });

        socket.on('joinGroup', async ({ groupId }) => {
            try {
                const group = await Group.findOne({ _id: groupId, 'members.user': socket.userId });
                if (group) {
                    socket.join(`group:${groupId}`);
                    console.log(`User ${socket.userId} joined group ${groupId}`);
                }
            } catch (err) {
                console.error('Join group error:', err);
            }
        });

        // ---- Join group room with online members (NEW FEATURE) ----
        socket.on('joinGroupRoom', async ({ groupId }) => {
            try {
                const group = await Group.findOne({
                    _id: groupId,
                    'members.user': socket.userId,
                    'metadata.isDeleted': false
                });
                
                if (group) {
                    socket.join(`group:${groupId}`);
                    
                    // Add user to online members
                    await Group.findByIdAndUpdate(groupId, {
                        $pull: { onlineMembers: { user: socket.userId } }
                    });
                    await Group.findByIdAndUpdate(groupId, {
                        $push: { onlineMembers: { user: socket.userId, lastActive: new Date() } }
                    });
                    
                    // Get online members list
                    const updatedGroup = await Group.findById(groupId)
                        .populate('onlineMembers.user', 'username profilePicture status');
                    
                    io.to(`group:${groupId}`).emit('groupOnlineMembers', {
                        groupId,
                        onlineMembers: updatedGroup.onlineMembers
                    });
                    
                    console.log(`User ${socket.userId} joined group ${groupId}`);
                }
            } catch (err) {
                console.error('Join group room error:', err);
            }
        });

        // ---- Leave group room (NEW FEATURE) ----
        socket.on('leaveGroupRoom', async ({ groupId }) => {
            try {
                socket.leave(`group:${groupId}`);
                
                // Remove user from online members
                await Group.findByIdAndUpdate(groupId, {
                    $pull: { onlineMembers: { user: socket.userId } }
                });
                
                // Get updated online members
                const updatedGroup = await Group.findById(groupId)
                    .populate('onlineMembers.user', 'username profilePicture status');
                
                io.to(`group:${groupId}`).emit('groupOnlineMembers', {
                    groupId,
                    onlineMembers: updatedGroup.onlineMembers
                });
                
                console.log(`User ${socket.userId} left group ${groupId}`);
            } catch (err) {
                console.error('Leave group room error:', err);
            }
        });

        // ---- Send message (UPDATED with block check and caption support) ----
        socket.on('sendMessage', async (data) => {
            try {
                const { chatId, groupId, content, type, media, replyTo, caption } = data;
                const userId = socket.userId;

                let messageData = {
                    sender: userId,
                    content,
                    type: type || 'text',
                    media: media || null,
                    replyTo: replyTo || null,
                };

                // Add caption for image messages (NEW FEATURE)
                if (type === 'image' && caption) {
                    if (messageData.media) {
                        messageData.media.caption = caption;
                    } else {
                        messageData.media = { caption };
                    }
                }

                let savedMessage;
                let chat;

                if (chatId) {
                    chat = await Chat.findById(chatId);
                    if (!chat) {
                        socket.emit('error', { message: 'Chat not found' });
                        return;
                    }

                    if (!chat.participants.includes(userId)) {
                        socket.emit('error', { message: 'Not a participant' });
                        return;
                    }

                    // ---- BLOCK CHECK ----
                    const participants = chat.participants;
                    let isBlocked = false;
                    let blockedBy = null;
                    
                    for (const participantId of participants) {
                        if (participantId.toString() === userId) continue;
                        
                        const participant = await User.findById(participantId);
                        if (participant && participant.blockedUsers && participant.blockedUsers.includes(userId)) {
                            isBlocked = true;
                            blockedBy = participantId;
                            break;
                        }
                    }

                    if (isBlocked) {
                        return socket.emit('messageBlocked', {
                            chatId,
                            message: 'You are blocked by this user',
                            blockedBy: blockedBy
                        });
                    }

                    const currentUser = await User.findById(userId);
                    for (const participantId of participants) {
                        if (participantId.toString() === userId) continue;
                        if (currentUser && currentUser.blockedUsers && currentUser.blockedUsers.includes(participantId)) {
                            return socket.emit('messageBlocked', {
                                chatId,
                                message: 'You have blocked this user',
                                blockedUser: participantId
                            });
                        }
                    }

                    const message = new Message({
                        ...messageData,
                        chat: chatId,
                    });
                    savedMessage = await message.save();

                    chat.lastMessage = savedMessage._id;
                    chat.lastMessageTime = savedMessage.createdAt || Date.now();
                    
                    const recipients = chat.participants.filter(p => p.toString() !== userId);
                    for (const recipientId of recipients) {
                        const recipient = await User.findById(recipientId);
                        if (recipient && recipient.blockedUsers && recipient.blockedUsers.includes(userId)) {
                            continue;
                        }
                        await chat.incrementUnread(recipientId);
                        io.to(`user:${recipientId}`).emit('unreadCountUpdate', {
                            chatId,
                            unreadCount: chat.unreadCount
                        });
                    }
                    
                    await chat.save();
                    await savedMessage.populate('sender', 'username profilePicture');
                    io.to(`chat:${chatId}`).emit('newMessage', savedMessage);
                    
                } else if (groupId) {
                    const group = await Group.findById(groupId);
                    if (!group) {
                        socket.emit('error', { message: 'Group not found' });
                        return;
                    }

                    if (!group.members.some(m => m.user.toString() === userId)) {
                        socket.emit('error', { message: 'Not a member' });
                        return;
                    }

                    const members = group.members;
                    let isBlocked = false;
                    let blockedBy = null;
                    
                    for (const member of members) {
                        if (member.user.toString() === userId) continue;
                        
                        const memberUser = await User.findById(member.user);
                        if (memberUser && memberUser.blockedUsers && memberUser.blockedUsers.includes(userId)) {
                            isBlocked = true;
                            blockedBy = member.user;
                            break;
                        }
                    }

                    if (isBlocked) {
                        return socket.emit('messageBlocked', {
                            groupId,
                            message: 'You are blocked by a group member',
                            blockedBy: blockedBy
                        });
                    }

                    const message = new Message({
                        ...messageData,
                        group: groupId,
                    });
                    savedMessage = await message.save();

                    group.lastMessage = savedMessage._id;
                    group.lastMessageTime = savedMessage.createdAt || Date.now();
                    
                    // Increment unread count for all other members
                    await group.incrementUnread(userId);

                    await savedMessage.populate('sender', 'username profilePicture');
                    io.to(`group:${groupId}`).emit('newMessage', savedMessage);
                    
                    // Emit unreadCountUpdate to all members
                    for (const member of group.members) {
                        const memberUserId = member.user.toString();
                        if (memberUserId !== userId) {
                            io.to(`user:${memberUserId}`).emit('unreadCountUpdate', {
                                chatId: groupId,
                                groupId: groupId,
                                unreadCount: member.unreadCount
                            });
                        }
                    }
                }

                socket.emit('messageSent', savedMessage);

            } catch (err) {
                console.error('Send message error:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // ---- Group typing (NEW FEATURE) ----
        socket.on('groupTyping', ({ groupId, isTyping }) => {
            if (isTyping) {
                socket.to(`group:${groupId}`).emit('groupTyping', {
                    groupId,
                    userId: socket.userId,
                    username: socket.user.username
                });
            } else {
                socket.to(`group:${groupId}`).emit('groupStopTyping', {
                    groupId,
                    userId: socket.userId
                });
            }
        });

        // ---- Send contact request (NEW FEATURE) ----
        socket.on('sendContactRequest', async ({ toUserId, message }) => {
            try {
                const fromUser = await User.findById(socket.userId).select('username profilePicture');
                
                const request = await ContactRequest.create({
                    from: socket.userId,
                    to: toUserId,
                    message: message || ''
                });
                
                io.to(`user:${toUserId}`).emit('newContactRequest', {
                    requestId: request._id,
                    from: {
                        _id: socket.userId,
                        username: fromUser.username,
                        profilePicture: fromUser.profilePicture
                    },
                    message: request.message,
                    createdAt: request.createdAt
                });
            } catch (err) {
                console.error('Send contact request error:', err);
            }
        });

        // ---- Block user (NEW FEATURE) ----
        socket.on('blockUser', async ({ userId }) => {
            try {
                const currentUser = await User.findById(socket.userId);
                if (!currentUser) return;

                await currentUser.blockUser(userId);

                io.to(`user:${userId}`).emit('userBlocked', {
                    blockedBy: socket.userId,
                    blockedAt: new Date()
                });
                
                io.to(`user:${socket.userId}`).emit('userBlocked', {
                    blockedUser: userId,
                    blockedAt: new Date()
                });

                const chat = await Chat.findOne({
                    participants: { $all: [socket.userId, userId] }
                });
                if (chat) {
                    io.to(`chat:${chat._id}`).emit('chatBlocked', {
                        chatId: chat._id,
                        blockedBy: socket.userId
                    });
                }
            } catch (err) {
                console.error('Block user socket error:', err);
            }
        });

        // ---- Unblock user (NEW FEATURE) ----
        socket.on('unblockUser', async ({ userId }) => {
            try {
                const currentUser = await User.findById(socket.userId);
                if (!currentUser) return;

                await currentUser.unblockUser(userId);

                io.to(`user:${userId}`).emit('userUnblocked', {
                    unblockedBy: socket.userId,
                    unblockedAt: new Date()
                });
                
                io.to(`user:${socket.userId}`).emit('userUnblocked', {
                    unblockedUser: userId,
                    unblockedAt: new Date()
                });
            } catch (err) {
                console.error('Unblock user socket error:', err);
            }
        });

        // ---- Check block status (NEW FEATURE) ----
        socket.on('checkBlockStatus', async ({ userId }) => {
            try {
                const currentUser = await User.findById(socket.userId);
                const targetUser = await User.findById(userId);
                
                if (!currentUser || !targetUser) {
                    return socket.emit('blockStatus', {
                        userId,
                        isBlocked: false,
                        isBlockedBy: false,
                        canInteract: false
                    });
                }

                const isBlocked = currentUser.blockedUsers && currentUser.blockedUsers.includes(userId);
                const isBlockedBy = targetUser.blockedUsers && targetUser.blockedUsers.includes(socket.userId);
                
                socket.emit('blockStatus', {
                    userId,
                    isBlocked,
                    isBlockedBy,
                    canInteract: !isBlocked && !isBlockedBy,
                    mutual: isBlocked && isBlockedBy
                });
            } catch (err) {
                console.error('Check block status error:', err);
            }
        });

        // ---- Get blocked users (NEW FEATURE) ----
        socket.on('getBlockedUsers', async () => {
            try {
                const currentUser = await User.findById(socket.userId);
                if (!currentUser) return;

                const blockedUsers = await currentUser.getBlockedUsers();
                socket.emit('blockedUsers', blockedUsers);
            } catch (err) {
                console.error('Get blocked users error:', err);
            }
        });

        // ---- Mark chat as read (NEW FEATURE) ----
        socket.on('markChatAsRead', async ({ chatId }) => {
            try {
                const chat = await Chat.findOne({
                    _id: chatId,
                    participants: socket.userId
                });
                if (chat) {
                    await chat.markAsRead(socket.userId);
                    
                    const otherParticipants = chat.participants
                        .filter(p => p.toString() !== socket.userId);
                    
                    otherParticipants.forEach(userId => {
                        io.to(`user:${userId}`).emit('chatRead', {
                            chatId,
                            userId: socket.userId,
                            readAt: new Date()
                        });
                    });
                }
            } catch (err) {
                console.error('Mark chat as read socket error:', err);
                socket.emit('error', { message: 'Failed to mark chat as read' });
            }
        });

        // ---- Mark chat as unread (NEW FEATURE) ----
        socket.on('markChatAsUnread', async ({ chatId }) => {
            try {
                const chat = await Chat.findOne({
                    _id: chatId,
                    participants: socket.userId
                });
                if (chat) {
                    await chat.markAsUnread(socket.userId);
                    
                    const otherParticipants = chat.participants
                        .filter(p => p.toString() !== socket.userId);
                    
                    otherParticipants.forEach(userId => {
                        io.to(`user:${userId}`).emit('chatUnread', {
                            chatId,
                            userId: socket.userId,
                            unreadCount: chat.unreadCount
                        });
                    });
                }
            } catch (err) {
                console.error('Mark chat as unread socket error:', err);
                socket.emit('error', { message: 'Failed to mark chat as unread' });
            }
        });

        // ---- Message seen (KEPT from OLD) ----
        socket.on('messageSeen', async ({ chatId, groupId, messageId }) => {
            try {
                const room = chatId || groupId;
                
                const message = await Message.findById(messageId);
                if (message) {
                    if (!message.seenBy) message.seenBy = [];
                    if (!message.seenBy.includes(socket.userId)) {
                        message.seenBy.push(socket.userId);
                        await message.save();
                    }
                }

                if (chatId) {
                    const chat = await Chat.findById(chatId);
                    if (chat) {
                        await chat.markAsSeen(socket.userId, messageId);
                    }
                } else if (groupId) {
                    const group = await Group.findById(groupId);
                    if (group) {
                        await group.markAsSeen(socket.userId, messageId);
                    }
                }

                if (room) {
                    socket.to(room).emit('messageSeen', {
                        chatId,
                        groupId,
                        messageId,
                        userId: socket.userId,
                        seenAt: new Date()
                    });
                }
            } catch (err) {
                console.error('Message seen error:', err);
            }
        });

        // ---- Message delivered (KEPT from OLD) ----
        socket.on('messageDelivered', async ({ chatId, groupId, messageId }) => {
            try {
                const room = chatId || groupId;
                const message = await Message.findById(messageId);
                if (message) {
                    if (!message.deliveredTo) message.deliveredTo = [];
                    if (!message.deliveredTo.includes(socket.userId)) {
                        message.deliveredTo.push(socket.userId);
                        await message.save();
                    }
                }

                if (room) {
                    socket.to(room).emit('messageDelivered', {
                        chatId,
                        groupId,
                        messageId,
                        userId: socket.userId,
                        deliveredAt: new Date()
                    });
                }
            } catch (err) {
                console.error('Message delivered error:', err);
            }
        });

        // ---- Typing indicators (KEPT from OLD) ----
        socket.on('typing', ({ chatId, groupId }) => {
            const room = chatId || groupId;
            if (room) {
                socket.to(room).emit('typing', { 
                    userId: socket.userId, 
                    chatId, 
                    groupId 
                });
            }
        });

        socket.on('stopTyping', ({ chatId, groupId }) => {
            const room = chatId || groupId;
            if (room) {
                socket.to(room).emit('stopTyping', { 
                    userId: socket.userId, 
                    chatId, 
                    groupId 
                });
            }
        });

        // ---- Message deleted (KEPT from OLD) ----
        socket.on('messageDeleted', ({ chatId, groupId, messageId, deleteForEveryone }) => {
            const room = chatId || groupId;
            if (room) {
                socket.to(room).emit('messageDeleted', {
                    chatId,
                    groupId,
                    messageId,
                    deleteForEveryone,
                    userId: socket.userId,
                    deletedAt: new Date()
                });
            }
        });

        // ---- Message edited (KEPT from OLD) ----
        socket.on('messageEdited', async ({ chatId, groupId, messageId, newContent }) => {
            try {
                const room = chatId || groupId;
                const message = await Message.findById(messageId);
                if (message && message.sender.toString() === socket.userId) {
                    message.content = newContent;
                    message.isEdited = true;
                    await message.save();
                    
                    if (room) {
                        io.to(room).emit('messageEdited', {
                            chatId,
                            groupId,
                            messageId,
                            newContent,
                            userId: socket.userId,
                            editedAt: new Date()
                        });
                    }
                }
            } catch (err) {
                console.error('Message edit error:', err);
            }
        });

        // ---- Message starred (KEPT from OLD) ----
        socket.on('messageStarred', async ({ chatId, groupId, messageId }) => {
            try {
                const room = chatId || groupId;
                const message = await Message.findById(messageId);
                if (message) {
                    if (!message.starredBy) message.starredBy = [];
                    const index = message.starredBy.indexOf(socket.userId);
                    if (index > -1) {
                        message.starredBy.splice(index, 1);
                    } else {
                        message.starredBy.push(socket.userId);
                    }
                    await message.save();
                    
                    if (room) {
                        io.to(room).emit('messageStarred', {
                            chatId,
                            groupId,
                            messageId,
                            userId: socket.userId,
                            isStarred: index === -1,
                            starredAt: new Date()
                        });
                    }
                }
            } catch (err) {
                console.error('Message star error:', err);
            }
        });

        // ---- Get unread counts (NEW FEATURE) ----
        socket.on('getUnreadCounts', async () => {
            try {
                const chats = await Chat.find({
                    participants: socket.userId,
                    'metadata.isDeleted': false
                });
                
                const unreadCounts = {};
                for (const chat of chats) {
                    const unreadCount = chat.getUnreadCount(socket.userId);
                    if (unreadCount > 0) {
                        unreadCounts[chat._id] = unreadCount;
                    }
                }
                
                socket.emit('unreadCounts', unreadCounts);
            } catch (err) {
                console.error('Get unread counts error:', err);
            }
        });

        // ---- Get chat unread count (NEW FEATURE) ----
        socket.on('getChatUnreadCount', async ({ chatId }) => {
            try {
                const chat = await Chat.findOne({
                    _id: chatId,
                    participants: socket.userId
                });
                if (chat) {
                    const unreadCount = chat.getUnreadCount(socket.userId);
                    socket.emit('chatUnreadCount', {
                        chatId,
                        unreadCount
                    });
                }
            } catch (err) {
                console.error('Get chat unread count error:', err);
            }
        });

        // ---- Clear chat (UPDATED from OLD) ----
        socket.on('clearChat', async ({ chatId }) => {
            try {
                const chat = await Chat.findOne({
                    _id: chatId,
                    participants: socket.userId
                });

                if (chat) {
                    await Message.deleteMany({ chat: chatId });
                    chat.lastMessage = null;
                    chat.lastMessageTime = null;
                    chat.unreadCount = 0;
                    await chat.save();
                    
                    io.to(`chat:${chatId}`).emit('chatCleared', {
                        chatId: chatId,
                        clearedBy: socket.userId,
                        clearedAt: new Date()
                    });
                    
                    io.to(`user:${socket.userId}`).emit('chatCleared', {
                        chatId: chatId,
                        clearedBy: socket.userId,
                        clearedAt: new Date()
                    });
                }
            } catch (err) {
                console.error('Clear chat socket error:', err);
                socket.emit('error', { message: 'Failed to clear chat' });
            }
        });

        // ---- Forward messages (NEW FEATURE) ----
        socket.on('forwardMessages', async ({ messageIds, chatIds, groupIds }) => {
            try {
                if (!messageIds || messageIds.length === 0) {
                    return socket.emit('error', { message: 'No messages to forward' });
                }

                if ((!chatIds || chatIds.length === 0) && (!groupIds || groupIds.length === 0)) {
                    return socket.emit('error', { message: 'No recipients selected' });
                }

                const originalMessages = await Message.find({
                    _id: { $in: messageIds },
                    isDeleted: false
                });

                if (originalMessages.length === 0) {
                    return socket.emit('error', { message: 'No valid messages found' });
                }

                let forwardedCount = 0;
                const ioInstance = io;

                if (chatIds && chatIds.length > 0) {
                    for (const chatId of chatIds) {
                        const chat = await Chat.findOne({
                            _id: chatId,
                            participants: socket.userId,
                            'metadata.isDeleted': false
                        });

                        if (!chat) continue;

                        for (const originalMsg of originalMessages) {
                            const forwardedMessage = new Message({
                                sender: socket.userId,
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

                            await forwardedMessage.save();
                            await forwardedMessage.populate('sender', 'username profilePicture status');
                            
                            await Chat.findByIdAndUpdate(chatId, {
                                lastMessage: forwardedMessage._id,
                                lastMessageTime: new Date(),
                                $inc: { unreadCount: 1 }
                            });

                            ioInstance.to(`chat:${chatId}`).emit('receiveMessage', {
                                message: forwardedMessage,
                                chatId: chatId,
                                groupId: null
                            });
                            
                            forwardedCount++;
                        }
                    }
                }

                if (groupIds && groupIds.length > 0) {
                    for (const groupId of groupIds) {
                        const group = await Group.findOne({
                            _id: groupId,
                            'members.user': socket.userId,
                            'metadata.isDeleted': false
                        });

                        if (!group) continue;

                        for (const originalMsg of originalMessages) {
                            const forwardedMessage = new Message({
                                sender: socket.userId,
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

                            await forwardedMessage.save();
                            await forwardedMessage.populate('sender', 'username profilePicture status');
                            
                            await Group.findByIdAndUpdate(groupId, {
                                lastMessage: forwardedMessage._id,
                                lastMessageTime: new Date(),
                                $inc: { unreadCount: 1 }
                            });

                            ioInstance.to(`group:${groupId}`).emit('receiveMessage', {
                                message: forwardedMessage,
                                chatId: null,
                                groupId: groupId
                            });
                            
                            forwardedCount++;
                        }
                    }
                }

                ioInstance.to(`user:${socket.userId}`).emit('messagesForwarded', {
                    messageIds,
                    chatIds,
                    groupIds,
                    forwardedCount,
                    forwardedAt: new Date()
                });

                socket.emit('forwardSuccess', {
                    message: `Successfully forwarded ${forwardedCount} messages`,
                    count: forwardedCount
                });

            } catch (err) {
                console.error('Forward messages socket error:', err);
                socket.emit('error', { message: 'Failed to forward messages' });
            }
        });

        // ---- Pin message (NEW FEATURE) ----
        socket.on('pinMessage', async ({ chatId, groupId, messageId }) => {
            try {
                const room = chatId || groupId;
                const message = await Message.findById(messageId);
                
                if (!message) {
                    return socket.emit('error', { message: 'Message not found' });
                }

                if (groupId) {
                    const group = await Group.findOne({
                        _id: groupId,
                        'members.user': socket.userId,
                        'members.role': 'admin'
                    });
                    if (!group) {
                        return socket.emit('error', { message: 'Only admins can pin messages' });
                    }
                } else if (chatId) {
                    const chat = await Chat.findOne({
                        _id: chatId,
                        participants: socket.userId
                    });
                    if (!chat) {
                        return socket.emit('error', { message: 'Access denied' });
                    }
                }

                message.isPinned = !message.isPinned;
                message.pinnedAt = message.isPinned ? new Date() : null;
                message.pinnedBy = message.isPinned ? socket.userId : null;
                await message.save();

                if (room) {
                    io.to(room).emit('messagePinned', {
                        messageId,
                        isPinned: message.isPinned,
                        userId: socket.userId,
                        pinnedAt: message.pinnedAt
                    });
                }

                socket.emit('pinSuccess', {
                    messageId,
                    isPinned: message.isPinned
                });

            } catch (err) {
                console.error('Pin message socket error:', err);
                socket.emit('error', { message: 'Failed to pin message' });
            }
        });

        // ---- Get pinned messages (NEW FEATURE) ----
        socket.on('getPinnedMessages', async ({ chatId, groupId }) => {
            try {
                const query = {
                    isPinned: true,
                    isDeleted: false
                };

                if (chatId) {
                    query.chat = chatId;
                } else if (groupId) {
                    query.group = groupId;
                } else {
                    return socket.emit('error', { message: 'Chat ID or Group ID required' });
                }

                const pinnedMessages = await Message.find(query)
                    .populate('sender', 'username profilePicture status')
                    .populate('pinnedBy', 'username profilePicture')
                    .sort({ pinnedAt: -1 });

                socket.emit('pinnedMessages', {
                    chatId: chatId || null,
                    groupId: groupId || null,
                    messages: pinnedMessages
                });

            } catch (err) {
                console.error('Get pinned messages socket error:', err);
                socket.emit('error', { message: 'Failed to get pinned messages' });
            }
        });

        // ---- Disconnect (KEPT from OLD) ----
        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.userId}`);
            await User.findByIdAndUpdate(socket.userId, { 
                status: 'offline', 
                lastSeen: new Date() 
            });
            io.emit('userStatusChanged', { 
                userId: socket.userId, 
                status: 'offline', 
                lastSeen: new Date() 
            });
        });
    });

    return io;
};

module.exports = initializeSocket;