import React, { useState, useRef } from 'react';
import { FiUpload, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';

const WALLPAPER_CATEGORIES = {
  'Solid Colors': [
    { id: 'solid-1', value: '#0B141A', label: 'Dark Default' },
    { id: 'solid-2', value: '#F0F2F5', label: 'Light Default' },
    { id: 'solid-3', value: '#128C7E', label: 'WhatsApp Green' },
    { id: 'solid-4', value: '#1A5276', label: 'Deep Blue' },
    { id: 'solid-5', value: '#4A235A', label: 'Dark Purple' },
    { id: 'solid-6', value: '#641E16', label: 'Dark Red' },
  ],
  'Gradient Backgrounds': [
    { id: 'grad-1', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Purple' },
    { id: 'grad-2', value: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)', label: 'Blue Gradient' },
    { id: 'grad-3', value: 'linear-gradient(to right, #434343 0%, black 100%)', label: 'Dark Gradient' },
    { id: 'grad-4', value: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', label: 'Warm Sunset' },
  ],
  'Images': [
    { id: 'img-nature', value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000', label: 'Nature' },
    { id: 'img-mountains', value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000', label: 'Mountains' },
    { id: 'img-ocean', value: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=1000', label: 'Ocean' },
    { id: 'img-minimal', value: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=1000', label: 'Minimal' },
    { id: 'img-glass', value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000', label: 'Glass' },
    { id: 'img-blur', value: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=1000', label: 'Blur' },
    { id: 'img-abstract', value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000', label: 'Abstract' },
    { id: 'img-modern', value: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=1000', label: 'Modern' },
  ]
};

const WallpaperSettings = ({ currentTheme, onSettingsSaved }) => {
  const { updateTheme, uploadWallpaper } = useAuth();
  
  // Local state for instant preview in settings page
  const [theme, setTheme] = useState({
    ...currentTheme,
    wallpaperBlur: currentTheme?.wallpaperBlur || 0,
    wallpaperBrightness: currentTheme?.wallpaperBrightness ?? 100,
    wallpaperOpacity: currentTheme?.wallpaperOpacity || 'none',
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Images');

  // Handle value change and instantly update local theme state and global preview
  const handleWallpaperSelect = (item, type) => {
    const newTheme = {
      ...theme,
      wallpaper: item.value,
      wallpaperType: type, // 'solid', 'gradient', 'image'
      wallpaperLabel: item.label,
      wallpaperOpacity: type === 'image' ? 'light' : theme.wallpaperOpacity
    };
    setTheme(newTheme);
    if (updateTheme) updateTheme(newTheme);
  };

  const handleFilterChange = (key, value) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
    if (updateTheme) updateTheme(newTheme);
  };

  const handleCustomUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(50);

    try {
      const response = await uploadWallpaper(file);
      if (response && response.success) {
        setUploadProgress(100);
        const newTheme = {
          ...theme,
          wallpaper: response.url,
          wallpaperType: 'image',
          wallpaperLabel: 'Custom Upload',
          wallpaperOpacity: 'light' // Auto overlay
        };
        setTheme(newTheme);
        // updateTheme is already called inside uploadWallpaper, but calling it here again ensures local state sync if needed.
        if (updateTheme) updateTheme(newTheme);
      } else {
        alert(response?.error || 'Failed to upload wallpaper');
      }
    } catch (err) {
      alert('Failed to upload wallpaper');
    } finally {
      setPreviewImage(null);
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleRemoveWallpaper = () => {
    const newTheme = {
      ...theme,
      wallpaper: null,
      wallpaperType: 'solid',
      wallpaperLabel: 'Default',
      wallpaperOpacity: 'none'
    };
    setTheme(newTheme);
    if (updateTheme) updateTheme(newTheme);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (chatService.updateTheme) {
        await chatService.updateTheme(theme);
      }
      if (updateTheme) {
        updateTheme(theme);
      }
      if (onSettingsSaved) {
        onSettingsSaved('Wallpaper settings saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save wallpaper settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Preview renderer for the background
  const renderPreviewBackground = () => {
    if (!theme.wallpaper) return { backgroundColor: '#0B141A' }; // Default fallback
    if (theme.wallpaperType === 'solid') return { backgroundColor: theme.wallpaper };
    if (theme.wallpaperType === 'gradient') return { backgroundImage: theme.wallpaper };
    return { backgroundImage: `url(${theme.wallpaper})` };
  };

  return (
    <div className="space-y-6">
      {/* Live Preview Area */}
      <div className="border border-border-color rounded-12 p-4 bg-background relative overflow-hidden h-48 flex items-center justify-center shadow-inner">
        {/* Background Layer */}
        <div 
          className="absolute inset-0 z-0 transition-all duration-300"
          style={{
            ...renderPreviewBackground(),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${theme.wallpaperBlur || 0}px) brightness(${theme.wallpaperBrightness ?? 100}%)`,
          }}
        />
        {/* Overlay Layer */}
        {(theme.wallpaperOpacity && theme.wallpaperOpacity !== 'none') && (
          <div 
            className="absolute inset-0 z-10 transition-all duration-300"
            style={{
              backgroundColor: 
                theme.wallpaperOpacity === 'light' ? 'rgba(0,0,0,0.2)' : 
                theme.wallpaperOpacity === 'medium' ? 'rgba(0,0,0,0.5)' : 
                theme.wallpaperOpacity === 'dark' ? 'rgba(0,0,0,0.8)' : 'transparent'
            }}
          />
        )}
        
        {/* Dummy Messages */}
        <div className="relative z-20 w-full max-w-sm flex flex-col gap-2 p-2">
          <div className="bg-[#202C33] text-[#E9EDEF] p-2 rounded-lg self-start max-w-[80%] text-sm shadow-md glass-effect">
            Hello! How does this wallpaper look?
          </div>
          <div className="bg-[#005C4B] text-[#E9EDEF] p-2 rounded-lg self-end max-w-[80%] text-sm shadow-md glass-effect">
            Looks great! Very readable.
          </div>
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Object.keys(WALLPAPER_CATEGORIES).map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${
                activeCategory === category 
                ? 'bg-primary text-white' 
                : 'bg-card text-text-secondary hover:bg-border-color'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Wallpaper Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          {WALLPAPER_CATEGORIES[activeCategory].map((item) => (
            <button
              key={item.id}
              onClick={() => handleWallpaperSelect(item, activeCategory === 'Images' ? 'image' : activeCategory === 'Solid Colors' ? 'solid' : 'gradient')}
              className={`relative h-24 rounded-12 overflow-hidden border-2 transition ${
                theme.wallpaper === item.value
                  ? 'border-primary'
                  : 'border-border-color hover:border-primary'
              }`}
              style={
                activeCategory === 'Images' ? { backgroundImage: `url(${item.value})`, backgroundSize: 'cover', backgroundPosition: 'center' } :
                activeCategory === 'Solid Colors' ? { backgroundColor: item.value } :
                { backgroundImage: item.value }
              }
            >
              {theme.wallpaper === item.value && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                  <FiCheck className="text-white drop-shadow-lg" size={24} />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 font-medium truncate px-1">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Upload */}
      <div className="flex flex-col gap-2 p-4 bg-card rounded-12 border border-border-color">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-text">Custom Wallpaper</span>
          {theme.wallpaper && (
             <button onClick={handleRemoveWallpaper} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1">
               <FiTrash2 size={14} /> Remove
             </button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-background border border-border-color rounded-12 text-text hover:bg-border-color transition disabled:opacity-50"
            disabled={isUploading}
          >
            <FiUpload size={18} />
            {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload from Device (jpg, png, webp)'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleCustomUpload}
            className="hidden"
          />
        </div>
        {previewImage && (
          <div className="mt-2 relative w-24 h-24">
            <img src={previewImage} alt="Preview" className="w-full h-full object-cover rounded-8 border border-border-color" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white" />
            </div>
          </div>
        )}
      </div>

      {/* Visual Adjustments */}
      <div className="space-y-4 p-4 bg-card rounded-12 border border-border-color">
        <h4 className="text-sm font-semibold text-text mb-2">Visual Adjustments</h4>
        
        <div>
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <label>Background Blur</label>
            <span>{theme.wallpaperBlur || 0}px</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="20" 
            value={theme.wallpaperBlur || 0}
            onChange={(e) => handleFilterChange('wallpaperBlur', Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <label>Background Brightness</label>
            <span>{theme.wallpaperBrightness ?? 100}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={theme.wallpaperBrightness ?? 100}
            onChange={(e) => handleFilterChange('wallpaperBrightness', Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="text-xs text-text-secondary mb-1 block">Overlay Opacity (Improves text readability)</label>
          <div className="flex gap-2">
            {['none', 'light', 'medium', 'dark'].map(opacity => (
              <button
                key={opacity}
                onClick={() => handleFilterChange('wallpaperOpacity', opacity)}
                className={`flex-1 py-1 text-sm rounded border transition ${
                  (theme.wallpaperOpacity || 'none') === opacity
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border-color text-text-secondary hover:border-primary'
                }`}
              >
                {opacity.charAt(0).toUpperCase() + opacity.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-primary hover:bg-secondary text-white py-3 rounded-12 transition font-medium text-lg flex justify-center items-center gap-2"
      >
        {loading ? (
          <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" /> Saving...</>
        ) : (
          <><FiCheck /> Apply Chat Wallpaper</>
        )}
      </button>

    </div>
  );
};

export default WallpaperSettings;
