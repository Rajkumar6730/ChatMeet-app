import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiUserPlus } from 'react-icons/fi';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';

const NewChatModal = ({ isOpen, onClose, onChatCreated }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delay = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query) => {
    setLoading(true);
    try {
      const data = await chatService.searchUsers(query);
      setResults(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (participantId) => {
    try {
      const chat = await chatService.createChat(participantId);
      // Fetch full chat details
      const fullChat = await chatService.getChatById(chat.chatId);
      onChatCreated(fullChat);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create chat');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-12 shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-xl font-semibold text-text">New Chat</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border-color rounded-12 py-2 pl-10 pr-4 text-text focus:outline-none focus:border-primary"
              placeholder="Search users..."
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading && (
            <div className="text-center text-text-secondary">Searching...</div>
          )}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {results.length === 0 && searchQuery.length >= 2 && !loading && (
            <div className="text-center text-text-secondary">No users found</div>
          )}
          {results.map((u) => (
            <div
              key={u._id}
              onClick={() => startChat(u._id)}
              className="flex items-center gap-3 p-3 hover:bg-background rounded-12 cursor-pointer transition"
            >
              <img
                src={u.profilePicture || '/default-avatar.png'}
                alt={u.username}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-text font-medium">{u.username}</p>
                <p className="text-text-secondary text-sm">{u.email}</p>
              </div>
              <FiUserPlus className="text-primary" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;