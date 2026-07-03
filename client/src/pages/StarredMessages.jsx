// client/src/pages/StarredMessages.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import MessageBubble from '../components/chat/MessageBubble';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { FiStar } from 'react-icons/fi';

const StarredMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStarred = async () => {
      try {
        // Assume endpoint: GET /api/messages/starred
        const data = await chatService.getStarredMessages();
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch starred messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStarred();
  }, []);

  if (loading) return <Loader />;
  if (messages.length === 0) {
    return <EmptyState icon={FiStar} title="No Starred Messages" description="Star important messages to find them here." />;
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto p-4">
      <h2 className="text-2xl font-bold text-text mb-4">Starred Messages</h2>
      <div className="space-y-2">
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.sender._id === user._id}
            showAvatar
            showSenderName
          />
        ))}
      </div>
    </div>
  );
};

export default StarredMessages;