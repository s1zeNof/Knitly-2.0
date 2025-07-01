import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext'; // <-- 1. ІМПОРТУЄМО КОНТЕКСТ ПЛЕЄРА
import default_picture from './img/Default-Images/default-picture.svg';
import './LeftSidebar.css';

// Іконки (без змін)
const UploadIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>;
const LibraryIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const MessagesIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const BellIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
const HelpIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;


const LeftSidebar = ({ isOpen }) => {
    const { user } = useUserContext();
    const location = useLocation();
    // --- ПОЧАТОК ЗМІН ---
    const { currentTrack } = usePlayerContext();
    const isPlayerVisible = !!currentTrack;
    // --- КІНЕЦЬ ЗМІН ---

    return (
        // --- ПОЧАТОК ЗМІН ---
        <aside className={`left-sidebar ${isOpen ? 'open' : ''} ${isPlayerVisible ? 'player-visible-padding' : ''}`}>
        {/* --- КІНЕЦЬ ЗМІН --- */}
            <div>
                {user ? (
                    <Link to="/profile" className="sidebar-user-info">
                        <img src={user.photoURL || default_picture} alt="Avatar" className="profile-avatar" />
                        <div className="profile-info">
                            <span className="profile-name">{user.displayName || 'Мій Профіль'}</span>
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
                    <Link to="/upload" className={`nav-item ${location.pathname === '/upload' ? 'active' : ''}`}><UploadIcon /> Завантажити</Link>
                    <Link to="/library" className={`nav-item ${location.pathname === '/library' ? 'active' : ''}`}><LibraryIcon /> Моя бібліотека</Link>
                    <Link to="/messages" className={`nav-item ${location.pathname === '/messages' ? 'active' : ''}`}><MessagesIcon /> Повідомлення</Link>
                    <Link to="/notifications" className={`nav-item ${location.pathname === '/notifications' ? 'active' : ''}`}><BellIcon /> Сповіщення</Link>
                </nav>
            </div>
            <div className="sidebar-footer">
                <Link to="/settings" className="nav-item"><SettingsIcon /> Налаштування</Link>
                <Link to="/help" className="nav-item"><HelpIcon /> Допомога</Link>
            </div>
        </aside>
    );
};

export default LeftSidebar;