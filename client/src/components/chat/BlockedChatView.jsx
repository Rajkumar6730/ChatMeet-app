// client/src/components/chat/BlockedChatView.jsx
import React from 'react';
import { FiLock, FiUserX } from 'react-icons/fi';

const BlockedChatView = ({ username, onUnblock }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="bg-red-500/10 p-6 rounded-full mb-4">
                <FiLock size={48} className="text-red-500" />
            </div>
            <h2 className="text-text font-semibold text-xl mb-2">
                You are blocked
            </h2>
            <p className="text-text-secondary mb-2">
                You can no longer message {username || 'this user'}
            </p>
            <p className="text-text-secondary text-sm mb-6">
                • Messages won't be delivered<br />
                • Calls won't connect<br />
                • Status updates are hidden
            </p>
            <button
                onClick={onUnblock}
                className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-12 transition"
            >
                Unblock Contact
            </button>
        </div>
    );
};

export default BlockedChatView;