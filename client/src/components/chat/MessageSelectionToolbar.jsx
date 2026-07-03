// client/src/components/chat/MessageSelectionToolbar.jsx
import React from 'react';
import { 
  FiCopy, 
  FiStar, 
  FiTrash2, 
  FiShare2, 
  FiX,
  FiChevronLeft,
  FiInfo,
  FiEdit2
} from 'react-icons/fi';
import { useMessageSelection } from '../../context/MessageSelectionContext';
const MessageSelectionToolbar = ({
  onCopy,
  onStar,
  onDelete,
  onForward,
  onEdit,
  onInfo,
  selectedCount,
  onCancel,
}) => {
  const { clearSelection } = useMessageSelection();

  const handleCancel = () => {
    clearSelection();
    if (onCancel) onCancel();
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-header-bg border-b border-border-color px-4 py-2 flex items-center gap-2 animate-slideDown">
      <button
        onClick={handleCancel}
        className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
        aria-label="Cancel selection"
      >
        <FiX size={20} />
      </button>
      
      <span className="text-text font-semibold flex-1">
        {selectedCount} {selectedCount === 1 ? 'message' : 'messages'} selected
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={onCopy}
          className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
          title="Copy"
          aria-label="Copy selected messages"
        >
          <FiCopy size={18} />
        </button>
        
        <button
          onClick={onStar}
          className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
          title="Star"
          aria-label="Star selected messages"
        >
          <FiStar size={18} />
        </button>
        
        <button
          onClick={onForward}
          className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
          title="Forward"
          aria-label="Forward selected messages"
        >
          <FiShare2 size={18} />
        </button>
        
        <button
          onClick={onEdit}
          className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
          title="Edit"
          aria-label="Edit selected message"
          disabled={selectedCount !== 1}
        >
          <FiEdit2 size={18} />
        </button>
        
        <button
          onClick={onInfo}
          className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
          title="Message Info"
          aria-label="View message info"
          disabled={selectedCount !== 1}
        >
          <FiInfo size={18} />
        </button>
        
        <button
          onClick={onDelete}
          className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition"
          title="Delete"
          aria-label="Delete selected messages"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default MessageSelectionToolbar;