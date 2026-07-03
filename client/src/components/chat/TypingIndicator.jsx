import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-2 max-w-[70%]">
      <div className="bg-bubble-received rounded-12 px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

export default TypingIndicator;