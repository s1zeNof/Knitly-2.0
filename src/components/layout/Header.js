import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useUserContext } from '../../contexts/UserContext';
import default_picture from '../../img/Default-Images/default-picture.svg';
import HeaderSearch from '../search/HeaderSearch';
import './Header.css';

const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const BellIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const MessagesIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6a8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;

const Header = () => {
    const { user, totalUnreadMessages, unreadNotificationsCount } = useUserContext();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    const handleLogoClick = (e) => {
        if (location.pathname === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const renderMobileHeader = () => {
        if (location.pathname === '/profile' && user) {
            return (
                <div className="mobile-header profile-context-header">
                    <span className="profile-context-username">@{user?.nickname}</span>
                    <Link to="/settings" className="mobile-header-action">
                        <MenuIcon />
                    </Link>
                </div>
            );
        }

        return (
            <div className="mobile-header">
                <div className="header-logo">
                    <Link to="/" onClick={handleLogoClick}>Knitly</Link>
                </div>
                {user ? (
                    <div className="mobile-header-actions">
                        <Link to="/notifications" className="mobile-header-action notification">
                            <BellIcon />
                            {unreadNotificationsCount > 0 && <span className="mobile-badge">{unreadNotificationsCount}</span>}
                        </Link>
                        <Link to="/messages" className="mobile-header-action notification">
                            <MessagesIcon />
                            {totalUnreadMessages > 0 && <span className="mobile-badge">{totalUnreadMessages}</span>}
                        </Link>
                    </div>
                ) : (
                    <div className="mobile-header-actions auth-buttons-mobile">
                        <button className="btn-login" onClick={() => navigate('/login')}>Увійти</button>
                        <button className="btn-signup" onClick={() => navigate('/register')}>Реєстрація</button>
                    </div>
                )}
            </div>
        );
    };

    const renderDesktopHeader = () => (
        <>
            <div className="header-left-section">
                <div className="header-logo">
                    <Link to="/" onClick={handleLogoClick}>Knitly</Link>
                </div>
            </div>

            <div className="header-center-section">
                <HeaderSearch />
            </div>

            {!user ? (
                <div className="right-side-header auth-buttons">
                    <button className="btn-login button" onClick={() => navigate('/login')}>Увійти</button>
                    <button className="btn-signup button" onClick={() => navigate('/register')}>
                        <span>Реєстрація</span>
                    </button>
                </div>
            ) : (
                <div className="right-side-header">
                    <div className="notification-icon">
                        <Link to="/notifications" className="notif-icon-link">
                            <BellIcon />
                            {unreadNotificationsCount > 0 && <span className="notification-count active">{unreadNotificationsCount}</span>}
                        </Link>
                    </div>
                    <div className="notification-icon">
                        <Link to="/messages" className="notif-icon-link">
                            <MessagesIcon />
                            {totalUnreadMessages > 0 && <span className="notification-count active">{totalUnreadMessages}</span>}
                        </Link>
                    </div>
                    <div className="user-profile">
                        <img src={user.photoURL || default_picture} alt="" className="profile-picture" onError={(e) => { e.target.onerror = null; e.target.src = default_picture; }} />
                        <div className="dropdown-menu">
                            <Link to="/profile">Мій профіль</Link>
                            <Link to="/settings">Налаштування</Link>
                            <button onClick={handleLogout}>Вийти</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <header>
            {isMobile ? renderMobileHeader() : renderDesktopHeader()}
        </header>
    );
};

export default Header;