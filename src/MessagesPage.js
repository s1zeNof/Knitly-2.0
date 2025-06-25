import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext';
import { db } from './firebase';
import { collection, query, where, onSnapshot, orderBy, doc, addDoc, serverTimestamp, updateDoc, getDocs, writeBatch, arrayUnion, arrayRemove, deleteDoc, getDoc, increment } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { getIconComponent } from './FolderIcons';
import './MessagesPage.css';
import default_picture from './img/Default-Images/default-picture.svg';

import CreateGroupModal from './CreateGroupModal';
import GroupInfoPanel from './GroupInfoPanel';
import ConfirmationModal from './ConfirmationModal';
import AttachmentMenu from './AttachmentMenu';
import ImageUploadEditor from './ImageUploadEditor'; // Імпорт нового компонента
import MessageBubble from './MessageBubble';
import MessageContextMenu from './MessageContextMenu';
import SelectionHeader from './SelectionHeader';
import ReplyPreview from './ReplyPreview';
import PinnedMessagesBar from './PinnedMessagesBar';
import StoragePanel from './StoragePanel';
import BookmarkIcon from './BookmarkIcon';
import ForwardModal from './ForwardModal';
import ShareMusicModal from './ShareMusicModal';

const AllChatsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const PersonalIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const NewGroupIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const SendIcon = () => <svg height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>;
const BackArrowIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7"></path></svg>;
const PaperclipIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>;

