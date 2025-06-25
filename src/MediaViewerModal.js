import React from 'react';
import './MediaViewerModal.css';

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const MediaViewerModal = ({ isOpen, mediaUrl, mediaType, onClose }) => {
    if (!isOpen || !mediaUrl) {
        return null;
    }

    const handleContentClick = (e) => {
        e.stopPropagation(); // Prevent modal from closing if clicking on image/video controls
    };

    return (
        <div className="media-viewer-overlay" onClick={onClose}>
            <button className="media-viewer-close-button" onClick={onClose} aria-label="Close media viewer">
                <CloseIcon />
            </button>
            <div className="media-viewer-content-wrapper" onClick={handleContentClick}>
                {mediaType === 'image' || mediaType === 'image_gif' ? (
                    <img src={mediaUrl} alt="Media content" className="media-viewer-element" />
                ) : mediaType === 'video' ? (
                    <video src={mediaUrl} controls autoPlay className="media-viewer-element">
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <p>Unsupported media type</p>
                )}
            </div>
        </div>
    );
};

export default MediaViewerModal;
