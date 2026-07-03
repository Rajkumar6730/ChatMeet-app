// client/src/pages/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiAlertCircle } from 'react-icons/fi';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center max-w-md mx-auto p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center">
            <FiAlertCircle className="text-primary text-5xl" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-6xl font-bold text-text mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-text mb-3">Page Not Found</h2>
        
        {/* Description */}
        <p className="text-text-secondary mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/chats')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-12 transition"
          >
            <FiHome size={20} />
            Go to Chats
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-card hover:bg-border-color text-text rounded-12 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;