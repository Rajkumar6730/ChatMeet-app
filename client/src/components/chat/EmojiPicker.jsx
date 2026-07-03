import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
  '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗',
  '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥',
  '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝',
  '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁',
  '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩',
  '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡',
  '😠', '🤬', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌',
  '👐', '🤲', '🤝', '🙏', '✌️', '🤟', '🤘', '👌', '👈', '👉',
  '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪',
  '🦵', '🦶', '👀', '👂', '👃', '🧠', '🫀', '🫁', '🗣️', '👤',
  '👥', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '👨‍🦱',
  '👩‍🦰', '👨‍🦰', '👱‍♀️', '👱‍♂️', '👩‍🦳', '👨‍🦳', '👩‍🦲', '👨‍🦲', '🧔', '👵',
  '🧓', '👴', '👲', '👳‍♀️', '👳‍♂️', '🧕', '👮‍♀️', '👮‍♂️', '👷‍♀️', '👷‍♂️',
  '💂‍♀️', '💂‍♂️', '🕵️‍♀️', '🕵️‍♂️', '👩‍⚕️', '👨‍⚕️', '👩‍🌾', '👨‍🌾', '👩‍🍳', '👨‍🍳',
  '👩‍🎓', '👨‍🎓', '👩‍🎤', '👨‍🎤', '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭', '👩‍💻', '👨‍💻',
];

const EmojiPicker = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredEmojis = search
    ? EMOJIS.filter(emoji => emoji.includes(search))
    : EMOJIS;

  return (
    <div className="absolute bottom-16 left-0 bg-card rounded-12 shadow-xl p-3 w-72 max-h-80 overflow-y-auto z-50">
      <div className="flex items-center justify-between mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          className="flex-1 bg-background border border-border-color rounded-12 px-3 py-1 text-text placeholder-text-secondary focus:outline-none focus:border-primary text-sm"
        />
        <button onClick={onClose} className="ml-2 text-text-secondary hover:text-text">
          <FiX size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelect(emoji)}
            className="text-2xl hover:bg-background rounded-8 p-1 transition"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;