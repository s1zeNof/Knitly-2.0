import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { db } from '../../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Lottie from 'lottie-react';
import { useLottieData } from '../../hooks/useLottieData';
import GiftCard from './GiftCard';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './SendGiftModal.css';

const PopupGiftMedia = ({ gift }) => {
    const { animationData, loading } = useLottieData(gift.mediaType === 'lottie' ? gift.mediaUrl : null);

    if (gift.mediaType === 'lottie' && !loading && animationData) {
        return <Lottie animationData={animationData} loop={true} style={{ width: '100%', height: '100%' }} />;
    }
    return <div className="gift-placeholder">🎁</div>;
};

const SendGiftModal = ({ recipient, onClose, onGiftSendInitiated }) => {
    const [selectedGift, setSelectedGift] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Нові стани для підтвердження
    const [message, setMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    const { data: gifts, isLoading } = useQuery('allGifts', () =>
        getDocs(collection(db, 'gifts')).then(snap =>
            snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        )
    );

    const handleGiftSelect = (gift) => {
        setSelectedGift(gift);
    };

    const handleConfirmSend = async () => {
        if (!selectedGift) return;
        setIsProcessing(true);
        // Передаємо додаткові дані (анонімність та повідомлення) у функцію відправки
        await onGiftSendInitiated({ ...selectedGift, message, isAnonymous }, recipient);
        setIsProcessing(false);
        onClose();
    };

    const renderConfirmationForm = () => {
        if (!selectedGift) return null;

        return (
            <div className="gift-confirmation-overlay" onClick={() => setSelectedGift(null)}>
                <div className="gift-confirmation-popup" onClick={e => e.stopPropagation()}>
                    <button className="popup-close-btn" onClick={() => setSelectedGift(null)}>&times;</button>
                    <h3 className="popup-title">Надіслати подарунок</h3>

                    <div className="popup-info-banner">
                        Ви надсилаєте подарунок за {selectedGift.price} Нот
                    </div>

                    <div className="popup-gift-preview-card">
                        <div className="popup-gift-media">
                            <PopupGiftMedia gift={selectedGift} />
                        </div>
                        <h4 className="popup-gift-name">Подарунок від {isAnonymous ? 'Аноніма' : 'Вас'}</h4>
                        <p className="popup-gift-desc">
                            Додайте цей подарунок до профілю {recipient.displayName} як знак вашої уваги.
                        </p>
                    </div>

                    <div className="popup-form-group">
                        <input
                            type="text"
                            className="popup-input"
                            placeholder="Введіть повідомлення (необов'язково)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={100}
                        />
                    </div>

                    <div className="popup-form-toggle">
                        <div className="toggle-info">
                            <span className="toggle-label">Приховати моє ім'я</span>
                            <span className="toggle-desc">
                                Ваше ім'я та повідомлення будуть відомі лише {recipient.displayName}. Інші їх не побачать.
                            </span>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <button className="popup-submit-btn" onClick={handleConfirmSend} disabled={isProcessing}>
                        {isProcessing ? 'Відправка...' : `Надіслати подарунок за ${selectedGift.price} Нот`}
                    </button>

                </div>
            </div>
        );
    };

    const renderContent = () => {
        return (
            <div className="send-gift-main-layout">
                {/* Header with Avatar and animated particles */}
                <div className="send-gift-hero">
                    {/* Хрестик для закриття головного вікна */}
                    <button onClick={onClose} className="hero-close-button" disabled={isProcessing}>&times;</button>

                    <div className="send-gift-hero-avatar-container">
                        <img src={recipient.photoURL || default_picture} alt={recipient.displayName} className="send-gift-hero-avatar" />
                        <div className="floating-particle p-1">🎵</div>
                        <div className="floating-particle p-2">✨</div>
                        <div className="floating-particle p-3">💜</div>
                    </div>
                    <h3 className="send-gift-hero-title">Надішліть подарунок</h3>
                    <p className="send-gift-hero-desc">
                        Надішліть <strong>{recipient.displayName}</strong> особливий подарунок. <br />
                        Він збережеться у профілі як знак вашої уваги або підтримки творчості.
                    </p>
                    <button className="send-gift-learn-more">Докладніше про Ноти та Подарунки &gt;</button>
                </div>

                {/* Tabs */}
                <div className="send-gift-tabs">
                    <button className="active">Усі подарунки</button>
                    <button className="disabled" title="Скоро">Колекційні</button>
                </div>

                <div className="gift-selection-grid">
                    {isLoading ? (
                        <p className="gift-loading">Завантаження каталогу подарунків...</p>
                    ) : (
                        gifts?.map(gift => (
                            <GiftCard
                                key={gift.id}
                                gift={gift}
                                onGiftSelect={handleGiftSelect}
                                isSelectionMode={true}
                            />
                        ))
                    )}
                </div>

                {/* Рендеримо попап підтвердження, якщо вибрано подарунок */}
                {selectedGift && renderConfirmationForm()}
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* Видалено старий header, відступи перенесено до send-gift-body */}
            <div className="modal-content send-gift-modal" onClick={e => e.stopPropagation()}>
                <div className="send-gift-body">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default SendGiftModal;