import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from './firebase';
import { query, collection, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useUserContext } from './UserContext';
import default_picture from './img/Default-Images/default-picture.svg';
import verifiedIcon from './img/Profile-Settings/verified_icon-lg-bl.svg';
import './UserProfile.css';
import './Global.css';
const UserProfile = () => {
    const { userNickname } = useParams();
    const { user: currentUser, refreshUser } = useUserContext();
    const [profileUser, setProfileUser] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followRequestSent, setFollowRequestSent] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                let userRef;
                const usersQuery = query(collection(db, 'users'), where('nickname', '==', userNickname));
                const querySnapshot = await getDocs(usersQuery);
    
                if (!querySnapshot.empty) {
                    // Якщо користувач знайдений за нікнеймом
                    const userData = querySnapshot.docs[0].data();
                    setProfileUser({ ...userData, uid: querySnapshot.docs[0].id });
                    setFollowersCount(userData.followers?.length || 0);
                    setFollowingCount(userData.following?.length || 0);
                    setIsFollowing(userData.followers?.includes(currentUser?.uid));
                    setFollowRequestSent(userData.followRequests?.includes(currentUser?.uid));
                } else {
                    // Якщо користувач не знайдений за нікнеймом, спробуємо знайти за ID
                    userRef = doc(db, 'users', userNickname);
                    const docSnap = await getDoc(userRef);
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        setProfileUser({ ...userData, uid: userNickname });
                        setFollowersCount(userData.followers?.length || 0);
                        setFollowingCount(userData.following?.length || 0);
                        setIsFollowing(userData.followers?.includes(currentUser?.uid));
                        setFollowRequestSent(userData.followRequests?.includes(currentUser?.uid));
                    } else {
                        setError('User not found');
                    }
                }
            } catch (e) {
                setError('Error fetching user data');
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
    
        fetchUserData();
    }, [userNickname, currentUser]);
    

    useEffect(() => {
        console.log(`isFollowing: ${isFollowing}, followRequestSent: ${followRequestSent}`);
    }, [isFollowing, followRequestSent]);

    const refreshUserProfileData = async () => {
        if (!profileUser || !currentUser) return;
    
        try {
            const userRef = doc(db, 'users', profileUser.uid);
            const userDoc = await getDoc(userRef);
    
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setProfileUser({...userData, uid: profileUser.uid}, () => {
                    // Оновлення isFollowing після оновлення profileUser
                    setIsFollowing(userData.followers?.includes(currentUser.uid));
                    setFollowRequestSent(userData.followRequests?.includes(currentUser.uid));
                });
                setFollowersCount(userData.followers?.length || 0);
                setFollowingCount(userData.following?.length || 0);
            }
        } catch (error) {
            console.error('Error in refreshUserProfileData:', error);
        }
    };
    

    const handleFollow = async () => {
        if (!currentUser || !profileUser || currentUser.uid === profileUser.uid) return;
    
        const profileUserRef = doc(db, 'users', profileUser.uid);
        const currentUserRef = doc(db, 'users', currentUser.uid);
        try {
            console.log('Updating followers for profileUser:', profileUser.uid);
            if (profileUser.isPublicProfile) {
                await updateDoc(profileUserRef, {
                    followers: arrayUnion(currentUser.uid)
                });
                console.log('Updating following for currentUser:', currentUser.uid);
                const result = await updateDoc(currentUserRef, {
                    following: arrayUnion(profileUser.uid)
                });
    
                console.log('Update result:', result); // Додайте цей рядок для логування результату оновлення
    
                setIsFollowing(true);
                setFollowersCount(prevCount => prevCount + 1);
                refreshUser();
            } else {
                await updateDoc(profileUserRef, {
                    followRequests: arrayUnion(currentUser.uid)
                });
            }
            refreshUserProfileData();
        } catch (error) {
            console.error('Error in handleFollow:', error);
        }
    };
    
    
    const handleUnfollow = async () => {
        if (!currentUser || !profileUser || currentUser.uid === profileUser.uid) return;
    
        const profileUserRef = doc(db, 'users', profileUser.uid);
        const currentUserRef = doc(db, 'users', currentUser.uid);
        try {
            await updateDoc(profileUserRef, {
                followers: arrayRemove(currentUser.uid)
            });
            await updateDoc(currentUserRef, {
                following: arrayRemove(profileUser.uid) // Видаляємо UID профілю зі списку підписок поточного користувача
            });
            setIsFollowing(false);
            setFollowersCount(prevCount => prevCount - 1);
            // Оновлюємо кількість підписок у UserContext
            refreshUser();
            // Оновлюємо дані профілю користувача
            await refreshUserProfileData();
        } catch (error) {
            console.error('Error in handleUnfollow:', error);
        }
        setIsFollowing(false); // Встановлюємо isFollowing у false після успішної відписки
    };
    

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    


    return (
        <div className="settings-container">
            <aside className="sidebar">
                <div className="sidebar-profile">
                    <img src={profileUser?.photoURL || default_picture} alt={`${profileUser?.displayName}'s Avatar`} className="profile-picture" />
                    <h3>
                        {profileUser?.displayName || 'User'}
                        {profileUser?.isVerified && <span className="verified-badge"><img src={verifiedIcon} alt="Verified" /></span>}
                    </h3>
                    <p>@{profileUser?.nickname || 'No nickname available'}</p>
                    <p>Followers: {followersCount}</p>
                    <p>Following: {followingCount}</p>
                    <p>{profileUser?.email || 'No email available'}</p>
                    {/* Відображення опису тільки якщо профіль публічний або поточний користувач слідкує за цим профілем */}
                    {(profileUser?.isPublicProfile || isFollowing) && (
                        <p className="profile-description">{profileUser?.description || 'No description available'}</p>
                    )}
                    <button className="follow-btn" 
                            onClick={isFollowing ? handleUnfollow : followRequestSent ? null : handleFollow}>
                        {isFollowing ? "Unfollow" : followRequestSent ? "Request Sent" : "Follow"}
                    </button>
                    {!profileUser?.isPublicProfile && !isFollowing && (
                        <p className="private-profile-message">The user has made their profile private</p>
                    )}
                </div>
            </aside>
            <div className="profile-main-content">
                <div className="profile-background" style={{ backgroundImage: `url(${profileUser?.backgroundImage || '/path/to/default-background.jpg'})` }}></div>
                <main className="profile-main-content">
                    <div className="profile-details">
                        <h2>{profileUser?.displayName || 'User'}'s Profile</h2>
                        
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserProfile;
