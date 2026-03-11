import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useUserContext } from '../../contexts/UserContext';
import { usePlayerContext } from '../../contexts/PlayerContext';
import default_picture from '../../img/Default-Images/default-picture.svg';
import VerifiedBadge from '../common/VerifiedBadge';
import './LeftSidebar.css';

const HomeIcon = () => <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const DashboardIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18.7 8a6 6 0 0 0-8.4 0l-6.3 6.3" /><path d="M12.3 14.7a2 2 0 0 0-2.8 0l-4.2 4.2" /></svg>;
const UploadIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>;
const LibraryIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
const MessagesIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const BellIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
const HelpIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
// --- 👇 Оце та сама іконка, якої не вистачало ---
const GiftIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>;
const RoomsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
const AppsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;


const LeftSidebar = ({ isOpen }) => {
    const { user, authLoading, totalUnreadMessages, unreadNotificationsCount } = useUserContext();
    const { currentTrack } = usePlayerContext();
    const isPlayerVisible = !!currentTrack;

    // Guests never see the sidebar — hide it once auth state is resolved
    if (!authLoading && !user) return null;

    return (
        <aside className={`left-sidebar ${isOpen ? 'open' : ''} ${isPlayerVisible ? 'player-visible-padding' : ''}`}>
            <div>
                {user ? (
                    <Link to="/profile" className="sidebar-user-info">
                        <img src={user.photoURL || default_picture} alt="Avatar" className="profile-avatar" onError={(e) => { e.target.onerror = null; e.target.src = default_picture; }} />
                        <div className="profile-info">
                            <span className="profile-name">
                                {user.displayName || 'Мій Профіль'}
                                {/* 🔮 кастомні емоджі тут у майбутньому */}
                                {user.roles?.includes('verified') && <VerifiedBadge size="xs" />}
                            </span>
                            <span className="profile-nickname">@{user.nickname || 'nickname'}</span>
                        </div>
                    </Link>
                ) : (
                    <div className="sidebar-login-prompt">
                        <p>Увійдіть, щоб бачити персоналізований контент.</p>
                        <Link to="/login" className="login-button">Увійти</Link>
                    </div>
                )}
                <nav className="sidebar-nav">
                    <NavLink to="/" className="nav-item" title="Головна"><HomeIcon /><span className="nav-label">Головна</span></NavLink>
                    <NavLink to="/rooms" className="nav-item" title="Кімнати 🎧"><RoomsIcon /><span className="nav-label">Кімнати</span></NavLink>
                    <NavLink to="/gifts" className="nav-item" title="Подарунки"><GiftIcon /><span className="nav-label">Подарунки</span></NavLink>
                    <NavLink to="/apps" className="nav-item" title="Міні-додатки"><AppsIcon /><span className="nav-label">Міні-додатки</span></NavLink>
                    {user && <NavLink to="/studio" className="nav-item" title="Творча студія"><DashboardIcon /><span className="nav-label">Творча студія</span></NavLink>}
                    <NavLink to="/upload" className="nav-item" title="Завантажити"><UploadIcon /><span className="nav-label">Завантажити</span></NavLink>
                    <NavLink to="/library" className="nav-item" title="Моя бібліотека"><LibraryIcon /><span className="nav-label">Моя бібліотека</span></NavLink>
                    <NavLink to="/messages" className="nav-item" title="Повідомлення">
                        <MessagesIcon /><span className="nav-label">Повідомлення</span>
                        {totalUnreadMessages > 0 && <span className="sidebar-badge">{totalUnreadMessages}</span>}
                    </NavLink>
                    <NavLink to="/notifications" className="nav-item" title="Сповіщення">
                        <BellIcon /><span className="nav-label">Сповіщення</span>
                        {unreadNotificationsCount > 0 && <span className="sidebar-badge">{unreadNotificationsCount}</span>}
                    </NavLink>
                </nav>
            </div>
            <div className="sidebar-footer">
                <Link to="/settings" className="nav-item" title="Налаштування"><SettingsIcon /><span className="nav-label">Налаштування</span></Link>
                <Link to="/developers" className="nav-item" title="Допомога"><HelpIcon /><span className="nav-label">Допомога</span></Link>
            </div>
        </aside>
    );
};

export default LeftSidebar;