// client/src/components/chat/SelectionToolbar.jsx
import React from 'react';
import { FiArrowLeft, FiBookmark, FiStar, FiTrash2, FiShare2, FiMoreHorizontal } from 'react-icons/fi';

const SelectionToolbar = ({
  selectedCount,
  onExit,
  onPinSelected,
  onFavoriteSelected,
  onDeleteSelected,
  onForwardSelected,
  onMoreOptions,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-header-bg border-b border-border-color px-4 py-2 flex items-center gap-3">
      <button onClick={onExit} className="text-text-secondary hover:text-text">
        <FiArrowLeft size={24} />
      </button>
      <span className="text-text font-semibold flex-1">{selectedCount} selected</span>
      <button onClick={onPinSelected} className="text-text-secondary hover:text-text" title="Pin">
        <FiBookmark size={20} />
      </button>
      <button onClick={onFavoriteSelected} className="text-text-secondary hover:text-text" title="Favorite">
        <FiStar size={20} />
      </button>
      <button onClick={onDeleteSelected} className="text-red-500 hover:text-red-400" title="Delete">
        <FiTrash2 size={20} />
      </button>
      <button onClick={onForwardSelected} className="text-text-secondary hover:text-text" title="Forward">
        <FiShare2 size={20} />
      </button>
      <button onClick={onMoreOptions} className="text-text-secondary hover:text-text" title="More">
        <FiMoreHorizontal size={20} />
      </button>
    </div>
  );
};

export default SelectionToolbar;