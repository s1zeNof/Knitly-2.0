import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { query, collection, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useUserContext } from './UserContext';
import TrackList from './TrackList';
import PlaylistTab from './PlaylistTab';
import LikedTracks from './LikedTracks'; // <<< ІМПОРТУЄМО ОНОВЛЕНИЙ КОМПОНЕНТ

import default_picture from './img/Default-Images/default-picture.svg';
import verifiedIcon from './img/Profile-Settings/verified_icon-lg-bl.svg';
import './Profile.css';

// Іконки (без змін)
const MusicIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const FeedIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
const PlaylistIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>;

const UserProfile = () => {
    const { userNickname } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, authLoading, refreshUser } = useUserContext();
    
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('music');
    
    const [isFollowing, setIsFollowing] = useState(false);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);


    useEffect(() => {
        if (authLoading) return;

        const fetchUserData = async () => {
            setLoading(true);
            try {
                const usersQuery = query(collection(db, 'users'), where('nickname', '==', userNickname));
                const querySnapshot = await getDocs(usersQuery);
    
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userData = userDoc.data();

                    if (currentUser && userDoc.id === currentUser.uid) {
                        navigate('/profile');
                        return;
                    }

                    setProfileUser({ ...userData, uid: userDoc.id });
                    
                    if (currentUser) {
                        setIsFollowing(userData.followers?.includes(currentUser.uid));
                    }
                } else {
                    console.error("Користувача не знайдено");
                }
            } catch (e) {
                console.error("Помилка завантаження даних користувача:", e);
            } finally {
                setLoading(false);
            }
        };
    
        fetchUserData();
    }, [userNickname, currentUser, authLoading, navigate]);

    const handleFollowToggle = async () => {
        if (!currentUser || !profileUser || isProcessingFollow) return;
        setIsProcessingFollow(true);
        const profileUserRef = doc(db, 'users', profileUser.uid);
        const currentUserRef = doc(db, 'users', currentUser.uid);
        try {
            if (isFollowing) {
                await updateDoc(profileUserRef, { followers: arrayRemove(currentUser.uid) });
                await updateDoc(currentUserRef, { following: arrayRemove(profileUser.uid) });
                setIsFollowing(false);
            } else {
                await updateDoc(profileUserRef, { followers: arrayUnion(currentUser.uid) });
                await updateDoc(currentUserRef, { following: arrayUnion(profileUser.uid) });
                setIsFollowing(true);
            }
            await refreshUser();
        } catch (error) {
            console.error('Помилка підписки/відписки:', error);
        } finally {
            setIsProcessingFollow(false);
        }
    };

    const handleStartConversation = async () => {
        if (!currentUser || !profileUser) {
            console.error("ВІДСУТНІ ДАНІ: currentUser або profileUser не визначені.", { currentUser, profileUser });
            return;
        }
        const chatId = [currentUser.uid, profileUser.uid].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);

        const unreadCounts = {
            [currentUser.uid]: 0,
            [profileUser.uid]: 0
        };

        const dataToCreate = {
            participants: [currentUser.uid, profileUser.uid],
            participantInfo: [
                { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL },
                { uid: profileUser.uid, displayName: profileUser.displayName, photoURL: profileUser.photoURL }
            ],
            lastMessage: null,
            lastUpdatedAt: serverTimestamp(),
            unreadCounts: unreadCounts, 
        };

        try {
            const chatSnap = await getDoc(chatRef);
            if (!chatSnap.exists()) {
                await setDoc(chatRef, dataToCreate);
            }
            navigate('/messages', { state: { conversationId: chatId } });
        } catch (error) {
            console.error("Помилка створення чату:", error);
        }
    };
    
    const renderTabContent = () => {
        if (!profileUser) return null;
        switch (activeTab) {
            // --- ЗМІНА: Оновлюємо вигляд вкладки "Музика" ---
            case 'music': 
                return (
                    <div>
                        <div className="profile-section">
                            <h3 className="profile-section-title">Завантажені треки</h3>
                            <TrackList userId={profileUser.uid} />
                        </div>
                        <div className="profile-section">
                            <h3 className="profile-section-title">Вподобана музика</h3>
                            {/* Передаємо об'єкт користувача, чий профіль переглядаємо */}
                            <LikedTracks user={profileUser} />
                        </div>
                    </div>
                );
            case 'playlists': 
                return <PlaylistTab userId={profileUser.uid} />;
            case 'feed': 
                return <div className="page-profile-tab-placeholder">Стрічка цього користувача буде тут.</div>;
            default: 
                return null;
        }
    };

    if (loading) return <div>Завантаження профілю...</div>;
    if (!profileUser) return <div>Користувача не знайдено.</div>;

    const followButtonText = isFollowing ? "Відписатися" : "Підписатися";

    return (
        <div className="page-profile-container">
            <aside className="page-profile-sidebar">
                <div className="page-profile-background" style={{ backgroundImage: `url(${profileUser.backgroundImage || ''})` }}></div>
                <div className="page-profile-info-card">
                    <img src={profileUser.photoURL || default_picture} alt="Avatar" className="page-profile-avatar" />
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
                    {currentUser && (
                         <div className="page-profile-actions-group">
                            <button className="page-profile-action-button" onClick={handleFollowToggle} disabled={isProcessingFollow}>
                                {followButtonText}
                            </button>
                            <button className="page-profile-secondary-button" onClick={handleStartConversation}>
                                Повідомлення
                            </button>
                        </div>
                    )}
                </div>
            </aside>
            <main className="page-profile-main-content">
                <div className="page-profile-tabs">
                    <button className={`page-profile-tab-button ${activeTab === 'music' ? 'active' : ''}`} onClick={() => setActiveTab('music')}><MusicIcon/> Музика</button>
                    <button className={`page-profile-tab-button ${activeTab === 'playlists' ? 'active' : ''}`} onClick={() => setActiveTab('playlists')}><PlaylistIcon/> Плейлисти</button>
                    <button className={`page-profile-tab-button ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}><FeedIcon/> Стрічка</button>
                </div>
                <div className="page-profile-tab-content">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
};

export default UserProfile;