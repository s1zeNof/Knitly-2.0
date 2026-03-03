import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useUserContext } from '../contexts/UserContext';
import { usePlayerContext } from '../contexts/PlayerContext';
import { db } from '../services/firebase';
import { uploadFileWithProgress } from '../services/supabase';
import { collection, query, where, onSnapshot, orderBy, doc, addDoc, serverTimestamp, updateDoc, writeBatch, arrayUnion, arrayRemove, deleteDoc, getDoc, increment, runTransaction } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { getIconComponent } from '../components/common/FolderIcons';
import './MessagesPage.css';
import default_picture from '../img/Default-Images/default-picture.svg';
import ImageViewerModal from '../components/common/ImageViewerModal';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import GroupInfoPanel from '../components/chat/GroupInfoPanel';
import ConfirmationModal from '../components/common/ConfirmationModal';
import AttachmentMenu from '../components/chat/AttachmentMenu';
import MessageBubble from '../components/chat/MessageBubble';
import MessageContextMenu from '../components/chat/MessageContextMenu';
import SelectionHeader from '../components/chat/SelectionHeader';
import ReplyPreview from '../components/chat/ReplyPreview';
import PinnedMessagesBar from '../components/chat/PinnedMessagesBar';
import StoragePanel from '../components/chat/StoragePanel';
import BookmarkIcon from '../components/common/BookmarkIcon';
import VerifiedBadge from '../components/common/VerifiedBadge';
import ForwardModal from '../components/common/ForwardModal';
import ShareMusicModal from '../components/common/ShareMusicModal';
import EmojiPickerPlus from '../components/chat/EmojiPickerPlus';
import { isPackAnimated } from '../utils/emojiPackCache';

// Lazy load: не завантажуємо react-easy-crop до першого відкриття редактора
// (поза блоком static imports — після всіх import-рядків)
const ImageEditorModal = React.lazy(() => import('../components/common/ImageEditorModal'));

// Іконки
const AllChatsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const PersonalIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const NewGroupIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const SendIcon = () => <svg height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>;
const BackArrowIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7"></path></svg>;
const PaperclipIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>;

const getMessagePreviewText = (message) => {
    if (!message || !message.type || !message.content) return '';
    switch (message.type) {
        case 'text': return message.content;
        case 'track': return `🎵 ${message.content.title}`;
        case 'album': return `💿 ${message.content.title}`;
        case 'image': return `📷 Фото${message.content.originalName ? ` ${message.content.originalName}` : ''}`;
        case 'video': return `📹 Відео${message.content.originalName ? ` ${message.content.originalName}` : ''}`;
        case 'image_gif': return `🖼️ GIF${message.content.originalName ? ` ${message.content.originalName}` : ''}`;
        default: return 'Медіавкладення';
    }
};

