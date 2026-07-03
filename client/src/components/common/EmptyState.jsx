import React from 'react';

const EmptyState = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
      {Icon && <Icon className="w-16 h-16 text-card mb-4" />}
      <h3 className="text-text text-xl font-semibold">{title}</h3>
      <p className="text-text-secondary mt-2">{description}</p>
    </div>
  );
};

export default EmptyState;