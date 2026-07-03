import React, { useRef } from 'react';
import { FiImage, FiFile, FiVideo, FiMusic, FiX } from 'react-icons/fi';

const AttachmentMenu = ({ isOpen, onClose, onFileSelected }) => {
  const fileInputRef = useRef(null);
  const [selectedType, setSelectedType] = React.useState('');

  if (!isOpen) return null;

  const handleTypeClick = (type) => {
    setSelectedType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelected(file, selectedType);
      onClose();
    }
    e.target.value = ''; // reset
  };

  const attachments = [
    { type: 'image', icon: FiImage, label: 'Photo', accept: 'image/*' },
    { type: 'document', icon: FiFile, label: 'Document', accept: '.pdf,.doc,.docx' },
    { type: 'video', icon: FiVideo, label: 'Video', accept: 'video/*' },
    { type: 'audio', icon: FiMusic, label: 'Audio', accept: 'audio/*' },
  ];

  return (
    <div className="absolute bottom-24 left-0 right-0 bg-card rounded-12 mx-4 p-4 shadow-xl z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text font-semibold">Attach</h3>
        <button onClick={onClose} className="text-text-secondary hover:text-text">
          <FiX size={20} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {attachments.map(({ type, icon: Icon, label, accept }) => (
          <button
            key={type}
            onClick={() => handleTypeClick(type)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white group-hover:scale-110 transition`}>
              <Icon size={24} />
            </div>
            <span className="text-text-secondary text-xs">{label}</span>
          </button>
        ))}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={attachments.find(a => a.type === selectedType)?.accept || '*'}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default AttachmentMenu;