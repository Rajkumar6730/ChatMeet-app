import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import MessageBubble from '../chat/MessageBubble';
import MessageInput from '../chat/MessageInput';
import TypingIndicator from '../chat/TypingIndicator';
import AttachmentMenu from '../chat/AttachmentMenu';
import { FiArrowLeft, FiMoreVertical, FiUsers } from 'react-icons/fi';

const GroupChat = ({ group, onBack, onGroupUpdate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    messages, 
    loading, 
    typingUsers, 
    sendMessage, 
    sendTyping, 
    markAsRead,
    markChatAsRead,
    fetchMessages
  } = useChat(null, group?.id, onGroupUpdate);
  
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when group chat is open
  useEffect(() => {
    if (group?.id) {
      markChatAsRead();
    }
  }, [group?.id]);

  const handleSendMessage = async (content, type = 'text', media = null) => {
    if (!content && !media) return;
    try {
      await sendMessage(content, type, media);
      sendTyping(false);
      onGroupUpdate?.();
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleTyping = (isTyping) => {
    sendTyping(isTyping);
  };

  if (!group) return null;

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="bg-header-bg border-b border-border-color px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden text-text-secondary hover:text-text"
          >
            <FiArrowLeft size={24} />
          </button>
          <img
            src={group.groupPicture || '/default-group.png'}
            alt={group.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="text-text font-semibold">{group.name}</h2>
            <p className="text-text-secondary text-sm flex items-center gap-1">
              <FiUsers size={14} /> {group.memberCount || 0} members
            </p>
          </div>
        </div>
        <button className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition">
          <FiMoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message._id || index}
                message={message}
                isOwn={message.sender?._id === user?._id}
                showSenderName={true}
                showAvatar={true}
              />
            ))}
            {Object.keys(typingUsers).some(id => typingUsers[id]) && (
              <TypingIndicator />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Attachment Menu */}
      <AttachmentMenu
        isOpen={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onSelect={(type) => {
          setShowAttachmentMenu(false);
          console.log('Selected attachment:', type);
        }}
      />

      {/* Input */}
      <MessageInput
        ref={inputRef}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onAttachmentClick={() => setShowAttachmentMenu(true)}
        disabled={loading}
      />
    </div>
  );
};

export default GroupChat;