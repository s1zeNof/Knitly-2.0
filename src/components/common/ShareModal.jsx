import React, { useState, useEffect } from 'react';
import './ShareModal.css';
import { useUserContext } from '../../contexts/UserContext';
import { sharePostToChat, getFollowing, searchUsers } from '../../services/firebase';
import toast from 'react-hot-toast';
import default_picture from '../../img/Default-Images/default-picture.svg';

// Іконки для нових кнопок
const CopyLinkIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;
const ExternalShareIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>;


const ShareModal = ({ post, onClose }) => {
  const { user: currentUser } = useUserContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [sentTo, setSentTo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const postUrl = `${window.location.origin}/post/${post.id}`;

  useEffect(() => {
    const fetchInitialUsers = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      const following = await getFollowing(currentUser.uid);
      setUsers(following);
      setIsLoading(false);
    };
    fetchInitialUsers();
  }, [currentUser]);

  const handleSearch = async (e) => {
    const queryValue = e.target.value;
    setSearchQuery(queryValue);
    setIsLoading(true);
    if (queryValue.trim()) {
      const searchResults = await searchUsers(queryValue);
      setUsers(searchResults);
    } else {
      const following = await getFollowing(currentUser.uid);
      setUsers(following);
    }
    setIsLoading(false);
  };

  const handleSend = async (recipient) => {
    if (!currentUser || sentTo.includes(recipient.uid)) return;
    const optimisticId = recipient.uid;
    setSentTo(prev => [...prev, optimisticId]);
    const loadingToast = toast.loading(`Надсилаємо до @${recipient.nickname}...`);
    try {
      await sharePostToChat(currentUser, recipient, post);
      toast.success(`Надіслано до @${recipient.nickname}!`, { id: loadingToast });
    } catch (error) {
      toast.error(`Помилка: ${error.message}`, { id: loadingToast });
      setSentTo(prev => prev.filter(id => id !== optimisticId));
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
          <h3>Поширити допис</h3>
          <button onClick={onClose} className="share-modal-close-btn">&times;</button>
        </div>
        
        {/* -- НОВИЙ БЛОК ДІЙ -- */}
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

        <div className="share-modal-search">
          <input
            type="text"
            placeholder="Пошук користувачів..."
            value={searchQuery}
            onChange={handleSearch}
            autoFocus
          />
        </div>

        <div className="share-modal-user-list">
          {isLoading ? (
            <div className="share-modal-loader">Завантаження...</div>
          ) : users.length === 0 ? (
            <div className="share-modal-loader">Нікого не знайдено</div>
          ) : (
            users.map((user) => (
              <div key={user.uid} className="share-modal-user-item">
                <img src={user.photoURL || default_picture} alt={user.nickname} />
                <div className="share-modal-user-info">
                  <span className="username">{user.displayName}</span>
                  <span className="display-name">@{user.nickname}</span>
                </div>
                <button
                  onClick={() => handleSend(user)}
                  disabled={sentTo.includes(user.uid)}
                  className={`send-btn ${sentTo.includes(user.uid) ? 'sent' : ''}`}
                >
                  {sentTo.includes(user.uid) ? 'Надіслано' : 'Надіслати'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;