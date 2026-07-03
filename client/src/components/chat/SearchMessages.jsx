// client/src/components/chat/SearchMessages.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const SearchMessages = ({ messages, onResultClick, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }
    const lower = query.toLowerCase();
    const matched = messages.filter(msg => {
      if (msg.type === 'text' && msg.content.toLowerCase().includes(lower)) return true;
      if (msg.media?.fileName && msg.media.fileName.toLowerCase().includes(lower)) return true;
      return false;
    });
    setResults(matched);
    setCurrentIndex(0);
  }, [query, messages]);

  useEffect(() => {
    if (results.length > 0 && currentIndex < results.length) {
      onResultClick(results[currentIndex]._id);
    }
  }, [currentIndex, results, onResultClick]);

  const handleNext = () => {
    if (currentIndex < results.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  return (
    <div className="bg-header-bg border-b border-border-color px-4 py-2 flex items-center gap-3">
      <FiSearch className="text-text-secondary" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search messages..."
        className="flex-1 bg-transparent text-text placeholder-text-secondary focus:outline-none"
        autoFocus
      />
      {results.length > 0 && (
        <span className="text-text-secondary text-sm">{currentIndex + 1} of {results.length}</span>
      )}
      <button onClick={handlePrev} className="text-text-secondary hover:text-text" disabled={results.length === 0}>
        <FiChevronUp size={20} />
      </button>
      <button onClick={handleNext} className="text-text-secondary hover:text-text" disabled={results.length === 0}>
        <FiChevronDown size={20} />
      </button>
      <button onClick={onClose} className="text-text-secondary hover:text-text">
        <FiX size={20} />
      </button>
    </div>
  );
};

export default SearchMessages;