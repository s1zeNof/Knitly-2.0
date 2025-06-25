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
    onReaction,
    onMediaClick // New prop for opening media viewer
}) => {
    const { user: currentUser } = useUserContext();
    const { handlePlayPause } = usePlayerContext();
    // clickTimeoutRef is removed as single click logic is changing

    const isMediaMessage = message.type === 'image' || message.type === 'video' || message.type === 'image_gif';

    const handleWrapperClick = (e) => {
        if (isMediaMessage && e.target.closest('.chat-image, .chat-video')) {
            // If the click is on the media itself, let handleMediaClick handle it.
            // This check helps prevent context menu from opening on a single media click.
            return;
        }
        if (selectionMode) {
            onTap(message); // Toggle selection if in selection mode
        } else {
            // For non-media messages OR clicks on bubble but NOT on media:
            // Open context menu on single click (Telegram desktop like)
            onContextMenu(e, message);
        }
    };

    const handleMediaClick = (e) => {
        e.stopPropagation(); // Prevent other click handlers on wrapper if any
        if (isMediaMessage && onMediaClick) {
            onMediaClick(message.content.url, message.type);
        }
    };

    const handleLongPressOrRightClick = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Important to prevent triggering wrapper click
        if (selectionMode && !isMediaMessage) {
            // If in selection mode and it's not media, a long press might still toggle.
            // Or, always open context menu on long press. For simplicity, let's unify:
            onContextMenu(e, message); // Always open context menu on long press / right click
            if (!selectionMode) onLongPress(message); // Enter selection mode if not already in it
        } else if (!selectionMode) {
            onContextMenu(e, message);
            onLongPress(message); // Enter selection mode
        } else { // In selection mode, and it IS a media message or general right click
             onContextMenu(e, message);
        }
    };
    
    const handleDoubleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onReaction) {
            onReaction(message, 'unicode_❤️');
        }
    };
    
    const showSenderInfo = isSavedContext || (!isSent && isGroup);

    return (
        <div
            className={`message-wrapper ${isSent ? 'sent' : 'received'} ${isSelected ? 'selected' : ''} ${isDeleting ? deleteAnimationClass : ''}`}
            data-message-id={message.id}
            onClick={handleWrapperClick} // Changed from handleClick
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
                        <p className="reply-text" dangerouslySetInnerHTML={{ __html: message.replyTo.text.replace(/\n/g, '<br />') }}></p> {/* Handle potential newlines in reply previews */}
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
                    
                    {message.type === 'image' && message.content && (
                        <div className="image-message-content">
                            <img
                                src={message.content.url}
                                alt={message.content.originalName || 'Зображення в чаті'}
                                className="chat-image"
                                // TODO: Add onClick to open a larger preview modal
                            />
                            {message.content.quality === 'HD' && <span className="hd-badge">HD</span>}
                        </div>
                    )}

                    {message.type === 'video' && message.content && (
                        <div className="video-message-content">
                            <video
                                src={message.content.url}
                                controls
                                className="chat-video"
                                preload="metadata" // Helps with dimensions and first frame
                            >
                                Вашому браузеру не підтримує тег video.
                            </video>
                            {/* You could add originalName or other info here if needed */}
                        </div>
                    )}

                    {message.type === 'image_gif' && message.content && (
                        <div className="image-message-content"> {/* Re-use image style for GIFs */}
                            <img
                                src={message.content.url}
                                alt={message.content.originalName || 'GIF анімація'}
                                className="chat-image chat-gif" // Add chat-gif for specific styling if needed
                            />
                        </div>
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
                        {message.isEdited && message.type === 'text' && <span className="edited-label">(ред.)</span>} {/* Show (ред.) only for text messages */}
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