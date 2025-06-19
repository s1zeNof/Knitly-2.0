import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext';
import { db } from './firebase';
import { collection, query, where, onSnapshot, orderBy, doc, addDoc, serverTimestamp, updateDoc, getDocs, writeBatch, arrayUnion } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { getIconComponent } from './FolderIcons';
import './MessagesPage.css';
import default_picture from './img/Default-Images/default-picture.svg';
import CreateGroupModal from './CreateGroupModal';
import ChatContextMenu from './ChatContextMenu';
import GroupInfoPanel from './GroupInfoPanel';
import ConfirmationModal from './ConfirmationModal';
import AttachmentMenu from './AttachmentMenu'; // <<< ДОДАНО ІМПОРТ

// Іконки
const AllChatsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const PersonalIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const NewGroupIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const PlayIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>;
const SendIcon = () => <svg height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>;
const BackArrowIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7"></path></svg>;
const PaperclipIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>; // <<< ДОДАНО ІКОНКУ

const MessagesPage = () => {
    const { user: currentUser, authLoading } = useUserContext();
    const { handlePlayPause } = usePlayerContext();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [activeFolderId, setActiveFolderId] = useState('all');
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [myTracks, setMyTracks] = useState([]);
    const [isCreateGroupModalOpen, setCreateGroupModalOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, convo: null });
    const [infoPanelOpenFor, setInfoPanelOpenFor] = useState(null);
    const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, convo: null });
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false); // <<< ДОДАНО СТАН

    const messagesEndRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!currentUser) {
            if (!authLoading) setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(
            collection(db, 'chats'), 
            where('participants', 'array-contains', currentUser.uid),
            orderBy('lastUpdatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const convos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(convo => !(convo.hiddenFor && convo.hiddenFor.includes(currentUser.uid)));
            setConversations(convos);
            if (location.state?.conversationId && !selectedConversationId) {
                const convoToOpen = convos.find(c => c.id === location.state.conversationId);
                if (convoToOpen) {
                    setSelectedConversationId(convoToOpen.id);
                }
                navigate(location.pathname, { replace: true, state: {} });
            }
            setLoading(false);
        }, (error) => {
            console.error("Помилка при завантаженні чатів (onSnapshot):", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser, authLoading, location.state, location.pathname, navigate]);
    
    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        const messagesQuery = query(collection(db, 'chats', selectedConversationId, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            setLoadingMessages(false);
        }, (error) => {
            console.error("Помилка завантаження повідомлень:", error);
            setLoadingMessages(false);
        });
        return () => unsubscribe();
    }, [selectedConversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!currentUser) return;
        const fetchMyTracks = async () => {
            const tracksQuery = query(collection(db, 'tracks'), where('authorId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(tracksQuery);
            setMyTracks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchMyTracks();
    }, [currentUser]);

    const filteredConversations = useMemo(() => {
        if (activeFolderId === 'all') return conversations;
        if (activeFolderId === 'personal') return conversations.filter(c => !c.isGroup);
        const activeFolder = currentUser?.chatFolders?.find(f => f.id === activeFolderId);
        if (activeFolder) return conversations.filter(c => activeFolder.includedChats.includes(c.id));
        return [];
    }, [conversations, activeFolderId, currentUser]);

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId);
    }, [conversations, selectedConversationId]);
    
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
            const chatRef = doc(db, 'chats', convoToDelete.id);
            const messagesQuery = query(collection(chatRef, 'messages'));
            try {
                const messagesSnapshot = await getDocs(messagesQuery);
                const batch = writeBatch(db);
                messagesSnapshot.forEach(doc => { batch.delete(doc.ref); });
                batch.delete(chatRef);
                await batch.commit();
            } catch (error) { console.error("Помилка видалення чату для всіх:", error); }
        } else {
            const chatRef = doc(db, 'chats', convoToDelete.id);
            try { await updateDoc(chatRef, { hiddenFor: arrayUnion(currentUser.uid) }); } catch (error) { console.error("Помилка приховування/видалення чату:", error); }
        }
        if (selectedConversationId === convoToDelete.id) {
            setSelectedConversationId(null);
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
        return <div className="messages-page-loading">Завантаження...</div>;
    }
    
    const defaultFolders = [{ id: 'all', name: 'Усі', icon: 'all', component: <AllChatsIcon /> }, { id: 'personal', name: 'Особисті', icon: 'personal', component: <PersonalIcon /> }];
    const userFolders = (currentUser?.chatFolders || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    const allFolders = [...defaultFolders, ...userFolders];
    const companion = getCompanion(selectedConversation);

    return (
        <div className={`messages-page-container ${!selectedConversationId ? 'no-chat-selected' : ''}`}>
            <aside className="folders-icon-sidebar">
                {allFolders.map(folder => (<button key={folder.id} className={`folder-icon-item ${activeFolderId === folder.id ? 'active' : ''}`} onClick={() => setActiveFolderId(folder.id)} title={folder.name}>{folder.component || getIconComponent(folder.icon)}</button>))}
            </aside>
            <div className="main-chat-wrapper">
                <div className={`folder-tabs-mobile ${selectedConversationId ? 'hidden-mobile' : ''}`}>
                    {allFolders.map(folder => (<button key={folder.id} className={`mobile-tab-item ${activeFolderId === folder.id ? 'active' : ''}`} onClick={() => setActiveFolderId(folder.id)}>{folder.component || getIconComponent(folder.icon)}<span>{folder.name}</span></button>))}
                </div>
                <div className="chat-area-grid">
                    <aside className={`conversations-sidebar ${selectedConversationId ? 'hidden-mobile' : ''}`}>
                        <div className="conversations-header"><h2>{allFolders.find(f => f.id === activeFolderId)?.name || 'Чати'}</h2><button className="new-group-button" onClick={() => setCreateGroupModalOpen(true)}><NewGroupIcon /></button></div>
                        <div className="conversations-list">
                            {filteredConversations.length > 0 ? (filteredConversations.map(convo => {
                                const currentCompanion = !convo.isGroup ? getCompanion(convo) : null;
                                const convoName = convo.isGroup ? convo.groupName : currentCompanion?.displayName;
                                const convoPhoto = convo.isGroup ? convo.groupPhotoURL || default_picture : currentCompanion?.photoURL;
                                return (<div key={convo.id} className={`conversation-item ${selectedConversationId === convo.id ? 'active' : ''}`} onClick={() => setSelectedConversationId(convo.id)} onContextMenu={(e) => handleContextMenu(e, convo)}>
                                    <img src={convoPhoto || default_picture} alt={convoName} />
                                    <div className="conversation-details"><p className="conversation-name">{convoName || 'Користувач'}</p><p className="conversation-last-message">{convo.lastMessage?.text || ' '}</p></div>
                                </div>);
                            })) : (<p className="no-conversations">Чати не знайдено</p>)}
                        </div>
                    </aside>
                    <main className={`chat-window ${!selectedConversationId ? 'hidden-mobile' : ''}`}>
                        {selectedConversation ? (<>
                            <div className="chat-header">
                                <button className="back-button-mobile" onClick={() => setSelectedConversationId(null)}><BackArrowIcon /></button>
                                <img src={selectedConversation.isGroup ? selectedConversation.groupPhotoURL || default_picture : companion?.photoURL || default_picture} alt="avatar" onClick={openInfoPanel}/>
                                <h3 onClick={openInfoPanel}>{selectedConversation.isGroup ? selectedConversation.groupName : companion?.displayName}</h3>
                            </div>
                            <div className="messages-area">
                                {loadingMessages ? (<p className="chat-placeholder">Завантаження...</p>) : (messages.map(msg => {
                                    const isSent = msg.senderId === currentUser.uid;
                                    const senderInfo = selectedConversation.isGroup ? selectedConversation.participantInfo.find(p => p.uid === msg.senderId) : null;
                                    return (<div key={msg.id} className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
                                        {!isSent && <img src={senderInfo?.photoURL || companion?.photoURL || default_picture} alt="avatar" className="message-avatar"/>}
                                        <div className="message-content-wrapper">{!isSent && selectedConversation.isGroup && <p className="sender-name">{senderInfo?.displayName}</p>}
                                            <div className={`message-bubble ${msg.type === 'track' ? 'track-message' : ''}`}>
                                                {msg.type === 'text' && <p>{msg.content}</p>}
                                                {msg.type === 'track' && (<div className="track-message-card"><img src={msg.content.coverArtUrl || default_picture} alt={msg.content.title} /><div className="track-message-info"><p className="track-title">{msg.content.title}</p><p className="track-author">{msg.content.authorName}</p></div><button className="play-track-button" onClick={() => handlePlayPause(msg.content)}><PlayIcon /></button></div>)}
                                            </div>
                                        </div>
                                    </div>)
                                }))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="message-input-area">
                                <button className="attachment-button" onClick={() => setIsAttachmentMenuOpen(true)}>
                                    <PaperclipIcon />
                                </button>
                                <form onSubmit={handleSendMessage} className="message-input-form"><input type="text" placeholder="Напишіть повідомлення..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} /><button type="submit" disabled={!newMessage.trim()}><SendIcon/></button></form>
                            </div>
                        </>) : (<div className="chat-placeholder"><h3>Оберіть чат, щоб розпочати спілкування</h3><p>Або створіть нову групу.</p></div>)}
                    </main>
                    <aside className="music-sharing-sidebar">
                        <div className="conversations-header"><h4>Поділитися музикою</h4></div>
                        <div className="music-sharing-list">
                            {myTracks.length > 0 ? (myTracks.map(track => (<div key={track.id} className="music-share-item"><img src={track.coverArtUrl || default_picture} alt={track.title} /><div className="music-share-info"><p className="track-title">{track.title}</p><p className="track-author">{track.authorName}</p></div><button className="share-button" onClick={() => handleShareTrack(track)} disabled={!selectedConversationId}>Поділитися</button></div>))) : (<p className="no-conversations">У вас ще немає треків.</p>)}
                        </div>
                    </aside>
                </div>
            </div>
            {isCreateGroupModalOpen && (<CreateGroupModal onClose={() => setCreateGroupModalOpen(false)} onGroupCreated={handleGroupCreated}/>)}
            <ChatContextMenu {...contextMenu} onClose={() => setContextMenu({ ...contextMenu, show: false })} onAction={handleContextMenuAction} />
            {infoPanelOpenFor && (<GroupInfoPanel conversation={infoPanelOpenFor} currentUser={currentUser} onClose={() => setInfoPanelOpenFor(null)}/>)}
            <ConfirmationModal isOpen={deleteModalState.isOpen} onClose={() => setDeleteModalState({ isOpen: false, convo: null })} onConfirm={handleConfirmDelete} title="Видалити чат?" message={`Ви впевнені, що хочете видалити цей чат? Цю дію не можна буде скасувати.`} confirmText="Видалити" showCheckbox={!deleteModalState.convo?.isGroup} checkboxLabel={`Видалити також для ${getCompanion(deleteModalState.convo)?.displayName}`}/>
            <AttachmentMenu isOpen={isAttachmentMenuOpen} onClose={() => setIsAttachmentMenuOpen(false)} />
        </div>
    );
};

export default MessagesPage;