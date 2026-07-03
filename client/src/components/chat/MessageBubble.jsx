// client/src/components/chat/MessageBubble.jsx
import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { 
  FiCheck, 
  FiDownload, 
  FiFile, 
  FiTrash2, 
  FiX, 
  FiStar,
  FiClock
} from 'react-icons/fi';

const MessageBubble = ({
  message,
  isOwn,
  showAvatar = true,
  showSenderName = false,
  onDelete,
  onReply,
  onStar,
  onLongPress,
  onRightClick,
  isSelected = false,
  isSelectionMode = false,
  onSelect,
}) => {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isLongPress, setIsLongPress] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // NEW: For image preview
  const longPressTimer = useRef(null);

  // ---- Long press for selection (UPDATED) ----
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setSwipeOffset(0);
    setIsLongPress(false);
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      if (onLongPress) {
        onLongPress(message._id);
      }
    }, 500);
  };

  const handleTouchMove = (e) => {
    const delta = e.touches[0].clientX - touchStartX;
    if (delta > 0 && delta < 80) {
      setSwipeOffset(delta);
      e.preventDefault();
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Swipe to reply (OLD FEATURE KEPT)
    if (swipeOffset > 50 && !isLongPress) {
      if (onReply) onReply(message);
    }
    
    setSwipeOffset(0);
    setTouchStartX(0);
    setIsLongPress(false);
  };

  // ---- Right click (NEW FEATURE) ----
  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onRightClick) {
      onRightClick(e, message);
    }
  };

  // ---- Status icon (KEPT from OLD) ----
  const getStatusIcon = () => {
    if (!isOwn) return null;
    if (message.readBy?.length > 0) {
      return (
        <span className="flex items-center text-primary">
          <FiCheck size={14} />
          <FiCheck size={14} style={{ marginLeft: -4 }} />
        </span>
      );
    }
    if (message.deliveredTo?.length > 0) {
      return (
        <span className="flex items-center text-text-secondary">
          <FiCheck size={14} />
          <FiCheck size={14} style={{ marginLeft: -4 }} />
        </span>
      );
    }
    return <FiCheck className="text-text-secondary" size={14} />;
  };

  // ---- Content renderer (UPDATED with new features) ----
  const renderContent = () => {
    // ---- Text messages (KEPT from OLD) ----
    if (message.type === 'text') {
      // Emoji‑only messages: larger font
      const isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(message.content) && message.content.length < 10;
      return <p className={`whitespace-pre-wrap break-words ${isEmojiOnly ? 'text-3xl' : ''}`}>{message.content}</p>;
    }

    // ---- Image messages (UPDATED with caption support) ----
    if (message.type === 'image') {
      // Handle single image
      if (message.media?.url) {
        return (
          <div className="space-y-1">
            <img
              src={message.media.url}
              alt={message.media?.caption || 'Image'}
              className="max-w-full rounded-12 max-h-96 object-cover cursor-pointer"
              onClick={() => setSelectedImage(message.media.url)}
              loading="lazy"
            />
            {/* NEW: Image caption */}
            {message.media?.caption && (
              <p className="text-sm text-text-secondary border-t border-border-color/30 pt-1 mt-1">
                {message.media.caption}
              </p>
            )}
          </div>
        );
      }
      
      // Handle multiple images (NEW FEATURE)
      if (message.images && message.images.length > 0) {
        const gridCols = message.images.length === 1 ? 'grid-cols-1' : 
                         message.images.length === 2 ? 'grid-cols-2' : 
                         message.images.length === 3 ? 'grid-cols-2' : 'grid-cols-2';
        
        return (
          <div className="space-y-2">
            <div className={`grid ${gridCols} gap-1`}>
              {message.images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img.url}
                    alt={img.caption || `Image ${index + 1}`}
                    className={`w-full rounded-12 object-cover cursor-pointer ${
                      message.images.length === 3 && index === 0 ? 'col-span-2' : ''
                    }`}
                    style={{ maxHeight: message.images.length === 1 ? '400px' : '200px' }}
                    onClick={() => setSelectedImage(img.url)}
                    loading="lazy"
                  />
                  {/* Show count for remaining images */}
                  {message.images.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black/60 rounded-12 flex items-center justify-center text-white text-xl font-bold">
                      +{message.images.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* NEW: Captions for images */}
            {message.images.some(img => img.caption) && (
              <div className="space-y-1">
                {message.images.map((img, index) => (
                  img.caption && (
                    <p key={index} className="text-sm text-text-secondary border-t border-border-color/30 pt-1">
                      {img.caption}
                    </p>
                  )
                ))}
              </div>
            )}
          </div>
        );
      }
      
      return <p className="text-text-secondary">Image not available</p>;
    }

    // ---- Document/File messages (KEPT from OLD) ----
    if (message.type === 'document' || message.type === 'file') {
      return (
        <div className="flex items-center gap-3 bg-background/20 p-3 rounded-12">
          <FiFile size={24} className="text-primary" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{message.media?.fileName || 'File'}</p>
            <p className="text-text-secondary text-sm">
              {message.media?.fileSize ? `${(message.media.fileSize / 1024).toFixed(1)} KB` : ''}
            </p>
          </div>
          <button
            onClick={() => window.open(message.media?.url, '_blank')}
            className="p-2 bg-primary/20 rounded-full hover:bg-primary/30 transition"
          >
            <FiDownload size={16} />
          </button>
        </div>
      );
    }

    // ---- Audio messages (KEPT from OLD) ----
    if (message.type === 'audio') {
      const duration = message.media?.duration || 0;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      return (
        <div className="flex items-center gap-3 w-full min-w-[200px]">
          <audio controls className="w-full h-10">
            <source src={message.media?.url} type={message.media?.mimeType || 'audio/webm'} />
            Your browser does not support the audio element.
          </audio>
          <span className="text-xs text-text-secondary whitespace-nowrap">{formattedDuration}</span>
        </div>
      );
    }

    // ---- Video messages (NEW FEATURE) ----
    if (message.type === 'video') {
      return (
        <div className="space-y-1">
          <video 
            controls 
            className="max-w-full rounded-12 max-h-96 object-cover"
            poster={message.media?.thumbnail}
          >
            <source src={message.media?.url} type={message.media?.mimeType || 'video/mp4'} />
            Your browser does not support the video element.
          </video>
          {message.media?.caption && (
            <p className="text-sm text-text-secondary border-t border-border-color/30 pt-1 mt-1">
              {message.media.caption}
            </p>
          )}
        </div>
      );
    }

    // ---- Location messages (NEW FEATURE) ----
    if (message.type === 'location') {
      return (
        <div className="space-y-1">
          <div className="bg-background/20 rounded-12 p-4 text-center">
            <p className="text-text">📍 Location</p>
            {message.media?.latitude && message.media?.longitude && (
              <a 
                href={`https://www.google.com/maps?q=${message.media.latitude},${message.media.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-secondary text-sm block mt-1"
              >
                View on map
              </a>
            )}
          </div>
          {message.media?.caption && (
            <p className="text-sm text-text-secondary">{message.media.caption}</p>
          )}
        </div>
      );
    }

    // ---- Contact messages (NEW FEATURE) ----
    if (message.type === 'contact') {
      return (
        <div className="flex items-center gap-3 bg-background/20 p-3 rounded-12">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl">
            {message.media?.name?.charAt(0) || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{message.media?.name || 'Contact'}</p>
            {message.media?.phone && (
              <p className="text-text-secondary text-sm">{message.media.phone}</p>
            )}
          </div>
        </div>
      );
    }

    return <p className="text-text-secondary">Unsupported message type</p>;
  };

  const messageTime = message.createdAt ? format(new Date(message.createdAt), 'hh:mm a') : '';
  const isStarred = message.starredBy?.includes(message.sender?._id);
  const hasEdited = message.isEdited && message.editHistory?.length > 0;

  // ---- Event handlers (KEPT from OLD) ----
  const handleStar = (e) => {
    e.stopPropagation();
    if (onStar) onStar(message._id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteOptions(true);
  };

  const handleDeleteOption = (forEveryone) => {
    setShowDeleteOptions(false);
    if (onDelete) onDelete(message._id, forEveryone);
  };

  // ---- Selection handler (NEW FEATURE) ----
  const handleSelect = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(message._id);
  };

  // ---- Image preview modal (NEW FEATURE) ----
  if (selectedImage) {
    return (
      <div 
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedImage(null)}
      >
        <div className="relative max-w-4xl max-h-screen">
          <img 
            src={selectedImage} 
            alt="Preview" 
            className="max-w-full max-h-screen object-contain"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
          >
            <FiX size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2 group relative select-none ${
          isSelectionMode ? 'cursor-pointer' : ''
        }`}
        style={{ transform: `translateX(${swipeOffset}px)`, transition: 'transform 0.1s' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        onClick={isSelectionMode ? handleSelect : undefined}
        onMouseDown={(e) => {
          // Shift+click for selection (NEW FEATURE)
          if (e.shiftKey && onLongPress) {
            onLongPress(message._id);
          }
          // Ctrl+click for selection (KEPT from OLD with updated logic)
          if (e.ctrlKey && onLongPress) {
            onLongPress(message._id);
          }
        }}
      >
        {/* Selection Checkbox (NEW FEATURE) */}
        {isSelectionMode && (
          <div className={`flex-shrink-0 ${isOwn ? 'order-1' : 'order-0'}`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
              isSelected ? 'bg-primary border-primary' : 'border-text-secondary'
            }`}>
              {isSelected && <FiCheck size={12} className="text-white" />}
            </div>
          </div>
        )}

        {/* Avatar (KEPT from OLD) */}
        {!isOwn && showAvatar && message.sender && (
          <img
            src={message.sender.profilePicture || '/default-avatar.png'}
            alt={message.sender.username}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 mb-1"
          />
        )}

        <div className="flex flex-col max-w-[85%] md:max-w-[70%]">
          {/* Sender name (KEPT from OLD) */}
          {!isOwn && showSenderName && message.sender?.username && (
            <span className="text-xs text-primary font-semibold ml-2 mb-0.5">
              {message.sender.username}
            </span>
          )}

          <div
            className={`rounded-12 px-4 py-2 ${
              isOwn ? 'bg-bubble-sent text-white' : 'bg-bubble-received text-text'
            } ${isSelected ? 'ring-2 ring-primary' : ''}`}
            onClick={() => {
              // Click to select in selection mode (KEPT from OLD)
              if (isSelectionMode && onLongPress) onLongPress(message._id);
            }}
          >
            {/* Reply to (KEPT from OLD) */}
            {message.replyTo && (
              <div className="border-l-2 border-primary pl-2 mb-1 text-xs opacity-70">
                <p className="truncate">↩️ {message.replyTo.content}</p>
              </div>
            )}

            {/* Forwarded indicator (NEW FEATURE) */}
            {message.metadata?.isForwarded && (
              <div className="text-xs opacity-50 mb-1 flex items-center gap-1">
                <span>↗️</span>
                <span>Forwarded</span>
              </div>
            )}

            {renderContent()}

            <div className="flex items-center justify-end gap-2 mt-1 flex-wrap">
              {isStarred && <FiStar size={12} className="text-yellow-500" />}
              
              {/* NEW: Edited badge with tooltip */}
              {hasEdited && (
                <span 
                  className="text-xs opacity-50 italic flex items-center gap-1"
                  title={`Edited at ${format(new Date(message.editedAt), 'hh:mm a')}`}
                >
                  <FiClock size={10} />
                  edited
                </span>
              )}
              
              <span className="text-xs opacity-70">{messageTime}</span>
              {getStatusIcon()}
            </div>
          </div>
        </div>

        {/* Hover actions: Star, Reply, Delete (KEPT from OLD with modifications) */}
        {!isSelectionMode && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleStar} 
              className="p-1 text-text-secondary hover:text-yellow-500" 
              title="Star"
            >
              <FiStar size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onReply) onReply(message);
              }}
              className="p-1 text-text-secondary hover:text-primary"
              title="Reply"
            >
              ↩️
            </button>
            {/* Delete button - KEPT from OLD */}
            <button
              onClick={handleDeleteClick}
              className="p-1 text-text-secondary hover:text-red-500"
              title="Delete"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal (KEPT from OLD) */}
      {showDeleteOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-12 p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-text font-semibold">Delete Message</h3>
              <button
                onClick={() => setShowDeleteOptions(false)}
                className="text-text-secondary hover:text-text"
              >
                <FiX size={20} />
              </button>
            </div>
            <p className="text-text-secondary mb-4">Choose an option:</p>
            <div className="space-y-2">
              <button
                onClick={() => handleDeleteOption(false)}
                className="w-full bg-background hover:bg-border-color text-text px-4 py-2 rounded-12 transition text-left"
              >
                Delete for me
              </button>
              {isOwn && (
                <button
                  onClick={() => handleDeleteOption(true)}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-12 transition text-left"
                >
                  Delete for everyone
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageBubble;