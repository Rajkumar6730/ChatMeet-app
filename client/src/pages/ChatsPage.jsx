// client/src/pages/ChatsPage.jsx (Fully Updated)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import SearchBar from '../components/common/SearchBar';
import NewChatModal from '../components/modals/NewChatModal';
import EmptyState from '../components/common/EmptyState';
import { FiMessageSquare, FiPlus } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { chatService } from '../services/chatService';

const ChatsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, on, off } = useSocket();
  const [selectedChat, setSelectedChat] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, favorites, groups
  const [totalUnread, setTotalUnread] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ---- Handle resize for mobile responsiveness (NEW FEATURE) ----
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ---- Fetch chats (KEPT from OLD with improvements) ----
  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatService.getChats();
      setChats(data);
      
      // Calculate total unread count (KEPT from OLD)
      const total = data.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      setTotalUnread(total);
    } catch (error) {
      console.error('Fetch chats error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Handle chat selection (KEPT from OLD) ----
  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  // ---- Handle back (NEW FEATURE) ----
  const handleBack = () => {
    setSelectedChat(null);
  };

  // ---- Handle search (KEPT from OLD) ----
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // ---- Handle filter change (KEPT from OLD) ----
  const handleFilterChange = (filterType) => {
    setFilter(filterType);
  };

  // ---- Handle chat update (KEPT from OLD) ----
  const handleChatUpdate = useCallback(() => {
    fetchChats();
  }, [fetchChats]);

  // ---- Sort chats by last message time (KEPT from OLD) ----
  const sortChats = (chatsList) => {
    return [...chatsList].sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(0);
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(0);
      return timeB - timeA;
    });
  };

  // ---- Filter and sort chats (UPDATED from OLD) ----
  const filteredChats = sortChats(chats.filter(chat => {
    // Filter by search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const name = chat.participant?.username?.toLowerCase() || '';
      const lastMessage = chat.lastMessage?.content?.toLowerCase() || '';
      if (!name.includes(searchLower) && !lastMessage.includes(searchLower)) {
        return false;
      }
    }
    // Filter by type
    if (filter === 'unread') {
      return chat.unreadCount > 0;
    }
    if (filter === 'favorites') {
      return user?.favorites?.includes(chat.participant?._id);
    }
    if (filter === 'groups') {
      return chat.isGroup;
    }
    return true;
  }));

  // ---- Socket listeners for unread updates (KEPT from OLD) ----
  useEffect(() => {
    if (!isConnected) return;

    // Handle unread count update for a specific chat
    const handleUnreadUpdate = (data) => {
      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === data.chatId || chat._id === data.chatId) {
            return { ...chat, unreadCount: data.unreadCount || 0 };
          }
          return chat;
        });
        
        // Update total unread count
        const total = updatedChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        setTotalUnread(total);
        
        return updatedChats;
      });
    };

    // Handle chat marked as unread
    const handleChatUnread = (data) => {
      setChats(prev => {
        const chatIndex = prev.findIndex(c => c.id === data.chatId || c._id === data.chatId);
        if (chatIndex === -1) return prev;
        
        // Move chat to top when marked as unread
        const updatedChats = [...prev];
        const chat = { 
          ...updatedChats[chatIndex], 
          unreadCount: data.unreadCount || 1 
        };
        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(chat);
        
        // Update total unread count
        const total = updatedChats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setTotalUnread(total);
        
        return updatedChats;
      });
    };

    // Handle chat marked as read
    const handleChatRead = (data) => {
      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === data.chatId || chat._id === data.chatId) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        });
        
        // Update total unread count
        const total = updatedChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        setTotalUnread(total);
        
        return updatedChats;
      });
    };

    // Handle new message (UPDATED)
    const handleNewMessage = (data) => {
      if (data.chatId) {
        setChats(prev => {
          const chatIndex = prev.findIndex(c => c.id === data.chatId || c._id === data.chatId);
          if (chatIndex === -1) return prev;
          
          const updatedChats = [...prev];
          const chat = { 
            ...updatedChats[chatIndex],
            lastMessage: data.message,
            lastMessageTime: data.message?.createdAt || new Date()
          };
          
          // Increment unread count if not current chat or not in focus
          if (!document.hasFocus() || selectedChat?.id !== data.chatId) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
          }
          
          // Move chat to top
          updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(chat);
          
          // Update total unread count
          const total = updatedChats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setTotalUnread(total);
          
          return updatedChats;
        });
      }
    };

    // Register event listeners
    on('unreadCountUpdate', handleUnreadUpdate);
    on('chatUnread', handleChatUnread);
    on('chatRead', handleChatRead);
    on('receiveMessage', handleNewMessage);

    return () => {
      off('unreadCountUpdate', handleUnreadUpdate);
      off('chatUnread', handleChatUnread);
      off('chatRead', handleChatRead);
      off('receiveMessage', handleNewMessage);
    };
  }, [isConnected, on, off, selectedChat]);

  // ---- Initial fetch (KEPT from OLD) ----
  useEffect(() => {
    fetchChats();
  }, []);

  // ---- Update document title with unread count (KEPT from OLD) ----
  useEffect(() => {
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) ChatApp`;
    } else {
      document.title = 'ChatApp';
    }
  }, [totalUnread]);

  return (
    <div className="flex h-full bg-background">
      {/* Chat List */}
      <div className={`${selectedChat && isMobile ? 'hidden' : 'flex'} flex-col w-full md:w-96 border-r border-border-color bg-card`}>
        {/* Header */}
        <div className="p-4 border-b border-border-color">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-text">Chats</h2>
              {/* Unread badge */}
              {totalUnread > 0 && (
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 bg-primary hover:bg-secondary rounded-full transition text-white"
              title="New Chat"
            >
              <FiPlus size={20} />
            </button>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search chats..."
          />
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {['all', 'unread', 'favorites', 'groups'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => handleFilterChange(filterType)}
                className={`px-3 py-1 rounded-full text-sm capitalize whitespace-nowrap transition ${
                  filter === filterType
                    ? 'bg-primary text-white'
                    : 'bg-background text-text-secondary hover:bg-border-color'
                }`}
              >
                {filterType}
                {/* Show count for unread filter */}
                {filterType === 'unread' && totalUnread > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
            </div>
          ) : filteredChats.length === 0 ? (
            <EmptyState
              icon={FiMessageSquare}
              title="No chats yet"
              description="Start a new conversation by tapping the + button"
              action={
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="mt-4 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-12 transition flex items-center gap-2"
                >
                  <FiPlus size={18} /> New Chat
                </button>
              }
            />
          ) : (
            <ChatList
              chats={filteredChats}
              loading={loading}
              onChatSelect={handleChatSelect}
              selectedChatId={selectedChat?.id || selectedChat?._id}
            />
          )}
        </div>
      </div>

      {/* Chat Window */}
      {selectedChat ? (
        <div className={`flex-1 ${selectedChat && isMobile ? 'flex' : 'hidden md:flex'}`}>
          <ChatWindow
            chat={selectedChat}
            onBack={handleBack}
            onChatUpdate={handleChatUpdate}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-background">
          <div className="text-center">
            <FiMessageSquare className="w-20 h-20 text-card mx-auto mb-4" />
            <h3 className="text-text text-xl font-semibold">Select a chat</h3>
            <p className="text-text-secondary">Choose a conversation to start messaging</p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="mt-4 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-12 transition inline-flex items-center gap-2"
            >
              <FiPlus size={18} /> New Chat
            </button>
          </div>
        </div>
      )}

      {/* New Chat Modal (KEPT from OLD) */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={(chat) => {
          setShowNewChatModal(false);
          fetchChats();
          if (chat) setSelectedChat(chat);
        }}
      />
    </div>
  );
};

export default ChatsPage;