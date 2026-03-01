import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useUserContext } from '../../contexts/UserContext';
import default_picture from '../../img/Default-Images/default-picture.svg';
import HeaderSearch from '../search/HeaderSearch';
import './Header.css';

const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const BackArrowIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;
const BellIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const MessagesIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6a8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const ChevronDownIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

const ACCOUNTS_KEY = 'knitly_saved_accounts';

const Header = () => {
    const { user, totalUnreadMessages, unreadNotificationsCount } = useUserContext();
    const navigate = useNavigate();
    const location = useLocation();
    const accountMenuRef = useRef(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [savedAccounts, setSavedAccounts] = useState(() => {
        try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); } catch { return []; }
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Persist current user into saved accounts
    useEffect(() => {
        if (!user?.uid) return;
        setSavedAccounts(prev => {
            const entry = {
                uid: user.uid,
                nickname: user.nickname,
                photoURL: user.photoURL || null,
                displayName: user.displayName || user.nickname,
            };
            const idx = prev.findIndex(a => a.uid === user.uid);
            const next = idx >= 0
                ? prev.map((a, i) => i === idx ? entry : a)
                : [...prev, entry];
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
            return next;
        });
    }, [user]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
                setShowAccountMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
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

    const handleAddAccount = () => {
        setShowAccountMenu(false);
        // Navigate to login WITHOUT signing out — user stays logged in.
        // Firebase will switch sessions automatically when they log in.
        // They can press back to cancel and return with current session.
        navigate('/login', { state: { canGoBack: true } });
    };

    const handleSwitchAccount = (account) => {
        setShowAccountMenu(false);
        if (account.uid === user?.uid) return;
        // Firebase web supports one active session — sign out then go to login
        signOut(auth).then(() => navigate('/login'));
    };

    // Known static route prefixes — anything else is a /:nickname route
    const KNOWN_ROUTES = new Set([
        '', 'login', 'register', 'settings', 'messages', 'notifications',
        'profile', 'gifts', 'admin', 'upload', 'mini-apps', 'creative-studio',
        'my-library', 'track', 'post', 'playlist', 'search', 'users',
    ]);
    const firstSegment = location.pathname.split('/').filter(Boolean)[0] || '';
    const isNicknamePath = firstSegment && !KNOWN_ROUTES.has(firstSegment);
    const profileNicknameFromUrl = isNicknamePath ? firstSegment : null;

    // Detect own profile route: /profile (legacy) or /:nickname (new)
    const isOwnProfileRoute = !!(user && (
        location.pathname === '/profile' ||
        location.pathname === `/${user.nickname}`
    ));
    // Detect other user's profile route
    const isOtherProfileRoute = !!(isNicknamePath && profileNicknameFromUrl !== user?.nickname);

    const renderMobileHeader = () => {
        // Other user's profile → back arrow + their @nickname
        if (isOtherProfileRoute) {
            return (
                <div className="mobile-header other-profile-header">
                    <button className="mobile-back-btn" onClick={() => navigate(-1)} aria-label="Назад">
                        <BackArrowIcon />
                    </button>
                    <span className="other-profile-username">@{profileNicknameFromUrl}</span>
                    {user && (
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
                    )}
                </div>
            );
        }

        if (isOwnProfileRoute) {
            return (
                <div className="mobile-header profile-context-header">
                    {/* Nickname + account switcher */}
                    <div className="profile-context-switcher" ref={accountMenuRef}>
                        <button
                            className="profile-context-trigger"
                            onClick={() => setShowAccountMenu(v => !v)}
                            aria-label="Перемикання акаунтів"
                        >
                            <span className="profile-context-username">@{user?.nickname}</span>
                            <span className={`profile-context-chevron ${showAccountMenu ? 'open' : ''}`}>
                                <ChevronDownIcon />
                            </span>
                        </button>

                        {showAccountMenu && (
                            <div className="account-switcher-dropdown">
                                {savedAccounts.map(account => (
                                    <button
                                        key={account.uid}
                                        className={`account-switcher-item ${account.uid === user?.uid ? 'active' : ''}`}
                                        onClick={() => handleSwitchAccount(account)}
                                    >
                                        <img
                                            src={account.photoURL || default_picture}
                                            alt=""
                                            className="account-switcher-avatar"
                                            onError={e => { e.target.onerror = null; e.target.src = default_picture; }}
                                        />
                                        <div className="account-switcher-info">
                                            <span className="account-switcher-name">{account.displayName}</span>
                                            <span className="account-switcher-nick">@{account.nickname}</span>
                                        </div>
                                        {account.uid === user?.uid && (
                                            <span className="account-switcher-check"><CheckIcon /></span>
                                        )}
                                    </button>
                                ))}

                                <div className="account-switcher-divider" />

                                <button className="account-switcher-add" onClick={handleAddAccount}>
                                    <span className="account-switcher-add-icon"><PlusIcon /></span>
                                    <span>Додати обліковий запис</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Settings / menu */}
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
                            <Link to={`/${user.nickname}`}>Мій профіль</Link>
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
