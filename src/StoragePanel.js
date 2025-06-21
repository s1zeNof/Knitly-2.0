import React, { useState } from 'react';
import './StoragePanel.css'; 

import SavedMusicTab from './SavedMusicTab';
import SavedChatsTab from './SavedChatsTab'; // <-- ІМПОРТ

// Іконки
const PhotoIcon = () => <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const FileIcon = () => <svg viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>;
const MusicIcon = () => <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const LinkIcon = () => <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>;
const ChatsIcon = () => <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>; // <-- НОВА ІКОНКА

const PlaceholderContent = ({ tabName }) => (
    <div className="placeholder-content">
        Тут буде відображатися список ваших збережених {tabName}.
    </div>
);


const StoragePanel = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('chats'); // <-- Змінено на 'chats' за замовчуванням

    const renderContent = () => {
        switch (activeTab) {
            case 'chats':
                return <SavedChatsTab />;
            case 'music':
                return <SavedMusicTab />;
            case 'photos':
                return <PlaceholderContent tabName="фото" />;
            case 'files':
                return <PlaceholderContent tabName="файлів" />;
            case 'links':
                return <PlaceholderContent tabName="посилань" />;
            default:
                return null;
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="storage-panel-overlay" onClick={onClose}>
            <div className="storage-panel" onClick={e => e.stopPropagation()}>
                <aside className="storage-sidebar">
                    <h3>Збережене</h3>
                    <nav>
                        <button className={activeTab === 'chats' ? 'active' : ''} onClick={() => setActiveTab('chats')}>
                            <ChatsIcon /> Чати
                        </button>
                        <button className={activeTab === 'music' ? 'active' : ''} onClick={() => setActiveTab('music')}>
                            <MusicIcon /> Музика
                        </button>
                        <button className={activeTab === 'photos' ? 'active' : ''} onClick={() => setActiveTab('photos')}>
                            <PhotoIcon /> Фото
                        </button>
                         <button className={activeTab === 'files' ? 'active' : ''} onClick={() => setActiveTab('files')}>
                            <FileIcon /> Файли
                        </button>
                         <button className={activeTab === 'links' ? 'active' : ''} onClick={() => setActiveTab('links')}>
                            <LinkIcon /> Посилання
                        </button>
                    </nav>
                </aside>
                <main className="storage-main-content">
                    <button className="close-button" onClick={onClose}>&times;</button>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default StoragePanel;