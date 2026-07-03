// client/src/components/chat/MessageContextMenu.jsx
import React, { useEffect, useRef } from 'react';
import { useMessageSelection } from '../../context/MessageSelectionContext';

import { 
  FiCopy, 
  FiStar, 
  FiTrash2, 
  FiShare2, 
  FiEdit2,
  FiCheckSquare,
  FiInfo,
  FiCornerUpLeft,  // ✅ Changed from FiReply to FiCornerUpLeft
  FiChevronRight
} from 'react-icons/fi';

const MessageContextMenu = ({
  x,
  y,
  message,
  isOwn,
  onClose,
  onReply,
  onCopy,
  onStar,
  onForward,
  onDelete,
  onEdit,
  onSelect,
  onInfo,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Position menu within viewport
  const getPosition = () => {
    const menuWidth = 240;
    const menuHeight = 300;
    const padding = 10;
    
    let left = x;
    let top = y;
    
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }
    if (top + menuHeight > window.innerHeight - padding) {
      top = window.innerHeight - menuHeight - padding;
    }
    if (left < padding) left = padding;
    if (top < padding) top = padding;
    
    return { left, top };
  };

  const position = getPosition();

  const menuItems = [
    { icon: FiCornerUpLeft, label: 'Reply', action: onReply, show: true },  // ✅ Changed here too
    { icon: FiCopy, label: 'Copy', action: onCopy, show: message.type === 'text' },
    { icon: FiStar, label: 'Star', action: onStar, show: true },
    { icon: FiShare2, label: 'Forward', action: onForward, show: true },
    { icon: FiEdit2, label: 'Edit', action: onEdit, show: isOwn && message.type === 'text' },
    { icon: FiCheckSquare, label: 'Select', action: onSelect, show: true },
    { icon: FiInfo, label: 'Message Info', action: onInfo, show: true },
    { icon: FiTrash2, label: 'Delete', action: onDelete, show: true, danger: true },
  ];

  const visibleItems = menuItems.filter(item => item.show);

  return (
    <div
      ref={menuRef}
      className="fixed bg-card rounded-12 shadow-xl py-1 z-50 min-w-[200px] border border-border-color animate-scaleIn"
      style={{ left: position.left, top: position.top }}
    >
      {visibleItems.map((item, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            item.action();
            onClose();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-background transition ${
            item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-text hover:text-text'
          }`}
        >
          <item.icon size={16} className={item.danger ? 'text-red-500' : 'text-text-secondary'} />
          <span className="flex-1">{item.label}</span>
          <FiChevronRight size={14} className="text-text-secondary opacity-50" />
        </button>
      ))}
    </div>
  );
};

export default MessageContextMenu;