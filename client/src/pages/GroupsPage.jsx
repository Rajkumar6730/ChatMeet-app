// client/src/pages/GroupsPage.jsx (Fully Updated)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { chatService } from '../services/chatService';
import GroupList from '../components/group/GroupList';
import GroupChat from '../components/group/GroupChat';
import CreateGroupModal from '../components/group/CreateGroupModal';
import SearchBar from '../components/common/SearchBar';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { FiUsers, FiPlus, FiUserPlus } from 'react-icons/fi';

const GroupsPage = () => {
  const { isConnected, on, off, emit } = useSocket();
  
  // ---- State (KEPT from OLD with additions) ----
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, favorites
  const [onlineMembers, setOnlineMembers] = useState({}); // NEW
  const [typingUsers, setTypingUsers] = useState({}); // NEW

  // ---- Fetch groups (KEPT from OLD) ----
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await chatService.getGroups();
      setGroups(data);
      
      // Join group rooms for real-time updates (NEW)
      if (isConnected) {
        data.forEach(group => {
          emit('joinGroupRoom', { groupId: group.id });
        });
      }
    } catch (error) {
      console.error('Fetch groups error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---- Initial fetch (KEPT from OLD) ----
  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Socket listeners for group events (NEW FEATURE) ----
  useEffect(() => {
    if (!isConnected) return;

    // Handle online members update
    const handleGroupOnlineMembers = (data) => {
      setOnlineMembers(prev => ({
        ...prev,
        [data.groupId]: data.onlineMembers
      }));
    };

    // Handle group typing
    const handleGroupTyping = (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.groupId]: {
          ...prev[data.groupId],
          [data.userId]: true
        }
      }));
      
      // Auto-clear typing after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [data.groupId]: {
            ...prev[data.groupId],
            [data.userId]: false
          }
        }));
      }, 3000);
    };

    const handleGroupStopTyping = (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.groupId]: {
          ...prev[data.groupId],
          [data.userId]: false
        }
      }));
    };

    // Handle new group message
    const handleNewMessage = (data) => {
      if (data.groupId) {
        setGroups(prev => prev.map(group => {
          if (group.id === data.groupId) {
            return {
              ...group,
              lastMessage: data.message,
              lastMessageTime: data.message?.createdAt || new Date()
            };
          }
          return group;
        }));
      }
    };

    // Handle group created
    const handleGroupCreated = () => {
      fetchGroups();
    };

    // Handle group updated
    const handleGroupUpdated = () => {
      fetchGroups();
    };

    // Handle group deleted
    const handleGroupDeleted = (data) => {
      setGroups(prev => prev.filter(group => group.id !== data.groupId));
      if (selectedGroup?.id === data.groupId) {
        setSelectedGroup(null);
      }
    };

    on('groupOnlineMembers', handleGroupOnlineMembers);
    on('groupTyping', handleGroupTyping);
    on('groupStopTyping', handleGroupStopTyping);
    on('newMessage', handleNewMessage);
    on('groupCreated', handleGroupCreated);
    on('groupUpdated', handleGroupUpdated);
    on('groupDeleted', handleGroupDeleted);

    return () => {
      off('groupOnlineMembers', handleGroupOnlineMembers);
      off('groupTyping', handleGroupTyping);
      off('groupStopTyping', handleGroupStopTyping);
      off('newMessage', handleNewMessage);
      off('groupCreated', handleGroupCreated);
      off('groupUpdated', handleGroupUpdated);
      off('groupDeleted', handleGroupDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, on, off, selectedGroup]);

  // ---- Handle group select (KEPT from OLD) ----
  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    // Join group room for real-time updates (NEW)
    if (isConnected) {
      emit('joinGroupRoom', { groupId: group.id });
    }
  };

  // ---- Handle back (KEPT from OLD) ----
  const handleBack = () => {
    // Leave group room (NEW)
    if (isConnected && selectedGroup) {
      emit('leaveGroupRoom', { groupId: selectedGroup.id });
    }
    setSelectedGroup(null);
  };

  // ---- Handle search (KEPT from OLD) ----
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // ---- Handle filter change (KEPT from OLD) ----
  const handleFilterChange = (filterType) => {
    setFilter(filterType);
  };

  // ---- Handle group created (KEPT from OLD) ----
  const handleGroupCreated = (group) => {
    setShowCreateModal(false);
    fetchGroups();
    if (group) {
      setSelectedGroup(group);
      if (isConnected) {
        emit('joinGroupRoom', { groupId: group.id });
      }
    }
  };

  // ---- Filter groups (KEPT from OLD) ----
  const filteredGroups = groups.filter(group => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const name = group.name?.toLowerCase() || '';
      const lastMessage = group.lastMessage?.content?.toLowerCase() || '';
      if (!name.includes(searchLower) && !lastMessage.includes(searchLower)) {
        return false;
      }
    }
    if (filter === 'unread') {
      return group.unreadCount > 0;
    }
    if (filter === 'favorites') {
      return group.isFavorite;
    }
    return true;
  });

  // ---- Get typing users for a group (NEW) ----
  const getTypingUsers = (groupId) => {
    const typing = typingUsers[groupId] || {};
    return Object.keys(typing).filter(id => typing[id]);
  };

  // ---- Get online count for a group (NEW) ----
  const getOnlineCount = (groupId) => {
    return onlineMembers[groupId]?.length || 0;
  };

  if (loading) return <Loader />;

  return (
    <div className="flex h-full">
      {/* Group List */}
      <div className={`${selectedGroup ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-border-color bg-card`}>
        <div className="p-4 border-b border-border-color">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text">Groups</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 bg-primary rounded-full hover:bg-secondary transition"
            >
              <FiPlus className="text-white" />
            </button>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search groups..."
          />
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {['all', 'unread', 'favorites'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => handleFilterChange(filterType)}
                className={`px-3 py-1 rounded-full text-sm capitalize whitespace-nowrap transition ${
                  filter === filterType
                    ? 'bg-primary text-white'
                    : 'bg-background text-text-secondary hover:bg-border-color'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <EmptyState
              icon={FiUsers}
              title="No Groups Yet"
              description="Create a group to start chatting with multiple people!"
              action={
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-12 transition flex items-center gap-2"
                >
                  <FiUserPlus size={18} /> Create Group
                </button>
              }
            />
          ) : (
            <GroupList
              groups={filteredGroups}
              loading={loading}
              onGroupSelect={handleGroupSelect}
              selectedGroupId={selectedGroup?.id}
              onlineCounts={onlineMembers}
              typingUsers={getTypingUsers}
            />
          )}
        </div>
      </div>

      {/* Group Chat */}
      {selectedGroup ? (
        <div className={`flex-1 ${selectedGroup ? 'flex' : 'hidden'} md:flex`}>
          <GroupChat
            group={selectedGroup}
            onBack={handleBack}
            onGroupUpdate={fetchGroups}
            onlineCount={getOnlineCount(selectedGroup.id)}
            typingUsers={getTypingUsers(selectedGroup.id)}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-background">
          <div className="text-center">
            <FiUsers className="w-20 h-20 text-card mx-auto mb-4" />
            <h3 className="text-text text-xl font-semibold">Select a group</h3>
            <p className="text-text-secondary">Choose a group to start chatting</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-12 transition inline-flex items-center gap-2"
            >
              <FiPlus size={18} /> Create New Group
            </button>
          </div>
        </div>
      )}

      {/* Create Group Modal (KEPT from OLD) */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};

export default GroupsPage;