const MessagesPage = ({ openBrowser }) => {
    const { user: currentUser, authLoading } = useUserContext();
    const { showNotification, currentTrack } = usePlayerContext();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [activeFolderId, setActiveFolderId] = useState('all');
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isCreateGroupModalOpen, setCreateGroupModalOpen] = useState(false);
    const [infoPanelOpenFor, setInfoPanelOpenFor] = useState(null);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, message: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, message: null });
    const [multiDeleteModal, setMultiDeleteModal] = useState(false);
    const [deletingMessages, setDeletingMessages] = useState([]);
    const [isStoragePanelOpen, setStoragePanelOpen] = useState(false);
    const [forwardingMessages, setForwardingMessages] = useState(null);
    const [isShareMusicModalOpen, setShareMusicModalOpen] = useState(false);
    const [isFullPickerOpen, setIsFullPickerOpen] = useState(false);
    const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
    const [imageForEditor, setImageForEditor] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showUploadOverlay, setShowUploadOverlay] = useState(false);
    // uid → roles[] — для відображення verified-бейджу у компаньонів
    const [companionRoles, setCompanionRoles] = useState({});
    const [viewingImage, setViewingImage] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [swipeState, setSwipeState] = useState({ startX: 0, deltaX: 0, isSwiping: false });
    const chatWindowRef = useRef(null);
    const isPlayerVisible = !!currentTrack;

    useEffect(() => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile && selectedConversationId) {
            document.body.classList.add('in-chat-view');
        } else {
            document.body.classList.remove('in-chat-view');
        }
        return () => document.body.classList.remove('in-chat-view');
    }, [selectedConversationId]);

    const getCompanion = (convo) => {
        if (!convo || !convo.participantInfo || !currentUser) return null;
        return convo.participantInfo.find(p => p.uid !== currentUser.uid);
    }

    const selectedConversation = useMemo(() => {
        if (selectedConversationId === 'saved_messages') {
            return { id: 'saved_messages', isGroup: false, groupName: 'Збережене', participantInfo: [currentUser], participants: [currentUser?.uid] };
        }
        return conversations.find(c => c.id === selectedConversationId);
    }, [conversations, selectedConversationId, currentUser]);

    // Redirect non-authenticated users away from messages
    useEffect(() => {
        if (!authLoading && !currentUser) {
            navigate('/', { replace: true });
        }
    }, [authLoading, currentUser, navigate]);

    useEffect(() => {
        if (!currentUser) { if (!authLoading) setLoading(false); return; }
        setLoading(true);
        const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUser.uid), orderBy('lastUpdatedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const convos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(convo => !(convo.hiddenFor?.includes(currentUser.uid)));
            setConversations(convos);
            if (location.state?.conversationId && !selectedConversationId) {
                const convoToOpen = convos.find(c => c.id === location.state.conversationId);
                if (convoToOpen) handleSelectConversation(convoToOpen.id);
                navigate(location.pathname, { replace: true, state: {} });
            }
            setLoading(false);
        }, (error) => { console.error("Помилка завантаження чатів:", error); setLoading(false); });
        return () => unsubscribe();
    }, [currentUser, authLoading, location.pathname, navigate, selectedConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!selectedConversationId || !currentUser?.uid) {
            setMessages([]); return;
        }
        setLoadingMessages(true);
        const messagesQuery = selectedConversationId === 'saved_messages'
            ? query(collection(db, 'users', currentUser.uid, 'savedMessages'), orderBy('savedAt', 'asc'))
            : query(collection(db, 'chats', selectedConversationId, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(msg => !msg.deletedFor?.includes(currentUser.uid));
            setMessages(msgs);
            setLoadingMessages(false);
        }, (error) => { console.error("Помилка завантаження повідомлень:", error); setLoadingMessages(false); });
        return () => unsubscribe();
    }, [selectedConversationId, currentUser?.uid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* ── Завантажуємо roles для всіх компаньонів (1-on-1 чати) ──
       Потрібно, щоб показати verified-бейдж у списку чатів і заголовку.
       participantInfo у Firestore не зберігає roles — тому читаємо окремо. */
    useEffect(() => {
        if (!currentUser || conversations.length === 0) return;
        const uids = [...new Set(
            conversations
                .filter(c => !c.isGroup)
                .flatMap(c => (c.participantInfo || []).map(p => p.uid))
                .filter(uid => uid && uid !== currentUser.uid)
        )];
        if (uids.length === 0) return;
        Promise.all(uids.map(uid => getDoc(doc(db, 'users', uid))))
            .then(snaps => {
                const map = {};
                snaps.forEach(snap => { if (snap.exists()) map[snap.id] = snap.data().roles || []; });
                setCompanionRoles(map);
            })
            .catch(() => {/* якщо rules блокують — просто без бейджу */});
    }, [conversations, currentUser]);

    const handleSwipeStart = (e) => {
        if (e.touches[0].clientX < 50) {
            setSwipeState({ startX: e.touches[0].clientX, deltaX: 0, isSwiping: true });
            if (chatWindowRef.current) chatWindowRef.current.classList.add('is-swiping');
        }
    };
    const handleSwipeMove = (e) => {
        if (!swipeState.isSwiping) return;
        const deltaX = e.touches[0].clientX - swipeState.startX;
        if (deltaX > 0) setSwipeState(prev => ({ ...prev, deltaX }));
    };
    const handleSwipeEnd = () => {
        if (!swipeState.isSwiping) return;
        if (chatWindowRef.current) chatWindowRef.current.classList.remove('is-swiping');
        if (swipeState.deltaX > window.innerWidth / 3) setSelectedConversationId(null);
        setSwipeState({ startX: 0, deltaX: 0, isSwiping: false });
    };

    const allFolders = useMemo(() => [{ id: 'all', name: 'Усі', icon: 'all', component: <AllChatsIcon /> }, { id: 'personal', name: 'Особисті', icon: 'personal', component: <PersonalIcon /> }, ...(currentUser?.chatFolders || []).sort((a, b) => (a.order || 0) - (b.order || 0))], [currentUser?.chatFolders]);
    const folderUnreadCounts = useMemo(() => {
        if (!currentUser?.uid) return {};
        const counts = {};
        allFolders.forEach(folder => {
            let unreadChats = 0;
            if (folder.id === 'all') unreadChats = conversations.filter(c => (c.unreadCounts?.[currentUser.uid] || 0) > 0).length;
            else if (folder.id === 'personal') unreadChats = conversations.filter(c => !c.isGroup && (c.unreadCounts?.[currentUser.uid] || 0) > 0).length;
            else { const chatIdsInFolder = new Set(folder.includedChats); unreadChats = conversations.filter(c => chatIdsInFolder.has(c.id) && (c.unreadCounts?.[currentUser.uid] || 0) > 0).length; }
            counts[folder.id] = unreadChats;
        });
        return counts;
    }, [conversations, currentUser, allFolders]);

    const savedMessagesChat = useMemo(() => ({ id: 'saved_messages', groupName: 'Збережене', lastMessage: { text: 'Ваші нотатки та файли' }, isVirtual: true }), []);

    const handleSelectConversation = async (convoId) => {
        if (selectionMode) exitSelectionMode();
        setSelectedConversationId(convoId);
        if (convoId !== 'saved_messages' && currentUser?.uid) {
            const chatRef = doc(db, 'chats', convoId);
            try { await updateDoc(chatRef, { [`unreadCounts.${currentUser.uid}`]: 0 }); } catch (error) { console.error("Помилка обнулення лічильника:", error); }
        }
    };

    const handleMessageReaction = async (message, reactionId, customUrl = null) => {
        if (!selectedConversationId || selectedConversationId === 'saved_messages' || !currentUser) return;
        const messageRef = doc(db, 'chats', selectedConversationId, 'messages', message.id);

        const [packId] = reactionId.split('_');
        const isAnimated = isPackAnimated(packId);

        try {
            await runTransaction(db, async (transaction) => {
                const messageDoc = await transaction.get(messageRef);
                if (!messageDoc.exists()) throw new Error("Повідомлення не знайдено!");

                const data = messageDoc.data();
                const reactions = (typeof data.reactions === 'object' && data.reactions !== null && !Array.isArray(data.reactions)) ? data.reactions : {};
                let reactionData = reactions[reactionId] || { uids: [] };

                const currentUserUid = currentUser.uid;
                const userIndex = reactionData.uids.indexOf(currentUserUid);

                if (userIndex > -1) {
                    reactionData.uids.splice(userIndex, 1);
                } else {
                    reactionData.uids.push(currentUserUid);
                }

                if (customUrl) {
                    reactionData.url = customUrl;
                    if (isAnimated) {
                        reactionData.isAnimated = true;
                    }
                }

                if (reactionData.uids.length > 0) {
                    reactions[reactionId] = reactionData;
                } else {
                    delete reactions[reactionId];
                }

                transaction.update(messageRef, { reactions });
            });
        } catch (error) {
            console.error("Помилка додавання реакції:", error);
            showNotification("Не вдалося поставити реакцію.", "error");
        }
    };

    const handleEmojiSelect = (emoji, isCustom = false) => {
        if (contextMenu.message) {
            let reactionId, customUrl = null;
            if (isCustom) { reactionId = `${emoji.packId}_${emoji.name}`; customUrl = emoji.url; } else { reactionId = `unicode_${emoji}`; }
            handleMessageReaction(contextMenu.message, reactionId, customUrl);
        }
        setContextMenu({ show: false, x: 0, y: 0, message: null });
        setIsFullPickerOpen(false);
    };
    const handleOpenFullPicker = () => { setContextMenu({ show: false, x: 0, y: 0, message: contextMenu.message }); setIsFullPickerOpen(true); };
    const exitSelectionMode = () => { setSelectionMode(false); setSelectedMessages([]); };
    const handleLongPress = (message) => { if (!selectionMode) { setSelectionMode(true); setSelectedMessages([message.id]); } };
    const handleToggleSelect = (message) => {
        const newSelected = selectedMessages.includes(message.id) ? selectedMessages.filter(id => id !== message.id) : [...selectedMessages, message.id];
        if (newSelected.length === 0) exitSelectionMode(); else setSelectedMessages(newSelected);
    };
    const handleContextMenu = (e, message) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ show: true, x: e.pageX, y: e.pageY, message: message }); };
    const handlePinMessage = async (message) => {
        if (!selectedConversationId || selectedConversationId === 'saved_messages') return;
        const chatRef = doc(db, "chats", selectedConversationId);
        const currentPins = selectedConversation.pinnedMessages || [];
        const pinData = { messageId: message.id, content: getMessagePreviewText(message), senderName: selectedConversation.participantInfo.find(p => p.uid === message.senderId)?.displayName || 'User', timestamp: message.timestamp };
        const isAlreadyPinned = currentPins.some(p => p.messageId === message.id);
        try {
            if (isAlreadyPinned) { const pinToRemove = currentPins.find(p => p.messageId === message.id); if (pinToRemove) await updateDoc(chatRef, { pinnedMessages: arrayRemove(pinToRemove) }); }
            else { await updateDoc(chatRef, { pinnedMessages: arrayUnion(pinData) }); }
        } catch (error) { console.error("Помилка закріплення повідомлення:", error); }
    };
    const scrollToMessage = (messageId) => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) { messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); messageElement.classList.add('highlight'); setTimeout(() => messageElement.classList.remove('highlight'), 1500); }
    };
    const handleContextMenuAction = (action, message) => {
        setContextMenu({ show: false, x: 0, y: 0, message: null });
        switch (action) {
            case 'reply': setReplyingTo(message); break;
            case 'edit': if (message.type === 'text') { setEditingMessage(message); setNewMessage(message.content); } else { showNotification("Редагувати можна лише текстові повідомлення.", "info"); } break;
            case 'delete': setDeleteModal({ isOpen: true, message: message }); break;
            case 'forward': setForwardingMessages([message]); break;
            case 'pin': handlePinMessage(message); break;
            case 'select':
                setSelectionMode(true);
                setSelectedMessages([message.id]);
                break;
            default: break;
        }
    };
    const handleCloseContextMenu = () => setContextMenu({ show: false, x: 0, y: 0, message: null });
    const handleConfirmDelete = async (deleteForBoth) => {
        const messageToDelete = deleteModal.message;
        setDeleteModal({ isOpen: false, message: null });
        if (!messageToDelete || !currentUser) return;
        setDeletingMessages(prev => [...prev, messageToDelete.id]);
        setTimeout(async () => {
            try {
                const messageRef = doc(db, 'chats', selectedConversationId, 'messages', messageToDelete.id);
                if (deleteForBoth && !selectedConversation.isGroup) await deleteDoc(messageRef);
                else await updateDoc(messageRef, { deletedFor: arrayUnion(currentUser.uid) });
                showNotification("Повідомлення видалено.", "info");
            } catch (error) { console.error("Помилка видалення повідомлення:", error); showNotification("Не вдалося видалити повідомлення.", "error"); }
            finally { setDeletingMessages(prev => prev.filter(id => id !== messageToDelete.id)); }
        }, 600);
    };
    const handleDeleteSelected = async () => {
        setMultiDeleteModal(false);
        if (selectedMessages.length === 0 || !currentUser) return;
        setDeletingMessages(prev => [...prev, ...selectedMessages]);
        setTimeout(async () => {
            try {
                const batch = writeBatch(db);
                selectedMessages.forEach(messageId => { const messageRef = doc(db, 'chats', selectedConversationId, 'messages', messageId); batch.update(messageRef, { deletedFor: arrayUnion(currentUser.uid) }); });
                await batch.commit();
                showNotification(`${selectedMessages.length} повідомлень видалено.`, "info");
            } catch (error) { console.error("Помилка видалення повідомлень:", error); showNotification("Не вдалося видалити повідомлення.", "error"); }
            finally { setDeletingMessages(prev => prev.filter(id => !selectedMessages.includes(id))); exitSelectionMode(); }
        }, 600);
    };
    const sendMessage = async (messageContent, messageType = 'text', additionalData = {}) => {
        if (!currentUser || !selectedConversationId || selectedConversationId === 'saved_messages') { showNotification("Неможливо відправити повідомлення: чат не вибрано.", "error"); return; }
        if (messageType === 'text' && !messageContent.trim() && !editingMessage) return;
        const conversationRef = doc(db, 'chats', selectedConversationId);
        const messagesColRef = collection(db, 'chats', selectedConversationId, 'messages');
        let contentToSend = messageContent;
        if (['image', 'video', 'image_gif'].includes(messageType)) contentToSend = { url: messageContent, ...additionalData };
        const messageData = { senderId: currentUser.uid, type: messageType, timestamp: serverTimestamp(), reactions: {}, isEdited: false, replyTo: replyingTo ? { messageId: replyingTo.id, senderName: (replyingTo.senderId === currentUser.uid ? currentUser.displayName : getCompanion(selectedConversation)?.displayName) || 'Користувач', text: getMessagePreviewText(replyingTo), } : null, content: contentToSend, };
        try {
            if (editingMessage && editingMessage.type === 'text' && messageType === 'text') { const messageRef = doc(db, 'chats', selectedConversationId, 'messages', editingMessage.id); await updateDoc(messageRef, { content: contentToSend, isEdited: true }); setNewMessage(''); setEditingMessage(null); }
            else if (!editingMessage) {
                const addedDoc = await addDoc(messagesColRef, messageData);
                const finalMessage = { type: messageType, content: contentToSend, id: addedDoc.id, ...additionalData };
                const lastMessageText = getMessagePreviewText(finalMessage);
                await updateDoc(conversationRef, { lastMessage: { text: lastMessageText, senderId: currentUser.uid, messageId: addedDoc.id }, lastUpdatedAt: serverTimestamp(), ...Object.fromEntries(selectedConversation.participants.filter(uid => uid !== currentUser.uid).map(uid => [`unreadCounts.${uid}`, increment(1)])) });
            }
            if (messageType === 'text') setNewMessage('');
            if (replyingTo) setReplyingTo(null);
        } catch (error) { console.error("Помилка відправки повідомлення:", error); showNotification("Не вдалося відправити повідомлення.", "error"); }
    };
    const handleConfirmForward = async (destinationChatId) => {
        if (!forwardingMessages || forwardingMessages.length === 0 || !currentUser) { setForwardingMessages(null); return; }
        const batch = writeBatch(db);
        if (destinationChatId === 'saved_messages') {
            const savedMessagesRef = collection(db, 'users', currentUser.uid, 'savedMessages');
            for (const message of forwardingMessages) {
                const newSavedMessageRef = doc(savedMessagesRef);
                const originalSenderName = message.senderId === 'system' ? 'System' : selectedConversation.participantInfo.find(p => p.uid === message.senderId)?.displayName || 'Unknown User';
                const originalSenderPhoto = selectedConversation.participantInfo.find(p => p.uid === message.senderId)?.photoURL || null;
                const sourceChatName = selectedConversation.isGroup ? selectedConversation.groupName : getCompanion(selectedConversation)?.displayName || 'Чат';
                const sourceChatPhoto = (selectedConversation.isGroup ? selectedConversation.groupPhotoURL : getCompanion(selectedConversation)?.photoURL) || null;
                const savedMessageData = { ...message, id: newSavedMessageRef.id, savedAt: serverTimestamp(), savedFrom: { chatId: selectedConversationId, chatName: sourceChatName, isGroup: selectedConversation.isGroup || false, photoURL: sourceChatPhoto }, originalSender: { id: message.senderId, name: originalSenderName, photoURL: originalSenderPhoto, } };
                batch.set(newSavedMessageRef, savedMessageData);
            }
        } else {
            const destinationChatRef = doc(db, 'chats', destinationChatId);
            const destinationMessagesRef = collection(db, 'chats', destinationChatId, 'messages');
            const destinationChatSnap = await getDoc(destinationChatRef);
            if (!destinationChatSnap.exists()) { showNotification("Чат призначення не знайдено.", "error"); setForwardingMessages(null); return; }
            const destinationChatData = destinationChatSnap.data();
            let lastForwardedMessageForPreview = null;
            for (const message of forwardingMessages) {
                const newMessageRef = doc(destinationMessagesRef);
                const originalSenderName = message.senderId === 'system' ? 'System' : selectedConversation.participantInfo.find(p => p.uid === message.senderId)?.displayName || 'Unknown User';
                const newForwardedMessage = { ...message, id: newMessageRef.id, senderId: currentUser.uid, timestamp: serverTimestamp(), reactions: {}, isEdited: false, replyTo: null, forwardedFrom: { name: originalSenderName, chatId: selectedConversationId, }, deletedFor: [], };
                batch.set(newMessageRef, newForwardedMessage);
                lastForwardedMessageForPreview = newForwardedMessage;
            }
            if (lastForwardedMessageForPreview) {
                const lastMessageText = getMessagePreviewText(lastForwardedMessageForPreview);
                batch.update(destinationChatRef, { lastMessage: { text: lastMessageText, senderId: currentUser.uid, messageId: lastForwardedMessageForPreview.id }, lastUpdatedAt: serverTimestamp(), ...Object.fromEntries(destinationChatData.participants.map(uid => [`unreadCounts.${uid}`, increment(uid === currentUser.uid ? 0 : forwardingMessages.length)])) });
            }
        }
        try { await batch.commit(); const destinationName = destinationChatId === 'saved_messages' ? "Збережене" : "чат"; showNotification(`Повідомлення переслано в ${destinationName}!`, "info"); }
        catch (error) { console.error("Помилка пересилки повідомлень:", error); showNotification("Не вдалося переслати повідомлення.", "error"); }
        finally { setForwardingMessages(null); exitSelectionMode(); }
    };
    const handleSelectAttachment = (type) => { setIsAttachmentMenuOpen(false); if (type === 'music') setShareMusicModalOpen(true); else if (type === 'photoOrVideo') if (fileInputRef.current) fileInputRef.current.click(); };
    const handleFileSelected = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type.startsWith('image/') && !file.type.startsWith('image/gif')) { setImageForEditor(file); setIsImageEditorOpen(true); }
            else if (file.type.startsWith('video/') || file.type.startsWith('image/gif')) handleDirectFileUpload(file, file.type.startsWith('video/') ? 'video' : 'image_gif');
            else showNotification("Непідтримуваний тип файлу. Можна завантажувати лише фото, відео та GIF.", "error");
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    const handleDirectFileUpload = async (file, fileType) => {
        if (!currentUser || !selectedConversationId || selectedConversationId === 'saved_messages') {
            showNotification("Неможливо завантажити файл: чат не вибрано.", "error");
            return;
        }
        const fileExtension = file.name.split('.').pop();
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        const uniquePrefix = `${fileType}_${Date.now()}`;
        const fileName = `${uniquePrefix}_${baseName}.${fileExtension}`.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${selectedConversationId}/${currentUser.uid}/${fileName}`;

        setShowUploadOverlay(true);
        setUploadProgress(0);
        try {
            // Завантажуємо файл у Supabase (bucket: chat)
            const downloadURL = await uploadFileWithProgress(
                file,
                'chat',
                filePath,
                (progress) => setUploadProgress(progress)
            );
            sendMessage(downloadURL, fileType, { originalName: file.name, mimeType: file.type });
        } catch (error) {
            console.error(`Помилка завантаження ${fileType}:`, error);
            showNotification(`Не вдалося завантажити ${fileType === 'video' ? 'відео' : 'GIF'}.`, "error");
        } finally {
            setShowUploadOverlay(false);
            setUploadProgress(0);
        }
    };
    const base64ToBlob = (base64, mimeType) => { const byteCharacters = atob(base64.split(',')[1]); const byteNumbers = new Array(byteCharacters.length); for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); } const byteArray = new Uint8Array(byteNumbers); return new Blob([byteArray], { type: mimeType }); };
    const handleImageEditorSave = async (editedImageObject, quality) => {
        if (!currentUser || !selectedConversationId || selectedConversationId === 'saved_messages') {
            showNotification("Неможливо відправити зображення: чат не вибрано.", "error");
            return;
        }
        const { imageBase64, name: originalName, mimeType } = editedImageObject;
        if (!imageBase64) { showNotification("Помилка: не вдалося отримати дані зображення.", "error"); return; }
        const blob = base64ToBlob(imageBase64, mimeType);
        const uniquePrefix = `img_${Date.now()}`;
        const fileName = `${uniquePrefix}_${originalName || 'image.png'}`.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${selectedConversationId}/${currentUser.uid}/${fileName}`;

        setShowUploadOverlay(true);
        setUploadProgress(0);
        try {
            // Завантажуємо зображення у Supabase (bucket: chat)
            const downloadURL = await uploadFileWithProgress(
                blob,
                'chat',
                filePath,
                (progress) => setUploadProgress(progress)
            );
            sendMessage(downloadURL, 'image', {
                originalName: editedImageObject.name || 'image.png',
                quality,
                width: editedImageObject.width,
                height: editedImageObject.height,
                mimeType: editedImageObject.mimeType
            });
        } catch (error) {
            console.error("Помилка завантаження фото:", error);
            showNotification("Не вдалося завантажити фото.", "error");
        } finally {
            setShowUploadOverlay(false);
            setUploadProgress(0);
        }
    };
    const handleShareContent = async (item, type) => { await sendMessage(item, type); setShareMusicModalOpen(false); };
    const handleFormSubmit = (e) => { e.preventDefault(); if (editingMessage && editingMessage.type !== 'text') return; sendMessage(newMessage, 'text'); };
    const filteredConversations = useMemo(() => {
        let finalConvos = [];
        if (activeFolderId === 'all') finalConvos = [savedMessagesChat, ...conversations];
        else if (activeFolderId === 'personal') finalConvos = [savedMessagesChat, ...conversations.filter(c => !c.isGroup)];
        else { const activeFolder = currentUser?.chatFolders?.find(f => f.id === activeFolderId); if (activeFolder) { const folderChats = conversations.filter(c => activeFolder.includedChats.includes(c.id)); if (activeFolder.includedChats.includes('saved_messages')) finalConvos = [savedMessagesChat, ...folderChats]; else finalConvos = folderChats; } else finalConvos = [savedMessagesChat, ...conversations]; }
        return finalConvos;
    }, [conversations, activeFolderId, currentUser, savedMessagesChat]);
    const handleGroupCreated = (newChatId) => { setCreateGroupModalOpen(false); navigate('/messages', { state: { conversationId: newChatId } }); };
    const openInfoPanel = () => { if (selectedConversationId === 'saved_messages') setStoragePanelOpen(true); else if (selectedConversation?.isGroup) setInfoPanelOpenFor(selectedConversation); };
    const handleForwardSelected = () => { const messagesToForward = messages.filter(msg => selectedMessages.includes(msg.id)); setForwardingMessages(messagesToForward); };
    const handleOpenImageViewer = (image) => setViewingImage(image);
    const handleCloseImageViewer = () => setViewingImage(null);

    if (authLoading || loading) return <div className="messages-page-loading">Завантаження...</div>;

    const companion = getCompanion(selectedConversation);
    const isCurrentUserAdmin = selectedConversation?.admins?.includes(currentUser?.uid);
    const companionName = !selectedConversation?.isGroup ? getCompanion(selectedConversation)?.displayName : '';
    const renderLastMessage = (lastMessage) => {
        if (!lastMessage || !lastMessage.text) return ' ';
        if (typeof lastMessage.text === 'object' && lastMessage.text !== null) return 'Медіавкладення';
        return lastMessage.text;
    };
    const chatWindowStyle = swipeState.isSwiping ? { transform: `translateX(${swipeState.deltaX}px)`, transition: 'none' } : {};

    return (
        <div className={`messages-page-container ${!selectedConversationId ? 'no-chat-selected' : ''} ${isPlayerVisible ? 'player-visible' : ''}`}>
            <aside className="folders-icon-sidebar">
                {allFolders.map(folder => (<button key={folder.id} className={`folder-icon-item ${activeFolderId === folder.id ? 'active' : ''}`} onClick={() => setActiveFolderId(folder.id)} title={folder.name}> {folder.component || getIconComponent(folder.icon)} {(folderUnreadCounts[folder.id] || 0) > 0 && <span className="folder-unread-badge">{folderUnreadCounts[folder.id] > 99 ? '99+' : folderUnreadCounts[folder.id]}</span>} </button>))}
            </aside>
            <div className="main-chat-wrapper">
                <div className={`folder-tabs-mobile ${selectedConversationId ? 'hidden-mobile' : ''}`}>
                    {allFolders.map(folder => (<button key={folder.id} className={`mobile-tab-item ${activeFolderId === folder.id ? 'active' : ''}`} onClick={() => setActiveFolderId(folder.id)}> {folder.component || getIconComponent(folder.icon)} <span>{folder.name}</span> {(folderUnreadCounts[folder.id] || 0) > 0 && <span className="folder-unread-badge mobile">{folderUnreadCounts[folder.id] > 99 ? '99+' : folderUnreadCounts[folder.id]}</span>} </button>))}
                </div>
                <div className="chat-area-grid">
                    <aside className={`conversations-sidebar ${selectedConversationId ? 'hidden-mobile' : ''}`}>
                        <div className="conversations-header"><h2>{allFolders.find(f => f.id === activeFolderId)?.name || 'Чати'}</h2><button className="new-group-button" onClick={() => setCreateGroupModalOpen(true)}><NewGroupIcon /></button></div>
                        <div className="conversations-list">
                            {filteredConversations.length > 0 ? (filteredConversations.map(convo => {
                                const isSavedChat = convo.id === 'saved_messages';
                                const currentCompanion = !isSavedChat && !convo.isGroup ? getCompanion(convo) : null;
                                const convoName = isSavedChat ? 'Збережене' : (convo.isGroup ? convo.groupName : currentCompanion?.displayName);
                                const convoPhoto = isSavedChat ? null : (convo.isGroup ? convo.groupPhotoURL || default_picture : currentCompanion?.photoURL);
                                const unreadCount = isSavedChat ? 0 : (convo.unreadCounts?.[currentUser.uid] || 0);
                                const convoCompanionRoles = (!isSavedChat && !convo.isGroup && currentCompanion?.uid)
                                    ? (companionRoles[currentCompanion.uid] || []) : [];
                                return (
                                    <div key={convo.id} className={`conversation-item ${selectedConversationId === convo.id ? 'active' : ''}`} onClick={() => handleSelectConversation(convo.id)}>
                                        <div className="conversation-item-main">
                                            {isSavedChat ? <div className="saved-messages-avatar"><BookmarkIcon /></div> : <img src={convoPhoto || default_picture} alt={convoName} />}
                                            <div className="conversation-details">
                                                <p className="conversation-name">
                                                    {convoName || 'Користувач'}
                                                    {convoCompanionRoles.includes('verified') && <VerifiedBadge size="xs" />}
                                                </p>
                                                <p className="conversation-last-message">{renderLastMessage(convo.lastMessage)}</p>
                                            </div>
                                        </div>
                                        {unreadCount > 0 && <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                                    </div>);
                            })) : (<p className="no-conversations">Чати не знайдено</p>)}
                        </div>
                    </aside>
                    <main
                        ref={chatWindowRef}
                        className={`chat-window ${!selectedConversationId ? 'hidden-mobile' : ''}`}
                        onTouchStart={handleSwipeStart}
                        onTouchMove={handleSwipeMove}
                        onTouchEnd={handleSwipeEnd}
                        style={chatWindowStyle}
                    >
                        {selectionMode ? (<SelectionHeader selectedCount={selectedMessages.length} onCancel={exitSelectionMode} onDelete={() => setMultiDeleteModal(true)} onForward={handleForwardSelected} />
                        ) : selectedConversation ? (
                            <div className="chat-header" onClick={openInfoPanel} style={{ cursor: 'pointer' }}>
                                <button className="back-button-mobile" onClick={(e) => { e.stopPropagation(); setSelectedConversationId(null) }}><BackArrowIcon /></button>
                                {selectedConversation.id === 'saved_messages' ?
                                    <div className="saved-messages-avatar header"><BookmarkIcon /></div> :
                                    <img src={selectedConversation.isGroup ? selectedConversation.groupPhotoURL || default_picture : companion?.photoURL || default_picture} alt="avatar" />
                                }
                                <h3>
                                    {selectedConversation.id === 'saved_messages'
                                        ? 'Збережене'
                                        : selectedConversation.isGroup
                                            ? selectedConversation.groupName
                                            : companion?.displayName}
                                    {/* 🔮 кастомні емоджі тут у майбутньому */}
                                    {!selectedConversation.isGroup && selectedConversation.id !== 'saved_messages' &&
                                        companion?.uid && (companionRoles[companion.uid] || []).includes('verified') &&
                                        <VerifiedBadge size="xs" />}
                                </h3>
                            </div>
                        ) : null}
                        {selectedConversation && (
                            <>
                                {selectedConversation.id !== 'saved_messages' && <PinnedMessagesBar pinnedMessages={selectedConversation.pinnedMessages} onMessageSelect={scrollToMessage} />}
                                <div className="messages-area">
                                    {loadingMessages ? (<p className="chat-placeholder">Завантаження...</p>) : (messages.map(msg => {
                                        const isSent = msg.senderId === currentUser.uid;
                                        const senderInfo = selectedConversation.id === 'saved_messages' ? { displayName: msg.originalSender?.name, photoURL: msg.originalSender?.photoURL } : (isSent ? currentUser : (selectedConversation.isGroup ? selectedConversation.participantInfo.find(p => p.uid === msg.senderId) : companion));
                                        return (<MessageBubble
                                            key={msg.id}
                                            message={msg}
                                            isGroup={selectedConversation.isGroup}
                                            isSent={selectedConversationId !== 'saved_messages' && isSent}
                                            senderInfo={senderInfo}
                                            selectionMode={selectionMode}
                                            isSelected={selectedMessages.includes(msg.id)}
                                            isDeleting={deletingMessages.includes(msg.id)}
                                            deleteAnimationClass={currentUser.settings?.chat?.deleteAnimation || 'animation-vortex-out'}
                                            onContextMenu={handleContextMenu}
                                            onLongPress={handleLongPress}
                                            onTap={handleToggleSelect}
                                            isSavedContext={selectedConversationId === 'saved_messages'}
                                            onReaction={handleMessageReaction}
                                            isContextMenuOpen={contextMenu.show}
                                            onCloseContextMenu={handleCloseContextMenu}
                                            onOpenImage={handleOpenImageViewer}
                                            openBrowser={openBrowser}
                                        />);
                                    }))}
                                    {selectedConversationId === 'saved_messages' && messages.length === 0 && !loadingMessages && (<div className="chat-placeholder"> <BookmarkIcon className="placeholder-icon" /> <h3>Збережені повідомлення</h3> <p>Пересилайте сюди повідомлення, щоб зберегти їх. Цей чат бачите тільки ви.</p> </div>)}
                                    <div ref={messagesEndRef} />
                                </div>
                                {selectedConversation.id !== 'saved_messages' && (
                                    <div className="message-input-container">
                                        {replyingTo && <ReplyPreview message={replyingTo} onCancel={() => setReplyingTo(null)} />}
                                        <div className="message-input-area">
                                            <button className="attachment-button" onClick={() => setIsAttachmentMenuOpen(true)}><PaperclipIcon /></button>
                                            <form onSubmit={handleFormSubmit} className="message-input-form">
                                                <input type="text" placeholder="Напишіть повідомлення..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                                <button type="submit" disabled={!newMessage.trim() && !editingMessage}><SendIcon /></button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </>)}
                        {!selectedConversation && (<div className="chat-placeholder"><h3>Оберіть чат, щоб розпочати спілкування</h3><p>Або створіть нову групу.</p></div>)}
                    </main>
                </div>
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelected} accept="image/*,video/*" />
            {isCreateGroupModalOpen && <CreateGroupModal onClose={() => setCreateGroupModalOpen(false)} onGroupCreated={handleGroupCreated} />}
            <MessageContextMenu {...contextMenu} onClose={() => setContextMenu({ show: false, x: 0, y: 0, message: null })} onAction={handleContextMenuAction} onEmojiSelect={handleEmojiSelect} onOpenFullPicker={handleOpenFullPicker} isOwnMessage={contextMenu.message?.senderId === currentUser?.uid} isUserAdmin={isCurrentUserAdmin} />
            {infoPanelOpenFor && (<GroupInfoPanel conversation={infoPanelOpenFor} currentUser={currentUser} onClose={() => setInfoPanelOpenFor(null)} />)}
            <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, message: null })} onConfirm={handleConfirmDelete} title="Видалити повідомлення?" message="Ви впевнені, що хочете видалити це повідомлення?" confirmText="Видалити" showCheckbox={!selectedConversation?.isGroup && selectedConversationId !== 'saved_messages'} checkboxLabel={`Видалити для ${companionName}`} />
            <ConfirmationModal isOpen={multiDeleteModal} onClose={() => setMultiDeleteModal(false)} onConfirm={handleDeleteSelected} title={`Видалити ${selectedMessages.length} повідомлень?`} message="Ця дія є незворотною." confirmText="Видалити" />
            <AttachmentMenu isOpen={isAttachmentMenuOpen} onClose={() => setIsAttachmentMenuOpen(false)} onSelectAttachment={handleSelectAttachment} />
            <StoragePanel isOpen={isStoragePanelOpen} onClose={() => setStoragePanelOpen(false)} />
            <ForwardModal isOpen={!!forwardingMessages} onClose={() => setForwardingMessages(null)} onForward={handleConfirmForward} conversations={conversations} currentUser={currentUser} />
            <ShareMusicModal isOpen={isShareMusicModalOpen} onClose={() => setShareMusicModalOpen(false)} onShare={handleShareContent} />
            {isFullPickerOpen && (<EmojiPickerPlus onClose={() => setIsFullPickerOpen(false)} onEmojiSelect={handleEmojiSelect} />)}
            {isImageEditorOpen && (
                <React.Suspense fallback={null}>
                    <ImageEditorModal isOpen={isImageEditorOpen} imageToEdit={imageForEditor} onClose={() => { setIsImageEditorOpen(false); setImageForEditor(null); }} onSave={handleImageEditorSave} />
                </React.Suspense>
            )}
            {showUploadOverlay && (<div className="upload-progress-overlay"><div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div></div>)}
            {viewingImage && (<ImageViewerModal isOpen={!!viewingImage} imageUrl={viewingImage.url} imageAlt={viewingImage.alt} onClose={handleCloseImageViewer} />)}
        </div>
    );
};

export default MessagesPage;