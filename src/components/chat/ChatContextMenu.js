import React, { useEffect, useRef } from 'react';
import './ChatContextMenu.css';

const ArchiveIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"></path></svg>;
const PinIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const MuteIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5zm10.59 4.59L17 14.17l-4.59-4.58L11 11l4.59 4.59L17 11l4.59 4.59z"></path></svg>;
const DeleteIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const ClearIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;


const ChatContextMenu = ({ x, y, show, onClose, onAction }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => document.removeEventListener('click', handleClickOutside, true);
    }, [onClose]);

    if (!show) return null;

    return (
        <div className="context-menu" style={{ top: y, left: x }} ref={menuRef}>
            <button className="context-menu-item" onClick={() => onAction('archive')}>
                <ArchiveIcon /> Архівувати
            </button>
            <button className="context-menu-item" onClick={() => onAction('pin')}>
                <PinIcon /> Відкріпити
            </button>
            <button className="context-menu-item" onClick={() => onAction('mute')}>
                <MuteIcon /> Вимкнути сповіщення
            </button>
            <div className="context-menu-divider" />
            <button className="context-menu-item" onClick={() => onAction('clearHistory')}>
                <ClearIcon /> Очистити історію
            </button>
            <button className="context-menu-item delete" onClick={() => onAction('delete')}>
                <DeleteIcon /> Видалити чат
            </button>
        </div>
    );
};

export default ChatContextMenu;