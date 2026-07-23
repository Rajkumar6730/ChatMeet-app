import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import { FiEdit2, FiCamera, FiSave, FiX } from 'react-icons/fi';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const updatedUser = await chatService.updateProfile(formData);
      updateUser(updatedUser);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // In a production app, upload to a server endpoint here.
    // For demo/UI showcase, we convert to base64.
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imageUrl = event.target.result;
        const updatedUser = await chatService.updateProfilePicture(imageUrl);
        updateUser(updatedUser);
        setSuccess('Profile picture updated!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message || 'Failed to update picture');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <div className="h-full w-full overflow-y-auto bg-background p-4 md:p-8 font-inter">
      <div className="max-w-3xl mx-auto mt-4 md:mt-8">
        
        {/* Header Section */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-text mb-2">My Profile</h1>
          <p className="text-text-secondary text-sm md:text-base">Manage your personal information and profile appearance.</p>
        </div>

        <div className="bg-card rounded-2xl p-6 md:p-10 shadow-card border border-border-color/50 transition-all duration-300">
          
          {/* Top Section: Avatar & Basic Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 pb-10 border-b border-border-color">
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-primary to-blue-500 shadow-lg">
                <img
                  src={user.profilePicture || '/default-avatar.png'}
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover border-4 border-card bg-card"
                />
              </div>
              <label
                htmlFor="profile-picture"
                className="absolute bottom-2 right-2 p-3 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:bg-secondary hover:scale-110 active:scale-95 transition-all duration-200"
                title="Update Profile Picture"
              >
                <FiCamera size={20} />
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                />
              </label>
            </div>
            
            <div className="text-center md:text-left flex-1 mt-2">
              <h2 className="text-2xl font-bold text-text mb-1">{user.username}</h2>
              <p className="text-primary font-medium mb-3">{user.status || 'Available'}</p>
              <p className="text-text-secondary text-sm leading-relaxed max-w-md">
                {user.bio || 'Hello there! I am using MessageMate.'}
              </p>
            </div>
          </div>

          {/* Form / Details Section */}
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text">Personal Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-primary hover:text-secondary font-medium transition-colors"
                >
                  <FiEdit2 size={16} /> Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-input-bg border border-border-color rounded-xl py-3 px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner-soft"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-input-bg border border-border-color rounded-xl py-3 px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner-soft"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full bg-input-bg border border-border-color rounded-xl py-3 px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner-soft"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    className="w-full bg-input-bg border border-border-color rounded-xl py-3 px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-inner-soft"
                    placeholder="Tell people about yourself..."
                  />
                </div>

                {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}
                {success && <div className="text-primary text-sm bg-primary/10 p-3 rounded-lg border border-primary/20">{success}</div>}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md active:scale-[0.98] disabled:opacity-70"
                  >
                    <FiSave size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        username: user.username,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        bio: user.bio || '',
                      });
                      setError('');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-input-bg hover:bg-border-color text-text px-6 py-3 rounded-xl font-medium transition-all active:scale-[0.98]"
                  >
                    <FiX size={18} /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-0 bg-input-bg rounded-xl border border-border-color overflow-hidden animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border-color hover:bg-white/5 transition-colors">
                  <span className="text-text-secondary text-sm sm:text-base mb-1 sm:mb-0">Username</span>
                  <span className="text-text font-medium">{user.username}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border-color hover:bg-white/5 transition-colors">
                  <span className="text-text-secondary text-sm sm:text-base mb-1 sm:mb-0">Email</span>
                  <span className="text-text font-medium truncate max-w-full sm:max-w-xs">{user.email}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border-color hover:bg-white/5 transition-colors">
                  <span className="text-text-secondary text-sm sm:text-base mb-1 sm:mb-0">Phone</span>
                  <span className="text-text font-medium">{user.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between p-4 hover:bg-white/5 transition-colors">
                  <span className="text-text-secondary text-sm sm:text-base mb-1 sm:mb-0 whitespace-nowrap mr-4">Bio</span>
                  <span className="text-text font-medium sm:text-right break-words">{user.bio || 'Not set'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;