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
    isSavedContext = false,
    onReaction
}) => {
    const { user: currentUser } = useUserContext();
    const { handlePlayPause } = usePlayerContext();
    const clickTimeoutRef = useRef(null);

    const handleClick = (e) => {
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
    
    const handleDoubleClick = (e) => {
        e.preventDefault();
        if (onReaction) {
            // Викликаємо реакцію зі стандартним ID для "сердечка"
            onReaction(message, 'unicode_❤️');
        }
    };
    
    const showSenderInfo = isSavedContext || (!isSent && isGroup);

    return (
        <div
            className={`message-wrapper ${isSent ? 'sent' : 'received'} ${isSelected ? 'selected' : ''} ${isDeleting ? deleteAnimationClass : ''}`}
            data-message-id={message.id}
            onClick={handleClick}
            onContextMenu={handleLongPressOrRightClick}
            onDoubleClick={handleDoubleClick}
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

                <div className={`message-bubble ${message.type === 'track' || message.type === 'album' ? `${message.type}-message` : ''}`}>
                    {message.type === 'text' && <p>{message.content}</p>}
                    
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

                {/* <<< ОСНОВНЕ ВИПРАВЛЕННЯ ТУТ >>> */}
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="reactions-container">
                        {Object.entries(message.reactions).map(([reactionId, reactionData]) => {
                            // Перевіряємо, що дані реакції існують і мають масив uids
                            if (!reactionData || !reactionData.uids || reactionData.uids.length === 0) return null;

                            // Тепер правильно отримуємо масив користувачів
                            const uids = reactionData.uids;
                            const userHasReacted = currentUser ? uids.includes(currentUser.uid) : false;
                            const isCustom = !reactionId.startsWith('unicode_');
                            
                            return (
                                <div
                                    key={reactionId}
                                    className={`reaction-badge ${userHasReacted ? 'user-reacted' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onReaction) onReaction(message, reactionId, isCustom ? reactionData.url : null);
                                    }}
                                >
                                    {isCustom ? (
                                        <img src={reactionData.url} alt={reactionId} className="reaction-emoji-custom" />
                                    ) : (
                                        <span className="reaction-emoji">{reactionId.substring(8)}</span>
                                    )}
                                    <span className="reaction-count">{uids.length}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;