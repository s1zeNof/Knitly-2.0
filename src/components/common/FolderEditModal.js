import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserContext } from '../../contexts/UserContext';
import default_picture from '../../img/Default-Images/default-picture.svg';
import { folderIcons, getIconComponent } from './FolderIcons';
import './FolderEditModal.css';

const FolderEditModal = ({ isOpen, onClose, onSave, folderToEdit }) => {
    const { user: currentUser } = useUserContext();
    const [folderName, setFolderName] = useState('');
    const [folderIcon, setFolderIcon] = useState('default');
    const [includedChats, setIncludedChats] = useState([]);
    const [allUserChats, setAllUserChats] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (folderToEdit) {
                setFolderName(folderToEdit.name || '');
                setIncludedChats(folderToEdit.includedChats || []);
                setFolderIcon(folderToEdit.icon || 'default');
            } else {
                setFolderName('');
                setIncludedChats([]);
                setFolderIcon('default');
            }

            const fetchChats = async () => {
                if (!currentUser) return;
                setIsLoading(true);
                try {
                    const q = query(
                        collection(db, 'chats'),
                        where('participants', 'array-contains', currentUser.uid)
                    );
                    const querySnapshot = await getDocs(q);
                    const chats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setAllUserChats(chats);
                } catch (error) { console.error("Помилка завантаження чатів:", error); }
                finally { setIsLoading(false); }
            };
            fetchChats();
        }
    }, [isOpen, folderToEdit, currentUser]);

    const handleToggleChat = (chatId) => {
        setIncludedChats(prev => prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]);
    };

    const handleSave = () => {
        if (!folderName.trim()) {
            alert("Будь ласка, введіть назву папки.");
            return;
        }
        const newFolderData = {
            id: folderToEdit ? folderToEdit.id : Date.now().toString(),
            name: folderName,
            icon: folderIcon,
            includedChats: includedChats,
        };
        onSave(newFolderData);
    };
    
    const filteredChats = useMemo(() => {
        if (!searchTerm) {
            return allUserChats;
        }
        return allUserChats.filter(chat => {
            const chatName = chat.isGroup 
                ? chat.groupName 
                : chat.participantInfo?.find(p => p.uid !== currentUser.uid)?.displayName;
            return chatName?.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [allUserChats, searchTerm, currentUser]);

    if (!isOpen) return null;

    const getCompanion = (chat) => chat.participantInfo.find(p => p.uid !== currentUser.uid);

    return (
        <div className="modal-overlay">
            <div className="modal-content folder-edit-modal">
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h4>{folderToEdit ? 'Редагувати папку' : 'Створити папку'}</h4>
                
                <div className="form-group">
                    <label htmlFor="folder-name">Назва папки</label>
                    <input type="text" id="folder-name" className="form-input" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Наприклад, 'Робота'"/>
                </div>

                <div className="form-group">
                    <label>Іконка</label>
                    <div className="icon-selection-grid">
                        {Object.keys(folderIcons).map(iconKey => (
                            <button
                                key={iconKey}
                                className={`icon-option ${folderIcon === iconKey ? 'selected' : ''}`}
                                onClick={() => setFolderIcon(iconKey)}
                                type="button"
                            >
                                {getIconComponent(iconKey)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Додати чати</label>
                    <input type="text" className="form-input" placeholder="Пошук чатів..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                
                <div className="chat-selection-list">
                    {isLoading ? (
                        <p className="chats-loading-placeholder">Завантаження чатів...</p>
                    ) : (
                        filteredChats.length > 0 ? filteredChats.map(chat => {
                            const companion = !chat.isGroup ? getCompanion(chat) : null;
                            const name = chat.isGroup ? chat.groupName : companion?.displayName;
                            const image = chat.isGroup ? (chat.groupPhotoURL || default_picture) : (companion?.photoURL || default_picture);
                            
                            return (
                                <div key={chat.id} className="chat-selection-item" onClick={() => handleToggleChat(chat.id)}>
                                    <input
                                        type="checkbox"
                                        checked={includedChats.includes(chat.id)}
                                        readOnly
                                    />
                                    <img src={image} alt={name || 'Chat'} className="chat-selection-avatar" />
                                    <span className="chat-selection-name">{name || 'Chat'}</span>
                                </div>
                            );
                        }) : <p className="chats-loading-placeholder">Не знайдено чатів.</p>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="modal-button-cancel" onClick={onClose}>Скасувати</button>
                    <button className="modal-button-confirm save" onClick={handleSave}>Зберегти</button>
                </div>
            </div>
        </div>
    );
};

export default FolderEditModal;