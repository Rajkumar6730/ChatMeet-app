// client/src/components/group/GroupCard.jsx (Fully Updated)
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiUsers, FiUser, FiCheck, FiClock } from 'react-icons/fi';

const GroupCard = ({ 
  group, 
  isSelected = false, 
  onClick, 
  onlineCount = 0,
  typingUsers = [],
  showLastMessage = true
}) => {
  const { 
    name, 
    groupPicture, 
    lastMessage, 
    lastMessageTime, 
    unreadCount, 
    memberCount,
    isMuted = false,
    isArchived = false,
    isPinned = false
  } = group;

  // ---- Helper functions (KEPT from OLD) ----
  const getLastMessagePreview = () => {
    if (!lastMessage) return 'No messages yet';
    if (lastMessage.type === 'text') return lastMessage.content;
    if (lastMessage.type === 'image') return '📷 Photo';
    if (lastMessage.type === 'audio') return '🎵 Voice message';
    if (lastMessage.type === 'video') return '🎬 Video';
    if (lastMessage.type === 'document') return '📄 Document';
    if (lastMessage.type === 'location') return '📍 Location';
    return `📎 ${lastMessage.type}`;
  };

  const getTimeAgo = () => {
    if (!lastMessageTime) return '';
    return formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true });
  };

  const getMessageSender = () => {
    if (!lastMessage || !lastMessage.sender) return '';
    return lastMessage.sender.username || 'Unknown';
  };

  // ---- Check if typing (NEW FEATURE) ----
  const isTyping = typingUsers && typingUsers.length > 0;
  const typingText = isTyping ? `${typingUsers.length} ${typingUsers.length === 1 ? 'person is' : 'people are'} typing...` : '';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-12 cursor-pointer transition ${
        isSelected 
          ? 'bg-primary/20 border border-primary' 
          : 'bg-card hover:bg-card/70 border border-transparent'
      } ${isArchived ? 'opacity-60' : ''}`}
    >
      {/* ---- Avatar (UPDATED) ---- */}
      <div className="relative flex-shrink-0">
        <img
          src={groupPicture || '/default-group.png'}
          alt={name}
          className="w-12 h-12 rounded-full object-cover border-2 border-border-color"
        />
        
        {/* Online count badge (NEW) */}
        {onlineCount > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-status-online text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-medium">
            {onlineCount}
          </span>
        )}
        
        {/* Member count badge (if no online) (NEW) */}
        {onlineCount === 0 && memberCount > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-card border border-border-color text-text-secondary text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {memberCount}
          </span>
        )}
      </div>

      {/* ---- Content (UPDATED) ---- */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-text font-medium truncate">
              {name}
            </h3>
            {/* Pinned indicator (NEW) */}
            {isPinned && (
              <span className="text-primary text-xs" title="Pinned">📌</span>
            )}
            {/* Muted indicator (NEW) */}
            {isMuted && (
              <span className="text-text-secondary text-xs" title="Muted">🔇</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Member count (NEW) */}
            <span className="text-text-secondary text-xs flex items-center gap-1">
              <FiUsers size={12} /> {memberCount || 0}
            </span>
            <span className="text-text-secondary text-xs">
              {getTimeAgo()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-0.5">
          {/* Last message preview (UPDATED) */}
          {showLastMessage && (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {isTyping ? (
                <p className="text-primary text-sm truncate flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span className="ml-1">{typingText}</span>
                </p>
              ) : (
                <>
                  {/* Sender name (NEW) */}
                  {lastMessage && lastMessage.sender && (
                    <span className="text-text-secondary text-xs flex-shrink-0">
                      {getMessageSender()}:
                    </span>
                  )}
                  <p className={`text-sm truncate flex-1 ${
                    unreadCount > 0 ? 'text-text font-medium' : 'text-text-secondary'
                  }`}>
                    {getLastMessagePreview()}
                  </p>
                  {/* Last message status (NEW) */}
                  {lastMessage && lastMessage.sender && (
                    <span className="text-text-secondary text-xs flex-shrink-0">
                      {lastMessage.sender._id === group.currentUserId ? (
                        <FiCheck size={12} className={lastMessage.readBy?.length > 0 ? 'text-primary' : 'text-text-secondary'} />
                      ) : null}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Unread count badge (KEPT from OLD) */}
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 min-w-[20px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        
        {/* Typing indicator (NEW) - shown below last message */}
        {isTyping && !showLastMessage && (
          <p className="text-primary text-sm truncate flex items-center gap-1 animate-pulse mt-0.5">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span className="ml-1">{typingText}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default GroupCard;