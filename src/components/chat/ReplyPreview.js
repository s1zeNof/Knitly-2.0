import React from 'react';
import './ReplyPreview.css';

const CloseIcon = () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>;

const ReplyPreview = ({ message, onCancel }) => {
    if (!message) return null;

    return (
        <div className="reply-preview-container">
            <div className="reply-preview-content">
                <p className="reply-preview-sender">Відповідь для {message.senderId}</p>
                <p className="reply-preview-text">
                    {message.type === 'track' ? `🎵 ${message.content.title}` : message.content}
                </p>
            </div>
            <button onClick={onCancel} className="reply-preview-cancel">
                <CloseIcon />
            </button>
        </div>
    );
};

export default ReplyPreview;