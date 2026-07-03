// client/src/hooks/useChat.js
import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const useChat = (chatId = null, groupId = null, onChatUpdate = null) => {
  const { user } = useAuth();
  const { socket, emit, on, off, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  
  // ---- Block status ----
  const [isBlockedByUser, setIsBlockedByUser] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [blockStatus, setBlockStatus] = useState({
    isBlocked: false,
    isBlockedBy: false,
    canInteract: true,
    mutual: false
  });

  // ---- Fetch messages ----
  const fetchMessages = useCallback(async (page = 1) => {
    if (!chatId && !groupId) return;
    setLoading(true);
    try {
      const data = await chatService.getMessages(chatId, groupId, page);
      if (page === 1) {
        setMessages(data.messages);
      } else {
        setMessages(prev => [...data.messages, ...prev]);
      }
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  }, [chatId, groupId]);

  // ---- Fetch chat details ----
  const fetchChat = useCallback(async () => {
    if (!chatId && !groupId) return;
    try {
      const data = groupId 
        ? await chatService.getGroupById(groupId) 
        : await chatService.getChatById(chatId);
      setChat(data);
      setUnreadCount(data.unreadCount || 0);
      return data;
    } catch (err) {
      console.error('Fetch chat error:', err);
    }
  }, [chatId, groupId]);

  // ---- Check block status ----
  const checkBlockStatus = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const status = await chatService.checkBlockStatus(userId);
      setBlockStatus({
        isBlocked: status.isBlocked || false,
        isBlockedBy: status.isBlockedBy || false,
        canInteract: status.canInteract !== undefined ? status.canInteract : true,
        mutual: status.mutual || false
      });
      setIsBlockedByUser(status.isBlocked || false);
      setIsBlockedByOther(status.isBlockedBy || false);
      return status;
    } catch (err) {
      console.error('Check block status error:', err);
      return null;
    }
  }, []);

  // ---- Send message ----
  const sendMessage = useCallback(async (content, type = 'text', media = null, replyToId = null) => {
    if (!chatId && !groupId) return;
    
    if (isBlockedByUser || isBlockedByOther) {
      const error = new Error('Cannot send message: You are blocked or have blocked this user');
      setError(error.message);
      throw error;
    }
    
    try {
      const data = { chatId, groupId, content, type, media, replyToId };
      const message = await chatService.sendMessage(data);
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
      return message;
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.message);
      throw err;
    }
  }, [chatId, groupId, emit, isConnected, isBlockedByUser, isBlockedByOther]);

  // ---- Send typing indicator ----
  const sendTyping = useCallback((isTyping = true) => {
    if ((!chatId && !groupId) || !isConnected) return;
    if (groupId) {
      emit('groupTyping', { groupId, isTyping });
    } else {
      if (isTyping) {
        emit('typing', { chatId });
      } else {
        emit('stopTyping', { chatId });
      }
    }
  }, [chatId, groupId, emit, isConnected]);

  // ---- Mark a single message as read ----
  const markAsRead = useCallback(async (messageId) => {
    try {
      await chatService.markMessageAsRead(messageId);
      if (isConnected) {
        emit('messageSeen', { chatId, messageId });
      }
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, readBy: [...msg.readBy, { user: user._id, readAt: new Date() }] } : msg
      ));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }, [chatId, groupId, emit, isConnected, user]);

  // ---- Mark the whole chat as read ----
  const markChatAsRead = useCallback(async () => {
    if (!chatId && !groupId) return;
    try {
      if (groupId) {
        await chatService.markGroupAsRead(groupId);
        // Note: the socket emit for group read might not exist, but let's leave it out or add if needed
      } else {
        await chatService.markChatAsRead(chatId);
        if (isConnected) {
          emit('markChatAsRead', { chatId });
        }
      }
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark chat as read error:', err);
    }
  }, [chatId, groupId, emit, isConnected]);

  // ---- Mark the whole chat as unread ----
  const markChatAsUnread = useCallback(async () => {
    if (!chatId && !groupId) return;
    try {
      if (groupId) {
        // Group unread API not implemented yet, skip for now
      } else {
        await chatService.markChatAsUnread(chatId);
        if (isConnected) {
          emit('markChatAsUnread', { chatId });
        }
      }
      setUnreadCount(1);
    } catch (err) {
      console.error('Mark chat as unread error:', err);
    }
  }, [chatId, groupId, emit, isConnected]);

  // ---- Delete a message ----
  const deleteMessage = useCallback(async (messageId, deleteForEveryone = false) => {
    setMessages(prev => prev.filter(msg => msg._id !== messageId));

    try {
      await chatService.deleteMessage(messageId, deleteForEveryone);
      if (isConnected) {
        emit('messageDeleted', { chatId, groupId, messageId, deleteForEveryone });
      }
    } catch (err) {
      console.error('Delete message API error:', err);
      fetchMessages();
    }
  }, [chatId, groupId, emit, isConnected, fetchMessages]);

  // ---- Edit a message ----
  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      const updatedMessage = await chatService.editMessage(messageId, newContent);
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? updatedMessage : msg
      ));
      if (isConnected) {
        emit('messageEdited', { 
          chatId, 
          groupId,
          messageId, 
          newContent
        });
      }
      return updatedMessage;
    } catch (err) {
      console.error('Edit message error:', err);
      throw err;
    }
  }, [chatId, groupId, emit, isConnected]);

  // ---- Star a message ----
  const starMessage = useCallback(async (messageId) => {
    try {
      const result = await chatService.starMessage(messageId);
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, starredBy: result.starredBy || [] } : msg
      ));
      if (isConnected) {
        emit('messageStarred', { chatId, groupId, messageId });
      }
      return result;
    } catch (err) {
      console.error('Star message error:', err);
      throw err;
    }
  }, [chatId, groupId, emit, isConnected]);

  // ---- Clear chat ----
  const clearChat = useCallback(async () => {
    if (!chatId && !groupId) return;
    try {
      await chatService.clearChat(chatId);
      setMessages([]);
      setUnreadCount(0);
      if (isConnected) {
        emit('clearChat', { chatId });
      }
      if (onChatUpdate) onChatUpdate();
    } catch (err) {
      console.error('Clear chat error:', err);
    }
  }, [chatId, groupId, emit, isConnected, onChatUpdate]);

  // ---- Forward messages ----
  const forwardMessages = useCallback(async (messageIds, chatIds, groupIds = []) => {
    try {
      const result = await chatService.forwardMessages(messageIds, chatIds, groupIds);
      if (isConnected) {
        emit('forwardMessages', { messageIds, chatIds, groupIds });
      }
      return result;
    } catch (err) {
      console.error('Forward messages error:', err);
      throw err;
    }
  }, [emit, isConnected]);

  // ---- Get unread count ----
  const getUnreadCount = useCallback(() => {
    return unreadCount;
  }, [unreadCount]);

  // ---- Block/Unblock user ----
  const blockUser = useCallback(async (userId) => {
    try {
      await chatService.blockUser(userId);
      setIsBlockedByUser(true);
      setBlockStatus(prev => ({
        ...prev,
        isBlocked: true,
        canInteract: false
      }));
      if (isConnected) {
        emit('blockUser', { userId });
      }
      return true;
    } catch (err) {
      console.error('Block user error:', err);
      throw err;
    }
  }, [isConnected, emit]);

  const unblockUser = useCallback(async (userId) => {
    try {
      await chatService.unblockUser(userId);
      setIsBlockedByUser(false);
      setBlockStatus(prev => ({
        ...prev,
        isBlocked: false,
        canInteract: true
      }));
      if (isConnected) {
        emit('unblockUser', { userId });
      }
      return true;
    } catch (err) {
      console.error('Unblock user error:', err);
      throw err;
    }
  }, [isConnected, emit]);

  // ---- Socket event handlers ----
  useEffect(() => {
    if (!chatId || !isConnected) return;

    // Receive message
    const handleNewMessage = (data) => {
      // data may have just the message object, or it may have { message, chatId } for forwarded messages.
      // Wait, socket.js `newMessage` emits `savedMessage` directly!
      // So data IS the message object.
      // We need to check if data.chat === chatId or data.group === groupId
      const msgChatId = data.chat ? data.chat.toString() : null;
      const msgGroupId = data.group ? data.group.toString() : null;
      
      if ((chatId && msgChatId === chatId) || (groupId && msgGroupId === groupId)) {
        setMessages(prev => {
          if (prev.some(m => m._id === data._id)) return prev;
          return [...prev, data];
        });
        if (document.hasFocus()) {
          markAsRead(data._id);
        } else {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    // Typing indicators
    const handleTyping = (data) => {
      if (data.chatId === chatId) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: true }));
      }
    };

    const handleStopTyping = (data) => {
      if (data.chatId === chatId) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: false }));
      }
    };

    const handleGroupTyping = (data) => {
      if (data.groupId === groupId) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: true }));
      }
    };

    const handleGroupStopTyping = (data) => {
      if (data.groupId === groupId) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: false }));
      }
    };

    // Message read
    const handleMessageRead = (data) => {
      if ((chatId && data.chatId === chatId) || (groupId && data.groupId === groupId)) {
        setMessages(prev => prev.map(msg =>
          msg._id === data.messageId
            ? { ...msg, readBy: [...msg.readBy, { user: data.userId, readAt: data.readAt }] }
            : msg
        ));
      }
    };

    // Message delivered
    const handleMessageDelivered = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.map(msg =>
          msg._id === data.messageId
            ? { ...msg, deliveredTo: [...msg.deliveredTo, data.userId] }
            : msg
        ));
      }
    };

    // Message deleted
    const handleMessageDeleted = (data) => {
      if ((chatId && data.chatId === chatId) || (groupId && data.groupId === groupId)) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    };

    // Message edited
    const handleMessageEdited = (data) => {
      if ((chatId && data.chatId === chatId) || (groupId && data.groupId === groupId)) {
        setMessages(prev => prev.map(msg =>
          msg._id === data.messageId
            ? { 
                ...msg, 
                content: data.newContent || data.content, 
                isEdited: true, 
                editedAt: data.editedAt || new Date()
              }
            : msg
        ));
      }
    };

    // Message starred
    const handleMessageStarred = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.map(msg =>
          msg._id === data.messageId
            ? { ...msg, starredBy: data.isStarred ? [...msg.starredBy, data.userId] : msg.starredBy.filter(id => id !== data.userId) }
            : msg
        ));
      }
    };

    // Unread count update
    const handleUnreadUpdate = (data) => {
      if (data.chatId === chatId) {
        setUnreadCount(data.unreadCount || 0);
        if (onChatUpdate) onChatUpdate();
      }
    };

    // Chat read
    const handleChatRead = (data) => {
      if (data.chatId === chatId) {
        setUnreadCount(0);
        if (onChatUpdate) onChatUpdate();
      }
    };

    // Chat unread
    const handleChatUnread = (data) => {
      if (data.chatId === chatId) {
        setUnreadCount(data.unreadCount || 1);
        if (onChatUpdate) onChatUpdate();
      }
    };

    // Chat cleared
    const handleChatCleared = (data) => {
      if (data.chatId === chatId && data.clearedBy !== user?._id) {
        setMessages([]);
        setUnreadCount(0);
        if (onChatUpdate) onChatUpdate();
      }
    };

    // Block events
    const handleUserBlocked = (data) => {
      if (data.blockedUser === chatId || data.blockedBy === chatId) {
        setIsBlockedByUser(true);
        setBlockStatus(prev => ({
          ...prev,
          isBlocked: true,
          canInteract: false
        }));
        if (onChatUpdate) onChatUpdate();
      }
    };

    const handleUserUnblocked = (data) => {
      if (data.unblockedUser === chatId || data.unblockedBy === chatId) {
        setIsBlockedByUser(false);
        setBlockStatus(prev => ({
          ...prev,
          isBlocked: false,
          canInteract: true
        }));
        if (onChatUpdate) onChatUpdate();
      }
    };

    const handleChatBlocked = (data) => {
      if (data.chatId === chatId) {
        setIsBlockedByUser(true);
        setBlockStatus(prev => ({
          ...prev,
          isBlocked: true,
          canInteract: false
        }));
        if (onChatUpdate) onChatUpdate();
      }
    };

    const handleBlockStatus = (data) => {
      if (data.userId === chatId) {
        setBlockStatus({
          isBlocked: data.isBlocked,
          isBlockedBy: data.isBlockedBy,
          canInteract: data.canInteract,
          mutual: data.mutual
        });
        setIsBlockedByUser(data.isBlocked);
        setIsBlockedByOther(data.isBlockedBy);
      }
    };

    // Forward messages event
    const handleMessagesForwarded = (data) => {
      if (data.chatIds?.includes(chatId) || data.groupIds?.includes(chatId)) {
        fetchMessages();
      }
    };

    // Register event listeners
    on('newMessage', handleNewMessage);
    on('typing', handleTyping);
    on('stopTyping', handleStopTyping);
    on('groupTyping', handleGroupTyping);
    on('groupStopTyping', handleGroupStopTyping);
    on('messageRead', handleMessageRead);
    on('messageDelivered', handleMessageDelivered);
    on('messageDeleted', handleMessageDeleted);
    on('messageEdited', handleMessageEdited);
    on('messageStarred', handleMessageStarred);
    on('unreadCountUpdate', handleUnreadUpdate);
    on('chatRead', handleChatRead);
    on('chatUnread', handleChatUnread);
    on('chatCleared', handleChatCleared);
    on('userBlocked', handleUserBlocked);
    on('userUnblocked', handleUserUnblocked);
    on('chatBlocked', handleChatBlocked);
    on('blockStatus', handleBlockStatus);
    on('messagesForwarded', handleMessagesForwarded);

    // Cleanup
    return () => {
      off('newMessage', handleNewMessage);
      off('typing', handleTyping);
      off('stopTyping', handleStopTyping);
      off('groupTyping', handleGroupTyping);
      off('groupStopTyping', handleGroupStopTyping);
      off('messageRead', handleMessageRead);
      off('messageDelivered', handleMessageDelivered);
      off('messageDeleted', handleMessageDeleted);
      off('messageEdited', handleMessageEdited);
      off('messageStarred', handleMessageStarred);
      off('unreadCountUpdate', handleUnreadUpdate);
      off('chatRead', handleChatRead);
      off('chatUnread', handleChatUnread);
      off('chatCleared', handleChatCleared);
      off('userBlocked', handleUserBlocked);
      off('userUnblocked', handleUserUnblocked);
      off('chatBlocked', handleChatBlocked);
      off('blockStatus', handleBlockStatus);
      off('messagesForwarded', handleMessagesForwarded);
    };
  }, [chatId, groupId, isConnected, on, off, markAsRead, onChatUpdate, user?._id, fetchMessages]);

  // ---- Join/Leave Socket Rooms ----
  useEffect(() => {
    if (!isConnected) return;
    
    if (chatId) {
      emit('joinChat', { chatId });
    } else if (groupId) {
      emit('joinGroupRoom', { groupId });
    }

    return () => {
      if (groupId) {
        emit('leaveGroupRoom', { groupId });
      }
      // Assuming server removes user from chat room on disconnect, but good practice
    };
  }, [chatId, groupId, isConnected, emit]);

  // ---- Initial load ----
  useEffect(() => {
    if (chatId || groupId) {
      fetchMessages();
      fetchChat();
      markChatAsRead();
    }
  }, [chatId, groupId, fetchMessages, fetchChat, markChatAsRead]);

  // ---- Check block status when chat is loaded ----
  useEffect(() => {
    if (chat?.participant?._id) {
      checkBlockStatus(chat.participant._id);
    }
  }, [chat, checkBlockStatus]);

  // ---- Update chat when messages change ----
  useEffect(() => {
    if (chat && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && chat.lastMessage !== lastMessage._id) {
        setChat(prev => ({
          ...prev,
          lastMessage: lastMessage._id,
          lastMessageTime: lastMessage.createdAt
        }));
      }
    }
  }, [messages, chat]);

  return {
    // State
    messages,
    chat,
    loading,
    error,
    typingUsers,
    unreadCount,
    
    // Block status
    isBlockedByUser,
    isBlockedByOther,
    blockStatus,
    
    // Core methods
    sendMessage,
    sendTyping,
    markAsRead,
    markChatAsRead,
    deleteMessage,
    fetchMessages,
    fetchChat,
    setMessages,
    
    // New methods
    markChatAsUnread,
    editMessage,
    starMessage,
    clearChat,
    forwardMessages,
    getUnreadCount,
    
    // Block methods
    checkBlockStatus,
    blockUser,
    unblockUser,
  };
};