// client/src/services/chatService.js
import { api } from './api';

export const chatService = {
  // ============================================
  // CHATS
  // ============================================
  
  async getChats() {
    try {
      const response = await api.get('/chats');
      return response.data.data || [];
    } catch (error) {
      console.error('Get chats error:', error);
      return [];
    }
  },

  async getChatById(chatId) {
    try {
      const response = await api.get(`/chats/${chatId}`);
      return response.data.data;
    } catch (error) {
      console.error('Get chat by ID error:', error);
      return null;
    }
  },

  async createChat(participantId) {
    try {
      const response = await api.post('/chats', { participantId });
      return response.data.data;
    } catch (error) {
      console.error('Create chat error:', error);
      throw error;
    }
  },

  async deleteChat(chatId) {
    try {
      await api.delete(`/chats/${chatId}`);
    } catch (error) {
      console.error('Delete chat error:', error);
      throw error;
    }
  },

  async archiveChat(chatId) {
    try {
      await api.put(`/chats/${chatId}/archive`);
    } catch (error) {
      console.error('Archive chat error:', error);
      throw error;
    }
  },

  async unarchiveChat(chatId) {
    try {
      await api.put(`/chats/${chatId}/unarchive`);
    } catch (error) {
      console.error('Unarchive chat error:', error);
      throw error;
    }
  },

  async muteChat(chatId, duration = null) {
    try {
      await api.put(`/chats/${chatId}/mute`, { duration });
    } catch (error) {
      console.error('Mute chat error:', error);
      throw error;
    }
  },

  async unmuteChat(chatId) {
    try {
      await api.put(`/chats/${chatId}/unmute`);
    } catch (error) {
      console.error('Unmute chat error:', error);
      throw error;
    }
  },

  async pinChat(chatId) {
    try {
      await api.put(`/chats/${chatId}/pin`);
    } catch (error) {
      console.error('Pin chat error:', error);
      throw error;
    }
  },

  async unpinChat(chatId) {
    try {
      await api.put(`/chats/${chatId}/unpin`);
    } catch (error) {
      console.error('Unpin chat error:', error);
      throw error;
    }
  },

  async markChatAsRead(chatId) {
    try {
      const response = await api.put(`/chats/${chatId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark chat as read error:', error);
      throw error;
    }
  },

  async  markChatAsUnread(chatId) {
    try {
      const response = await api.put(`/chats/${chatId}/unread`);
      return response.data;
    } catch (error) {
      console.error('Mark chat as unread error:', error);
      throw error;
    }
  },

  // Mark a group as read (NEW FEATURE)
  async markGroupAsRead(groupId) {
    try {
      const response = await api.put(`/groups/${groupId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark group as read error:', error);
      throw error;
    }
  },

  async clearChat(chatId) {
    try {
      const response = await api.post(`/chats/${chatId}/clear`);
      return response.data.data;
    } catch (error) {
      console.error('Clear chat error:', error);
      throw error;
    }
  },

  async getUnreadCount() {
    try {
      const response = await api.get('/chats/unread');
      return response.data.data?.unreadCount || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  },

  // ============================================
  // MESSAGES
  // ============================================

  async getMessages(chatId, groupId, page = 1, limit = 50) {
    try {
      const endpoint = groupId ? `/messages/group/${groupId}` : `/messages/chat/${chatId}`;
      const response = await api.get(`${endpoint}?page=${page}&limit=${limit}`);
      return response.data.data || { messages: [], page, limit };
    } catch (error) {
      console.error('Get messages error:', error);
      return { messages: [], page, limit };
    }
  },

  async sendMessage(data) {
    try {
      const response = await api.post('/messages', data);
      return response.data.data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  async editMessage(messageId, content) {
    try {
      const response = await api.put(`/messages/${messageId}`, { content });
      return response.data.data;
    } catch (error) {
      console.error('Edit message error:', error);
      throw error;
    }
  },

  async getMessageEditHistory(messageId) {
    try {
      const response = await api.get(`/messages/${messageId}/history`);
      return response.data.data || { current: {}, history: [], totalEdits: 0 };
    } catch (error) {
      console.error('Get message edit history error:', error);
      return { current: {}, history: [], totalEdits: 0 };
    }
  },

  async deleteMessage(messageId, deleteForEveryone = false) {
    try {
      const response = await api.delete(`/messages/${messageId}?deleteForEveryone=${deleteForEveryone}`);
      return response.data;
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  },

  async markMessageAsRead(messageId) {
    try {
      await api.put(`/messages/${messageId}/read`);
    } catch (error) {
      console.error('Mark message as read error:', error);
      throw error;
    }
  },

  async starMessage(messageId) {
    try {
      const response = await api.post(`/messages/${messageId}/star`);
      return response.data;
    } catch (error) {
      console.error('Star message error:', error);
      throw error;
    }
  },

  async reactToMessage(messageId, reaction) {
    try {
      const response = await api.post(`/messages/${messageId}/react`, { reaction });
      return response.data.data;
    } catch (error) {
      console.error('React to message error:', error);
      throw error;
    }
  },

  async removeReaction(messageId) {
    try {
      await api.delete(`/messages/${messageId}/react`);
    } catch (error) {
      console.error('Remove reaction error:', error);
      throw error;
    }
  },

  async forwardMessage(messageId, chatId, groupId) {
    try {
      const response = await api.post(`/messages/${messageId}/forward`, { chatId, groupId });
      return response.data.data;
    } catch (error) {
      console.error('Forward message error:', error);
      throw error;
    }
  },

  async forwardMessages(messageIds, chatIds, groupIds = []) {
    try {
      const response = await api.post('/messages/forward', {
        messageIds,
        chatIds,
        groupIds
      });
      return response.data.data;
    } catch (error) {
      console.error('Forward messages error:', error);
      throw error;
    }
  },

  async replyToMessage(messageId, content, type = 'text', media = null) {
    try {
      const response = await api.post(`/messages/${messageId}/reply`, { content, type, media });
      return response.data.data;
    } catch (error) {
      console.error('Reply to message error:', error);
      throw error;
    }
  },

  async getMediaMessages(chatId, type = null, limit = 20) {
    try {
      const response = await api.get(`/messages/media/${chatId}?type=${type}&limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Get media messages error:', error);
      return [];
    }
  },

  // ============================================
  // USERS
  // ============================================

  async searchUsers(query) {
    try {
      const response = await api.get(`/users/search?q=${query}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  },

  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  },

  async updateProfile(data) {
    try {
      const response = await api.put('/users/profile', data);
      return response.data.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  async updateProfilePicture(profilePicture) {
    try {
      const response = await api.put('/users/profile-picture', { profilePicture });
      return response.data.data;
    } catch (error) {
      console.error('Update profile picture error:', error);
      throw error;
    }
  },

  async getUserStatus() {
    try {
      const response = await api.get('/users/status');
      return response.data.data;
    } catch (error) {
      console.error('Get user status error:', error);
      return null;
    }
  },

  async updateUserStatus(status) {
    try {
      const response = await api.put('/users/status', { status });
      return response.data.data;
    } catch (error) {
      console.error('Update user status error:', error);
      throw error;
    }
  },

  async addToFavorites(userId) {
    try {
      await api.put(`/users/favorites/${userId}`);
    } catch (error) {
      console.error('Add to favorites error:', error);
      throw error;
    }
  },

  async removeFromFavorites(userId) {
    try {
      await api.delete(`/users/favorites/${userId}`);
    } catch (error) {
      console.error('Remove from favorites error:', error);
      throw error;
    }
  },

  async blockUser(userId) {
    try {
      await api.put(`/users/block/${userId}`);
    } catch (error) {
      console.error('Block user error:', error);
      throw error;
    }
  },

  async unblockUser(userId) {
    try {
      await api.delete(`/users/block/${userId}`);
    } catch (error) {
      console.error('Unblock user error:', error);
      throw error;
    }
  },

  async getBlockedUsers() {
    try {
      const response = await api.get('/users/blocked');
      return response.data.data || [];
    } catch (error) {
      console.error('Get blocked users error:', error);
      return [];
    }
  },

  async checkBlockStatus(userId) {
    try {
      const response = await api.get(`/users/block/status/${userId}`);
      return response.data.data || { isBlocked: false, isBlockedBy: false, canInteract: true };
    } catch (error) {
      console.error('Check block status error:', error);
      return { isBlocked: false, isBlockedBy: false, canInteract: true };
    }
  },

  async checkIfBlocked(userId) {
    try {
      const response = await api.get(`/users/blocked/check/${userId}`);
      return response.data.data || { isBlocked: false };
    } catch (error) {
      console.error('Check if blocked error:', error);
      return { isBlocked: false };
    }
  },

  async updateSettings(settings) {
    try {
      const response = await api.put('/users/settings', { settings });
      return response.data.data;
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  },

  async updateTheme(theme) {
    try {
      const response = await api.put('/users/theme', { theme });
      return response.data.data;
    } catch (error) {
      console.error('Update theme error:', error);
      throw error;
    }
  },

  async uploadWallpaper(wallpaperUrl) {
    try {
      const response = await api.post('/users/wallpaper', { wallpaperUrl });
      return response.data.data;
    } catch (error) {
      console.error('Upload wallpaper error:', error);
      throw error;
    }
  },

  // ============================================
  // GROUPS
  // ============================================

  async getGroups() {
    try {
      const response = await api.get('/groups');
      return response.data.data || [];
    } catch (error) {
      console.error('Get groups error:', error);
      return [];
    }
  },

  async getGroupById(groupId) {
    try {
      const response = await api.get(`/groups/${groupId}`);
      return response.data.data;
    } catch (error) {
      console.error('Get group by ID error:', error);
      return null;
    }
  },

  async createGroup(data) {
    try {
      const response = await api.post('/groups', data);
      return response.data.data;
    } catch (error) {
      console.error('Create group error:', error);
      throw error;
    }
  },

  async updateGroup(groupId, data) {
    try {
      const response = await api.put(`/groups/${groupId}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Update group error:', error);
      throw error;
    }
  },

  async deleteGroup(groupId) {
    try {
      await api.delete(`/groups/${groupId}`);
    } catch (error) {
      console.error('Delete group error:', error);
      throw error;
    }
  },

  async addMember(groupId, userId) {
    try {
      const response = await api.post(`/groups/${groupId}/members`, { userId });
      return response.data;
    } catch (error) {
      console.error('Add member error:', error);
      throw error;
    }
  },

  async removeMember(groupId, userId) {
    try {
      const response = await api.delete(`/groups/${groupId}/members/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Remove member error:', error);
      throw error;
    }
  },

  async makeAdmin(groupId, userId) {
    try {
      const response = await api.put(`/groups/${groupId}/admins/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Make admin error:', error);
      throw error;
    }
  },

  async removeAdmin(groupId, userId) {
    try {
      const response = await api.delete(`/groups/${groupId}/admins/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Remove admin error:', error);
      throw error;
    }
  },

  async leaveGroup(groupId) {
    try {
      const response = await api.post(`/groups/${groupId}/leave`);
      return response.data;
    } catch (error) {
      console.error('Leave group error:', error);
      throw error;
    }
  },

  async getGroupMembers(groupId) {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      return response.data.data || [];
    } catch (error) {
      console.error('Get group members error:', error);
      return [];
    }
  },

  async getGroupRequests(groupId) {
    try {
      const response = await api.get(`/groups/${groupId}/requests`);
      return response.data.data || [];
    } catch (error) {
      console.error('Get group requests error:', error);
      return [];
    }
  },

  async acceptRequest(groupId, userId) {
    try {
      await api.put(`/groups/${groupId}/requests/${userId}/accept`);
    } catch (error) {
      console.error('Accept request error:', error);
      throw error;
    }
  },

  async rejectRequest(groupId, userId) {
    try {
      await api.delete(`/groups/${groupId}/requests/${userId}/reject`);
    } catch (error) {
      console.error('Reject request error:', error);
      throw error;
    }
  },

  async updateGroupSettings(groupId, settings) {
    try {
      const response = await api.put(`/groups/${groupId}/settings`, { settings });
      return response.data.data;
    } catch (error) {
      console.error('Update group settings error:', error);
      throw error;
    }
  },

  // ============================================
  // CONTACTS
  // ============================================

  async sendContactRequest(userId, message = '') {
    try {
      const response = await api.post('/contacts/request', { userId, message });
      return response.data.data;
    } catch (error) {
      console.error('Send contact request error:', error);
      throw error;
    }
  },

  async acceptContactRequest(requestId) {
    try {
      const response = await api.put(`/contacts/request/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Accept contact request error:', error);
      throw error;
    }
  },

  async rejectContactRequest(requestId) {
    try {
      const response = await api.put(`/contacts/request/${requestId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Reject contact request error:', error);
      throw error;
    }
  },

  async getContactRequests() {
    try {
      const response = await api.get('/contacts/requests');
      return response.data.data || [];
    } catch (error) {
      console.error('Get contact requests error:', error);
      return [];
    }
  },

  async getContacts() {
    try {
      const response = await api.get('/contacts');
      return response.data.data || [];
    } catch (error) {
      console.error('Get contacts error:', error);
      return [];
    }
  },

  async removeContact(userId) {
    try {
      const response = await api.delete(`/contacts/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Remove contact error:', error);
      throw error;
    }
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotifications() {
    try {
      const response = await api.get('/notifications');
      return response.data.data || [];
    } catch (error) {
      console.error('Get notifications error:', error);
      return [];
    }
  },

  async markNotificationAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data.data;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return null;
    }
  },

  async markAllNotificationsAsRead() {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data.data;
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return null;
    }
  },

  // ============================================
  // UPLOADS
  // ============================================

  async uploadCameraImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/camera', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      return response.json();
    } catch (error) {
      console.error('Upload camera image error:', error);
      throw error;
    }
  },

  async uploadFile(file, type = 'file') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      return response.json();
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  },

  async uploadWallpaperFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/wallpaper', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      return response.json();
    } catch (error) {
      console.error('Upload wallpaper error:', error);
      throw error;
    }
  },

  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      return response.json();
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  },

  async deleteFile(filename) {
    try {
      const response = await api.delete(`/upload/${filename}`);
      return response.data;
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }
};