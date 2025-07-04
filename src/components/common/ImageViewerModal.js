import React from 'react';
import './ImageViewerModal.css';

const ImageViewerModal = ({ isOpen, imageUrl, imageAlt, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="image-viewer-overlay" onClick={onClose}>
            <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
                <button className="image-viewer-close" onClick={onClose}>&times;</button>
                <img src={imageUrl} alt={imageAlt || 'Перегляд зображення'} />
            </div>
        </div>
    );
};

export default ImageViewerModal;