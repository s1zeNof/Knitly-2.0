import React from 'react';
import Lottie from 'lottie-react';
import { useLottieData } from '../../hooks/useLottieData';
import GiftViewerModal from './GiftViewerModal';
import './GiftCard.css';

const GiftCard = ({ gift, onGiftSelect, isSelectionMode = false }) => {
    const { animationData, loading } = useLottieData(gift.mediaType === 'lottie' ? gift.mediaUrl : null);
    const [isViewerModalOpen, setIsViewerModalOpen] = React.useState(false);

    const handleCardClick = () => {
        if (isSelectionMode) {
            onGiftSelect(gift);
        } else {
            setIsViewerModalOpen(true);
        }
    };

    return (
        <>
            <button className="gift-card" onClick={handleCardClick} type="button">
                <div className="gift-card-media">
                    {gift.mediaType === 'lottie' && !loading && animationData ? (
                        <Lottie animationData={animationData} loop={true} />
                    ) : (
                        <div className="gift-placeholder">🎁</div>
                    )}
                </div>
                <div className="gift-card-price-pill">
                    <span className="price-icon">⭐</span> {gift.price}
                </div>
            </button>

            {isViewerModalOpen && (
                <GiftViewerModal
                    gift={gift}
                    onClose={() => setIsViewerModalOpen(false)}
                />
            )}
        </>
    );
};

export default GiftCard;