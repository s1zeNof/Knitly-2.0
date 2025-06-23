import React, { useLayoutEffect, useRef, useState } from 'react';
import './MessageContextMenu.css';

// Іконки дій
const ReplyIcon = () => <svg viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>;
const EditIcon = () => <svg viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const ForwardIcon = () => <svg viewBox="0 0 24 24"><path d="M20 12l-7.5-7.5v4.5H4v6h8.5v4.5L20 12z"/></svg>;
const PinIcon = () => <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const DeleteIcon = () => <svg viewBox="0 0 24 24"><path d="M3 6h18m-2 19H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6"/></svg>;
// Іконка для відкриття повного пікера
const PlusIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

const QUICK_REACTIONS = ['❤️', '👍', '👎', '🔥', '😂', '👏'];

const MessageContextMenu = ({ x, y, show, onClose, onAction, onEmojiSelect, onOpenFullPicker, message, isOwnMessage, isUserAdmin }) => {
    const menuRef = useRef(null);
    const [position, setPosition] = useState({ top: y, left: x });

    useLayoutEffect(() => {
        if (show && menuRef.current) {
            const menuWidth = menuRef.current.offsetWidth;
            const menuHeight = menuRef.current.offsetHeight;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            let newX = x;
            let newY = y;

            if (x + menuWidth > screenWidth) newX = screenWidth - menuWidth - 10;
            if (y + menuHeight > screenHeight) newY = screenHeight - menuHeight - 10;
            
            if (newY < 60) newY = y + 20;

            setPosition({ top: newY, left: newX });
        }
    }, [x, y, show]);

    useLayoutEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                event.stopPropagation();
                event.preventDefault();
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, [onClose]);

    if (!show) return null;

    const canDelete = isOwnMessage || isUserAdmin;

    const handleQuickReactionClick = (emoji) => {
        onEmojiSelect(emoji);
        onClose();
    };

    return (
        <div className="message-context-menu" style={{ top: position.top, left: position.left }} ref={menuRef}>
            <div className="quick-reactions-bar">
                {QUICK_REACTIONS.map(emoji => (
                    <button 
                        key={emoji} 
                        className="quick-reaction-btn" 
                        onClick={() => handleQuickReactionClick(emoji)}
                    >
                        {emoji}
                    </button>
                ))}
                {/* Ось ця кнопка, якої, ймовірно, не було у вашому файлі */}
                <button className="quick-reaction-btn open-picker" onClick={onOpenFullPicker}>
                    <PlusIcon />
                </button>
            </div>

            <div className="context-menu-divider" />

            <button className="context-menu-item" onClick={() => onAction('reply', message)}><ReplyIcon /> Відповісти</button>
            <button className="context-menu-item" onClick={() => onAction('forward', message)}><ForwardIcon /> Переслати</button>
            {isOwnMessage && (
                 <button className="context-menu-item" onClick={() => onAction('edit', message)}><EditIcon /> Редагувати</button>
            )}
            <button className="context-menu-item" onClick={() => onAction('pin', message)}><PinIcon /> Закріпити</button>
            <div className="context-menu-divider" />
            {canDelete && (
                <button className="context-menu-item delete" onClick={() => onAction('delete', message)}><DeleteIcon /> Видалити</button>
            )}
        </div>
    );
};

export default MessageContextMenu;