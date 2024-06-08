// Header.js
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useUserContext } from './UserContext';
import default_picture from './img/Default-Images/default-picture.svg';
import notificationBell from './img/notifications/notificationBell-white.svg';

import './Header.css';

const Header = () => {
    const { user, setUser, refreshUser  } = useUserContext();
    const [showMenu, setShowMenu] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            if (authUser) {
                const fetchNotifications = async () => {
                    const userRef = doc(db, 'users', authUser.uid);
                    const docSnap = await getDoc(userRef);
    
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        const followRequests = userData.followRequests || [];
                        
                        // Отримуємо дані для кожного користувача, який надіслав запит на слідкування
                        const notificationPromises = followRequests.map(async (requesterId) => {
                            const requesterRef = doc(db, 'users', requesterId);
                            const requesterSnap = await getDoc(requesterRef);
                            if (requesterSnap.exists()) {
                                const requesterData = requesterSnap.data();
                                return {
                                    senderId: requesterId,
                                    senderPhotoURL: requesterData.photoURL || '/path/to/default-avatar.jpg', // фото профілю
                                    senderDisplayName: requesterData.displayName || 'Someone', // нікнейм
                                    message: "wants to start following you",
                                    type: "followRequest"
                                };
                            }
                            return null;
                        });
    
                        const resolvedNotifications = await Promise.all(notificationPromises);
                        setNotifications(resolvedNotifications.filter(notif => notif !== null));
                    }
                };
                
                fetchNotifications();
            }
        });
    
        return () => unsubscribe();
    }, [user]);
    

    const handleNotificationClick = () => {
        setShowNotificationsPopup(!showNotificationsPopup);
    };

    const handleAcceptFollowRequest = async (requesterId) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            const requesterRef = doc(db, 'users', requesterId);
    
            await updateDoc(userRef, {
                followers: arrayUnion(requesterId),
                followRequests: arrayRemove(requesterId)
            });
    
            await updateDoc(requesterRef, {
                following: arrayUnion(user.uid)
            });
    
            // Оновлення стану та UI
            setNotifications(notifications.filter(notification => notification.senderId !== requesterId));
            refreshUser(); // Оновлення даних користувача в контексті
        } catch (error) {
            console.error('Error accepting follow request:', error);
        }
    };

    const handleDeclineFollowRequest = async (requesterId) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                followRequests: arrayRemove(requesterId)
            });

            setNotifications(notifications.filter(notification => notification.senderId !== requesterId));
        } catch (error) {
            console.error('Error declining follow request:', error);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    return (
        <header>
            <div className="header-logo">
                <Link to="/">Knitly</Link>
            </div>
            <div className="header-menu">
                <Link to="/">Home</Link>
                <Link to="/userlist">Users</Link>
            </div>
            {!user ? (
                <div className="auth-buttons">
                    <button className="btn-login button" onClick={() => navigate('/login')}>Log In</button>
                    <button className="btn-signup button" onClick={() => navigate('/register')}>Sign Up</button>
                </div>
            ) : (
                <div className="right-side-header">
                    <div className="notification-icon" onClick={handleNotificationClick}>
                        <img className="notif-icon" src={notificationBell} alt="Notifications" />
                        <span className={`notification-count ${notifications.length > 0 ? 'active' : ''}`}>{notifications.length}</span>
                        {showNotificationsPopup && (
                            <div className="notifications-popup">
                                {notifications.map((notification, index) => (
    <div key={index} className="notification-item">
        <div className="notification-item-picture">
            <img src={notification.senderPhotoURL} alt={`${notification.senderDisplayName}'s Avatar`} className="profile-picture" />
        </div>
        <div className="notification-item-info">
            <p><strong>{notification.senderDisplayName}</strong> {notification.message}</p>
            <div className="notification-item-btns">
                <button onClick={() => handleAcceptFollowRequest(notification.senderId)}>Accept</button>
                <button onClick={() => handleDeclineFollowRequest(notification.senderId)}>Decline</button>
            </div>
        </div>
    </div>
))}
                            </div>
                        )}
                    </div>
                    <div className="user-profile" onClick={() => setShowMenu(!showMenu)}>
                        <img src={user.photoURL || default_picture} alt="Avatar" className="profile-picture" />
                        {showMenu && (
                            <div className="dropdown-menu">
                                <Link to="/profile">My Profile</Link>
                                <Link to="/settings">Settings</Link>
                                <button onClick={handleLogout}>Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;