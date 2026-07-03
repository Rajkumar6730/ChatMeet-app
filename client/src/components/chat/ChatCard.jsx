import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import ChatMenu from './ChatMenu';
import { FiCheck, FiBookmark } from 'react-icons/fi';

const ChatCard = ({
  chat,
  isSelected,
  isSelectMode,
  onSelect,
  onChatClick,
  onPin,
  onUnpin,
  onFavorite,
  onUnfavorite,
  onMarkUnread,
  onMarkRead,
  onClearChat,
  onDeleteChat,
  onBlockContact,
  onUnblockContact,
}) => {
  const { participant, lastMessage, lastMessageTime, unreadCount, isPinned, isFavorited } = chat;

  const getStatusColor = () => {
    if (participant?.status === 'online') return 'bg-status-online';
    if (participant?.status === 'away') return 'bg-status-away';
    return 'bg-status-offline';
  };

  const getLastMessagePreview = () => {
    if (!lastMessage) return 'No messages yet';
    if (lastMessage.type === 'text') return lastMessage.content;
    if (lastMessage.type === 'image') return '📷 Image';
    if (lastMessage.type === 'audio') return '🎤 Voice message';
    if (lastMessage.type === 'document') return '📄 Document';
    return `📎 ${lastMessage.type}`;
  };

  const getTimeAgo = () => {
    if (!lastMessageTime) return '';
    return formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true });
  };

  const handleClick = () => {
    if (isSelectMode) {
      onSelect(chat.id);
    } else {
      onChatClick(chat);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition relative ${
        isSelected ? 'bg-primary/20' : 'hover:bg-card/50'
      }`}
    >
      {/* Selection checkbox */}
      {isSelectMode && (
        <div className="flex-shrink-0">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
            isSelected ? 'bg-primary border-primary' : 'border-text-secondary'
          }`}>
            {isSelected && <FiCheck size={12} className="text-white" />}
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={participant?.profilePicture || '/default-avatar.png'}
          alt={participant?.username}
          className="w-12 h-12 rounded-full object-cover"
        />
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor()}`} />
        {isPinned && (
          <FiBookmark size={14} className="absolute -top-1 -right-1 text-primary bg-background rounded-full p-0.5" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-text font-medium truncate flex items-center gap-1">
            {participant?.username || 'Unknown User'}
            {isFavorited && <span className="text-yellow-500">★</span>}
          </h3>
          <span className="text-text-secondary text-xs flex-shrink-0">{getTimeAgo()}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-text-secondary text-sm truncate flex-1">
            {getLastMessagePreview()}
          </p>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ml-2">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Three-dot menu */}
      {!isSelectMode && (
        <ChatMenu
          chatId={chat.id}
          isPinned={isPinned}
          isFavorited={isFavorited}
          isUnread={unreadCount > 0}
          isBlocked={chat.isBlocked || false}
          isBlockedBy={chat.isBlockedBy || false}
          onPin={onPin}
          onUnpin={onUnpin}
          onFavorite={onFavorite}
          onUnfavorite={onUnfavorite}
          onMarkUnread={onMarkUnread}
          onMarkRead={onMarkRead}
          onClearChat={onClearChat}
          onDeleteChat={onDeleteChat}
          onBlockContact={onBlockContact}
          onUnblockContact={onUnblockContact}
          onSelectChat={onSelect}
        />  
      )}
    </div>
  );
};

export default ChatCard;