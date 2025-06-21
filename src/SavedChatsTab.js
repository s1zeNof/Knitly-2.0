import React, { useState, useMemo } from 'react';
import { useUserContext } from './UserContext';
import { useQuery } from 'react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import MessageBubble from './MessageBubble';
import default_picture from './img/Default-Images/default-picture.svg';
import BookmarkIcon from './BookmarkIcon';
import './SavedChatsTab.css';

const SavedChatsTab = () => {
    const { user: currentUser } = useUserContext();
    const [selectedSource, setSelectedSource] = useState(null);

    const { data: savedMessages = [], isLoading } = useQuery(
        ['savedMessages', currentUser?.uid],
        async () => {
            if (!currentUser) return [];
            const q = query(collection(db, 'users', currentUser.uid, 'savedMessages'), orderBy('savedAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        { enabled: !!currentUser }
    );

    const chatSources = useMemo(() => {
        if (!savedMessages.length) return [];
        
        const sourcesMap = new Map();
        
        savedMessages.forEach(msg => {
            if (msg.savedFrom && msg.savedFrom.chatId) {
                const { chatId, chatName, isGroup, photoURL } = msg.savedFrom;
                if (!sourcesMap.has(chatId)) {
                    sourcesMap.set(chatId, {
                        id: chatId,
                        name: chatName,
                        isGroup: isGroup,
                        photoURL: photoURL, // Зберігаємо фото
                        messageCount: 0,
                    });
                }
                sourcesMap.get(chatId).messageCount++;
            }
        });
        return Array.from(sourcesMap.values());
    }, [savedMessages]);

    if (isLoading) {
        return <div className="placeholder-content">Завантаження...</div>;
    }

    if (selectedSource) {
        const messagesFromSource = savedMessages.filter(msg => msg.savedFrom?.chatId === selectedSource.id);
        return (
            <div className="source-messages-view">
                 <header className="source-messages-header">
                    <button onClick={() => setSelectedSource(null)}>&larr;</button>
                    <img src={selectedSource.photoURL || default_picture} alt={selectedSource.name} className="source-header-avatar" />
                    <h4>{selectedSource.name}</h4>
                </header>
                <div className="messages-area">
                    {messagesFromSource.map(msg => (
                         <MessageBubble
                            key={msg.id}
                            message={msg}
                            isSent={false}
                            senderInfo={{ 
                                displayName: msg.originalSender?.name || 'Unknown', 
                                photoURL: msg.originalSender?.photoURL 
                            }}
                            isSavedContext={true}
                         />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="saved-chats-list">
             {chatSources.length > 0 ? chatSources.map(source => (
                <div key={source.id} className="conversation-item" onClick={() => setSelectedSource(source)}>
                    <div className="conversation-item-main">
                        <img src={source.photoURL || default_picture} alt={source.name} />
                        <div className="conversation-details">
                            <p className="conversation-name">{source.name}</p>
                            <p className="conversation-last-message">
                                {source.messageCount} збережених повідомлень
                            </p>
                        </div>
                    </div>
                </div>
             )) : (
                <div className="placeholder-content">
                    <BookmarkIcon className="placeholder-icon"/>
                    <h4>Тут будуть чати</h4>
                    <p>Пересилайте повідомлення в "Збережене", і вони з'являться тут, згруповані за джерелом.</p>
                </div>
             )}
        </div>
    );
};

export default SavedChatsTab;