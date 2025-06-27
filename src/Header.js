import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useUserContext } from './UserContext';
import default_picture from './img/Default-Images/default-picture.svg';
import notificationBell from './img/notifications/notificationBell-white.svg';
import verifiedIcon from './img/Profile-Settings/verified_icon-lg-bl.svg';
import './Header.css';

// --- ПОЧАТОК ЗМІН ---
// Іконка меню (гамбургер)
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;

const Header = ({ showTagPageMenu, onTagPageMenuClick }) => {
// --- КІНЕЦЬ ЗМІН ---
    const { user, setUser, refreshUser } = useUserContext();
    const [showMenu, setShowMenu] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            if (authUser) {
                // ...
            }
        });
        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };
    
    return (
        <header>
            {/* --- ПОЧАТОК ЗМІН --- */}
            <div className="header-left-section">
                {showTagPageMenu && (
                    <button className="header-menu-toggle" onClick={onTagPageMenuClick}>
                        <MenuIcon />
                    </button>
                )}
                <div className="header-logo">
                    <Link to="/">Knitly</Link>
                </div>
            </div>
            {/* --- КІНЕЦЬ ЗМІН --- */}

            <div className="header-menu">
                <Link to="/">Home</Link>
                <Link to="/userlist">Users</Link>
                {user && <Link to="/upload">Upload</Link>}
            </div>
            {!user ? (
                <div className="auth-buttons">
                    <button className="btn-login button" onClick={() => navigate('/login')}>Log In</button>
                    <button className="btn-signup button" onClick={() => navigate('/register')}>Sign Up</button>
                </div>
            ) : (
                <div className="right-side-header">
                    <div className="notification-icon" onClick={() => setShowNotificationsPopup(!showNotificationsPopup)}>
                        {/* ... існуюча розмітка для сповіщень ... */}
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