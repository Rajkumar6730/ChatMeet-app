import React from 'react';
import GroupCard from './GroupCard';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import { FiUsers } from 'react-icons/fi';

const GroupList = ({ groups, loading, onGroupSelect, selectedGroupId }) => {
  if (loading) {
    return <Loader />;
  }

  if (!groups || groups.length === 0) {
    return (
      <EmptyState
        icon={FiUsers}
        title="No groups yet"
        description="Create a new group to chat with multiple people"
      />
    );
  }

  return (
    <div className="divide-y divide-border-color">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          isSelected={selectedGroupId === group.id}
          onClick={() => onGroupSelect(group)}
        />
      ))}
    </div>
  );
};

export default GroupList;