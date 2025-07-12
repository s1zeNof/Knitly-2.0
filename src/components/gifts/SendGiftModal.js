import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { db } from '../../shared/services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import GiftCard from './GiftCard';
import './SendGiftModal.css';

const SendGiftModal = ({ recipient, onClose, onGiftSendInitiated }) => {
    const [selectedGift, setSelectedGift] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

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
        await onGiftSendInitiated(selectedGift, recipient);
        setIsProcessing(false);
        onClose();
    };

    const renderContent = () => {
        if (selectedGift) {
            return (
                <div className="gift-confirmation-view">
                    <h4>Підтвердьте відправку</h4>
                    <p>Ви даруєте "{selectedGift.name}" користувачу {recipient.displayName}.</p>
                    <div className="gift-confirmation-details">
                        <span>Вартість:</span>
                        <span className="price">{selectedGift.price} Нот</span>
                    </div>
                    <div className="modal-actions confirmation-actions">
                        <button className="modal-button-cancel" onClick={() => setSelectedGift(null)} disabled={isProcessing}>Назад</button>
                        <button className="modal-button-confirm" onClick={handleConfirmSend} disabled={isProcessing}>
                            {isProcessing ? 'Відправка...' : 'Подарувати'}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <>
                <div className="gift-selection-grid">
                    {isLoading ? (
                        <p>Завантаження подарунків...</p>
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
            </>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content send-gift-modal" onClick={e => e.stopPropagation()}>
                <header className="send-gift-header">
                    <h4>{selectedGift ? 'Підтвердження' : `Подарунок для ${recipient.displayName}`}</h4>
                    <button onClick={onClose} className="modal-close-button" disabled={isProcessing}>&times;</button>
                </header>
                <div className="send-gift-body">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default SendGiftModal;