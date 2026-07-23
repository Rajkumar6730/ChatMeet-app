import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiRefreshCw, FiZap, FiZapOff, FiImage } from 'react-icons/fi';

const CameraModal = ({ isOpen, onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setError('');
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera(); // Ensure previous stream is strictly closed
    setError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser.');
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera device found.');
      } else {
        setError(err.message || 'Unable to access the camera.');
      }
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    
    try {
      if (!window.ImageCapture) {
        // Fallback for browsers that don't support ImageCapture API (Safari, Firefox)
        const trackCapabilities = track.getCapabilities && track.getCapabilities();
        if (trackCapabilities && trackCapabilities.torch) {
          await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
          setFlashOn(!flashOn);
        } else {
          alert("Flash control is unsupported on your current device/browser.");
        }
        return;
      }

      const imageCapture = new window.ImageCapture(track);
      const capabilities = await imageCapture.getPhotoCapabilities();
      const trackCapabilities = track.getCapabilities && track.getCapabilities();

      if (capabilities.fillLightMode?.includes('flash') || (trackCapabilities && trackCapabilities.torch)) {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn }]
        });
        setFlashOn(!flashOn);
      } else {
        alert("Flash is not supported on this device's camera.");
      }
    } catch (err) {
      console.error('Flash toggle failed:', err);
      // Fallback alert for devices that don't support the API properly
      alert("Flash control is unsupported on your current device/browser.");
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    
    // Slight delay to allow for capture animation
    setTimeout(() => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // If using front camera, flip the image so it acts like a mirror
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
      setIsCapturing(false);
    }, 150);
  };

  const handleGalleryUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const sendPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black flex flex-col z-[100] animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 text-white">
        <button 
          onClick={onClose} 
          className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-all duration-200 shadow-lg active:scale-95"
          title="Close Camera"
        >
          <FiX size={24} />
        </button>
        
        {!capturedImage && !error && (
          <div className="flex gap-4">
            <button 
              onClick={toggleFlash} 
              className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 shadow-lg active:scale-95 ${flashOn ? 'bg-yellow-500/80 text-black' : 'bg-black/40 hover:bg-black/60'}`}
              title="Toggle Flash"
            >
              {flashOn ? <FiZap size={24} /> : <FiZapOff size={24} />}
            </button>
            <button 
              onClick={toggleCamera} 
              className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-all duration-200 shadow-lg active:scale-95"
              title="Switch Camera"
            >
              <FiRefreshCw size={24} />
            </button>
          </div>
        )}
      </div>

      {/* Center Camera / Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
        {error ? (
          <div className="p-8 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-500">
              <FiX size={32} />
            </div>
            <p className="text-white font-medium mb-2">Camera Error</p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-secondary transition active:scale-95"
            >
              Close
            </button>
          </div>
        ) : !capturedImage ? (
          <video 
            ref={videoRef} 
            className={`min-h-full min-w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
            autoPlay 
            playsInline 
            muted 
          />
        ) : (
          <img 
            src={capturedImage} 
            alt="Captured preview" 
            className="w-full h-full object-contain animate-scaleIn" 
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Bar */}
      {!error && (
        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-t from-black/90 to-transparent z-10 pb-8">
          {!capturedImage ? (
            <>
              {/* Gallery Button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all active:scale-95"
                title="Open Gallery"
              >
                <FiImage size={22} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleGalleryUpload} 
                accept="image/*" 
                className="hidden" 
              />

              {/* Central Professional Capture Button */}
              <button
                onClick={captureImage}
                disabled={isCapturing}
                className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-200 outline-none
                  ${isCapturing ? 'border-gray-400 scale-95' : 'border-white hover:scale-105 active:scale-90 shadow-[0_0_20px_rgba(255,255,255,0.4)]'}
                `}
                title="Take Photo"
              >
                <div className={`w-14 h-14 bg-white rounded-full transition-all duration-200 ${isCapturing ? 'scale-75 opacity-50' : 'scale-100'}`} />
              </button>

              {/* Cancel Button */}
              <button 
                onClick={onClose}
                className="text-white font-medium px-4 py-2 hover:bg-white/10 rounded-full transition active:scale-95"
              >
                Cancel
              </button>
            </>
          ) : (
            <div className="w-full flex justify-between items-center max-w-sm mx-auto">
              <button 
                onClick={retakePhoto} 
                className="px-6 py-3 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition shadow-lg active:scale-95"
              >
                Retake
              </button>
              <button 
                onClick={sendPhoto} 
                className="px-8 py-3 bg-primary text-white rounded-full font-medium hover:bg-secondary transition shadow-[0_4px_14px_rgba(37,211,102,0.4)] active:scale-95"
              >
                Send Photo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraModal;