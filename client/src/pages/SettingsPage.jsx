import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import { FiMoon, FiSun, FiBell, FiLock, FiLogOut, FiSave, FiCheck, FiSettings, FiUser } from 'react-icons/fi';
import WallpaperSettings from '../components/chat/WallpaperSettings';

const SettingsPage = () => {
  const { user, logout, updateTheme } = useAuth();
  const [settings, setSettings] = useState(user?.settings || {});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings);
    }
  }, [user]);

  const handleChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleFontChange = (font) => {
    handleChange('theme', 'fontFamily', font);
    if (updateTheme) {
      updateTheme({ fontFamily: font });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const updatedSettings = await chatService.updateSettings(settings);
      setSettings(updatedSettings);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  if (!user) return null;

  return (
    <div className="h-full w-full overflow-y-auto bg-background p-4 md:p-8 font-inter">
      <div className="max-w-3xl mx-auto mt-4 md:mt-8">
        
        {/* Header Section */}
        <div className="mb-8 text-center md:text-left flex items-center gap-3 justify-center md:justify-start">
          <FiSettings className="text-primary text-3xl hidden md:block" />
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Settings</h1>
            <p className="text-text-secondary text-sm md:text-base">Customize your chat experience and privacy.</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 md:p-10 shadow-card border border-border-color/50 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Theme & Display */}
            <section>
              <div className="flex items-center gap-2 border-b border-border-color pb-3 mb-6">
                <FiSun className="text-text-secondary text-lg" />
                <h3 className="text-xl font-semibold text-text">Theme & Display</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  type="button"
                  onClick={() => handleChange('theme', 'theme', 'dark')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                    settings.theme?.theme === 'dark'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-color hover:border-primary/50 text-text-secondary hover:text-text'
                  }`}
                >
                  <FiMoon size={20} /> <span className="font-medium">Dark Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('theme', 'theme', 'light')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                    settings.theme?.theme === 'light'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-color hover:border-primary/50 text-text-secondary hover:text-text'
                  }`}
                >
                  <FiSun size={20} /> <span className="font-medium">Light Mode</span>
                </button>
              </div>

              {/* Typography Sub-section */}
              <div className="bg-input-bg p-5 rounded-xl border border-border-color mb-8">
                <h4 className="text-lg font-semibold text-text mb-4">Typography (Font Style)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Inter', 'Poppins', 'Roboto', 'Open Sans', 'Nunito', 'Lato', 'Montserrat'].map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => handleFontChange(font)}
                      className={`py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${
                        (settings.theme?.fontFamily || 'Inter') === font
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border-color hover:border-primary/50 text-text-secondary hover:text-text'
                      }`}
                      style={{ fontFamily: `"${font}", sans-serif` }}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallpaper Sub-section */}
              <div className="bg-input-bg p-5 rounded-xl border border-border-color">
                <h4 className="text-lg font-semibold text-text mb-4">Chat Wallpaper</h4>
                <WallpaperSettings 
                  currentTheme={settings.theme || user?.theme || {}} 
                  onSettingsSaved={(msg) => {
                    setSuccess(msg);
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                />
              </div>
            </section>

            {/* Notifications */}
            <section>
              <div className="flex items-center gap-2 border-b border-border-color pb-3 mb-6">
                <FiBell className="text-text-secondary text-lg" />
                <h3 className="text-xl font-semibold text-text">Notifications</h3>
              </div>
              <div className="bg-input-bg rounded-xl border border-border-color overflow-hidden">
                <label className="flex items-center justify-between p-4 border-b border-border-color hover:bg-white/5 cursor-pointer transition-colors">
                  <span className="text-text font-medium">Message notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.message ?? true}
                    onChange={(e) => handleChange('notifications', 'message', e.target.checked)}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-4 border-b border-border-color hover:bg-white/5 cursor-pointer transition-colors">
                  <span className="text-text font-medium">Group notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.group ?? true}
                    onChange={(e) => handleChange('notifications', 'group', e.target.checked)}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer transition-colors">
                  <span className="text-text font-medium">Call notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.call ?? true}
                    onChange={(e) => handleChange('notifications', 'call', e.target.checked)}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>
              </div>
            </section>

            {/* Privacy */}
            <section>
              <div className="flex items-center gap-2 border-b border-border-color pb-3 mb-6">
                <FiLock className="text-text-secondary text-lg" />
                <h3 className="text-xl font-semibold text-text">Privacy</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-text-secondary text-sm font-medium">Last Seen</label>
                  <select
                    value={settings.privacy?.lastSeen || 'everyone'}
                    onChange={(e) => handleChange('privacy', 'lastSeen', e.target.value)}
                    className="w-full bg-input-bg border border-border-color rounded-xl py-3 px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner-soft"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="none">Nobody</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-text-secondary text-sm font-medium">Profile Photo</label>
                  <select
                    value={settings.privacy?.profilePhoto || 'everyone'}
                    onChange={(e) => handleChange('privacy', 'profilePhoto', e.target.value)}
                    className="w-full bg-input-bg border border-border-color rounded-xl py-3 px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner-soft"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="none">Nobody</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-text-secondary text-sm font-medium">Status</label>
                  <select
                    value={settings.privacy?.status || 'everyone'}
                    onChange={(e) => handleChange('privacy', 'status', e.target.value)}
                    className="w-full bg-input-bg border border-border-color rounded-xl py-3 px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner-soft"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="none">Nobody</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Error and Success Messages */}
            {error && <div className="text-red-500 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</div>}
            {success && <div className="text-primary text-sm bg-primary/10 p-4 rounded-xl border border-primary/20 flex items-center gap-2"><FiCheck /> {success}</div>}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border-color">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3.5 rounded-xl font-medium transition-all shadow-md active:scale-[0.98] disabled:opacity-70"
              >
                <FiSave size={18} /> {loading ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 flex justify-center items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3.5 rounded-xl font-medium transition-all active:scale-[0.98]"
              >
                <FiLogOut size={18} /> Logout
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;