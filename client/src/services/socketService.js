// client/src/services/socketService.js
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // ---- Connection methods (KEPT from OLD) ----
  connect(userId) {
    if (this.socket) {
      this.disconnect();
    }

    const token = localStorage.getItem('token');
    this.socket = io(SOCKET_URL, {
      query: { userId },
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.emit('userConnected', { userId });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // ---- Core socket methods (KEPT from OLD) ----
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected, cannot emit ${event}`);
    }
  }

  on(event, callback) {
    if (this.socket) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
        const callbacks = this.listeners.get(event);
        if (callbacks) {
          callbacks.delete(callback);
        }
      } else {
        this.socket.off(event);
        this.listeners.delete(event);
      }
    }
  }

  // ---- Message events (KEPT from OLD) ----
  sendMessage(data) {
    this.emit('sendMessage', data);
  }

  onReceiveMessage(callback) {
    this.on('receiveMessage', callback);
  }

  // ---- Typing events (KEPT from OLD) ----
  typing(data) {
    this.emit('typing', data);
  }

  stopTyping(data) {
    this.emit('stopTyping', data);
  }

  onTyping(callback) {
    this.on('typing', callback);
  }

  onStopTyping(callback) {
    this.on('stopTyping', callback);
  }

  // ---- Read/Seen events (KEPT from OLD) ----
  messageSeen(data) {
    this.emit('messageSeen', data);
  }

  onMessageSeen(callback) {
    this.on('messageSeen', callback);
  }

  // ---- Message delivered events (KEPT from OLD) ----
  messageDelivered(data) {
    this.emit('messageDelivered', data);
  }

  onMessageDelivered(callback) {
    this.on('messageDelivered', callback);
  }

  // ---- Delete events (KEPT from OLD) ----
  messageDeleted(data) {
    this.emit('messageDeleted', data);
  }

  onMessageDeleted(callback) {
    this.on('messageDeleted', callback);
  }

  // ---- Edit events (KEPT from OLD) ----
  messageEdited(data) {
    this.emit('messageEdited', data);
  }

  onMessageEdited(callback) {
    this.on('messageEdited', callback);
  }

  // ---- Star events (KEPT from OLD) ----
  messageStarred(data) {
    this.emit('messageStarred', data);
  }

  onMessageStarred(callback) {
    this.on('messageStarred', callback);
  }

  // ---- Clear chat events (KEPT from OLD) ----
  clearChat(data) {
    this.emit('clearChat', data);
  }

  onChatCleared(callback) {
    this.on('chatCleared', callback);
  }

  // ---- User status events (KEPT from OLD) ----
  onUserStatusChanged(callback) {
    this.on('userStatusChanged', callback);
  }

  onNewNotification(callback) {
    this.on('newNotification', callback);
  }

  // ---- UNREAD EVENTS (NEW FEATURES) ----
  
  /**
   * Mark a chat as read
   * @param {Object} data - { chatId }
   */
  markChatAsRead(data) {
    this.emit('markChatAsRead', data);
  }

  /**
   * Mark a chat as unread
   * @param {Object} data - { chatId }
   */
  markChatAsUnread(data) {
    this.emit('markChatAsUnread', data);
  }

  /**
   * Listen for unread count updates
   * @param {Function} callback - (data) => { chatId, unreadCount }
   */
  onUnreadCountUpdate(callback) {
    this.on('unreadCountUpdate', callback);
  }

  /**
   * Listen for chat marked as unread
   * @param {Function} callback - (data) => { chatId, userId, unreadCount }
   */
  onChatUnread(callback) {
    this.on('chatUnread', callback);
  }

  /**
   * Listen for chat marked as read
   * @param {Function} callback - (data) => { chatId, userId, readAt }
   */
  onChatRead(callback) {
    this.on('chatRead', callback);
  }

  /**
   * Get unread counts for all chats
   * @param {Function} callback - (data) => { unreadCounts: { chatId: count } }
   */
  getUnreadCounts(callback) {
    this.emit('getUnreadCounts');
    this.once('unreadCounts', callback);
  }

  /**
   * Get unread count for a specific chat
   * @param {Object} data - { chatId }
   * @param {Function} callback - (data) => { chatId, unreadCount }
   */
  getChatUnreadCount(data, callback) {
    this.emit('getChatUnreadCount', data);
    this.once('chatUnreadCount', callback);
  }

  // ---- Utility methods (NEW) ----
  
  /**
   * Listen for once event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  once(event, callback) {
    if (this.socket) {
      this.socket.once(event, callback);
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean} - Connection status
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Get socket ID
   * @returns {string|null} - Socket ID or null
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  // ---- Room management (NEW) ----
  
  /**
   * Join a chat room
   * @param {Object} data - { chatId }
   */
  joinChat(data) {
    this.emit('joinChat', data);
  }

  /**
   * Join a group room
   * @param {Object} data - { groupId }
   */
  joinGroup(data) {
    this.emit('joinGroup', data);
  }

  /**
   * Leave a chat room
   * @param {Object} data - { chatId }
   */
  leaveChat(data) {
    this.emit('leaveChat', data);
  }

  /**
   * Leave a group room
   * @param {Object} data - { groupId }
   */
  leaveGroup(data) {
    this.emit('leaveGroup', data);
  }

  // ---- Error handling (NEW) ----
  
  /**
   * Listen for errors
   * @param {Function} callback - (error) => { message }
   */
  onError(callback) {
    this.on('error', callback);
  }

  /**
   * Emit a custom event with acknowledgment
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   * @param {Function} callback - Acknowledgment callback
   */
  emitWithAck(event, data, callback) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data, callback);
    } else {
      console.warn(`Socket not connected, cannot emit ${event}`);
      if (callback) callback({ error: 'Socket not connected' });
    }
  }
}

export const socketService = new SocketService();