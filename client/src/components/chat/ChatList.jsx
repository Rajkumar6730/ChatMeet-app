// client/src/components/chat/ChatList.jsx
import React, { useState, useEffect } from 'react';
import ChatCard from './ChatCard';
import SelectionToolbar from './SelectionToolbar';
import ConfirmationModal from '../common/ConfirmationModal';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import { FiMessageSquare } from 'react-icons/fi';
import { chatService } from '../../services/chatService';

const ChatList = ({ chats, loading, onChatSelect, onChatsUpdate }) => {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalState, setModalState] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  useEffect(() => {
    if (selectedIds.length === 0) setSelectMode(false);
  }, [selectedIds]);

  const toggleSelect = (chatId) => {
    setSelectedIds(prev =>
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    );
    if (!selectMode) setSelectMode(true);
  };

  const exitSelection = () => {
    setSelectedIds([]);
    setSelectMode(false);
  };

  const showModal = (title, message, onConfirm) => {
    setModalState({ isOpen: true, title, message, onConfirm });
  };

  // ---- Toolbar action handlers ----
  const handlePinSelected = async () => {
    try {
      await Promise.all(selectedIds.map(id => chatService.pinChat(id)));
      onChatsUpdate?.();
      exitSelection();
    } catch (err) {
      console.error('Pin error:', err);
    }
  };

  const handleFavoriteSelected = async () => {
    // Add favorite logic (e.g., add to favorites list)
    exitSelection();
  };

  const handleDeleteSelected = () => {
    showModal(
      'Delete Selected Chats?',
      'This will permanently delete the selected chats and their messages.',
      async () => {
        try {
          await Promise.all(selectedIds.map(id => chatService.deleteChat(id)));
          onChatsUpdate?.();
          exitSelection();
        } catch (err) {
          console.error('Delete error:', err);
        }
        setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    );
  };

  const handleForwardSelected = () => {
    console.log('Forward selected chats:', selectedIds);
    // Open forward modal (to be implemented)
  };

  const handleMoreOptions = () => {
    // Additional options
  };

  if (loading) return <Loader />;
  
  if (!chats || chats.length === 0) {
    return (
      <EmptyState 
        icon={FiMessageSquare} 
        title="No chats yet" 
        description="Start a new conversation" 
      />
    );
  }

  return (
    <>
      {/* Selection Toolbar */}
      <SelectionToolbar
        selectedCount={selectedIds.length}
        onExit={exitSelection}
        onPinSelected={handlePinSelected}
        onFavoriteSelected={handleFavoriteSelected}
        onDeleteSelected={handleDeleteSelected}
        onForwardSelected={handleForwardSelected}
        onMoreOptions={handleMoreOptions}
      />

      <div className="divide-y divide-border-color">
        {chats.map((chat) => (
          <ChatCard
            key={chat.id}
            chat={chat}
            isSelected={selectedIds.includes(chat.id)}
            isSelectMode={selectMode || selectedIds.length > 0}
            onSelect={toggleSelect}
            onChatClick={onChatSelect}
            onPin={() => chatService.pinChat(chat.id).then(onChatsUpdate)}
            onUnpin={() => chatService.unpinChat(chat.id).then(onChatsUpdate)}
            onFavorite={() => chatService.addToFavorites(chat.participant._id).then(onChatsUpdate)}
            onUnfavorite={() => chatService.removeFromFavorites(chat.participant._id).then(onChatsUpdate)}
            onMarkUnread={() => chatService.markChatAsUnread?.(chat.id).then(onChatsUpdate)}
            onMarkRead={() => chatService.markChatAsRead(chat.id).then(onChatsUpdate)}
            onClearChat={() => {
              showModal('Clear Chat?', 'This will delete all messages but keep the contact.', async () => {
                // Implement clear chat endpoint
                onChatsUpdate?.();
                setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
              });
            }}
            onDeleteChat={() => {
              showModal('Delete Contact?', 'This will delete the chat and all messages.', async () => {
                await chatService.deleteChat(chat.id);
                onChatsUpdate?.();
                setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
              });
            }}
            onBlockContact={() => {
              showModal(
                `Block ${chat.participant?.username || 'User'}?`, 
                'They will no longer be able to message you.', 
                async () => {
                  await chatService.blockUser(chat.participant._id);
                  onChatsUpdate?.();
                  setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
                }
              );
            }}
            onUnblockContact={() => {
              showModal(
                `Unblock ${chat.participant?.username || 'User'}?`, 
                'They will be able to message you again.', 
                async () => {
                  await chatService.unblockUser(chat.participant._id);
                  onChatsUpdate?.();
                  setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
                }
              );
            }}
          />
        ))}
      </div>

      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ 
          isOpen: false, 
          title: '', 
          message: '', 
          onConfirm: null 
        })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
      />
    </>
  );
};

export default ChatList;