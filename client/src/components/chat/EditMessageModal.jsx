// client/src/components/chat/EditMessageModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';

const EditMessageModal = ({ isOpen, message, onSave, onClose }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);
  const maxLength = 5000; // Max characters for a message

  // ---- Reset state when message changes (UPDATED) ----
  useEffect(() => {
    if (message) {
      setContent(message.content || '');
      setCharCount(message.content?.length || 0);
      setError('');
    }
  }, [message]);

  // ---- Auto-focus textarea (NEW FEATURE) ----
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }, 100);
    }
  }, [isOpen]);

  // ---- Handle content change (NEW FEATURE) ----
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    if (newContent.length <= maxLength) {
      setContent(newContent);
      setCharCount(newContent.length);
    }
  };

  // ---- Handle submit (UPDATED from OLD) ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!content.trim()) {
      setError('Message content cannot be empty');
      return;
    }
    
    if (content.trim() === message.content) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await onSave(message._id, content.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to edit message');
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Handle keyboard shortcuts (NEW FEATURE) ----
  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to submit (NEW FEATURE)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
    // Escape to close (NEW FEATURE)
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // ---- Handle close with confirmation (NEW FEATURE) ----
  const handleClose = () => {
    if (content !== message.content && content.trim()) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen || !message) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-card rounded-12 p-6 max-w-md w-full shadow-xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---- Header (UPDATED) ---- */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-text font-semibold text-lg">Edit Message</h3>
            <p className="text-text-secondary text-sm">
              Edit your message and save changes
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-text-secondary hover:text-text p-1 rounded-full hover:bg-background transition disabled:opacity-50"
            disabled={isLoading}
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ---- Original message (NEW FEATURE) ---- */}
          <div className="mb-4">
            <p className="text-text-secondary text-sm mb-2">Original message:</p>
            <div className="bg-background/50 rounded-8 p-2 text-text-secondary text-sm opacity-70 border border-border-color/30">
              {message.content}
            </div>
          </div>

          {/* ---- Edit textarea (UPDATED) ---- */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-text-secondary text-sm">
                Edit message
              </label>
              <span className={`text-xs ${charCount > maxLength * 0.9 ? 'text-red-500' : 'text-text-secondary'}`}>
                {charCount}/{maxLength}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              rows="4"
              className={`w-full bg-background border rounded-12 p-3 text-text focus:outline-none focus:ring-2 resize-none transition ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-border-color focus:border-primary focus:ring-primary'
              }`}
              placeholder="Edit your message..."
              disabled={isLoading}
              maxLength={maxLength}
              aria-label="Edit message content"
            />
          </div>

          {/* ---- Error display (UPDATED) ---- */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm mb-2 p-2 bg-red-500/10 rounded-8">
              <FiAlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* ---- Helper text (NEW FEATURE) ---- */}
          <div className="text-xs text-text-secondary mb-3">
            <span>Press </span>
            <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border border-border-color">Ctrl</kbd>
            <span> + </span>
            <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border border-border-color">Enter</kbd>
            <span> to save, </span>
            <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border border-border-color">Esc</kbd>
            <span> to cancel</span>
          </div>

          {/* ---- Buttons (UPDATED) ---- */}
          <div className="flex gap-3 mt-4 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-12 bg-background hover:bg-border-color text-text transition disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-12 bg-primary hover:bg-secondary text-white transition disabled:opacity-50 text-sm flex items-center gap-2"
              disabled={isLoading || !content.trim() || content.trim() === message.content}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMessageModal;