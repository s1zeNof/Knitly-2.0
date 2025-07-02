import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { useUserContext } from './UserContext';
import { doc, getDoc } from 'firebase/firestore';
import TrackList from './TrackList';
import LikedTracks from './LikedTracks';
import PlaylistTab from './PlaylistTab';

// <<< ДОДАНО ІМПОРТИ >>>
import CreatePostForm from './components/posts/CreatePostForm';
import Feed from './components/posts/Feed';

import default_picture from './img/Default-Images/default-picture.svg';
import verifiedIcon from './img/Profile-Settings/verified_icon-lg-bl.svg';
import './Profile.css';

// Іконки
const MusicIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const FeedIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
const AlbumsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="7" y1="3" x2="7" y2="21"></line></svg>;
const PlaylistIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>;

const Profile = () => {
    const navigate = useNavigate();
    const { user: currentUser, authLoading } = useUserContext();
    const [profileData, setProfileData] = useState(null);
    const [activeTab, setActiveTab] = useState('music');
    
    useEffect(() => {
        if (authLoading) return;
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchProfileData = async () => {
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setProfileData(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };
        fetchProfileData();
    }, [currentUser, authLoading, navigate]);

    const handleLogout = () => signOut(auth).then(() => navigate('/'));
    
    const renderTabContent = () => {
        if (!currentUser) return null; // Додаткова перевірка

        switch (activeTab) {
            case 'music':
                return (
                    <>
                        <div className="profile-music-layout">
                            <div className="profile-section">
                                <h3 className="profile-section-title">Топ треки</h3>
                                <TrackList userId={currentUser.uid} showTopTracksOnly={true} limit={5}/>
                            </div>
                             <div className="profile-section">
                                <h3 className="profile-section-title">Останні треки</h3>
                                <TrackList userId={currentUser.uid} showLatestTracksOnly={true} limit={5} />
                            </div>
                        </div>
                        <div className="profile-section">
                           <h3 className="profile-section-title">Вподобана музика</h3>
                           <LikedTracks />
                        </div>
                    </>
                );
            case 'playlists':
                return <PlaylistTab userId={currentUser.uid} />;
            case 'albums':
                return <div className="page-profile-tab-placeholder">Ваші альбоми будуть відображатися тут.</div>;
            // <<< ПОЧАТОК ЗМІН >>>
            case 'feed':
                return (
                    <div>
                        {/* Форма створення допису видима тільки на власному профілі */}
                        <CreatePostForm />
                        <hr className="feed-divider" /> 
                        {/* Стрічка з дописами ТІЛЬКИ поточного користувача */}
                        <Feed userId={currentUser.uid} />
                    </div>
                );
            // <<< КІНЕЦЬ ЗМІН >>>
            default:
                return null;
        }
    };

    if (authLoading || !profileData) return <div>Завантаження профілю...</div>;

    return (
        <div className="page-profile-container">
            <aside className="page-profile-sidebar">
                 <div className="page-profile-background" style={{ backgroundImage: `url(${profileData?.backgroundImage})` }}></div>
                <div className="page-profile-info-card">
                    <img src={profileData?.photoURL || default_picture} alt="Avatar" className="page-profile-avatar" />
                    <h2 className="page-profile-display-name">
                        {profileData?.displayName || 'No Name'}
                        {profileData?.isVerified && <img src={verifiedIcon} className="page-profile-verified-badge" alt="Verified" />}
                    </h2>
                    <p className="page-profile-nickname">@{profileData?.nickname || 'nickname'}</p>
                    <p className="page-profile-description">{profileData?.description || 'No description'}</p>
                    <div className="page-profile-stats">
                        <div className="page-profile-stat-item"><strong>{profileData?.followers?.length || 0}</strong><span>Підписники</span></div>
                        <div className="page-profile-stat-item"><strong>{profileData?.following?.length || 0}</strong><span>Підписки</span></div>
                    </div>
                    <button className="page-profile-logout-button" onClick={handleLogout}>Вийти</button>
                </div>
            </aside>

            <main className="page-profile-main-content">
                <div className="page-profile-tabs">
                    <button className={`page-profile-tab-button ${activeTab === 'music' ? 'active' : ''}`} onClick={() => setActiveTab('music')}><MusicIcon/> Музика</button>
                    <button className={`page-profile-tab-button ${activeTab === 'playlists' ? 'active' : ''}`} onClick={() => setActiveTab('playlists')}><PlaylistIcon/> Плейлисти</button>
                    <button className={`page-profile-tab-button ${activeTab === 'albums' ? 'active' : ''}`} onClick={() => setActiveTab('albums')}><AlbumsIcon/> Альбоми</button>
                    <button className={`page-profile-tab-button ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}><FeedIcon/> Стрічка</button>
                </div>
                <div className="page-profile-tab-content">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
};

export default Profile;