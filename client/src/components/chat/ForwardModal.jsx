// client/src/components/chat/ForwardModal.jsx (Fully Updated)
import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiCheck, FiSend, FiUsers, FiUser } from 'react-icons/fi';
import { chatService } from '../../services/chatService';
import { useSocket } from '../../hooks/useSocket';

const ForwardModal = ({ isOpen, messages, onClose, onForward }) => {
  const { isConnected, emit } = useSocket();
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forwarding, setForwarding] = useState(false); // NEW: Track forwarding state
  const [error, setError] = useState(null); // NEW: Track errors

  // ---- Fetch chats when modal opens (UPDATED) ----
  useEffect(() => {
    if (isOpen) {
      const fetchChats = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await chatService.getChats();
          setChats(data);
        } catch (err) {
          console.error('Fetch chats error:', err);
          setError('Failed to load chats. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchChats();
      setSelected([]);
      setSearch('');
      setForwarding(false);
    }
  }, [isOpen]);

  // ---- Close on Escape key (KEPT from OLD) ----
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // ---- Filter chats by search (KEPT from OLD) ----
  const filtered = chats.filter(chat => {
    const name = chat.participant?.username || chat.name || 'Unknown';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  // ---- Toggle chat selection (KEPT from OLD) ----
  const toggleSelect = (chatId) => {
    setSelected(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId) 
        : [...prev, chatId]
    );
  };

  // ---- Select all chats (NEW FEATURE) ----
  const selectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(chat => chat.id));
    }
  };

  // ---- Clear selection (NEW FEATURE) ----
  const clearSelection = () => {
    setSelected([]);
  };

  // ---- Handle forward (UPDATED from OLD) ----
  const handleForward = async () => {
    if (selected.length === 0 || !messages || messages.length === 0) {
      setError('Please select at least one chat and message to forward.');
      return;
    }
    
    setForwarding(true);
    setError(null);
    
    try {
      const messageIds = messages.map(m => m._id || m.id);
      
      // Call API to forward messages
      const result = await chatService.forwardMessages(messageIds, selected);
      
      // Emit socket event for real-time updates
      if (isConnected) {
        emit('forwardMessages', {
          messageIds,
          chatIds: selected,
          groupIds: []
        });
      }
      
      // Call the onForward callback
      onForward(messages, selected, result);
      
      // Close modal after successful forward
      onClose();
    } catch (err) {
      console.error('Forward error:', err);
      setError(err.message || 'Failed to forward messages. Please try again.');
    } finally {
      setForwarding(false);
    }
  };

  // ---- Get message preview (NEW FEATURE) ----
  const getMessagePreview = () => {
    if (!messages || messages.length === 0) return '';
    if (messages.length === 1) {
      const msg = messages[0];
      if (msg.type === 'text') {
        return msg.content?.substring(0, 50) + (msg.content?.length > 50 ? '...' : '');
      }
      return `📎 ${msg.type || 'media'} message`;
    }
    return `${messages.length} messages`;
  };

  // ---- Get chat type (NEW FEATURE) ----
  const getChatType = (chat) => {
    return chat.isGroup ? <FiUsers className="text-text-secondary" size={16} /> : <FiUser className="text-text-secondary" size={16} />;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-card rounded-12 max-w-md w-full mx-auto max-h-[80vh] flex flex-col shadow-xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---- Header (UPDATED) ---- */}
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <div>
            <h3 className="text-text font-semibold">
              Forward {messages?.length || 0} message(s)
            </h3>
            <p className="text-text-secondary text-sm truncate max-w-[200px]">
              {getMessagePreview()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text p-1 rounded-full hover:bg-background transition"
            aria-label="Close"
            disabled={forwarding}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* ---- Search Bar (KEPT from OLD) ---- */}
        <div className="p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts or groups..."
              className="w-full bg-background border border-border-color rounded-12 py-2 pl-10 pr-4 text-text focus:outline-none focus:border-primary"
              autoFocus
              disabled={forwarding}
            />
          </div>
        </div>

        {/* ---- Select All / Clear (NEW FEATURE) ---- */}
        {filtered.length > 0 && (
          <div className="px-4 pb-2 flex items-center justify-between">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:text-secondary transition"
              disabled={forwarding}
            >
              {selected.length === filtered.length ? 'Deselect All' : 'Select All'}
            </button>
            {selected.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs text-text-secondary hover:text-text transition"
                disabled={forwarding}
              >
                Clear ({selected.length})
              </button>
            )}
          </div>
        )}

        {/* ---- Chat List (UPDATED) ---- */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  chatService.getChats()
                    .then(data => setChats(data))
                    .catch(err => setError('Failed to load chats'))
                    .finally(() => setLoading(false));
                }}
                className="mt-2 text-primary hover:text-secondary text-sm"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <FiUsers className="mx-auto text-text-secondary text-4xl mb-2" />
              <p className="text-text-secondary">
                {search ? 'No chats found matching your search' : 'No chats available'}
              </p>
            </div>
          ) : (
            filtered.map(chat => {
              const name = chat.participant?.username || chat.name || 'Unknown';
              const avatar = chat.participant?.profilePicture || '/default-avatar.png';
              const isSelected = selected.includes(chat.id);
              
              return (
                <div
                  key={chat.id}
                  onClick={() => !forwarding && toggleSelect(chat.id)}
                  className={`flex items-center gap-3 p-2 hover:bg-background rounded-12 cursor-pointer transition ${
                    isSelected ? 'bg-background/50' : ''
                  }`}
                >
                  <div className="relative">
                    <img 
                      src={avatar} 
                      alt={name} 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                    {chat.isGroup && (
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                        <FiUsers size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-text font-medium truncate block">{name}</span>
                    {chat.lastMessage && (
                      <span className="text-text-secondary text-xs truncate block">
                        {chat.lastMessage.content?.substring(0, 30) || 'No messages'}
                      </span>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-primary border-primary' : 'border-text-secondary'
                  }`}>
                    {isSelected && <FiCheck size={12} className="text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ---- Footer (UPDATED) ---- */}
        <div className="p-4 border-t border-border-color flex items-center justify-between">
          <div className="text-text-secondary text-sm">
            {selected.length > 0 ? (
              <span>{selected.length} chat(s) selected</span>
            ) : (
              <span>Select chats to forward</span>
            )}
          </div>
          <button
            onClick={handleForward}
            disabled={selected.length === 0 || loading || forwarding}
            className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-12 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {forwarding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                Forwarding...
              </>
            ) : (
              <>
                <FiSend size={16} />
                Forward ({selected.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;