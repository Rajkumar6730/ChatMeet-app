import React, { useState, useRef, useEffect } from 'react';
import { FiMoreVertical, FiSearch, FiCopy, FiShare2, FiTrash2, FiStar, FiLayout, FiEdit } from 'react-icons/fi';

const ChatMenuHeader = ({
  onSearch,
  onCopy,
  onShare,
  onClearChat,
  onStarred,
  onTheme,
  onEditMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={toggleMenu} className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition">
        <FiMoreVertical size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-card rounded-12 shadow-xl py-1 z-50 border border-border-color">
          <button onClick={() => { onSearch(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-text hover:bg-background transition">
            <FiSearch size={16} /> Search
          </button>
          <button onClick={() => { onCopy(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-text hover:bg-background transition">
            <FiCopy size={16} /> Copy
          </button>
          <button onClick={() => { onShare(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-text hover:bg-background transition">
            <FiShare2 size={16} /> Share
          </button>
          <button onClick={() => { onStarred(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-text hover:bg-background transition">
            <FiStar size={16} /> Starred Messages
          </button>
          <button onClick={() => { onTheme(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-text hover:bg-background transition">
            <FiLayout size={16} /> Theme
          </button>
          <button onClick={() => { onEditMessage(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-text hover:bg-background transition">
            <FiEdit size={16} /> Edit Message
          </button>
          <div className="border-t border-border-color my-1" />
          <button onClick={() => { onClearChat(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-500/10 transition">
            <FiTrash2 size={16} /> Clear Chat
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatMenuHeader;