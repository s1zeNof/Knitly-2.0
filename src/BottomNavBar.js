import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useUserContext } from './UserContext';
import './BottomNavBar.css';

// Іконки (без змін)
const HomeIcon = () => <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const MessagesIcon = () => <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const UploadIcon = () => <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>;
const LibraryIcon = () => <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const ProfileIcon = () => <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;

const BottomNavBar = ({ isPlayerVisible }) => {
    const { user } = useUserContext();

    // --- ПОЧАТОК ЗМІН: Логіка анімації та видалення з DOM ---
    const [isMounted, setIsMounted] = useState(true);
    const [isHiding, setIsHiding] = useState(false);

    useEffect(() => {
        const handleClassChange = () => {
            const inChatView = document.body.classList.contains('in-chat-view');
            
            if (inChatView) {
                setIsHiding(true); // Запускаємо анімацію зникнення
            } else {
                setIsMounted(true); // Повертаємо в DOM
                setIsHiding(false); // Забираємо клас анімації зникнення
            }
        };

        // Спостерігаємо за змінами класу на <body>
        const observer = new MutationObserver(handleClassChange);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    const handleAnimationEnd = () => {
        // Коли анімація зникнення завершилась, видаляємо компонент з DOM
        if (isHiding) {
            setIsMounted(false);
        }
    };

    if (!user || !isMounted) {
        return null; // Повністю видаляємо компонент
    }

    const navBarClassName = `bottom-nav-bar ${isPlayerVisible ? 'player-visible' : ''} ${isHiding ? 'hiding' : ''}`;
    // --- КІНЕЦЬ ЗМІН ---

    return (
        <nav className={navBarClassName} onAnimationEnd={handleAnimationEnd}>
            <NavLink to="/" className="bottom-nav-item" end>
                <HomeIcon />
                <span>Стрічка</span>
            </NavLink>
            <NavLink to="/messages" className="bottom-nav-item">
                <MessagesIcon />
                <span>Чати</span>
            </NavLink>
            <NavLink to="/upload" className="bottom-nav-item special">
                <div className="special-icon-wrapper">
                    <UploadIcon />
                </div>
            </NavLink>
            <NavLink to="/library" className="bottom-nav-item">
                <LibraryIcon />
                <span>Треки</span>
            </NavLink>
            <NavLink to="/profile" className="bottom-nav-item">
                <ProfileIcon />
                <span>Профіль</span>
            </NavLink>
        </nav>
    );
};

export default BottomNavBar;