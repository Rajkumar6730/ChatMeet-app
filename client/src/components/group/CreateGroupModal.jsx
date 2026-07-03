import React, { useState, useEffect } from 'react';
import { FiX, FiUserPlus, FiSearch } from 'react-icons/fi';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delay = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query) => {
    try {
      const results = await chatService.searchUsers(query);
      // Filter out already selected and current user
      const filtered = results.filter(
        u => u._id !== user._id && !selectedUsers.some(s => s._id === u._id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search users error:', error);
    }
  };

  const toggleUser = (userToToggle) => {
    setSelectedUsers(prev =>
      prev.some(u => u._id === userToToggle._id)
        ? prev.filter(u => u._id !== userToToggle._id)
        : [...prev, userToToggle]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Select at least one member');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const memberIds = selectedUsers.map(u => u._id);
      const group = await chatService.createGroup({
        name: groupName.trim(),
        description: description.trim(),
        members: memberIds,
      });
      onGroupCreated(group);
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGroupName('');
    setDescription('');
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    setStep(1);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-12 shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-xl font-semibold text-text">Create Group</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className={step === 1 ? 'text-primary font-semibold' : ''}>1. Group Info</span>
            <span>→</span>
            <span className={step === 2 ? 'text-primary font-semibold' : ''}>2. Add Members</span>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-1">Group Name *</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-background border border-border-color rounded-12 py-2 px-4 text-text focus:outline-none focus:border-primary"
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-background border border-border-color rounded-12 py-2 px-4 text-text focus:outline-none focus:border-primary resize-none"
                  placeholder="Optional group description"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-primary hover:bg-secondary text-white py-2 rounded-12 transition"
              >
                Next: Add Members
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border-color rounded-12 py-2 pl-10 pr-4 text-text focus:outline-none focus:border-primary"
                    placeholder="Search users..."
                  />
                </div>
              </div>

              {/* Selected users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((u) => (
                    <span
                      key={u._id}
                      className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {u.username}
                      <button
                        onClick={() => toggleUser(u)}
                        className="hover:text-red-500"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search results */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => toggleUser(u)}
                    className="flex items-center gap-3 p-2 hover:bg-background rounded-12 cursor-pointer transition"
                  >
                    <img
                      src={u.profilePicture || '/default-avatar.png'}
                      alt={u.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-text">{u.username}</p>
                      <p className="text-text-secondary text-sm">{u.email}</p>
                    </div>
                    <FiUserPlus className={selectedUsers.some(s => s._id === u._id) ? 'text-primary' : 'text-text-secondary'} />
                  </div>
                ))}
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-border-color hover:bg-card text-text py-2 rounded-12 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading || selectedUsers.length === 0}
                  className="flex-1 bg-primary hover:bg-secondary text-white py-2 rounded-12 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;