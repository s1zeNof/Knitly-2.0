import React, { useEffect, useRef } from 'react';
import './AttachmentMenu.css';

const PhotoIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const FileIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>;
const PollIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;
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
    
    const handlePhotoVideoSelect = () => {
        onSelectAttachment('photoOrVideo');
    };

    const desktopItems = [
        { icon: <PhotoIcon />, label: 'Фото або відео', action: handlePhotoVideoSelect, disabled: false },
        { icon: <MusicIcon />, label: 'Музика', action: () => onSelectAttachment('music'), disabled: false },
        { icon: <FileIcon />, label: 'Файл', action: () => alert('File'), disabled: true },
        { icon: <PollIcon />, label: 'Створити опитування', action: () => alert('Poll'), disabled: true },
    ];

    const mobileItems = [
        { icon: <PhotoIcon />, label: 'Галерея', action: handlePhotoVideoSelect, disabled: false, color: 'blue' },
        { icon: <MusicIcon />, label: 'Музика', action: () => onSelectAttachment('music'), disabled: false, color: 'red' },
        { icon: <FileIcon />, label: 'Файл', action: () => alert('File'), disabled: true, color: 'sky' },
        { icon: <LocationIcon />, label: 'Розташув.', action: () => {}, disabled: true, color: 'green' },
        { icon: <PollIcon />, label: 'Опитування', action: () => alert('Poll'), disabled: true, color: 'yellow' },
    ];

    return (
        <div className="attachment-overlay" onClick={onClose}>
            <div className="attachment-menu-container" ref={menuRef} onClick={e => e.stopPropagation()}> {/* Added stopPropagation */}
                <div className="attachment-menu-desktop">
                    <ul>
                        {desktopItems.map(item => (
                            <li key={item.label} className={item.disabled ? 'disabled' : ''} onClick={!item.disabled ? item.action : undefined}>
                                {item.icon}
                                <span>{item.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="attachment-sheet-mobile">
                     <div className="attachment-sheet-handle"></div>
                     <div className="attachment-sheet-scroll">
                        {mobileItems.map(item => (
                            <div key={item.label} className={`mobile-item ${item.disabled ? 'disabled' : ''}`} onClick={!item.disabled ? item.action : undefined}>
                                <div className={`mobile-item-icon color-${item.color}`}>
                                    {item.icon}
                                </div>
                                <span className="mobile-item-label">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AttachmentMenu;