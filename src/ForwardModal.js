import React, { useState, useMemo } from 'react';
import './ForwardModal.css';
import default_picture from './img/Default-Images/default-picture.svg';
import BookmarkIcon from './BookmarkIcon';

const ForwardModal = ({ isOpen, onClose, onForward, conversations, currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const savedMessagesChat = {
        id: 'saved_messages',
        name: 'Збережене',
        isVirtual: true,
    };

    const allChats = useMemo(() => [
        savedMessagesChat,
        ...conversations
    ], [conversations, savedMessagesChat]);

    const getChatName = (chat) => {
        if (chat.isVirtual) return chat.name;
        if (chat.isGroup) return chat.groupName;
        const companion = chat.participantInfo?.find(p => p.uid !== currentUser.uid);
        return companion?.displayName || 'Чат';
    };

    const filteredChats = useMemo(() => {
        if (!searchTerm) {
            return allChats;
        }
        return allChats.filter(chat =>
            getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allChats, currentUser]);

    const handleSelectChat = (chatId) => {
        onForward(chatId);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content forward-modal" onClick={e => e.stopPropagation()}>
                <header className="forward-modal-header">
                    <h4>Переслати повідомлення</h4>
                    <button onClick={onClose} className="modal-close-button">&times;</button>
                </header>
                <div className="forward-modal-body">
                    <input
                        type="text"
                        className="form-input search-chats-input"
                        placeholder="Пошук..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="forward-chat-list">
                        {filteredChats.map(chat => {
                             const isSavedChat = chat.id === 'saved_messages';
                             const isGroup = chat.isGroup;
                             const name = getChatName(chat);
                             let image = default_picture;
                             
                             if (!isSavedChat) {
                                 if (isGroup) {
                                     image = chat.groupPhotoURL || default_picture;
                                 } else {
                                     const companion = chat.participantInfo?.find(p => p.uid !== currentUser.uid);
                                     image = companion?.photoURL || default_picture;
                                 }
                             }

                            return (
                                <div key={chat.id} className="forward-chat-item" onClick={() => handleSelectChat(chat.id)}>
                                    {isSavedChat ? (
                                        <div className="saved-messages-avatar small"><BookmarkIcon /></div>
                                    ) : (
                                        <img src={image} alt={name} />
                                    )}
                                    <span>{name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForwardModal;