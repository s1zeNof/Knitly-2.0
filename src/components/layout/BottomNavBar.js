import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUserContext } from '../../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import './BottomNavBar.css';

const HomeIcon = () => <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const LibraryIcon = () => <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const ProfileIcon = () => <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const PlusIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const CreatePostIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M4 20h3"/><path d="M4 12h16"/><path d="M4 4h9"/><path d="M20 12v8"/><path d="M16 4h4"/></svg>;
const UploadTrackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>;
const StudioIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18.7 8a6 6 0 0 0-8.4 0l-6.3 6.3"/><path d="M12.3 14.7a2 2 0 0 0-2.8 0l-4.2 4.2"/></svg>;

const BottomNavBar = ({ isPlayerVisible }) => {
    const { user } = useUserContext();
    const navigate = useNavigate();
    const [isMounted, setIsMounted] = useState(true);
    const [isHiding, setIsHiding] = useState(false);
    const [isCreationMenuOpen, setCreationMenuOpen] = useState(false);

    useEffect(() => {
        const handleClassChange = () => {
            const inChatView = document.body.classList.contains('in-chat-view');
            if (inChatView) {
                setIsHiding(true);
            } else {
                setIsMounted(true);
                setIsHiding(false);
            }
        };
        const observer = new MutationObserver(handleClassChange);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const handleAnimationEnd = () => {
        if (isHiding) {
            setIsMounted(false);
        }
    };
    
    const handleNavigationAction = (path) => {
        setCreationMenuOpen(false);
        navigate(path);
    }

    if (!user || !isMounted) {
        return null;
    }
    
    const userIsCreator = user.roles?.includes('creator') || user.roles?.includes('admin');
    const navBarClassName = `bottom-nav-bar ${isPlayerVisible ? 'player-visible' : ''} ${isHiding ? 'hiding' : ''}`;

    return (
        <>
            <AnimatePresence>
                {isCreationMenuOpen && (
                    <motion.div
                        className="creation-menu-overlay"
                        onClick={() => setCreationMenuOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="creation-menu-sheet"
                            initial={{ y: "100%" }}
                            animate={{ y: "0%" }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 400, damping: 40 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                             {userIsCreator && (
                                <div className="creation-menu-item" onClick={() => handleNavigationAction('/studio')}>
                                    <div className="creation-item-icon color-green"><StudioIcon /></div>
                                    <span>Творча студія</span>
                                </div>
                            )}
                            <div className="creation-menu-item" onClick={() => handleNavigationAction('/upload')}>
                                <div className="creation-item-icon color-purple"><UploadTrackIcon /></div>
                                <span>Завантажити трек</span>
                            </div>
                            <div className="creation-menu-item" onClick={() => handleNavigationAction('/')}>
                                <div className="creation-item-icon color-blue"><CreatePostIcon /></div>
                                <span>Створити допис</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav className={navBarClassName} onAnimationEnd={handleAnimationEnd}>
                <NavLink to="/" className="bottom-nav-item" end>
                    <HomeIcon />
                    <span>Стрічка</span>
                </NavLink>
                <NavLink to="/search" className="bottom-nav-item">
                    <SearchIcon />
                    <span>Пошук</span>
                </NavLink>
                <div className="bottom-nav-item special" onClick={() => setCreationMenuOpen(true)}>
                    <motion.div 
                        className="special-icon-wrapper"
                        whileTap={{ scale: 0.9 }}
                    >
                        <motion.div animate={{ rotate: isCreationMenuOpen ? 45 : 0 }}>
                            <PlusIcon />
                        </motion.div>
                    </motion.div>
                </div>
                <NavLink to="/library" className="bottom-nav-item">
                    <LibraryIcon />
                    <span>Треки</span>
                </NavLink>
                <NavLink to="/profile" className="bottom-nav-item">
                    <ProfileIcon />
                    <span>Профіль</span>
                </NavLink>
            </nav>
        </>
    );
};

export default BottomNavBar;