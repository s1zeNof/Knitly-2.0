import React, { useRef, useEffect } from 'react';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext';
import default_picture from './img/Default-Images/default-picture.svg';
import './MessageBubble.css';

const PlayIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>;
const CheckmarkIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>;
const ForwardIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12l-7.5-7.5v4.5H4v6h8.5v4.5L20 12z" /></svg>;

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
    isContextMenuOpen,
    onCloseContextMenu,
    onOpenImage,
}) => {
    const { user: currentUser } = useUserContext();
    const { handlePlayPause } = usePlayerContext();

    const touchTimeoutRef = useRef(null);
    const longPressTimeoutRef = useRef(null);
    const isLongPressRef = useRef(false);
    const isDragRef = useRef(false);
    const touchStartPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        return () => {
            if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
            if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
        };
    }, []);

    const isMediaMessage = (msg) => ['track', 'album', 'image', 'video', 'image_gif'].includes(msg.type);

    const handleTouchStart = (e) => {
        if (isContextMenuOpen) {
            return;
        }
        isLongPressRef.current = false;
        isDragRef.current = false;
        touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        longPressTimeoutRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            
            // --- ЗМІНА: Різна логіка для медіа та тексту ---
            if (isMediaMessage(message)) {
                // Для медіа-файлів (фото, музика) - тільки відкриваємо меню
                onContextMenu(e, message);
            } else {
                // Для текстових повідомлень - відкриваємо меню І вмикаємо режим вибору
                onLongPress(message);
                onContextMenu(e, message);
            }
        }, 500);
    };

    const handleTouchMove = (e) => {
        if (isContextMenuOpen) return;

        const touch = e.touches[0];
        const distanceMoved = Math.sqrt(
            Math.pow(touch.clientX - touchStartPosRef.current.x, 2) +
            Math.pow(touch.clientY - touchStartPosRef.current.y, 2)
        );
        
        if (distanceMoved > 10) {
            isDragRef.current = true;
            if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
            if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
        }
    };

    const handleTouchEnd = (e) => {
        // --- ЗМІНА: Повністю перероблена логіка для виправлення багів ---
        
        // Спочатку запам'ятовуємо, чи це був довгий натиск
        const wasLongPress = isLongPressRef.current;
        
        // Завжди очищуємо таймер довгого натискання
        if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);

        // Якщо жест, що закінчився, був довгим натиском, ми нічого більше не робимо.
        // Це запобігає закриттю меню, яке щойно з'явилося.
        if (wasLongPress) {
            e.preventDefault();
            return;
        }

        // Якщо це був новий, короткий дотик, і меню ВЖЕ БУЛО ВІДКРИТЕ, закриваємо його.
        if (isContextMenuOpen) {
            e.preventDefault();
            onCloseContextMenu();
            return;
        }
        
        // Якщо це був скрол, ігноруємо
        if (isDragRef.current) {
            return;
        }

        // В іншому випадку обробляємо логіку одинарного/подвійного дотику
        if (touchTimeoutRef.current) {
            clearTimeout(touchTimeoutRef.current);
            touchTimeoutRef.current = null;
            if (onReaction) {
                onReaction(message, 'unicode_❤️');
            }
        } else {
            touchTimeoutRef.current = setTimeout(() => {
                const tappedElement = e.target;
                const imageContent = tappedElement.closest('.image-message-content');
                const playButton = tappedElement.closest('.play-track-button');
                
                if (playButton) {
                    touchTimeoutRef.current = null;
                    return;
                }

                if (selectionMode) {
                    onTap(message);
                } else if (imageContent) {
                    onOpenImage({ url: message.content.url, alt: message.content.originalName });
                } else {
                    onContextMenu(e, message);
                }
                touchTimeoutRef.current = null;
            }, 300);
        }
    };
    
    const handleRightClick = (e) => {
        e.preventDefault();
        onContextMenu(e, message);
    };

    const handleSingleClick = (e) => {
        const tappedElement = e.target;
        const imageContent = tappedElement.closest('.image-message-content');
        
        const playButton = tappedElement.closest('.play-track-button');
        if (playButton) {
            e.stopPropagation();
            return;
        }

        if (selectionMode) {
            onTap(message);
        } else if (imageContent) {
            onOpenImage({ url: message.content.url, alt: message.content.originalName });
        }
    };
    
    const handleDoubleClick = (e) => {
        if (!selectionMode) {
             onContextMenu(e, message);
        }
    };

    const showSenderInfo = isSavedContext || (!isSent && isGroup);

    return (
        <div
            className={`message-wrapper ${isSent ? 'sent' : 'received'} ${isSelected ? 'selected' : ''} ${isDeleting ? deleteAnimationClass : ''}`}
            data-message-id={message.id}
            onClick={handleSingleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleRightClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
                        <p className="reply-text" dangerouslySetInnerHTML={{ __html: message.replyTo.text.replace(/\n/g, '<br />') }}></p>
                    </div>
                )}

                {message.forwardedFrom && !isSavedContext && (
                    <div className="forwarded-header">
                        <ForwardIcon />
                        Переслано від {message.forwardedFrom.name}
                    </div>
                )}

                <div className={`message-bubble ${message.type === 'track' || message.type === 'album' || message.type === 'image' || message.type === 'video' || message.type === 'image_gif' ? `${message.type}-message` : ''}`}>
                    {message.type === 'text' && <p>{message.content}</p>}
                    
                    {message.type === 'image' && message.content && (
                        <div className="image-message-content">
                            <img
                                src={message.content.url}
                                alt={message.content.originalName || 'Зображення в чаті'}
                                className="chat-image"
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
                                preload="metadata"
                            >
                                Вашому браузеру не підтримує тег video.
                            </video>
                        </div>
                    )}

                    {message.type === 'image_gif' && message.content && (
                        <div className="image-message-content">
                            <img
                                src={message.content.url}
                                alt={message.content.originalName || 'GIF анімація'}
                                className="chat-image chat-gif"
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
                            <button className="play-track-button" onClick={(e) => { e.stopPropagation(); handlePlayPause(message.content); }}><PlayIcon /></button>
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
                        {message.isEdited && message.type === 'text' && <span className="edited-label">(ред.)</span>}
                        <span className="timestamp">
                            { (message.timestamp || message.savedAt)?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                        </span>
                    </div>
                </div>

                {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="reactions-container">
                        {Object.entries(message.reactions).map(([reactionId, reactionData]) => {
                            if (!reactionData || !reactionData.uids || reactionData.uids.length === 0) return null;

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