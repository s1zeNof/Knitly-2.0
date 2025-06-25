import React, { useEffect } from 'react';
import './FullscreenImageViewer.css';

const FullscreenImageViewer = ({ src, alt, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!src) return null;

  return (
    <div className="fullscreen-viewer-overlay" onClick={onClose}>
      <div className="fullscreen-viewer-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt || 'Fullscreen image'} />
        <button className="close-viewer-button" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default FullscreenImageViewer;
