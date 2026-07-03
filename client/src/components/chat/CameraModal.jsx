import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi';

const CameraModal = ({ isOpen, onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const sendPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      // modal will be closed by parent after capture
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-12 p-6 max-w-sm w-full shadow-xl text-center">
          <p className="text-text-secondary mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-12">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black flex flex-col z-50"
      onClick={(e) => {
        // Close only if clicking the backdrop (not the content)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex justify-between items-center p-4 bg-black/80">
        <button onClick={onClose} className="text-white hover:text-gray-300">
          <FiX size={24} />
        </button>
        <span className="text-white font-semibold">Camera</span>
        <button onClick={toggleCamera} className="text-white hover:text-gray-300">
          <FiRefreshCw size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center bg-black">
        {!capturedImage ? (
          <video ref={videoRef} className="max-h-full w-auto" autoPlay playsInline muted />
        ) : (
          <img src={capturedImage} alt="Captured" className="max-h-full w-auto object-contain" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center p-6 bg-black/80">
        {!capturedImage ? (
          <button
            onClick={captureImage}
            className="w-16 h-16 rounded-full bg-white border-4 border-primary hover:opacity-80 transition"
          />
        ) : (
          <div className="flex gap-4">
            <button onClick={retakePhoto} className="px-6 py-2 bg-gray-600 text-white rounded-12 hover:bg-gray-500 transition">
              Retake
            </button>
            <button onClick={sendPhoto} className="px-6 py-2 bg-primary text-white rounded-12 hover:bg-secondary transition">
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraModal;