import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { UserProvider } from './UserContext';
import { PlayerProvider, usePlayerContext } from './PlayerContext';

import Header from './Header';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import Settings from './Settings';
import UserList from './UserList';
import UserProfile from './UserProfile';
import UploadMusic from './UploadMusic';
import CreateAlbum from './CreateAlbum';
import PlaylistPage from './PlaylistPage';
import MessagesPage from './MessagesPage';
import Player from './Player';
import CreateEmojiPack from './CreateEmojiPack';
import TrackPage from './TrackPage';
import TagPage from './pages/TagPage';
import BottomNavBar from './BottomNavBar'; 
import EmojiPacksSettings from './EmojiPacksSettings';
import EditEmojiPack from './EditEmojiPack';

import './App.css';

const queryClient = new QueryClient();

const AppLayout = () => {
    const { notification, currentTrack } = usePlayerContext();
    const isPlayerVisible = !!currentTrack;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    
    const onTagPage = location.pathname.startsWith('/tags/');

    const handleToggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            document.body.classList.add('mobile-view-active');
        } else {
            document.body.classList.remove('mobile-view-active');
        }
    }, [isMobile]);

    useEffect(() => {
        if (isPlayerVisible && isMobile) {
             document.body.classList.add('player-visible-mobile');
        } else {
             document.body.classList.remove('player-visible-mobile');
        }
    }, [isPlayerVisible, isMobile])

    return (
        <>
            <Header 
                showTagPageMenu={onTagPage}
                onTagPageMenuClick={handleToggleSidebar}
            />
            <main className="app-main-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/user/:userNickname" element={<UserProfile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/emoji-packs" element={<EmojiPacksSettings />} />
                    <Route path="/settings/emoji-packs/edit/:packId" element={<EditEmojiPack />} />
                    <Route path="/upload" element={<UploadMusic />} />
                    <Route path="/create-album" element={<CreateAlbum />} />
                    <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/userlist" element={<UserList />} />
                    <Route path="/create-emoji-pack" element={<CreateEmojiPack />} />
                    <Route path="/track/:trackId" element={<TrackPage />} />
                    {/* --- ПОЧАТОК ЗМІН --- */}
                    <Route path="/tags/:tagName" element={<TagPage isSidebarOpen={isSidebarOpen} />} />
                    {/* --- КІНЕЦЬ ЗМІН --- */}
                </Routes>
            </main>
            
            <BottomNavBar isPlayerVisible={isPlayerVisible} />
            
            <Player className={isPlayerVisible ? 'visible' : ''} />
            
            {notification.message && (
                <div className={`toast-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}
        </>
    );
}

const AppContent = () => (
    <Router>
        <AppLayout />
    </Router>
);

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <UserProvider>
                <PlayerProvider>
                    <AppContent />
                </PlayerProvider>
            </UserProvider>
        </QueryClientProvider>
    );
};

export default App;