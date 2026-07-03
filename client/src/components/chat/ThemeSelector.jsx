// client/src/components/chat/ThemeSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiCheck, FiUpload, FiTrash2, FiImage, FiMoon, FiSun } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';

const ThemeSelector = ({ isOpen, currentTheme, onSave, onClose }) => {
  const { updateTheme } = useAuth();
  const [theme, setTheme] = useState(currentTheme);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // ---- Reset theme when modal opens (NEW FEATURE) ----
  useEffect(() => {
    if (isOpen && currentTheme) {
      setTheme(currentTheme);
      setPreviewImage(null);
      setUploadProgress(0);
    }
  }, [isOpen, currentTheme]);

  if (!isOpen) return null;

  // ---- Theme modes (UPDATED) ----
  const modes = [
    { id: 'dark', label: 'Dark', bg: '#0B141A', text: '#E9EDEF', icon: <FiMoon size={16} /> },
    { id: 'light', label: 'Light', bg: '#FFFFFF', text: '#111B21', icon: <FiSun size={16} /> },
    { id: 'green', label: 'Green', bg: '#128C7E', text: '#FFFFFF', icon: '🌿' },
    { id: 'blue', label: 'Blue', bg: '#1A5276', text: '#FFFFFF', icon: '🌊' },
    { id: 'purple', label: 'Purple', bg: '#4A235A', text: '#FFFFFF', icon: '💜' },
    { id: 'red', label: 'Red', bg: '#641E16', text: '#FFFFFF', icon: '❤️' },
  ];

  // ---- Accent colors (UPDATED) ----
  const colors = [
    '#25D366', '#128C7E', '#34B7F1', '#FF6B6B', 
    '#FFD93D', '#6C5CE7', '#FD79A8', '#00B894',
    '#F39C12', '#E74C3C', '#3498DB', '#2ECC71'
  ];

  // ---- Wallpapers (UPDATED) ----
  const wallpapers = [
    { id: 'default', url: '/wallpapers/default.jpg', label: 'Default' },
    { id: 'light', url: '/wallpapers/light.jpg', label: 'Light' },
    { id: 'night', url: '/wallpapers/night.jpg', label: 'Night' },
    { id: 'forest', url: '/wallpapers/forest.jpg', label: 'Forest' },
    { id: 'ocean', url: '/wallpapers/ocean.jpg', label: 'Ocean' },
    { id: 'mountain', url: '/wallpapers/mountain.jpg', label: 'Mountain' },
  ];

  // ---- Handle mode select (NEW FEATURE) ----
  const handleModeSelect = (modeId) => {
    setTheme(prev => ({ ...prev, mode: modeId }));
  };

  // ---- Handle color select (NEW FEATURE) ----
  const handleColorSelect = (color) => {
    setTheme(prev => ({ 
      ...prev, 
      accentColor: color,
      bubbleColor: color 
    }));
  };

  // ---- Handle wallpaper select (NEW FEATURE) ----
  const handleWallpaperSelect = (wallpaper) => {
    setTheme(prev => ({ 
      ...prev, 
      wallpaper: wallpaper.url,
      wallpaperType: 'image',
      wallpaperLabel: wallpaper.label
    }));
    setPreviewImage(null);
  };

  // ---- Handle wallpaper upload (NEW FEATURE) ----
  const handleWallpaperUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setPreviewImage(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress (NEW FEATURE)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/wallpaper', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      const data = await response.json();
      
      if (data.success) {
        setUploadProgress(100);
        setTimeout(() => {
          setTheme(prev => ({ 
            ...prev, 
            wallpaper: data.data.url,
            wallpaperType: 'image',
            wallpaperLabel: file.name
          }));
          setPreviewImage(null);
          setUploadProgress(0);
        }, 500);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Wallpaper upload error:', err);
      alert('Failed to upload wallpaper: ' + err.message);
      setPreviewImage(null);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Handle remove wallpaper (NEW FEATURE) ----
  const handleRemoveWallpaper = () => {
    setTheme(prev => ({ 
      ...prev, 
      wallpaper: null,
      wallpaperType: 'solid',
      wallpaperLabel: null
    }));
    setPreviewImage(null);
    setUploadProgress(0);
  };

  // ---- Handle save (UPDATED) ----
  const handleSave = async () => {
    try {
      // Save theme via API
      if (chatService.updateTheme) {
        await chatService.updateTheme(theme);
      }
      // Update context
      if (updateTheme) {
        updateTheme(theme);
      }
      onSave(theme);
      onClose();
    } catch (err) {
      console.error('Save theme error:', err);
      alert('Failed to save theme: ' + err.message);
    }
  };

  // ---- Handle reset to defaults (NEW FEATURE) ----
  const handleReset = () => {
    const defaultTheme = {
      mode: 'dark',
      wallpaper: null,
      wallpaperType: 'solid',
      accentColor: '#25D366',
      bubbleColor: '#005C4B'
    };
    setTheme(defaultTheme);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-card rounded-12 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---- Header (UPDATED) ---- */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-text font-semibold text-lg">Chat Theme</h3>
            <p className="text-text-secondary text-sm">Customize your chat appearance</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-text-secondary hover:text-text p-1 rounded-full hover:bg-background transition"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* ---- Mode Selection (NEW FEATURE) ---- */}
          <div>
            <label className="text-text-secondary text-sm block mb-2">Theme Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className={`px-3 py-2 rounded-12 border transition flex items-center justify-center gap-2 ${
                    theme.mode === mode.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border-color hover:border-primary'
                  }`}
                  style={{ 
                    backgroundColor: theme.mode === mode.id ? mode.bg : 'transparent',
                    color: theme.mode === mode.id ? mode.text : 'inherit'
                  }}
                >
                  <span>{mode.icon}</span>
                  <span className="text-sm">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ---- Accent Color (UPDATED) ---- */}
          <div>
            <label className="text-text-secondary text-sm block mb-2">Accent Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                    theme.accentColor === color
                      ? 'border-primary scale-110'
                      : 'border-transparent hover:border-primary hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {theme.accentColor === color && <FiCheck className="text-white" size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* ---- Wallpaper (UPDATED) ---- */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-text-secondary text-sm">Wallpaper</label>
              {theme.wallpaper && (
                <button
                  onClick={handleRemoveWallpaper}
                  className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                >
                  <FiTrash2 size={12} />
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-2">
              {wallpapers.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => handleWallpaperSelect(wp)}
                  className={`relative h-16 rounded-12 overflow-hidden border-2 transition ${
                    theme.wallpaper === wp.url
                      ? 'border-primary'
                      : 'border-border-color hover:border-primary'
                  }`}
                  style={{ 
                    backgroundImage: `url(${wp.url})`, 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {theme.wallpaper === wp.url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <FiCheck className="text-white drop-shadow-lg" size={16} />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                    {wp.label}
                  </div>
                </button>
              ))}
            </div>

            {/* ---- Upload custom wallpaper (NEW FEATURE) ---- */}
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-background border border-border-color rounded-12 text-text hover:bg-border-color transition disabled:opacity-50"
                disabled={isUploading}
              >
                <FiUpload size={16} />
                {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Custom'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleWallpaperUpload}
                className="hidden"
              />
            </div>

            {/* ---- Upload progress (NEW FEATURE) ---- */}
            {isUploading && (
              <div className="mt-2">
                <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-text-secondary text-xs mt-1">Uploading wallpaper...</p>
              </div>
            )}

            {/* ---- Preview image (NEW FEATURE) ---- */}
            {previewImage && (
              <div className="mt-2 relative">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-24 object-cover rounded-12 border border-border-color"
                />
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ---- Actions (UPDATED) ---- */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-background border border-border-color text-text rounded-12 hover:bg-border-color transition"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-secondary text-white py-2 rounded-12 transition"
            >
              Apply Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;