import React, { useEffect, useRef } from 'react';
import './AttachmentMenu.css';

const PhotoIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const FileIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>;
const PollIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;
const WalletIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"></path><path d="M20 12h-4a2 2 0 0 1 0-4h4v4z"></path></svg>;
const LocationIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const MusicIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;

const AttachmentMenu = ({ isOpen, onClose, onSelectAttachment }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && menuRef.current && !menuRef.current.contains(event.target) && !event.target.closest('.attachment-button')) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleFileSelect = (event, type) => {
        onSelectAttachment(type, event); // Pass the event for file input types
        // onClose(); // Close is handled by handleClickOutside or by selecting non-file item
    };
    
    const desktopItems = [
        { type: 'photo', icon: <PhotoIcon />, label: 'Фото або відео', inputType: 'file', accept: 'image/*,video/*', disabled: false },
        { type: 'music', icon: <MusicIcon />, label: 'Музика', action: () => onSelectAttachment('music'), disabled: false },
        { type: 'document', icon: <FileIcon />, label: 'Файл', inputType: 'file', accept: '*', disabled: false },
        { type: 'poll', icon: <PollIcon />, label: 'Створити опитування', action: () => alert('Poll'), disabled: true },
    ];

    const mobileItems = [
        { type: 'photo', icon: <PhotoIcon />, label: 'Галерея', inputType: 'file', accept: 'image/*,video/*', disabled: false, color: 'blue' },
        { type: 'music', icon: <MusicIcon />, label: 'Музика', action: () => onSelectAttachment('music'), disabled: false, color: 'red' },
        { type: 'document', icon: <FileIcon />, label: 'Файл', inputType: 'file', accept: '*', disabled: false, color: 'sky' },
        { type: 'location', icon: <LocationIcon />, label: 'Розташув.', action: () => {}, disabled: true, color: 'green' },
        { type: 'poll', icon: <PollIcon />, label: 'Опитування', action: () => alert('Poll'), disabled: true, color: 'yellow' },
    ];

    return (
        <div className="attachment-overlay" onClick={onClose}>
            <div className="attachment-menu-container" ref={menuRef}>
                <div className="attachment-menu-desktop">
                    <ul>
                        {desktopItems.map(item => (
                            item.inputType === 'file' ? (
                                <li key={item.label} className={item.disabled ? 'disabled' : ''}>
                                    <label className="attachment-file-label">
                                        <input
                                            type="file"
                                            accept={item.accept}
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFileSelect(e, item.type)}
                                            disabled={item.disabled}
                                        />
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </label>
                                </li>
                            ) : (
                                <li key={item.label} className={item.disabled ? 'disabled' : ''} onClick={!item.disabled ? () => { item.action(); onClose(); } : undefined}>
                                    {item.icon}
                                    <span>{item.label}</span>
                                </li>
                            )
                        ))}
                    </ul>
                </div>
                <div className="attachment-sheet-mobile">
                     <div className="attachment-sheet-handle"></div>
                     <div className="attachment-sheet-scroll">
                        {mobileItems.map(item => (
                             item.inputType === 'file' ? (
                                <div key={item.label} className={`mobile-item ${item.disabled ? 'disabled' : ''}`}>
                                    <label className="attachment-file-label-mobile">
                                        <input
                                            type="file"
                                            accept={item.accept}
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFileSelect(e, item.type)}
                                            disabled={item.disabled}
                                        />
                                        <div className={`mobile-item-icon color-${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <span className="mobile-item-label">{item.label}</span>
                                    </label>
                                </div>
                            ) : (
                                <div key={item.label} className={`mobile-item ${item.disabled ? 'disabled' : ''}`} onClick={!item.disabled ? () => { item.action(); onClose(); } : undefined}>
                                    <div className={`mobile-item-icon color-${item.color}`}>
                                        {item.icon}
                                    </div>
                                    <span className="mobile-item-label">{item.label}</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AttachmentMenu;