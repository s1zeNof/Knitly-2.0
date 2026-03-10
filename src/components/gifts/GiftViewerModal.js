import React from 'react';
import Lottie from 'lottie-react';
import { useLottieData } from '../../hooks/useLottieData';
import './GiftViewerModal.css';

const GiftViewerModal = ({ gift, onClose }) => {
    const { animationData, loading } = useLottieData(gift.lottieUrl || null);

    const displayName = typeof gift.name === 'object'
        ? (gift.name?.uk || gift.name?.en || 'Подарунок')
        : (gift.name || 'Подарунок');

    return (
        <div className="gift-viewer-overlay" onClick={onClose}>
            <div className="glassmorphism-content" onClick={e => e.stopPropagation()}>
                <button className="viewer-close-button" onClick={onClose}>&times;</button>
                <div className="viewer-animation-container">
                    {loading ? (
                        <p>Завантаження...</p>
                    ) : (
                        animationData && <Lottie animationData={animationData} loop={true} />
                    )}
                </div>
                <div className="viewer-info">
                    <h3>{displayName}</h3>
                    <p>{gift.description}</p>
                </div>
            </div>
        </div>
    );
};

export default GiftViewerModal;