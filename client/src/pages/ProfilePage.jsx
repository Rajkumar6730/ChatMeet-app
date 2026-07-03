import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import { FiUser, FiMail, FiPhone, FiEdit2, FiCamera, FiSave, FiX } from 'react-icons/fi';

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
      setSuccess('Profile updated successfully');
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
    // In a real app, upload to server and get URL
    // For now, we'll use a placeholder
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imageUrl = event.target.result;
        const updatedUser = await chatService.updateProfilePicture(imageUrl);
        updateUser(updatedUser);
        setSuccess('Profile picture updated');
      } catch (err) {
        setError(err.message || 'Failed to update picture');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-12 p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-text mb-6">Profile</h1>

          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <img
                src={user.profilePicture || '/default-avatar.png'}
                alt={user.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
              <label
                htmlFor="profile-picture"
                className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-secondary transition"
              >
                <FiCamera className="text-white" />
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                />
              </label>
            </div>
            <h2 className="text-xl font-semibold text-text mt-4">{user.username}</h2>
            <p className="text-text-secondary">{user.status || 'Available'}</p>
          </div>

          {/* Profile Info */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-background border border-border-color rounded-12 py-2 px-4 text-text focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-background border border-border-color rounded-12 py-2 px-4 text-text focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full bg-background border border-border-color rounded-12 py-2 px-4 text-text focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-background border border-border-color rounded-12 py-2 px-4 text-text focus:outline-none focus:border-primary resize-none"
                  placeholder="Tell people about yourself..."
                />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              {success && <div className="text-green-500 text-sm">{success}</div>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-2 rounded-12 transition disabled:opacity-50"
                >
                  <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
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
                    setSuccess('');
                  }}
                  className="flex items-center gap-2 bg-border-color hover:bg-card text-text px-6 py-2 rounded-12 transition"
                >
                  <FiX /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border-color">
                <span className="text-text-secondary">Username</span>
                <span className="text-text">{user.username}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border-color">
                <span className="text-text-secondary">Email</span>
                <span className="text-text">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border-color">
                <span className="text-text-secondary">Phone</span>
                <span className="text-text">{user.phoneNumber}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border-color">
                <span className="text-text-secondary">Bio</span>
                <span className="text-text">{user.bio || 'Not set'}</span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-2 rounded-12 transition"
              >
                <FiEdit2 /> Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;