// client/src/components/chat/ChatMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  FiMoreVertical, 
  FiCheck, 
  FiStar, 
  FiBookmark, 
  FiTrash2, 
  FiUserX, 
  FiMail,
  FiUserCheck 
} from 'react-icons/fi';

const ChatMenu = ({
  chatId,
  isPinned,
  isFavorited,
  isUnread,
  isBlocked = false,
  isBlockedBy = false,
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
  onSelectChat,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = (callback) => (e) => {
    e.stopPropagation();
    if (callback) callback();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-1 rounded-full hover:bg-card text-text-secondary hover:text-text transition"
        aria-label="Chat menu"
      >
        <FiMoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-card rounded-12 shadow-xl py-1 z-50 border border-border-color">
          {/* Select Chat */}
          <button
            onClick={handleAction(() => onSelectChat(chatId))}
            className="w-full flex items-center gap-3 px-4 py-2 text-text hover:bg-background transition"
          >
            <FiCheck size={16} /> Select Chat
          </button>

          {/* Pin/Unpin */}
          <button
            onClick={handleAction(isPinned ? onUnpin : onPin)}
            className="w-full flex items-center gap-3 px-4 py-2 text-text hover:bg-background transition"
          >
            <FiBookmark size={16} className={isPinned ? 'text-primary' : ''} />
            {isPinned ? 'Unpin' : 'Pin'}
          </button>

          {/* Favorite/Unfavorite */}
          <button
            onClick={handleAction(isFavorited ? onUnfavorite : onFavorite)}
            className="w-full flex items-center gap-3 px-4 py-2 text-text hover:bg-background transition"
          >
            <FiStar size={16} className={isFavorited ? 'text-yellow-500' : ''} />
            {isFavorited ? 'Remove Favorite' : 'Add to Favorites'}
          </button>

          {/* Mark as Unread/Read */}
          <button
            onClick={handleAction(isUnread ? onMarkRead : onMarkUnread)}
            className="w-full flex items-center gap-3 px-4 py-2 text-text hover:bg-background transition"
          >
            <FiMail size={16} className={isUnread ? 'text-primary' : ''} />
            {isUnread ? 'Mark as Read' : 'Mark as Unread'}
          </button>

          <div className="border-t border-border-color my-1" />

          {/* Block/Unblock */}
          {isBlocked ? (
            <button
              onClick={handleAction(onUnblockContact)}
              className="w-full flex items-center gap-3 px-4 py-2 text-green-500 hover:bg-green-500/10 transition"
            >
              <FiUserCheck size={16} /> Unblock Contact
            </button>
          ) : (
            <button
              onClick={handleAction(onBlockContact)}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-500/10 transition"
            >
              <FiUserX size={16} /> Block Contact
            </button>
          )}

          {/* Clear Chat */}
          <button
            onClick={handleAction(onClearChat)}
            className="w-full flex items-center gap-3 px-4 py-2 text-orange-500 hover:bg-orange-500/10 transition"
          >
            <FiTrash2 size={16} /> Clear Chat
          </button>

          {/* Delete Chat */}
          <button
            onClick={handleAction(onDeleteChat)}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-500/10 transition"
          >
            <FiTrash2 size={16} /> Delete Contact
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatMenu;