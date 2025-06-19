import React, { useState, useEffect } from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Підтвердити",
    showCheckbox = false,
    checkboxLabel = ""
}) => {
    const [isChecked, setIsChecked] = useState(false);

    // Скидуємо стан галочки при кожному новому відкритті
    useEffect(() => {
        if (isOpen) {
            setIsChecked(false);
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleConfirm = () => {
        // Передаємо стан галочки в функцію onConfirm
        onConfirm(isChecked);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content confirmation-modal">
                <h4>{title}</h4>
                <p>{message}</p>
                {showCheckbox && (
                    <label className="confirmation-checkbox-label">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                        />
                        {checkboxLabel}
                    </label>
                )}
                <div className="modal-actions">
                    <button className="modal-button-cancel" onClick={onClose}>
                        Скасувати
                    </button>
                    <button className="modal-button-confirm delete" onClick={handleConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;