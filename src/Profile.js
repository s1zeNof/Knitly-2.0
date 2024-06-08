// Profile.js
import './Global.css';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { useUserContext } from './UserContext';
import { doc, getDoc } from 'firebase/firestore';
import default_picture from './img/Default-Images/default-picture.svg';
import verifiedIcon from './img/Profile-Settings/verified_icon-lg-bl.svg';
import './UserProfile.css';
import './Profile.css';
import './Settings.css';

const Profile = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useUserContext();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            const fetchData = async () => {
                try {
                    const userRef = doc(db, 'users', currentUser.uid);
                    const docSnap = await getDoc(userRef);
                    if (docSnap.exists()) {
                        setProfileData(docSnap.data());
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [currentUser]);

    const handleLogout = () => {
        signOut(auth).then(() => {
            navigate('/');
        }).catch((error) => {
            console.error('Error signing out: ', error);
        });
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="settings-container">
            <aside className="sidebar">
            <div className="sidebar-profile">
                        <img src={profileData?.photoURL || default_picture} alt={`${profileData?.displayName}'s Avatar`} className="profile-picture" />
                        <h3>
                            {profileData?.displayName || 'No Name'}
                            {profileData?.isVerified && <img src={verifiedIcon} className="verified-badge" alt="Verified" />}
                        </h3>
                        <p>@{profileData?.nickname || 'No nickname available'}</p>
                        
                        <p>Followers: {profileData?.followers?.length || 0}</p>
                    <p>Following: {profileData?.following?.length || 0}</p>
                    {/* Відображення опису та емейлу незалежно від статусу приватності */}
                    <p>{profileData?.email || 'No email available'}</p>
                    <p>{profileData?.description || 'No description available'}</p>
                    {profileData?.isPublicProfile === false && (
                        <p className="private-profile-message">You have made your profile private</p>
                    )}
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                </div>
            </aside>
            <div className="profile-main-content">
                <div className="profile-background" style={{ backgroundImage: `url(${profileData?.backgroundImage || '/path/to/default-background.jpg'})` }}></div>
                <main className="profile-main-content">
                    
                </main>
            </div>
        </div>
    );
};

export default Profile;
