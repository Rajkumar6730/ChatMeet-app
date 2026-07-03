// client/src/components/chat/MessageInput.jsx
import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { FiSmile, FiPaperclip, FiCamera, FiMic, FiSend, FiSquare, FiX } from 'react-icons/fi';
import EmojiPicker from './EmojiPicker';

const MessageInput = forwardRef(({ 
  onSendMessage, 
  onTyping, 
  onAttachmentClick, 
  onCameraClick,
  disabled = false, 
  isBlocked = false,
  replyTo = null,
  chatId = null,
  onClearReply = null,
}, ref) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // ---- Image preview state (NEW FEATURE) ----
  const [imagePreview, setImagePreview] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Expose methods to parent (KEPT from OLD) ---
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => setMessage(''),
    handleFileSelected: handleFileSelected,
    handleCameraClick: handleCameraClick,
  }));

  // --- Check if input should be disabled (KEPT from OLD) ---
  const isDisabled = disabled || isBlocked || isRecording || isUploading;

  // ---- Handle message change (KEPT from OLD) ----
  const handleChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    } else if (value.length === 0 && isTyping) {
      setIsTyping(false);
      onTyping(false);
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 2000);
    }
  };

  // ---- Handle submit (KEPT from OLD) ----
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
      onTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // ---- Handle key down (KEPT from OLD) ----
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // ---- Handle emoji select (KEPT from OLD) ----
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // ---- Voice Recording (KEPT from OLD) ----
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSendAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, `voice-${Date.now()}.webm`);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        onSendMessage('', 'audio', {
          url: data.data.url,
          fileName: data.data.fileName,
          fileSize: data.data.fileSize,
          mimeType: data.data.mimeType,
          duration: recordingTime
        });
      } else {
        console.error('Upload failed:', data.message);
      }
    } catch (error) {
      console.error('Audio upload error:', error);
    }
  };

  // ---- Upload file with caption (NEW FEATURE) ----
  const uploadFileWithCaption = async (file, caption) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        onSendMessage(caption || '', 'image', {
          url: data.data.url,
          fileName: data.data.fileName,
          fileSize: data.data.fileSize,
          mimeType: data.data.mimeType,
          caption: caption || ''
        });
        // Clear preview state
        setImagePreview(null);
        setPendingFile(null);
        setImageCaption('');
      } else {
        console.error('Upload failed:', data.message);
        alert('Failed to upload image. Please try again.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Handle file selected (UPDATED with preview) ----
  const handleFileSelected = async (file, type) => {
    if (type === 'image') {
      // Show preview with caption input
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setPendingFile(file);
        setImageCaption('');
        // Focus caption input after render
        setTimeout(() => {
          const captionInput = document.getElementById('image-caption-input');
          if (captionInput) captionInput.focus();
        }, 100);
      };
      reader.readAsDataURL(file);
      return;
    }
    
    // For non-image files, upload directly
    await uploadFile(file, type);
  };

  // ---- Upload non-image file (NEW FEATURE) ----
  const uploadFile = async (file, type) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        onSendMessage('', type, {
          url: data.data.url,
          fileName: data.data.fileName,
          fileSize: data.data.fileSize,
          mimeType: data.data.mimeType
        });
      } else {
        console.error('Upload failed:', data.message);
        alert('Failed to upload file. Please try again.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Handle camera click (UPDATED) ----
  const handleCameraClick = () => {
    if (onCameraClick) {
      onCameraClick();
    } else {
      // Fallback: file input with capture
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  // ---- Handle file input change (NEW FEATURE) ----
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelected(file, 'image');
      e.target.value = ''; // Reset input
    }
  };

  // ---- Cancel image preview (NEW FEATURE) ----
  const cancelImagePreview = () => {
    setImagePreview(null);
    setPendingFile(null);
    setImageCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-input-bg border-t border-border-color px-4 py-3 flex flex-col flex-shrink-0">
      {/* ---- Image Preview (NEW FEATURE) ---- */}
      {imagePreview && (
        <div className="bg-card rounded-12 p-4 mb-2 border border-border-color animate-slideUp">
          <div className="flex gap-3">
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded-8" 
              />
              <button
                onClick={cancelImagePreview}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition"
                disabled={isUploading}
              >
                <FiX size={14} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <input
                id="image-caption-input"
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (pendingFile) {
                      uploadFileWithCaption(pendingFile, imageCaption);
                    }
                  }
                  if (e.key === 'Escape') {
                    cancelImagePreview();
                  }
                }}
                placeholder="Add a caption..."
                className="w-full bg-background border border-border-color rounded-8 px-3 py-2 text-text placeholder-text-secondary focus:outline-none focus:border-primary"
                disabled={isUploading}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    if (pendingFile) {
                      uploadFileWithCaption(pendingFile, imageCaption);
                    }
                  }}
                  disabled={isUploading}
                  className="px-3 py-1 bg-primary text-white rounded-8 text-sm hover:bg-secondary transition disabled:opacity-50 flex items-center gap-1"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white" />
                      Sending...
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
                <button
                  onClick={cancelImagePreview}
                  className="px-3 py-1 bg-background text-text rounded-8 text-sm hover:bg-border-color transition"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                {pendingFile && (
                  <span className="text-xs text-text-secondary flex items-center ml-2">
                    {(pendingFile.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Input Row (KEPT from OLD) ---- */}
      <div className="flex items-end gap-2">
        {/* Emoji Picker (KEPT from OLD) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
            disabled={isDisabled}
          >
            <FiSmile size={22} />
          </button>
          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={handleEmojiSelect}
          />
        </div>

        {/* Attachment (KEPT from OLD) */}
        <button
          type="button"
          onClick={onAttachmentClick}
          className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
          disabled={isDisabled}
        >
          <FiPaperclip size={22} />
        </button>

        {/* Camera (UPDATED) */}
        <button
          type="button"
          onClick={handleCameraClick}
          className="p-2 text-text-secondary hover:text-text hover:bg-card rounded-full transition"
          disabled={isDisabled}
        >
          <FiCamera size={22} />
        </button>

        {/* Hidden file input for camera (NEW FEATURE) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Input (KEPT from OLD) */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isBlocked ? 'You are blocked' : isRecording ? 'Recording...' : isUploading ? 'Uploading...' : 'Type a message...'}
            rows="1"
            className="flex-1 bg-background border border-border-color rounded-12 px-4 py-2 text-text placeholder-text-secondary resize-none focus:outline-none focus:border-primary transition min-h-[42px] max-h-32"
            disabled={isDisabled}
          />
          <button
            type="submit"
            disabled={!message.trim() || isDisabled}
            className="p-2 bg-primary hover:bg-secondary rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed text-white flex-shrink-0"
          >
            <FiSend size={22} />
          </button>
        </form>

        {/* Voice Recording (KEPT from OLD) */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-full transition flex-shrink-0 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'text-text-secondary hover:text-text hover:bg-card'
          }`}
          disabled={isDisabled && !isRecording}
        >
          {isRecording ? <FiSquare size={22} /> : <FiMic size={22} />}
        </button>
        {isRecording && (
          <span className="text-xs text-red-500 ml-1 min-w-[40px]">
            {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* ---- Reply Preview (NEW FEATURE) ---- */}
      {replyTo && (
        <div className="mt-2 bg-background/50 rounded-8 p-2 flex items-center justify-between border-l-2 border-primary">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-secondary">Replying to {replyTo.sender?.username || 'Unknown'}</p>
            <p className="text-sm text-text truncate">{replyTo.content || '📎 Media'}</p>
          </div>
          <button
            onClick={() => {
              if (onClearReply) onClearReply();
            }}
            className="ml-2 p-1 text-text-secondary hover:text-text rounded-full hover:bg-background transition"
          >
            <FiX size={16} />
          </button>
        </div>
      )}
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;