const MessagesPage = () => {
    const { user: currentUser, authLoading } = useUserContext();
    const { showNotification } = usePlayerContext();
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
    const [isImageEditorOpen, setIsImageEditorOpen] = useState(false); // Стан для редактора
    const messagesEndRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    
    const getCompanion = (convo) => {
        if (!convo || !convo.participantInfo || !currentUser) return null;
        return convo.participantInfo.find(p => p.uid !== currentUser.uid);
    }

    const selectedConversation = useMemo(() => {
        if (selectedConversationId === 'saved_messages') {
            return {
                id: 'saved_messages',
                isGroup: false,
                groupName: 'Збережене',
                participantInfo: [currentUser],
                participants: [currentUser?.uid],
            };
        }
        return conversations.find(c => c.id === selectedConversationId);
    }, [conversations, selectedConversationId, currentUser]);

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
    }, [currentUser, authLoading, location.pathname, navigate]);
    
    useEffect(() => {
        if (!selectedConversationId || !currentUser?.uid) {
            setMessages([]);
            return;
        }

        setLoadingMessages(true);
        let messagesQuery;

        if (selectedConversationId === 'saved_messages') {
            messagesQuery = query(
                collection(db, 'users', currentUser.uid, 'savedMessages'), 
                orderBy('savedAt', 'asc')
            );
        } else {
            messagesQuery = query(
                collection(db, 'chats', selectedConversationId, 'messages'), 
                orderBy('timestamp', 'asc')
            );
        }

        const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            const msgs = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(msg => !msg.deletedFor?.includes(currentUser.uid));
            setMessages(msgs);
            setLoadingMessages(false);
        }, (error) => {
            console.error("Помилка завантаження повідомлень:", error);
            setLoadingMessages(false);
        });

        return () => unsubscribe();
    }, [selectedConversationId, currentUser?.uid]);
    
    useEffect(() => {
        const validatePinsAndSyncLastMessage = async () => {
            if (!selectedConversation || loadingMessages || selectedConversation.id === 'saved_messages') return;

            const existingMessageIds = new Set(messages.map(msg => msg.id));
            if (selectedConversation.pinnedMessages?.length > 0) {
                const validPins = selectedConversation.pinnedMessages.filter(pin => existingMessageIds.has(pin.messageId));
                if (validPins.length !== selectedConversation.pinnedMessages.length) {
                    await updateDoc(doc(db, 'chats', selectedConversation.id), { pinnedMessages: validPins });
                }
            }
            
            const actualLastMessageInState = messages.length > 0 ? messages[messages.length - 1] : null;
            const displayedLastMessage = selectedConversation.lastMessage;

            if (actualLastMessageInState) {
                if (displayedLastMessage?.messageId !== actualLastMessageInState.id) {
                    const chatRef = doc(db, 'chats', selectedConversationId);
                    const newLastMessage = {
                        text: actualLastMessageInState.type === 'track' ? `🎵 ${actualLastMessageInState.content.title}` : actualLastMessageInState.content,
                        senderId: actualLastMessageInState.senderId,
                        messageId: actualLastMessageInState.id
                    };
                    await updateDoc(chatRef, { lastMessage: newLastMessage });
                }
            } else if (displayedLastMessage) {
                await updateDoc(doc(db, 'chats', selectedConversationId), { lastMessage: null });
            }
        };
        validatePinsAndSyncLastMessage();
    }, [messages, selectedConversationId, selectedConversation, loadingMessages]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const allFolders = useMemo(() => [
        { id: 'all', name: 'Усі', icon: 'all', component: <AllChatsIcon /> },
        { id: 'personal', name: 'Особисті', icon: 'personal', component: <PersonalIcon /> },
        ...(currentUser?.chatFolders || []).sort((a, b) => (a.order || 0) - (b.order || 0))
    ], [currentUser?.chatFolders]);

    const folderUnreadCounts = useMemo(() => {
        if (!currentUser?.uid) return {};
        const counts = {};

        allFolders.forEach(folder => {
            let unreadChats = 0;
            if (folder.id === 'all') {
                unreadChats = conversations.filter(c => (c.unreadCounts?.[currentUser.uid] || 0) > 0).length;
            } else if (folder.id === 'personal') {
                unreadChats = conversations.filter(c => !c.isGroup && (c.unreadCounts?.[currentUser.uid] || 0) > 0).length;
            } else {
                const chatIdsInFolder = new Set(folder.includedChats);
                unreadChats = conversations.filter(c => chatIdsInFolder.has(c.id) && (c.unreadCounts?.[currentUser.uid] || 0) > 0).length;
            }
            counts[folder.id] = unreadChats;
        });
        return counts;
    }, [conversations, currentUser, allFolders]);
    
    const savedMessagesChat = useMemo(() => ({
        id: 'saved_messages',
        groupName: 'Збережене',
        lastMessage: { text: 'Ваші нотатки та файли' },
        isVirtual: true
    }), []);

    const handleSelectConversation = async (convoId) => {
        if (selectionMode) exitSelectionMode();
        setSelectedConversationId(convoId);

        if (convoId !== 'saved_messages' && currentUser?.uid) {
            const chatRef = doc(db, 'chats', convoId);
            try {
                await updateDoc(chatRef, {
                    [`unreadCounts.${currentUser.uid}`]: 0
                });
            } catch (error) {
                console.error("Помилка обнулення лічильника:", error);
            }
        }
    };

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
        const pinData = {
            messageId: message.id, content: message.type === 'track' ? `🎵 ${message.content.title}` : message.content,
            senderName: selectedConversation.participantInfo.find(p => p.uid === message.senderId)?.displayName || 'User',
            timestamp: message.timestamp
        };
        const isAlreadyPinned = currentPins.some(p => p.messageId === message.id);
        try {
            if (isAlreadyPinned) {
                const pinToRemove = currentPins.find(p => p.messageId === message.id);
                if(pinToRemove) await updateDoc(chatRef, { pinnedMessages: arrayRemove(pinToRemove) });
            } else { await updateDoc(chatRef, { pinnedMessages: arrayUnion(pinData) }); }
        } catch (error) { console.error("Помилка закріплення повідомлення:", error); }
    };

    const scrollToMessage = (messageId) => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight');
            setTimeout(() => messageElement.classList.remove('highlight'), 1500);
        }
    };

    const handleContextMenuAction = (action, message) => {
        setContextMenu({ show: false, x: 0, y: 0, message: null });
        switch (action) {
            case 'reply': setReplyingTo(message); break;
            case 'edit': setEditingMessage(message); setNewMessage(message.content); break;
            case 'delete': setDeleteModal({ isOpen: true, message: message }); break;
            case 'forward': setForwardingMessages([message]); break;
            case 'pin': handlePinMessage(message); break;
            default: break;
        }
    };
    
    const handleConfirmDelete = async (deleteForBoth) => {
        const messageToDelete = deleteModal.message;
        if (!messageToDelete || !selectedConversationId) return;
        
        setDeleteModal({ isOpen: false, message: null });
        setDeletingMessages(prev => [...prev, messageToDelete.id]);
    
        const batch = writeBatch(db);
    
        if (selectedConversationId === 'saved_messages') {
            const messageRef = doc(db, 'users', currentUser.uid, 'savedMessages', messageToDelete.id);
            batch.delete(messageRef);
        } else {
            const chatRef = doc(db, 'chats', selectedConversationId);
            const messageRef = doc(chatRef, 'messages', messageToDelete.id);
    
            const currentPins = selectedConversation.pinnedMessages || [];
            const pinToRemove = currentPins.find(p => p.messageId === messageToDelete.id);
            if (pinToRemove) {
                batch.update(chatRef, { pinnedMessages: arrayRemove(pinToRemove) });
            }
    
            if (selectedConversation.isGroup) {
                batch.delete(messageRef);
            } else {
                if (deleteForBoth) {
                    batch.delete(messageRef);
                } else {
                    batch.update(messageRef, { deletedFor: arrayUnion(currentUser.uid) });
                }
            }
        }
        
        try {
            await batch.commit();
            showNotification("Повідомлення видалено", "info");
        } catch (error) {
            console.error("❌ ПОМИЛКА BATCH-ЗАПИСУ (ВИДАЛЕННЯ):", error);
            showNotification(`Помилка: ${error.code}`, "error");
        } finally {
            setDeletingMessages(prev => prev.filter(id => id !== messageToDelete.id));
        }
    };
    
    const handleDeleteSelected = async () => {
        if (!selectedConversationId || selectedMessages.length === 0) return;
        
        setMultiDeleteModal(false);
        setDeletingMessages(prev => [...prev, ...selectedMessages]);
    
        const batch = writeBatch(db);
    
        if (selectedConversationId === 'saved_messages') {
            const savedMessagesRef = collection(db, 'users', currentUser.uid, 'savedMessages');
            selectedMessages.forEach(messageId => {
                batch.delete(doc(savedMessagesRef, messageId));
            });
        } else {
            const chatRef = doc(db, 'chats', selectedConversationId);
            const messagesRef = collection(chatRef, 'messages');
            
            const currentPins = selectedConversation.pinnedMessages || [];
            const pinsToRemove = currentPins.filter(pin => selectedMessages.includes(pin.messageId));
            if (pinsToRemove.length > 0) {
                batch.update(chatRef, { pinnedMessages: arrayRemove(...pinsToRemove) });
            }
    
            selectedMessages.forEach(messageId => {
                batch.delete(doc(messagesRef, messageId));
            });
        }
    
        try {
            await batch.commit();
            showNotification(`${selectedMessages.length} повідомлень видалено`, "info");
        } catch(e) {
            console.error("❌ ПОМИЛКА BATCH-ЗАПИСУ (ВИДАЛЕННЯ КІЛЬКОХ): ", e);
            showNotification(`Помилка: ${e.code}`, "error");
        } finally {
            exitSelectionMode();
            setDeletingMessages([]);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() && !editingMessage) return;
        if (selectedConversationId === 'saved_messages') return;

        const chatRef = doc(db, 'chats', selectedConversationId);
        try {
            if (editingMessage) {
                const messageRef = doc(chatRef, 'messages', editingMessage.id);
                await updateDoc(messageRef, { content: newMessage, isEdited: true });
                setEditingMessage(null);
            } else {
                let messageData = {
                    senderId: currentUser.uid, type: 'text', content: newMessage,
                    timestamp: serverTimestamp(), deletedFor: [],
                };
                if (replyingTo) {
                    messageData.replyTo = {
                        messageId: replyingTo.id,
                        senderName: (selectedConversation.participantInfo.find(p => p.uid === replyingTo.senderId)?.displayName || 'User'),
                        text: replyingTo.type === 'track' ? `🎵 ${replyingTo.content.title}` : replyingTo.content,
                    };
                }
                const newDocRef = await addDoc(collection(chatRef, 'messages'), messageData);
                
                const updates = {
                    lastMessage: { text: newMessage, senderId: currentUser.uid, messageId: newDocRef.id },
                    lastUpdatedAt: serverTimestamp()
                };
                selectedConversation.participants.forEach(participantId => {
                    if (participantId !== currentUser.uid) {
                        updates[`unreadCounts.${participantId}`] = increment(1);
                    }
                });

                await updateDoc(chatRef, updates);
            }
            setNewMessage('');
            setReplyingTo(null);
        } catch (error) { console.error("Помилка відправки:", error); }
    };
    
    const handleConfirmForward = async (destinationChatId) => {
        if (!forwardingMessages || !destinationChatId) return;
    
        const batch = writeBatch(db);
    
        try {
            if (destinationChatId === 'saved_messages') {
                const savedMessagesRef = collection(db, 'users', currentUser.uid, 'savedMessages');
                for (const msg of forwardingMessages) {
                    const newSavedMsgRef = doc(savedMessagesRef);
                    const originalSender = selectedConversation.participantInfo.find(p => p.uid === msg.senderId);
                    const companion = getCompanion(selectedConversation);
                    
                    const savedData = {
                        ...msg,
                        originalSender: {
                            name: originalSender?.displayName || 'Unknown User',
                            photoURL: originalSender?.photoURL || null,
                            id: originalSender?.uid,
                        },
                        savedFrom: {
                            chatId: selectedConversation.id,
                            chatName: selectedConversation.isGroup 
                                ? selectedConversation.groupName 
                                : companion?.displayName || 'Чат',
                            isGroup: selectedConversation.isGroup || false,
                            photoURL: selectedConversation.isGroup
                                ? selectedConversation.groupPhotoURL
                                : companion?.photoURL
                        },
                        savedAt: serverTimestamp(),
                    };
                    delete savedData.id;
                    delete savedData.originalSenderName;
                    delete savedData.originalSenderId;  
                    batch.set(newSavedMsgRef, savedData);
                }
                showNotification(`Повідомлення збережено!`, 'info');
    
            } else {
                const destChatRef = doc(db, 'chats', destinationChatId);
                const destMessagesRef = collection(destChatRef, 'messages');
                
                for (const msg of forwardingMessages) {
                    const originalSender = selectedConversation.participantInfo.find(p => p.uid === msg.senderId);
                    const newForwardedMsgRef = doc(destMessagesRef);
                    const forwardedData = {
                        content: msg.content,
                        type: msg.type,
                        senderId: currentUser.uid,
                        timestamp: serverTimestamp(),
                        forwardedFrom: {
                            name: originalSender?.displayName || 'Unknown User',
                            id: msg.senderId
                        }
                    };
                    batch.set(newForwardedMsgRef, forwardedData);
                }
                
                const destChatSnap = await getDoc(destChatRef);
                const destChatData = destChatSnap.data();
                const lastForwarded = forwardingMessages[forwardingMessages.length-1];
                const lastMessageText = lastForwarded.type === 'track' ? `🎵 ${lastForwarded.content.title}` : lastForwarded.content;
    
                const updates = {
                    lastMessage: { text: lastMessageText, senderId: currentUser.uid },
                    lastUpdatedAt: serverTimestamp()
                };
                 destChatData.participants.forEach(participantId => {
                    if (participantId !== currentUser.uid) {
                        updates[`unreadCounts.${participantId}`] = increment(forwardingMessages.length);
                    }
                });
                batch.update(destChatRef, updates);
    
                showNotification(`Переслано в чат "${destChatData.groupName || getCompanion(destChatData)?.displayName}"`, 'info');
            }
            
            await batch.commit();
    
        } catch (error) {
            console.error("Помилка пересилання повідомлення:", error);
            showNotification('Не вдалося переслати повідомлення.', 'error');
        } finally {
            setForwardingMessages(null);
            exitSelectionMode();
        }
    };

    const handleSelectAttachment = (type) => {
        if (type === 'music') {
            setShareMusicModalOpen(true);
        }
        setIsAttachmentMenuOpen(false);
    };

    const handleOpenImageEditor = () => {
        setIsImageEditorOpen(true);
    };

    const handleImageUpload = async (imageDataUrl) => {
        // Тут буде логіка відправки зображення як повідомлення
        // Наприклад, створення нового повідомлення типу "image" з imageDataUrl як content
        // eslint-disable-next-line no-console
        console.log('Image to upload:', imageDataUrl.substring(0, 50) + "..."); // Логуємо частину для перевірки

        if (!selectedConversationId || selectedConversationId === 'saved_messages' || !currentUser) {
            showNotification('Неможливо відправити зображення.', 'error');
            return;
        }

        const chatRef = doc(db, 'chats', selectedConversationId);
        const messagesRef = collection(chatRef, 'messages');

        const messageData = {
            senderId: currentUser.uid,
            type: 'image', // Новий тип повідомлення
            content: imageDataUrl, // base64 зображення
            timestamp: serverTimestamp(),
            deletedFor: [],
        };

        if (replyingTo) {
            messageData.replyTo = {
                messageId: replyingTo.id,
                senderName: (selectedConversation.participantInfo.find(p => p.uid === replyingTo.senderId)?.displayName || 'User'),
                text: replyingTo.type === 'track' ? `🎵 ${replyingTo.content.title}` : replyingTo.content,
            };
        }

        try {
            const newDocRef = await addDoc(messagesRef, messageData);
            const updates = {
                lastMessage: { text: '📷 Фотографія', senderId: currentUser.uid, messageId: newDocRef.id },
                lastUpdatedAt: serverTimestamp()
            };
            selectedConversation.participants.forEach(participantId => {
                if (participantId !== currentUser.uid) {
                    updates[`unreadCounts.${participantId}`] = increment(1);
                }
            });
            await updateDoc(chatRef, updates);
            showNotification('Фото надіслано!', 'info');
            setReplyingTo(null); // Скидаємо reply після відправки
        } catch (error) {
            console.error("Помилка відправки зображення:", error);
            showNotification('Не вдалося надіслати фото.', 'error');
        }
        setIsImageEditorOpen(false); // Закриваємо редактор
    };


    const handleShareContent = async (item, type) => {
        if (!selectedConversationId || selectedConversationId === 'saved_messages') {
            showNotification('Оберіть чат для відправки.', 'error');
            return;
        }

        const chatRef = doc(db, 'chats', selectedConversationId);
        const messagesRef = collection(chatRef, 'messages');

        const messageData = {
            senderId: currentUser.uid,
            type: type,
            content: { ...item },
            timestamp: serverTimestamp(),
        };

        try {
            const newDocRef = await addDoc(messagesRef, messageData);
            
            const lastMessageText = type === 'track' 
                ? `🎵 Трек: ${item.title}` 
                : `💿 Альбом: ${item.title}`;

            const updates = {
                lastMessage: { text: lastMessageText, senderId: currentUser.uid, messageId: newDocRef.id },
                lastUpdatedAt: serverTimestamp()
            };
            selectedConversation.participants.forEach(participantId => {
                if (participantId !== currentUser.uid) {
                    updates[`unreadCounts.${participantId}`] = increment(1);
                }
            });
            await updateDoc(chatRef, updates);

            setShareMusicModalOpen(false);
            showNotification('Успішно надіслано!', 'info');
        } catch (error) {
            console.error("Помилка відправки контенту:", error);
            showNotification('Не вдалося надіслати.', 'error');
        }
    };
    
    const handleFormSubmit = (e) => { e.preventDefault(); sendMessage(); };

    const filteredConversations = useMemo(() => {
        let finalConvos = [];
        if (activeFolderId === 'all') {
            finalConvos = [savedMessagesChat, ...conversations];
        } else if (activeFolderId === 'personal') {
            finalConvos = [savedMessagesChat, ...conversations.filter(c => !c.isGroup)];
        } else {
            const activeFolder = currentUser?.chatFolders?.find(f => f.id === activeFolderId);
            if (activeFolder) {
                const folderChats = conversations.filter(c => activeFolder.includedChats.includes(c.id));
                if (activeFolder.includedChats.includes('saved_messages')) {
                    finalConvos = [savedMessagesChat, ...folderChats];
                } else {
                    finalConvos = folderChats;
                }
            } else {
                 finalConvos = [savedMessagesChat, ...conversations];
            }
        }
        return finalConvos;
    }, [conversations, activeFolderId, currentUser, savedMessagesChat]);

    const handleGroupCreated = (newChatId) => { setCreateGroupModalOpen(false); navigate('/messages', { state: { conversationId: newChatId } }); };

    const openInfoPanel = () => {
        if (selectedConversationId === 'saved_messages') {
            setStoragePanelOpen(true);
        } else if (selectedConversation?.isGroup) {
            setInfoPanelOpenFor(selectedConversation);
        }
    };

    const handleForwardSelected = () => {
        const messagesToForward = messages.filter(msg => selectedMessages.includes(msg.id));
        setForwardingMessages(messagesToForward);
    };
    
    if (authLoading || loading) return <div className="messages-page-loading">Завантаження...</div>;
    const companion = getCompanion(selectedConversation);
    const isCurrentUserAdmin = selectedConversation?.admins?.includes(currentUser?.uid);
    const companionName = !selectedConversation?.isGroup ? getCompanion(selectedConversation)?.displayName : '';

    return (
        <div className={`messages-page-container ${!selectedConversationId ? 'no-chat-selected' : ''}`}>
            <aside className="folders-icon-sidebar">
                {allFolders.map(folder => {
                    const count = folderUnreadCounts[folder.id] || 0;
                    return (
                        <button key={folder.id} className={`folder-icon-item ${activeFolderId === folder.id ? 'active' : ''}`} onClick={() => setActiveFolderId(folder.id)} title={folder.name}>
                            {folder.component || getIconComponent(folder.icon)}
                            {count > 0 && <span className="folder-unread-badge">{count > 99 ? '99+' : count}</span>}
                        </button>
                    )
                })}
            </aside>
            <div className="main-chat-wrapper">
                <div className={`folder-tabs-mobile ${selectedConversationId ? 'hidden-mobile' : ''}`}>
                    {allFolders.map(folder => {
                        const count = folderUnreadCounts[folder.id] || 0;
                        return (
                            <button key={folder.id} className={`mobile-tab-item ${activeFolderId === folder.id ? 'active' : ''}`} onClick={() => setActiveFolderId(folder.id)}>
                                {folder.component || getIconComponent(folder.icon)}
                                <span>{folder.name}</span>
                                {count > 0 && <span className="folder-unread-badge mobile">{count > 99 ? '99+' : count}</span>}
                            </button>
                        )
                    })}
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

                                return (
                                <div key={convo.id} className={`conversation-item ${selectedConversationId === convo.id ? 'active' : ''}`} onClick={() => handleSelectConversation(convo.id)}>
                                    <div className="conversation-item-main">
                                        {isSavedChat ? <div className="saved-messages-avatar"><BookmarkIcon /></div> : <img src={convoPhoto || default_picture} alt={convoName} />}
                                        <div className="conversation-details">
                                            <p className="conversation-name">{convoName || 'Користувач'}</p>
                                            <p className="conversation-last-message">{convo.lastMessage?.text || ' '}</p>
                                        </div>
                                    </div>
                                    {unreadCount > 0 && (
                                        <span className="unread-badge">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </div>);
                            })) : (<p className="no-conversations">Чати не знайдено</p>)}
                        </div>
                    </aside>
                    <main className={`chat-window ${!selectedConversationId ? 'hidden-mobile' : ''}`}>
                        {selectionMode ? ( <SelectionHeader selectedCount={selectedMessages.length} onCancel={exitSelectionMode} onDelete={() => setMultiDeleteModal(true)} onForward={handleForwardSelected} />
                        ) : selectedConversation ? (
                            <div className="chat-header" onClick={openInfoPanel} style={{cursor: 'pointer'}}>
                                <button className="back-button-mobile" onClick={(e) => {e.stopPropagation(); setSelectedConversationId(null)}}><BackArrowIcon /></button>
                                {selectedConversation.id === 'saved_messages' ? 
                                    <div className="saved-messages-avatar header"><BookmarkIcon /></div> : 
                                    <img src={selectedConversation.isGroup ? selectedConversation.groupPhotoURL || default_picture : companion?.photoURL || default_picture} alt="avatar" />
                                }
                                <h3>{selectedConversation.id === 'saved_messages' ? 'Збережене' : (selectedConversation.isGroup ? selectedConversation.groupName : companion?.displayName)}</h3>
                            </div>
                        ) : null}
                        
                        {selectedConversation && (
                        <>
                            {selectedConversation.id !== 'saved_messages' && <PinnedMessagesBar pinnedMessages={selectedConversation.pinnedMessages} onMessageSelect={scrollToMessage} />}
                            <div className="messages-area">
                                {loadingMessages ? (<p className="chat-placeholder">Завантаження...</p>) : (messages.map(msg => {
                                    const isSent = msg.senderId === currentUser.uid;
                                    const senderInfo = selectedConversation.id === 'saved_messages'
                                        ? { displayName: msg.originalSender?.name, photoURL: msg.originalSender?.photoURL }
                                        : (isSent ? currentUser : (selectedConversation.isGroup ? selectedConversation.participantInfo.find(p => p.uid === msg.senderId) : companion));
                                    
                                    return (
                                        <MessageBubble
                                            key={msg.id} message={msg} isGroup={selectedConversation.isGroup} 
                                            isSent={selectedConversationId === 'saved_messages' ? false : isSent}
                                            senderInfo={senderInfo} selectionMode={selectionMode} isSelected={selectedMessages.includes(msg.id)}
                                            isDeleting={deletingMessages.includes(msg.id)}
                                            deleteAnimationClass={currentUser.settings?.chat?.deleteAnimation || 'animation-vortex-out'}
                                            onContextMenu={handleContextMenu} onLongPress={handleLongPress} onTap={handleToggleSelect}
                                            isSavedContext={selectedConversationId === 'saved_messages'}
                                        /> );
                                }))}
                                {selectedConversationId === 'saved_messages' && messages.length === 0 && !loadingMessages && (
                                    <div className="chat-placeholder">
                                        <BookmarkIcon className="placeholder-icon" />
                                        <h3>Збережені повідомлення</h3>
                                        <p>Пересилайте сюди повідомлення, щоб зберегти їх. Цей чат бачите тільки ви.</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {selectedConversation.id !== 'saved_messages' && (
                                <div className="message-input-container">
                                    {replyingTo && <ReplyPreview message={replyingTo} onCancel={() => setReplyingTo(null)} />}
                                    <div className="message-input-area">
                                        <button className="attachment-button" onClick={() => setIsAttachmentMenuOpen(true)}><PaperclipIcon /></button>
                                        <form onSubmit={handleFormSubmit} className="message-input-form">
                                            <input type="text" placeholder="Напишіть повідомлення..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                            <button type="submit" disabled={!newMessage.trim()}><SendIcon /></button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </>)}

                        {!selectedConversation && (<div className="chat-placeholder"><h3>Оберіть чат, щоб розпочати спілкування</h3><p>Або створіть нову групу.</p></div>)}
                    </main>
                </div>
            </div>
            {isCreateGroupModalOpen && <CreateGroupModal onClose={() => setCreateGroupModalOpen(false)} onGroupCreated={handleGroupCreated}/>}
            <MessageContextMenu {...contextMenu} onClose={() => setContextMenu({ show: false, x: 0, y: 0, message: null })} onAction={handleContextMenuAction} isOwnMessage={contextMenu.message?.senderId === currentUser?.uid} isUserAdmin={isCurrentUserAdmin} />
            {infoPanelOpenFor && (<GroupInfoPanel conversation={infoPanelOpenFor} currentUser={currentUser} onClose={() => setInfoPanelOpenFor(null)}/>)}
            <ConfirmationModal 
                isOpen={deleteModal.isOpen} 
                onClose={() => setDeleteModal({ isOpen: false, message: null })} 
                onConfirm={handleConfirmDelete} 
                title="Видалити повідомлення?" 
                message="Ви впевнені, що хочете видалити це повідомлення?" 
                confirmText="Видалити" 
                showCheckbox={!selectedConversation?.isGroup && selectedConversationId !== 'saved_messages'}
                checkboxLabel={`Видалити для ${companionName}`}
            />
            <ConfirmationModal isOpen={multiDeleteModal} onClose={() => setMultiDeleteModal(false)} onConfirm={handleDeleteSelected} title={`Видалити ${selectedMessages.length} повідомлень?`} message="Ця дія є незворотною." confirmText="Видалити" />
            <AttachmentMenu
                isOpen={isAttachmentMenuOpen}
                onClose={() => setIsAttachmentMenuOpen(false)}
                onSelectAttachment={handleSelectAttachment}
                onOpenImageEditor={handleOpenImageEditor} // Передаємо функцію
            />
            {isImageEditorOpen && (
                <ImageUploadEditor
                    onUpload={handleImageUpload}
                    onClose={() => setIsImageEditorOpen(false)}
                />
            )}
            <StoragePanel isOpen={isStoragePanelOpen} onClose={() => setStoragePanelOpen(false)} />
            <ForwardModal 
                isOpen={!!forwardingMessages}
                onClose={() => setForwardingMessages(null)}
                onForward={handleConfirmForward}
                conversations={conversations}
                currentUser={currentUser}
            />
            <ShareMusicModal 
                isOpen={isShareMusicModalOpen}
                onClose={() => setShareMusicModalOpen(false)}
                onShare={handleShareContent}
            />
        </div>
    );
};

export default MessagesPage;