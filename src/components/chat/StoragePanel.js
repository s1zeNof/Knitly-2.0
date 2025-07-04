import React, { useState, useEffect } from 'react';
import './StoragePanel.css'; 

import SavedMusicTab from './SavedMusicTab';
import SavedChatsTab from './SavedChatsTab';

const PhotoIcon = () => <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const FileIcon = () => <svg viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>;
const MusicIcon = () => <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const LinkIcon = () => <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>;
const ChatsIcon = () => <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const BackArrowIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>;

const PlaceholderContent = ({ tabName }) => (
    <div className="placeholder-content">
        Тут буде відображатися список ваших збережених {tabName}.
    </div>
);

const TABS = [
    { id: 'chats', name: 'Чати', title: 'Збережено з чатів', icon: <ChatsIcon/>, component: <SavedChatsTab /> },
    { id: 'music', name: 'Музика', title: 'Збережена музика', icon: <MusicIcon/>, component: <SavedMusicTab /> },
    { id: 'photos', name: 'Фото', title: 'Збережені фото', icon: <PhotoIcon/>, component: <PlaceholderContent tabName="фото" /> },
    { id: 'files', name: 'Файли', title: 'Збережені файли', icon: <FileIcon/>, component: <PlaceholderContent tabName="файлів" /> },
    { id: 'links', name: 'Посилання', title: 'Збережені посилання', icon: <LinkIcon/>, component: <PlaceholderContent tabName="посилань" /> },
];

const StoragePanel = ({ isOpen, onClose }) => {
    const [activeTabId, setActiveTabId] = useState(null);

    // Визначаємо, чи активний перегляд контенту (для мобільної анімації)
    const isContentView = !!activeTabId;

    useEffect(() => {
        if (!isOpen) {
            // Затримка для анімації закриття
            setTimeout(() => setActiveTabId(null), 300);
        }
    }, [isOpen]);
    
    const activeTabData = TABS.find(tab => tab.id === activeTabId);

    if (!isOpen) return null;

    return (
        <div className="storage-panel-overlay" onClick={onClose}>
            <div className={`storage-panel ${isContentView ? 'content-view-active' : ''}`} onClick={e => e.stopPropagation()}>
                <aside className="storage-sidebar">
                    <header className="storage-sidebar-header">
                        <h3>Збережене</h3>
                        <button className="close-button-mobile" onClick={onClose}>&times;</button>
                    </header>
                    <nav>
                        {TABS.map(tab => (
                             <button key={tab.id} className={activeTabId === tab.id ? 'active' : ''} onClick={() => setActiveTabId(tab.id)}>
                                {tab.icon} {tab.name}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="storage-main-content">
                    <header className="storage-content-header">
                        <button className="mobile-back-button" onClick={() => setActiveTabId(null)}>
                            <BackArrowIcon />
                        </button>
                        <h4>{activeTabData?.title || 'Збережене'}</h4>
                        <button className="close-button-desktop" onClick={onClose}>&times;</button>
                    </header>
                    <div className="storage-content-body">
                      {activeTabData?.component}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StoragePanel;