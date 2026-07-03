// client/src/components/common/ConfirmationModal.jsx
import React from 'react';
import { FiX } from 'react-icons/fi';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const confirmColors = {
    danger: 'bg-red-500 hover:bg-red-600',
    primary: 'bg-primary hover:bg-secondary',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-12 p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-text font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text">
            <FiX size={20} />
          </button>
        </div>
        <p className="text-text-secondary mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-12 bg-background hover:bg-border-color text-text transition"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-12 text-white transition ${confirmColors[confirmVariant]} disabled:opacity-50`}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;