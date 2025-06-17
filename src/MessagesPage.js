import React, { useState, useEffect, useRef } from 'react';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext';
import { db } from './firebase';
import { collection, query, where, onSnapshot, orderBy, doc, addDoc, serverTimestamp, updateDoc, getDocs, writeBatch, arrayUnion } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import './MessagesPage.css';
import default_picture from './img/Default-Images/default-picture.svg';
import CreateGroupModal from './CreateGroupModal';
import ChatContextMenu from './ChatContextMenu';
import GroupInfoPanel from './GroupInfoPanel';
import ConfirmationModal from './ConfirmationModal';

const PlayIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>;
const SendIcon = () => <svg height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>;
const NewGroupIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

const MessagesPage = () => {
    const { user: currentUser, authLoading } = useUserContext();
    const { handlePlayPause } = usePlayerContext();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [myTracks, setMyTracks] = useState([]);
    const [isCreateGroupModalOpen, setCreateGroupModalOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, convo: null });
    const [infoPanelOpenFor, setInfoPanelOpenFor] = useState(null);
    const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, convo: null });

    const messagesEndRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            if (!authLoading) setLoading(false);
            return;
        }
        setLoading(true);
        // ВИДАЛЕНО ПОМИЛКОВУ УМОВУ 'where('hiddenFor', ...)'
        const q = query(
            collection(db, 'chats'), 
            where('participants', 'array-contains', currentUser.uid),
            orderBy('lastUpdatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const convos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                // Фільтруємо на клієнті, це безпечно і вирішує проблему
                .filter(convo => !(convo.hiddenFor && convo.hiddenFor.includes(currentUser.uid)));
            
            setConversations(convos);
            
            if (location.state?.conversationId && !selectedConversation) {
                const convoToOpen = convos.find(c => c.id === location.state.conversationId);
                if (convoToOpen) {
                    setSelectedConversation(convoToOpen);
                }
                navigate(location.pathname, { replace: true, state: {} });
            }
            if(loading) setLoading(false);
        }, (error) => {
            console.error("Помилка при завантаженні чатів (onSnapshot):", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser, authLoading]);
    
    useEffect(() => {
        if (!selectedConversation) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        const messagesQuery = query(collection(db, 'chats', selectedConversation.id, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            setLoadingMessages(false);
        }, (error) => {
            console.error("Помилка завантаження повідомлень:", error);
            setLoadingMessages(false);
        });
        return () => unsubscribe();
    }, [selectedConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!currentUser) return;
        const fetchMyTracks = async () => {
            const tracksQuery = query(collection(db, 'tracks'), where('authorId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(tracksQuery);
            setMyTracks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchMyTracks();
    }, [currentUser]);
    
    const handleGroupCreated = (newChatId) => {
        setCreateGroupModalOpen(false);
        navigate('/messages', { state: { conversationId: newChatId } });
    };

    const getCompanion = (convo) => convo?.participantInfo.find(p => p.uid !== currentUser.uid);

    const sendMessage = async (type, content) => {
        if (!selectedConversation || !currentUser) return;
        try {
            await addDoc(collection(db, 'chats', selectedConversation.id, 'messages'), { senderId: currentUser.uid, type, content, timestamp: serverTimestamp() });
            await updateDoc(doc(db, 'chats', selectedConversation.id), { lastMessage: { text: type === 'track' ? `🎵 ${content.title}` : content, senderId: currentUser.uid }, lastUpdatedAt: serverTimestamp() });
        } catch (error) { console.error("Помилка відправки повідомлення:", error); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        sendMessage('text', newMessage);
        setNewMessage('');
    };

    const handleShareTrack = (track) => {
        if (!track) return;
        const trackData = { id: track.id, title: track.title, authorName: track.authorName, coverArtUrl: track.coverArtUrl, trackUrl: track.trackUrl };
        sendMessage('track', trackData);
    };

    const handleContextMenu = (e, convo) => {
        e.preventDefault();
        setContextMenu({ show: true, x: e.pageX, y: e.pageY, convo });
    };

    const handleConfirmDelete = async (deleteForEveryone) => {
        const convoToDelete = deleteModalState.convo;
        if (!convoToDelete || !currentUser) return;

        if (deleteForEveryone && !convoToDelete.isGroup) {
            // Видалення для всіх (працює тільки для 1-на-1 чатів наразі)
            const chatRef = doc(db, 'chats', convoToDelete.id);
            const messagesQuery = query(collection(chatRef, 'messages'));
            
            try {
                const messagesSnapshot = await getDocs(messagesQuery);
                const batch = writeBatch(db);
                messagesSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                batch.delete(chatRef);
                await batch.commit();
            } catch (error) {
                console.error("Помилка видалення чату для всіх:", error);
            }
        } else {
            // Приховування для себе (або видалення групи для всіх)
            const chatRef = doc(db, 'chats', convoToDelete.id);
            try {
                if (convoToDelete.isGroup) {
                    // Логіка видалення групи (поки що приховуємо)
                    await updateDoc(chatRef, { hiddenFor: arrayUnion(currentUser.uid) });
                } else {
                    await updateDoc(chatRef, { hiddenFor: arrayUnion(currentUser.uid) });
                }
            } catch (error) {
                console.error("Помилка приховування/видалення чату:", error);
            }
        }

        if (selectedConversation?.id === convoToDelete.id) {
            setSelectedConversation(null);
        }
        setDeleteModalState({ isOpen: false, convo: null });
    };

    const handleContextMenuAction = (action) => {
        if (action === 'delete') {
            setDeleteModalState({ isOpen: true, convo: contextMenu.convo });
        } else {
            alert(`Функція "${action}" буде реалізована пізніше.`);
        }
        setContextMenu({ ...contextMenu, show: false });
    };
    
    const openInfoPanel = () => {
        if (selectedConversation?.isGroup) {
            setInfoPanelOpenFor(selectedConversation);
        }
    };

    if (authLoading || loading) {
        return <div className="messages-page-loading">Завантаження чатів...</div>;
    }
    
    const companion = getCompanion(selectedConversation);

    return (
        <div className="messages-page-container">
            {infoPanelOpenFor && (
                <GroupInfoPanel
                    conversation={infoPanelOpenFor}
                    currentUser={currentUser}
                    onClose={() => setInfoPanelOpenFor(null)}
                />
            )}
            <aside className="conversations-sidebar">
                <div className="conversations-header">
                    <h2>Чати</h2>
                    <button className="new-group-button" onClick={() => setCreateGroupModalOpen(true)}>
                        <NewGroupIcon />
                    </button>
                </div>
                <div className="conversations-list">
                    {conversations.length > 0 ? (
                        conversations.map(convo => {
                            const isGroup = convo.isGroup;
                            const currentCompanion = !isGroup ? getCompanion(convo) : null;
                            const convoName = isGroup ? convo.groupName : currentCompanion?.displayName;
                            const convoPhoto = isGroup ? convo.groupPhotoURL || default_picture : currentCompanion?.photoURL;
                            
                            return (
                                <div key={convo.id} className={`conversation-item ${selectedConversation?.id === convo.id ? 'active' : ''}`} onClick={() => setSelectedConversation(convo)} onContextMenu={(e) => handleContextMenu(e, convo)}>
                                    <img src={convoPhoto || default_picture} alt={convoName} />
                                    <div className="conversation-details">
                                        <p className="conversation-name">{convoName || 'Користувач'}</p>
                                        <p className="conversation-last-message">{convo.lastMessage?.text || 'Повідомлень ще немає'}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="no-conversations">У вас ще немає діалогів.</p>
                    )}
                </div>
            </aside>
            <main className="chat-window">
                {selectedConversation ? (
                    <>
                        <div className="chat-header" onClick={openInfoPanel}>
                            <img src={selectedConversation.isGroup ? selectedConversation.groupPhotoURL || default_picture : companion?.photoURL || default_picture} alt="avatar" />
                            <h3>{selectedConversation.isGroup ? selectedConversation.groupName : companion?.displayName}</h3>
                        </div>
                        <div className="messages-area">
                            {loadingMessages ? (<p className="chat-placeholder">Завантаження...</p>) : (
                                messages.map(msg => {
                                    const isSent = msg.senderId === currentUser.uid;
                                    const senderInfo = selectedConversation.isGroup ? selectedConversation.participantInfo.find(p => p.uid === msg.senderId) : null;
                                    return (
                                    <div key={msg.id} className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
                                        {!isSent && <img src={senderInfo?.photoURL || companion?.photoURL || default_picture} alt="avatar" className="message-avatar"/>}
                                        <div className="message-content-wrapper">
                                            {!isSent && selectedConversation.isGroup && <p className="sender-name">{senderInfo?.displayName}</p>}
                                            <div className={`message-bubble ${msg.type === 'track' ? 'track-message' : ''}`}>
                                                {msg.type === 'text' && <p>{msg.content}</p>}
                                                {msg.type === 'track' && (
                                                    <div className="track-message-card">
                                                        <img src={msg.content.coverArtUrl || default_picture} alt={msg.content.title} />
                                                        <div className="track-message-info">
                                                            <p className="track-title">{msg.content.title}</p>
                                                            <p className="track-author">{msg.content.authorName}</p>
                                                        </div>
                                                        <button className="play-track-button" onClick={() => handlePlayPause(msg.content)}><PlayIcon /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="message-input-area">
                            <form onSubmit={handleSendMessage} className="message-input-form">
                                <input type="text" placeholder="Напишіть повідомлення..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                <button type="submit" disabled={!newMessage.trim()}><SendIcon/></button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="chat-placeholder">
                        <h3>Оберіть чат, щоб розпочати спілкування</h3>
                        <p>Або створіть нову групу.</p>
                    </div>
                )}
            </main>
            <aside className="music-sharing-sidebar">
                 <div className="conversations-header"><h4>Поділитися музикою</h4></div>
                 <div className="music-sharing-list">
                    {myTracks.length > 0 ? (
                        myTracks.map(track => (
                            <div key={track.id} className="music-share-item">
                                <img src={track.coverArtUrl || default_picture} alt={track.title} />
                                <div className="music-share-info">
                                    <p className="track-title">{track.title}</p>
                                    <p className="track-author">{track.authorName}</p>
                                </div>
                                <button className="share-button" onClick={() => handleShareTrack(track)} disabled={!selectedConversation}>
                                    Поділитися
                                </button>
                            </div>
                        ))
                    ) : (<p className="no-conversations">У вас ще немає треків.</p>)}
                 </div>
            </aside>
            {isCreateGroupModalOpen && (
                <CreateGroupModal 
                    onClose={() => setCreateGroupModalOpen(false)} 
                    onGroupCreated={handleGroupCreated}
                />
            )}
            <ChatContextMenu {...contextMenu} onClose={() => setContextMenu({ ...contextMenu, show: false })} onAction={handleContextMenuAction} />
            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ isOpen: false, convo: null })}
                onConfirm={handleConfirmDelete}
                title="Видалити чат?"
                message={`Ви впевнені, що хочете видалити цей чат? Цю дію не можна буде скасувати.`}
                confirmText="Видалити"
                showCheckbox={!deleteModalState.convo?.isGroup}
                checkboxLabel={`Видалити також для ${getCompanion(deleteModalState.convo)?.displayName}`}
            />
        </div>
    );
};

export default MessagesPage;