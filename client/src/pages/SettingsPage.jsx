import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import { FiMoon, FiSun, FiBell, FiLock, FiUser, FiLogOut, FiSave, FiCheck } from 'react-icons/fi';

const SettingsPage = () => {
  const { user, logout } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const updatedSettings = await chatService.updateSettings(settings);
      setSettings(updatedSettings);
      setSuccess('Settings saved successfully');
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
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-12 p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-text mb-6">Settings</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Theme */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-3">Theme</h3>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleChange('theme', 'theme', 'dark')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-12 border transition ${
                    settings.theme?.theme === 'dark'
                      ? 'border-primary bg-primary/10'
                      : 'border-border-color hover:border-primary'
                  }`}
                >
                  <FiMoon /> Dark
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('theme', 'theme', 'light')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-12 border transition ${
                    settings.theme?.theme === 'light'
                      ? 'border-primary bg-primary/10'
                      : 'border-border-color hover:border-primary'
                  }`}
                >
                  <FiSun /> Light
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-3">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Message notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.message ?? true}
                    onChange={(e) => handleChange('notifications', 'message', e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Group notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.group ?? true}
                    onChange={(e) => handleChange('notifications', 'group', e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Call notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.call ?? true}
                    onChange={(e) => handleChange('notifications', 'call', e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-3">Privacy</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Last Seen</label>
                  <select
                    value={settings.privacy?.lastSeen || 'everyone'}
                    onChange={(e) => handleChange('privacy', 'lastSeen', e.target.value)}
                    className="w-full bg-background border border-border-color rounded-12 py-2 px-4 text-text focus:outline-none focus:border-primary"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">Contacts</option>
                    <option value="none">Nobody</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Profile Photo</label>
                  <select
                    value={settings.privacy?.profilePhoto || 'everyone'}
                    onChange={(e) => handleChange('privacy', 'profilePhoto', e.target.value)}
                    className="w-full bg-background border border-border-color rounded-12 py-2 px-4 text-text focus:outline-none focus:border-primary"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">Contacts</option>
                    <option value="none">Nobody</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Status</label>
                  <select
                    value={settings.privacy?.status || 'everyone'}
                    onChange={(e) => handleChange('privacy', 'status', e.target.value)}
                    className="w-full bg-background border border-border-color rounded-12 py-2 px-4 text-text focus:outline-none focus:border-primary"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">Contacts</option>
                    <option value="none">Nobody</option>
                  </select>
                </div>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-500 text-sm flex items-center gap-2"><FiCheck /> {success}</div>}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-2 rounded-12 transition disabled:opacity-50"
              >
                <FiSave /> {loading ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-12 transition"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;