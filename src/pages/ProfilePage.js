import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { query, collection, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, serverTimestamp, addDoc, runTransaction } from 'firebase/firestore';
import { useUserContext } from '../contexts/UserContext';
import { useUserTracks } from '../hooks/useUserTracks';
import TrackList from '../components/common/TrackList';
import PlaylistTab from '../components/common/PlaylistTab';
import LikedTracks from '../components/common/LikedTracks';
import Feed from '../components/posts/Feed';
import CreatePostForm from '../components/posts/CreatePostForm';
import ReceivedGiftsTab from '../components/gifts/ReceivedGiftsTab';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import SendGiftModal from '../components/gifts/SendGiftModal';
import toast from 'react-hot-toast';

import default_picture from '../img/Default-Images/default-picture.svg';
import verifiedIcon from '../img/Profile-Settings/verified_icon-lg-bl.svg';
import './Profile.css';

const MusicIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
const FeedIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
const PlaylistIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>;
const AlbumsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="7" y1="3" x2="7" y2="21"></line></svg>;
const GiftIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>;
const ActionsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>;

const ProfilePage = ({ openBrowser, openShareModal }) => {
    const { userNickname } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, authLoading, refreshUser } = useUserContext();

    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('music');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);
    const [isActionMenuOpen, setActionMenuOpen] = useState(false);
    const actionMenuRef = useRef(null);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

    const isOwnProfile = !userNickname || (profileUser && currentUser && profileUser.uid === currentUser.uid);
    const targetUserId = profileUser?.uid;

    const { tracks: topTracks, loading: loadingTop } = useUserTracks(targetUserId, { orderByField: 'playCount', orderByDirection: 'desc', limit: 5 });
    const { tracks: latestTracks, loading: loadingLatest } = useUserTracks(targetUserId, { orderByField: 'createdAt', orderByDirection: 'desc', limit: 5 });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
                setActionMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [actionMenuRef]);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                let userToFetchId;
                let userToFetchData;

                if (userNickname) {
                    const usersQuery = query(collection(db, 'users'), where('nickname', '==', userNickname));
                    const querySnapshot = await getDocs(usersQuery);
                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        userToFetchId = userDoc.id;
                        userToFetchData = userDoc.data();
                    } else {
                        throw new Error("Користувача не знайдено");
                    }
                } else if (currentUser) {
                    // /profile route — redirect to canonical /:nickname URL
                    if (currentUser.nickname) {
                        navigate(`/${currentUser.nickname}`, { replace: true });
                        return;
                    }
                    userToFetchId = currentUser.uid;
                    userToFetchData = currentUser;
                } else {
                    setLoading(false);
                    if (!authLoading) navigate('/login');
                    return;
                }

                setProfileUser({ ...userToFetchData, uid: userToFetchId });

                if (currentUser && userToFetchId !== currentUser.uid) {
                    setIsFollowing(currentUser.following?.includes(userToFetchId));
                }
            } catch (e) {
                console.error("Помилка завантаження даних користувача:", e);
                setProfileUser(null);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchUserData();
        }
    }, [userNickname, currentUser, authLoading, navigate]);

    const handleFollowToggle = async () => {
        if (!currentUser || !profileUser || isProcessingFollow || isOwnProfile) return;
        setIsProcessingFollow(true);
        const profileUserRef = doc(db, 'users', profileUser.uid);
        const currentUserRef = doc(db, 'users', currentUser.uid);
        try {
            if (isFollowing) {
                await updateDoc(profileUserRef, { followers: arrayRemove(currentUser.uid) });
                await updateDoc(currentUserRef, { following: arrayRemove(profileUser.uid) });
            } else {
                await updateDoc(profileUserRef, { followers: arrayUnion(currentUser.uid) });
                await updateDoc(currentUserRef, { following: arrayUnion(profileUser.uid) });
                const notificationRef = collection(db, 'users', profileUser.uid, 'notifications');
                await addDoc(notificationRef, {
                    type: 'new_follower',
                    fromUser: { uid: currentUser.uid, nickname: currentUser.nickname, photoURL: currentUser.photoURL },
                    entityId: currentUser.uid, entityLink: `/${currentUser.nickname}`,
                    timestamp: serverTimestamp(), read: false
                });
            }
            await refreshUser();
            setProfileUser(prev => ({ ...prev, followers: isFollowing ? prev.followers.filter(id => id !== currentUser.uid) : [...(prev.followers || []), currentUser.uid] }));
            setIsFollowing(!isFollowing);
        } catch (error) {
            console.error('Помилка підписки/відписки:', error);
        } finally {
            setIsProcessingFollow(false);
        }
    };

    const handleStartConversation = async () => {
        if (!currentUser || !profileUser || isOwnProfile) return;
        const chatId = [currentUser.uid, profileUser.uid].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);
        try {
            const chatSnap = await getDoc(chatRef);
            if (!chatSnap.exists()) {
                const dataToCreate = {
                    isGroup: false,
                    participants: [currentUser.uid, profileUser.uid],
                    participantInfo: [
                        { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL || null },
                        { uid: profileUser.uid, displayName: profileUser.displayName, photoURL: profileUser.photoURL || null }
                    ],
                    lastMessage: null,
                    lastUpdatedAt: serverTimestamp(),
                    unreadCounts: { [currentUser.uid]: 0, [profileUser.uid]: 0 },
                };
                await setDoc(chatRef, dataToCreate);
            }
            navigate('/messages', { state: { conversationId: chatId } });
        } catch (error) {
            console.error("Помилка створення чату:", error);
        }
    };

    const handleLogout = () => {
        if (!window.confirm('Ви впевнені, що хочете вийти?')) return;
        signOut(auth).then(() => navigate('/'));
    };

    const handleSendGift = async (gift, recipientUser) => {
        if (!currentUser) {
            toast.error("Будь ласка, увійдіть, щоб дарувати подарунки.");
            return;
        }
        if (currentUser.uid === recipientUser.uid) {
            toast.error("Ви не можете дарувати подарунки самому собі.");
            return;
        }

        const senderRef = doc(db, 'users', currentUser.uid);
        const recipientRef = doc(db, 'users', recipientUser.uid);

        try {
            await runTransaction(db, async (transaction) => {
                const senderDoc = await transaction.get(senderRef);
                if (!senderDoc.exists()) throw new Error("Ваш профіль не знайдено.");

                const senderBalance = senderDoc.data().notesBalance || 0;
                if (senderBalance < gift.price) throw new Error("Недостатньо Нот на балансі.");

                transaction.update(senderRef, { notesBalance: senderBalance - gift.price });

                const recipientGiftRef = doc(collection(recipientRef, 'receivedGifts'));
                transaction.set(recipientGiftRef, {
                    giftId: gift.id,
                    giftName: gift.name,
                    giftMediaUrl: gift.mediaUrl,
                    giftMediaType: gift.mediaType,
                    fromUserId: currentUser.uid,
                    fromUserName: currentUser.displayName,
                    receivedAt: serverTimestamp()
                });
            });

            toast.success(`Подарунок "${gift.name}" успішно відправлено до ${recipientUser.displayName}!`);
            await refreshUser();

        } catch (error) {
            console.error("Помилка відправки подарунка:", error);
            toast.error(error.message || "Не вдалося відправити подарунок.");
        }
    };

    const renderTabContent = () => {
        if (!profileUser) return null;

        switch (activeTab) {
            case 'music':
                const hasTracks = (profileUser.tracksCount || 0) > 0;
                return (
                    <>
                        {hasTracks && (
                            <div className="profile-music-layout">
                                <div className="profile-section">
                                    <h3 className="profile-section-title">Топ треки</h3>
                                    <TrackList initialTracks={topTracks} isLoading={loadingTop} />
                                </div>
                                <div className="profile-section">
                                    <h3 className="profile-section-title">Останні треки</h3>
                                    <TrackList initialTracks={latestTracks} isLoading={loadingLatest} />
                                </div>
                            </div>
                        )}
                        <div className="profile-section">
                            <h3 className="profile-section-title">Вподобана музика</h3>
                            <LikedTracks user={profileUser} />
                        </div>
                    </>
                );
            case 'playlists':
                return <PlaylistTab userId={profileUser.uid} />;
            case 'albums':
                return <div className="page-profile-tab-placeholder">Альбоми цього користувача будуть відображатися тут.</div>;
            case 'gifts':
                return <ReceivedGiftsTab userId={profileUser.uid} />;
            case 'feed':
                return (
                    <div>
                        {isOwnProfile && <CreatePostForm />}
                        <Feed
                            profileUserId={profileUser.uid}
                            openBrowser={openBrowser}
                            openShareModal={openShareModal}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading || authLoading) return <div>Завантаження профілю...</div>;
    if (!profileUser) return <div>Користувача не знайдено.</div>;

    return (
        <>
            <div className="page-profile-container">
                <div className="page-profile-header">
                    <div className="page-profile-background" style={{ backgroundImage: `url(${profileUser.backgroundImage || ''})` }}>
                        {/* Actions icon — top-right of banner, other profiles only */}
                        {!isOwnProfile && (
                            <div className="profile-banner-actions" ref={actionMenuRef}>
                                <button
                                    className="profile-banner-action-btn"
                                    onClick={() => setActionMenuOpen(!isActionMenuOpen)}
                                    aria-label="Дії"
                                >
                                    <ActionsIcon />
                                </button>
                                <div className={`profile-actions-dropdown ${isActionMenuOpen ? 'visible' : ''}`}>
                                    <button className="dropdown-action-button" onClick={() => { setIsGiftModalOpen(true); setActionMenuOpen(false); }}>
                                        Надіслати подарунок
                                    </button>
                                    <button className="dropdown-action-button danger" onClick={() => { alert('Функціонал блокування в розробці'); setActionMenuOpen(false); }}>
                                        Заблокувати
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="page-profile-header-content">
                        <div className="page-profile-avatar-wrapper">
                            <img src={profileUser.photoURL || default_picture} alt="Avatar" className="page-profile-avatar" onError={(e) => { e.target.onerror = null; e.target.src = default_picture; }} />
                        </div>
                        <div className="page-profile-actions-group">
                            {isOwnProfile ? (
                                <>
                                    <button className="page-profile-secondary-button" onClick={() => navigate('/settings')}>Редагувати профіль</button>
                                    <button className="page-profile-logout-button" onClick={handleLogout}>Вийти</button>
                                </>
                            ) : (
                                <>
                                    <button className="page-profile-action-button" onClick={handleFollowToggle} disabled={isProcessingFollow}>
                                        {isFollowing ? "Відписатися" : "Підписатися"}
                                    </button>
                                    <button className="page-profile-secondary-button" onClick={handleStartConversation}>
                                        Повідомлення
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="page-profile-info">
                        <h2 className="page-profile-display-name">
                            {profileUser.displayName || 'No Name'}
                            {profileUser.isVerified && <img src={verifiedIcon} className="page-profile-verified-badge" alt="Verified" />}
                        </h2>
                        <p className="page-profile-nickname">@{profileUser.nickname}</p>
                        <p className="page-profile-description">{profileUser.description || 'No description'}</p>
                        <div className="page-profile-stats">
                            <div className="page-profile-stat-item"><strong>{profileUser.followers?.length || 0}</strong><span>Підписники</span></div>
                            <div className="page-profile-stat-item"><strong>{profileUser.following?.length || 0}</strong><span>Підписки</span></div>
                        </div>
                    </div>

                    <div className="page-profile-tabs">
                        <button className={`page-profile-tab-button ${activeTab === 'music' ? 'active' : ''}`} onClick={() => setActiveTab('music')}><MusicIcon /> Музика</button>
                        <button className={`page-profile-tab-button ${activeTab === 'albums' ? 'active' : ''}`} onClick={() => setActiveTab('albums')}><AlbumsIcon /> Альбоми</button>
                        <button className={`page-profile-tab-button ${activeTab === 'playlists' ? 'active' : ''}`} onClick={() => setActiveTab('playlists')}><PlaylistIcon /> Плейлисти</button>
                        <button className={`page-profile-tab-button ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}><FeedIcon /> Стрічка</button>
                        <button className={`page-profile-tab-button ${activeTab === 'gifts' ? 'active' : ''}`} onClick={() => setActiveTab('gifts')}><GiftIcon /> Подарунки</button>
                    </div>
                </div>

                <main className="page-profile-main-content">
                    <div className="page-profile-tab-content">
                        {renderTabContent()}
                    </div>
                </main>
            </div>

            {isGiftModalOpen && (
                <SendGiftModal
                    recipient={profileUser}
                    onClose={() => setIsGiftModalOpen(false)}
                    onGiftSendInitiated={handleSendGift}
                />
            )}
        </>
    );
};

export default ProfilePage;