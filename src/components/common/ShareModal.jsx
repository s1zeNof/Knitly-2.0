import React, { useState, useEffect, useCallback } from 'react';
import './ShareModal.css';
import { useUserContext } from '../../contexts/UserContext';
import { searchUsers, getUsersFromRecentChats, getFollowing, sharePostToChats } from '../../services/firebase';
import toast from 'react-hot-toast';
import default_picture from '../../img/Default-Images/default-picture.svg';

const CopyLinkIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;
const ExternalShareIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>;

const ShareModal = ({ post, onClose }) => {
    const { user: currentUser } = useUserContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [displayedUsers, setDisplayedUsers] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const postUrl = `${window.location.origin}/post/${post.id}`;

    const fetchInitialUsers = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);

        const [following, recentChatUsers] = await Promise.all([
            getFollowing(currentUser.uid),
            getUsersFromRecentChats(currentUser.uid)
        ]);

        const combinedUsers = new Map();
        recentChatUsers.forEach(user => combinedUsers.set(user.uid, user));
        following.forEach(user => combinedUsers.set(user.uid, user));

        const uniqueSuggestedUsers = Array.from(combinedUsers.values());
        
        if (uniqueSuggestedUsers.length > 0) {
            setSuggestedUsers(uniqueSuggestedUsers);
            setDisplayedUsers(uniqueSuggestedUsers);
        }
        setIsLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchInitialUsers();
    }, [fetchInitialUsers]);

    const handleSearch = async (e) => {
        const queryValue = e.target.value;
        setSearchQuery(queryValue);

        if (queryValue.trim() === '') {
            setDisplayedUsers(suggestedUsers);
            return;
        }

        setIsLoading(true);
        const searchResults = await searchUsers(queryValue);
        setDisplayedUsers(searchResults.filter(u => u.uid !== currentUser.uid));
        setIsLoading(false);
    };

    const toggleUserSelection = (user) => {
        setSelectedUsers(prev =>
            prev.some(u => u.uid === user.uid)
                ? prev.filter(u => u.uid !== user.uid)
                : [...prev, user]
        );
    };

    const handleSend = async () => {
        if (selectedUsers.length === 0) return;
        
        const recipients = selectedUsers.map(u => u.uid);
        const toastId = toast.loading(`Надсилання до ${selectedUsers.length} отримувачів...`);

        try {
            await sharePostToChats(currentUser.uid, recipients, post);
            toast.success('Успішно надіслано!', { id: toastId });
            onClose();
        } catch (error) {
            toast.error(`Сталася помилка: ${error.message}`, { id: toastId });
        }
    };
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(postUrl);
        toast.success('Посилання скопійовано!');
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Допис від @${post.authors?.[0]?.nickname || '...'}`,
                    text: 'Поглянь на цей допис у Knitly!',
                    url: postUrl,
                });
            } catch (error) {
                console.log('Помилка системного поширення:', error);
            }
        } else {
            toast.error('Ваш браузер не підтримує цю функцію.');
        }
    };

    return (
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="share-modal-header">
                    <h3>Поширити</h3>
                    <button onClick={onClose} className="share-modal-close-btn">&times;</button>
                </div>

                <div className="share-modal-search">
                    <input
                        type="text"
                        placeholder="Пошук..."
                        value={searchQuery}
                        onChange={handleSearch}
                        autoFocus
                    />
                </div>

                <div className="share-modal-user-list">
                    {isLoading ? (
                        <div className="share-modal-message">Завантаження...</div>
                    ) : displayedUsers.length === 0 ? (
                        <div className="share-modal-message">Нікого не знайдено</div>
                    ) : (
                        displayedUsers.map((user) => (
                            <div key={user.uid} className="share-modal-user-item" onClick={() => toggleUserSelection(user)}>
                                <img src={user.photoURL || default_picture} alt={user.nickname} />
                                <div className="share-modal-user-info">
                                    <span className="username">{user.displayName}</span>
                                    <span className="display-name">@{user.nickname}</span>
                                </div>
                                <div className={`checkbox-container ${selectedUsers.some(u => u.uid === user.uid) ? 'selected' : ''}`}>
                                    <div className="checkbox-custom"></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="share-modal-actions">
                    <button className="share-action-btn" onClick={handleCopyLink}>
                        <CopyLinkIcon />
                        Копіювати
                    </button>
                    <button className="share-action-btn" onClick={handleNativeShare}>
                        <ExternalShareIcon />
                        Поширити через...
                    </button>
                </div>

                {selectedUsers.length > 0 && (
                    <div className="share-modal-footer">
                        <button className="send-btn-primary" onClick={handleSend}>
                            Надіслати
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareModal;