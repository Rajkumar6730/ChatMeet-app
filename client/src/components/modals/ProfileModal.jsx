import React from 'react';
import { FiX, FiEdit2 } from 'react-icons/fi';

const ProfileModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-12 shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-xl font-semibold text-text">Profile</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="relative">
            <img
              src={user.profilePicture || '/default-avatar.png'}
              alt={user.username}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary"
            />
            <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full hover:bg-secondary transition">
              <FiEdit2 className="text-white" size={14} />
            </button>
          </div>
          <h3 className="text-xl font-semibold text-text mt-4">{user.username}</h3>
          <p className="text-text-secondary">{user.email}</p>
          <p className="text-text-secondary text-sm mt-1">{user.phoneNumber}</p>
          {user.bio && <p className="text-text-secondary text-sm mt-2 text-center">{user.bio}</p>}
          <div className="w-full mt-6 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border-color">
              <span className="text-text-secondary">Status</span>
              <span className="text-text capitalize">{user.status || 'offline'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-color">
              <span className="text-text-secondary">Last Seen</span>
              <span className="text-text">{user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-text-secondary">Member Since</span>
              <span className="text-text">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;