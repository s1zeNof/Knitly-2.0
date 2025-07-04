import React from 'react';
import Lottie from 'lottie-react';
import './PurchaseNotesModal.css';

// Тепер анімація приходить через пропси
const PurchaseNotesModal = ({ isOpen, onClose, onConfirm, pack, isPurchasing, animationData }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content purchase-modal">
                <button className="modal-close-button" onClick={onClose} disabled={isPurchasing}>&times;</button>
                <h4>Підтвердження покупки</h4>
                <div className="purchase-details">
                    {/* Використовуємо передану анімацію */}
                    {animationData && (
                        <Lottie animationData={animationData} loop={true} className="purchase-note-lottie" />
                    )}
                    <p>Ви купуєте пакет</p>
                    <span className="purchase-package-name">{pack.notes} Нот</span>
                    <p>за</p>
                    <span className="purchase-package-price">{pack.price} грн</span>
                </div>
                <div className="modal-actions">
                    <button className="modal-button-cancel" onClick={onClose} disabled={isPurchasing}>
                        Скасувати
                    </button>
                    <button className="modal-button-confirm save" onClick={onConfirm} disabled={isPurchasing}>
                        {isPurchasing ? 'Обробка...' : 'Підтвердити'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseNotesModal;