// client/src/components/chat/ChatWindow.jsx (Fully Updated with ALL Features)
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { useMessageSelection } from '../../context/MessageSelectionContext';
import { useSocket } from '../../hooks/useSocket';
import { chatService } from '../../services/chatService';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import AttachmentMenu from './AttachmentMenu';
import SearchMessages from './SearchMessages';
import ThemeSelector from './ThemeSelector';
import EditMessageModal from './EditMessageModal';
import CameraModal from './CameraModal';
import ForwardModal from './ForwardModal';
import ChatMenuHeader from './ChatMenuHeader';
import MessageSelectionToolbar from './MessageSelectionToolbar';
import MessageContextMenu from './MessageContextMenu';
import BlockedChatView from './BlockedChatView';
import ConfirmationModal from '../common/ConfirmationModal';
import { FiArrowLeft, FiPhone, FiVideo, FiX } from 'react-icons/fi';

const ChatWindow = ({ chat, onBack, onChatUpdate }) => {
  const { user, theme, updateTheme: updateUserTheme } = useAuth();
  const navigate = useNavigate();
  const { isConnected, emit, on, off } = useSocket();

  const {
    messages,
    loading,
    typingUsers,
    sendMessage,
    sendTyping,
    markChatAsRead,
    deleteMessage,
    fetchMessages,
    setMessages,
    clearChat: clearChatHook,
    editMessage: editMessageHook,
    checkBlockStatus,
    blockUser,
    unblockUser
  } = useChat(chat?.id, null, onChatUpdate);

  // ---- Message Selection ----
  const {
    selectedMessages,
    isSelectionMode,
    selectMessage,
    clearSelection,
    isSelected,
    getSelectedCount,
    toggleSelectionMode,
  } = useMessageSelection();

  // ---- UI state ----
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showForward, setShowForward] = useState(false);

  // ---- Selection & reply ----
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // ---- Context Menu ----
  const [contextMenu, setContextMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ---- Blocking ----
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockStatus, setBlockStatus] = useState({
    isBlocked: false,
    isBlockedBy: false,
    canInteract: true,
    mutual: false
  });



  // ---- Modal state ----
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const isGroup = chat?.isGroup;

  // ---- Scroll to bottom ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---- Mark chat as read ----
  useEffect(() => {
    if (chat?.id) markChatAsRead();
  }, [chat?.id, markChatAsRead]);

  // ---- Check block status when chat loads (UPDATED with null checks) ----
  useEffect(() => {
    if (chat?.participant?._id && !isGroup) {
      const checkBlockStatus = async () => {
        try {
          // Check if methods exist before calling
          let blockedUsers = [];
          let blockStatusResponse = null;
          
          if (typeof chatService.getBlockedUsers === 'function') {
            blockedUsers = await chatService.getBlockedUsers() || [];
          }
          
          if (typeof chatService.checkBlockStatus === 'function') {
            blockStatusResponse = await chatService.checkBlockStatus(chat.participant._id);
          }
          
          const isBlockedByUser = blockedUsers.some(
            u => u._id === chat.participant._id
          );
          
          setIsBlocked(isBlockedByUser);
          setBlockStatus({
            isBlocked: isBlockedByUser,
            isBlockedBy: blockStatusResponse?.isBlockedBy || false,
            canInteract: !isBlockedByUser && !(blockStatusResponse?.isBlockedBy || false),
            mutual: isBlockedByUser && (blockStatusResponse?.isBlockedBy || false)
          });
        } catch (err) {
          console.error('Check block status error:', err);
          // Set default state to avoid breaking UI
          setIsBlocked(false);
          setBlockStatus({
            isBlocked: false,
            isBlockedBy: false,
            canInteract: true,
            mutual: false
          });
        }
      };
      checkBlockStatus();
    }
  }, [chat, isGroup]);

  // ---- Socket listeners ----
  useEffect(() => {
    if (!isConnected) return;

    const handleUserBlocked = (data) => {
      if (data.blockedUser === chat?.participant?._id || data.blockedBy === chat?.participant?._id) {
        setIsBlocked(true);
        setBlockStatus(prev => ({
          ...prev,
          isBlocked: true,
          canInteract: false
        }));
      }
    };

    const handleUserUnblocked = (data) => {
      if (data.unblockedUser === chat?.participant?._id || data.unblockedBy === chat?.participant?._id) {
        setIsBlocked(false);
        setBlockStatus(prev => ({
          ...prev,
          isBlocked: false,
          canInteract: true
        }));
      }
    };

    const handleChatBlocked = (data) => {
      if (data.chatId === chat?.id) {
        console.log('Chat blocked:', data);
      }
    };

    const handleBlockStatus = (data) => {
      if (data.userId === chat?.participant?._id) {
        setBlockStatus({
          isBlocked: data.isBlocked,
          isBlockedBy: data.isBlockedBy,
          canInteract: data.canInteract,
          mutual: data.mutual
        });
        setIsBlocked(data.isBlocked);
      }
    };

    const handleChatCleared = (data) => {
      if (data.chatId === chat?.id) {
        setMessages([]);
        console.log(`Chat cleared by ${data.clearedBy} at ${data.clearedAt}`);
      }
    };

    // ---- Theme sync listeners ----
    const handleThemeUpdated = (data) => {
      if (data.userId === user?._id) {
        updateUserTheme(data.theme);
      }
    };

    const handleWallpaperUpdated = (data) => {
      if (data.userId === user?._id) {
        updateUserTheme({
          wallpaper: data.wallpaper,
          wallpaperType: 'image'
        });
      }
    };

    // ---- Message edited listener ----
    const handleMessageEdited = (data) => {
      if (data.chatId === chat?.id || data.groupId === chat?.id) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId ? {
            ...msg,
            content: data.content,
            isEdited: true,
            editedAt: data.editedAt
          } : msg
        ));
      }
    };

    // ---- Message starred listener ----
    const handleMessageStarred = (data) => {
      if (data.chatId === chat?.id) {
        setMessages(prev => prev.map(msg =>
          msg._id === data.messageId
            ? { ...msg, starredBy: data.isStarred ? [...msg.starredBy, data.userId] : msg.starredBy.filter(id => id !== data.userId) }
            : msg
        ));
      }
    };

    // ---- Register all listeners ----
    on('userBlocked', handleUserBlocked);
    on('userUnblocked', handleUserUnblocked);
    on('chatBlocked', handleChatBlocked);
    on('blockStatus', handleBlockStatus);
    on('chatCleared', handleChatCleared);
    on('themeUpdated', handleThemeUpdated);
    on('wallpaperUpdated', handleWallpaperUpdated);
    on('messageEdited', handleMessageEdited);
    on('messageStarred', handleMessageStarred);

    return () => {
      off('userBlocked', handleUserBlocked);
      off('userUnblocked', handleUserUnblocked);
      off('chatBlocked', handleChatBlocked);
      off('blockStatus', handleBlockStatus);
      off('chatCleared', handleChatCleared);
      off('themeUpdated', handleThemeUpdated);
      off('wallpaperUpdated', handleWallpaperUpdated);
      off('messageEdited', handleMessageEdited);
      off('messageStarred', handleMessageStarred);
    };
  }, [isConnected, on, off, chat?.participant?._id, chat?.id, chat?.groupId, setMessages, user?._id, updateUserTheme, theme]);

  // ---- Context Menu Handlers ----
  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // ---- Selection Handlers ----
  const handleLongPress = (messageId) => {
    if (!isSelectionMode) {
      toggleSelectionMode();
    }
    selectMessage(messageId);
  };

  const exitSelectMode = () => {
    clearSelection();
  };

  // ---- Toolbar Actions ----
  const handleCopySelected = () => {
    const selectedMessagesData = messages.filter(m => selectedMessages.includes(m._id));
    const textMessages = selectedMessagesData
      .filter(m => m.type === 'text')
      .map(m => m.content)
      .join('\n');
    
    if (textMessages) {
      navigator.clipboard.writeText(textMessages);
    }
    clearSelection();
  };

  const handleStarSelected = async () => {
    try {
      const promises = selectedMessages.map(id => chatService.starMessage(id));
      await Promise.all(promises);
      fetchMessages();
      clearSelection();
    } catch (err) {
      console.error('Star error:', err);
    }
  };

  const handleDeleteSelected = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteSelected = async () => {
    try {
      const promises = selectedMessages.map(id => 
        chatService.deleteMessage(id, false)
      );
      await Promise.all(promises);
      fetchMessages();
      clearSelection();
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleForwardSelected = () => {
    setShowForward(true);
  };

  // ---- Edit Message Handler ----
  const handleEditMessage = async (messageId, newContent) => {
    try {
      await editMessageHook(messageId, newContent);
      setShowEditModal(false);
      setEditingMessage(null);
    } catch (err) {
      console.error('Edit error:', err);
      throw err;
    }
  };

  const handleEditSelected = () => {
    if (selectedMessages.length === 1) {
      const msg = messages.find(m => m._id === selectedMessages[0]);
      if (msg && msg.sender?._id === user?._id && msg.type === 'text') {
        setEditingMessage(msg);
        setShowEditModal(true);
      }
    }
  };

  const handleInfoSelected = () => {
    if (selectedMessages.length === 1) {
      const msg = messages.find(m => m._id === selectedMessages[0]);
      console.log('Message info:', msg);
    }
  };

  // ---- Individual Message Actions ----
  const handleReply = (message) => {
    setReplyTo(message);
    closeContextMenu();
  };

  const handleStarMessage = async (messageId) => {
    try {
      await chatService.starMessage(messageId);
      fetchMessages();
    } catch (err) {
      console.error('Star error:', err);
    }
    closeContextMenu();
  };

  const handleCopy = (message) => {
    if (message.type === 'text') {
      navigator.clipboard.writeText(message.content);
    }
    closeContextMenu();
  };

  const handleSelect = (messageId) => {
    if (!isSelectionMode) {
      toggleSelectionMode();
    }
    selectMessage(messageId);
    closeContextMenu();
  };

  const handleDelete = (messageId) => {
    deleteMessage(messageId, false);
    closeContextMenu();
  };

  // ---- Block/Unblock handlers ----
  const handleBlockUser = () => {
    setModalState({
      isOpen: true,
      title: `Block ${chat.participant?.username || 'User'}?`,
      message: `You won't be able to send messages, make calls, or see status updates from ${chat.participant?.username || 'this user'}.`,
      onConfirm: async () => {
        try {
          setIsBlocking(true);
          await chatService.blockUser(chat.participant._id);
          setIsBlocked(true);
          setBlockStatus(prev => ({
            ...prev,
            isBlocked: true,
            canInteract: false
          }));
          if (isConnected) {
            emit('blockUser', { userId: chat.participant._id });
          }
          setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
          setIsBlocking(false);
        } catch (err) {
          console.error('Block user error:', err);
          setIsBlocking(false);
        }
      },
    });
  };

  const handleUnblockUser = () => {
    setModalState({
      isOpen: true,
      title: `Unblock ${chat.participant?.username || 'User'}?`,
      message: `You'll be able to send messages, make calls, and see status updates from ${chat.participant?.username || 'this user'} again.`,
      onConfirm: async () => {
        try {
          await chatService.unblockUser(chat.participant._id);
          setIsBlocked(false);
          setBlockStatus(prev => ({
            ...prev,
            isBlocked: false,
            canInteract: true
          }));
          if (isConnected) {
            emit('unblockUser', { userId: chat.participant._id });
          }
          setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
        } catch (err) {
          console.error('Unblock user error:', err);
        }
      },
    });
  };

  // ---- Send message with reply ----
  const handleSend = async (content, type, media) => {
    if (isBlocked) {
      console.warn('Cannot send message: You have blocked this user');
      return;
    }
    if (blockStatus.isBlockedBy) {
      console.warn('Cannot send message: You are blocked by this user');
      return;
    }
    await sendMessage(content, type, media, replyTo?._id);
    setReplyTo(null);
  };

  // ---- Clear chat ----
  const handleClearChat = () => {
    setModalState({
      isOpen: true,
      title: 'Clear Chat?',
      message: 'This will delete all messages in this conversation for you. The other person will still see their messages.',
      onConfirm: async () => {
        try {
          await clearChatHook();
          onChatUpdate?.();
          if (isConnected) {
            emit('clearChat', { chatId: chat.id });
          }
          setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
        } catch (err) {
          console.error('Clear chat error:', err);
          setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      },
    });
  };

  // ---- Share ----
  const handleShare = () => {
    const texts = messages
      .filter((m) => selectedMessages.includes(m._id) && m.type === 'text')
      .map((m) => m.content)
      .join('\n');
    if (navigator.share) {
      navigator.share({ title: 'Chat Messages', text: texts });
    } else {
      navigator.clipboard.writeText(texts);
    }
    exitSelectMode();
  };

  // ---- Camera ----
  const handleCameraCapture = (imageDataUrl) => {
    sendMessage('', 'image', { url: imageDataUrl });
    setShowCamera(false);
  };

  // ---- Go to starred ----
  const handleGoStarred = () => {
    navigate('/starred');
  };

  // ---- Forward ----
  const handleForwardMessages = (msgs, chatIds) => {
    console.log('Forwarding messages:', msgs, 'to chats:', chatIds);
    clearSelection();
    setShowForward(false);
  };

  // ---- Theme save handler ----
  const handleThemeSave = async (newTheme) => {
    try {
      await chatService.updateTheme(newTheme);
      updateUserTheme(newTheme);
    } catch (err) {
      console.error('Save theme error:', err);
    }
  };

  // ---- Render blocked view ----
  if (isBlocked && chat?.participant) {
    return (
      <BlockedChatView
        username={chat.participant?.username}
        profilePicture={chat.participant?.profilePicture}
        onUnblock={handleUnblockUser}
        onBack={onBack}
      />
    );
  }

  if (!chat) return null;

  const participant = chat.participant;

  // ---- Apply theme styles ----
  const getBackgroundColor = () => {
    if (theme.mode === 'dark') return '#0B141A';
    if (theme.mode === 'light') return '#FFFFFF';
    if (theme.mode === 'green') return '#128C7E';
    if (theme.mode === 'blue') return '#1A5276';
    return '#0B141A';
  };

  const renderChatBackground = () => {
    if (!theme.wallpaper) return { backgroundColor: getBackgroundColor() }; 
    if (theme.wallpaperType === 'solid') return { backgroundColor: theme.wallpaper };
    if (theme.wallpaperType === 'gradient') return { backgroundImage: theme.wallpaper };
    return { backgroundImage: `url(${theme.wallpaper})` };
  };

  return (
    <div
      className="relative flex flex-col h-full w-full overflow-hidden"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {/* Background Wallpaper Layer */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-500 ease-in-out"
        style={{
          ...renderChatBackground(),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: `blur(${theme.wallpaperBlur || 0}px) brightness(${theme.wallpaperBrightness ?? 100}%)`,
          opacity: theme.wallpaper ? 1 : 0
        }}
      />
      
      {/* Overlay Layer */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-500 ease-in-out"
        style={{
          backgroundColor: 
            theme.wallpaperOpacity === 'light' ? 'rgba(0,0,0,0.35)' : 
            theme.wallpaperOpacity === 'medium' ? 'rgba(0,0,0,0.5)' : 
            theme.wallpaperOpacity === 'dark' ? 'rgba(0,0,0,0.8)' : 'transparent'
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col h-full w-full">
        {/* ---- Header ---- */}
        <div className="bg-header-bg border-b border-border-color px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden text-text-secondary hover:text-text"
          >
            <FiArrowLeft size={24} />
          </button>
          <img
            src={participant?.profilePicture || '/default-avatar.png'}
            alt={participant?.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="text-text font-semibold">
              {isGroup ? chat.name : participant?.username || 'Unknown'}
            </h2>
            <p className="text-text-secondary text-sm">
              {isGroup
                ? `${chat.memberCount || 0} members`
                : blockStatus.isBlockedBy
                ? 'Blocked you'
                : participant?.status === 'online'
                ? 'Online'
                : participant?.lastSeen
                ? `Last seen ${new Date(participant.lastSeen).toLocaleString()}`
                : 'Offline'}
            </p>
            {blockStatus.isBlockedBy && (
              <p className="text-red-500 text-xs">You are blocked by this user</p>
            )}
            {blockStatus.mutual && (
              <p className="text-red-500 text-xs">Mutual block</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition">
            <FiPhone size={20} />
          </button>
          <button className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition">
            <FiVideo size={20} />
          </button>
          <ChatMenuHeader
            onSearch={() => setShowSearch(!showSearch)}
            onCopy={handleCopySelected}
            onShare={handleShare}
            onClearChat={handleClearChat}
            onStarred={handleGoStarred}
            onTheme={() => setShowTheme(true)}
            onEditMessage={handleEditSelected}
            onBlock={handleBlockUser}
            onUnblock={handleUnblockUser}
            isBlocked={isBlocked}
            isBlockedBy={blockStatus.isBlockedBy}
          />
        </div>
      </div>

      {/* ---- Search ---- */}
      {showSearch && (
        <SearchMessages
          messages={messages}
          onResultClick={(id) => {
            const el = document.getElementById(`message-${id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* ---- Selection Toolbar ---- */}
      {isSelectionMode && (
        <MessageSelectionToolbar
          selectedCount={getSelectedCount()}
          onCopy={handleCopySelected}
          onStar={handleStarSelected}
          onDelete={handleDeleteSelected}
          onForward={handleForwardSelected}
          onEdit={handleEditSelected}
          onInfo={handleInfoSelected}
          onCancel={clearSelection}
        />
      )}

      {/* ---- Messages ---- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                id={`message-${msg._id}`}
                message={msg}
                isOwn={msg.sender?._id === user?._id}
                showAvatar={!isGroup}
                showSenderName={isGroup}
                onDelete={handleDelete}
                onReply={handleReply}
                onStar={handleStarMessage}
                onLongPress={handleLongPress}
                onRightClick={handleContextMenu}
                isSelected={isSelected(msg._id)}
                isSelectionMode={isSelectionMode}
                onSelect={selectMessage}
                onEdit={() => {
                  if (msg.sender?._id === user?._id && msg.type === 'text') {
                    setEditingMessage(msg);
                    setShowEditModal(true);
                  }
                }}
              />
            ))}
            {Object.keys(typingUsers).some((id) => typingUsers[id]) && (
              <TypingIndicator />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ---- Reply preview ---- */}
      {replyTo && (
        <div className="bg-input-bg border-t border-border-color px-4 py-2 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-text-secondary text-xs">
              Replying to {replyTo.sender?.username || 'Unknown'}
            </p>
            <p className="text-text truncate">
              {replyTo.content || '📎 Media'}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-text-secondary hover:text-text"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* ---- Input ---- */}
      <MessageInput
        ref={messageInputRef}
        onSendMessage={handleSend}
        onTyping={sendTyping}
        onAttachmentClick={() => setShowAttachmentMenu(true)}
        onCameraClick={() => setShowCamera(true)}
        disabled={loading}
        isBlocked={isBlocked || blockStatus.isBlockedBy}
        replyTo={replyTo}
        chatId={chat.id}
        onClearReply={() => setReplyTo(null)}
      />

      {/* ---- Attachment menu ---- */}
      <AttachmentMenu
        isOpen={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onFileSelected={(file, type) => {
          if (messageInputRef.current?.handleFileSelected) {
            messageInputRef.current.handleFileSelected(file, type);
          }
          setShowAttachmentMenu(false);
        }}
      />

      {/* ---- Context Menu ---- */}
      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          isOwn={contextMenu.message.sender?._id === user?._id}
          onClose={closeContextMenu}
          onReply={() => handleReply(contextMenu.message)}
          onCopy={() => handleCopy(contextMenu.message)}
          onStar={() => handleStarMessage(contextMenu.message._id)}
          onForward={() => setShowForward(true)}
          onDelete={() => handleDelete(contextMenu.message._id)}
          onEdit={handleEditSelected}
          onSelect={() => handleSelect(contextMenu.message._id)}
          onInfo={handleInfoSelected}
        />
      )}

      {/* ---- Delete Confirmation Modal ---- */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteSelected}
        title="Delete Messages?"
        message={`Are you sure you want to delete ${getSelectedCount()} selected message(s)?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />

      {/* ---- Theme Selector ---- */}
      <ThemeSelector
        isOpen={showTheme}
        currentTheme={theme}
        onSave={handleThemeSave}
        onClose={() => setShowTheme(false)}
      />

      {/* ---- Edit Message Modal ---- */}
      <EditMessageModal
        isOpen={showEditModal}
        message={editingMessage}
        onSave={handleEditMessage}
        onClose={() => {
          setShowEditModal(false);
          setEditingMessage(null);
        }}
      />

      {/* ---- Camera Modal ---- */}
      <CameraModal
        isOpen={showCamera}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />

      {/* ---- Forward Modal ---- */}
      <ForwardModal
        isOpen={showForward}
        messages={selectedMessages
          .map((id) => messages.find((m) => m._id === id))
          .filter(Boolean)}
        onClose={() => {
          setShowForward(false);
          clearSelection();
        }}
        onForward={handleForwardMessages}
      />

      {/* ---- Confirmation Modal ---- */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: null,
            confirmVariant: 'danger',
          })
        }
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
      />
      </div>
    </div>
  );
};

export default ChatWindow;