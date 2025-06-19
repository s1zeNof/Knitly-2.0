import React, { useRef } from 'react';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext';
import default_picture from './img/Default-Images/default-picture.svg';
import './MessageBubble.css';

// Іконки
const PlayIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>;
const CheckmarkIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg>;

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
    deleteAnimationClass
}) => {
    const { user: currentUser } = useUserContext();
    const { handlePlayPause } = usePlayerContext();
    
    // Стан для обробки одинарного та подвійного кліку
    const clickTimeoutRef = useRef(null);

    // --- НОВА ЛОГІКА ВЗАЄМОДІЇ ---

    // Обробник для короткого та подвійного тапу
    const handleClick = (e) => {
        // Якщо ми в режимі виділення, тап завжди додає/видаляє повідомлення
        if (selectionMode) {
            onTap(message);
            return;
        }

        // Якщо таймер вже запущено - це подвійний клік.
        if (clickTimeoutRef.current) {
            // Скасовуємо таймер, щоб не спрацював одинарний клік.
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            // Нічого не робимо при подвійному кліку, як і просили.
        } else {
            // Якщо таймера немає - це перший клік. Запускаємо таймер.
            clickTimeoutRef.current = setTimeout(() => {
                // Якщо за 250мс не було другого кліку, виконуємо дію для одинарного тапу.
                onContextMenu(e, message); // Відкриваємо контекстне меню.
                clickTimeoutRef.current = null; // Скидаємо таймер.
            }, 250);
        }
    };

    // Обробник для довгого затискання (на мобільних) та правого кліку (на ПК)
    const handleLongPressOrRightClick = (e) => {
        e.preventDefault(); // Запобігаємо стандартному меню браузера
        if (selectionMode) return; // Не робимо нічого, якщо вже в режимі виділення
        onLongPress(message); // Вмикаємо режим виділення
    };
    
    return (
        <div
            className={`message-wrapper ${isSent ? 'sent' : 'received'} ${isSelected ? 'selected' : ''} ${isDeleting ? deleteAnimationClass : ''}`}
            data-message-id={message.id}
            onClick={handleClick} // Використовуємо новий обробник для кліків
            onContextMenu={handleLongPressOrRightClick} // Використовуємо для довгого затискання та правого кліку
        >
            {selectionMode && (
                <div className="selection-checkbox">
                    {isSelected && <CheckmarkIcon />}
                </div>
            )}

            {!isSent && <img src={senderInfo?.photoURL || default_picture} alt="avatar" className="message-avatar"/>}
            
            <div className="message-content-wrapper">
                {!isSent && message.isGroup && <p className="sender-name">{senderInfo?.displayName}</p>}
                
                {message.replyTo && (
                    <div className="reply-preview-bubble">
                        <p className="reply-sender">{message.replyTo.senderName}</p>
                        <p className="reply-text">{message.replyTo.text}</p>
                    </div>
                )}

                <div className={`message-bubble ${message.type === 'track' ? 'track-message' : ''}`}>
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
                    <div className="message-metadata">
                        {message.isEdited && <span className="edited-label">(ред.)</span>}
                        <span className="timestamp">
                            {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;