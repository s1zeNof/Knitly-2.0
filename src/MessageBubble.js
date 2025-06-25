import React, { useRef } from 'react';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext';
import default_picture from './img/Default-Images/default-picture.svg';
import './MessageBubble.css';

const PlayIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>;
const CheckmarkIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg>;
const ForwardIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12l-7.5-7.5v4.5H4v6h8.5v4.5L20 12z"/></svg>;


const MessageBubble = ({
    message,
    isGroup,
    isSent,
    senderInfo,
    onContextMenu,
    onLongPress,
    onTap,
    isSelected,
    selectionMode,
    isDeleting,
    deleteAnimationClass,
    isSavedContext = false
}) => {
    const { user: currentUser } = useUserContext();
    const { handlePlayPause } = usePlayerContext();
    const clickTimeoutRef = useRef(null);
    const [isImageModalOpen, setIsImageModalOpen] = React.useState(false);


    const handleClick = (e) => {
        if (message.type === 'image' && !selectionMode) {
            setIsImageModalOpen(true);
            return;
        }
        if (selectionMode) {
            onTap(message);
            return;
        }
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        } else {
            clickTimeoutRef.current = setTimeout(() => {
                onContextMenu(e, message);
                clickTimeoutRef.current = null;
            }, 250);
        }
    };

    const handleLongPressOrRightClick = (e) => {
        e.preventDefault();
        if (selectionMode) return;
        onLongPress(message);
    };
    
    const showSenderInfo = isSavedContext || (!isSent && isGroup);

    const ImageModal = ({ src, onClose }) => (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Full size" />
                <button onClick={onClose} className="close-modal-button">&times;</button>
            </div>
        </div>
    );

    return (
        <>
            <div
                className={`message-wrapper ${isSent ? 'sent' : 'received'} ${isSelected ? 'selected' : ''} ${isDeleting ? deleteAnimationClass : ''}`}
                data-message-id={message.id}
                onClick={handleClick}
                onContextMenu={handleLongPressOrRightClick}
            >
                {selectionMode && (
                    <div className="selection-checkbox">
                        {isSelected && <CheckmarkIcon />}
                    </div>
                )}

                {(isSavedContext || !isSent) && <img src={senderInfo?.photoURL || default_picture} alt="avatar" className="message-avatar"/>}

                <div className="message-content-wrapper">
                    {showSenderInfo && <p className="sender-name">{senderInfo?.displayName}</p>}
                    
                    {message.replyTo && (
                        <div className="reply-preview-bubble">
                            <p className="reply-sender">{message.replyTo.senderName}</p>
                            <p className="reply-text">{message.replyTo.text}</p>
                        </div>
                    )}

                    {message.forwardedFrom && !isSavedContext && (
                        <div className="forwarded-header">
                            <ForwardIcon />
                            Переслано від {message.forwardedFrom.name}
                        </div>
                    )}

                    <div className={`message-bubble ${message.type === 'track' || message.type === 'album' || message.type === 'image' ? `${message.type}-message` : ''}`}>
                        {message.type === 'text' && <p>{message.content}</p>}

                        {message.type === 'image' && (
                            <img src={message.content} alt="Надіслане зображення" className="message-image-content" />
                        )}

                        {message.type === 'track' && (
                            <div className="track-message-card">
                                <img src={message.content.coverArtUrl || default_picture} alt={message.content.title} />
                                <div className="track-message-info">
                                    <p className="track-title">{message.content.title}</p>
                                    <p className="track-author">{message.content.authorName}</p>
                                </div>
                                <button className="play-track-button" onClick={() => handlePlayPause(message.content)}><PlayIcon /></button>
                            </div>
                        )}

                        {/* --- НОВИЙ БЛОК ДЛЯ АЛЬБОМІВ --- */}
                        {message.type === 'album' && (
                            <div className="album-message-card">
                                <img src={message.content.coverArtUrl || default_picture} alt={message.content.title} />
                                <div className="album-message-info">
                                    <p className="album-label">АЛЬБОМ</p>
                                    <p className="album-title">{message.content.title}</p>
                                    <p className="album-author">{message.content.artistName}</p>
                                </div>
                            </div>
                        )}

                        <div className="message-metadata">
                            {message.isEdited && <span className="edited-label">(ред.)</span>}
                            <span className="timestamp">
                                { (message.timestamp || message.savedAt)?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            {isImageModalOpen && <ImageModal src={message.content} onClose={() => setIsImageModalOpen(false)} />}
        </>
    );
};

export default MessageBubble;