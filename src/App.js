import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { UserProvider } from './contexts/UserContext';
import { PlayerProvider, usePlayerContext } from './contexts/PlayerContext';



import Header from './components/layout/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UserList from './pages/UserList';
import UserProfile from './pages/UserProfile';
import UploadMusic from './pages/UploadMusic';
import CreateAlbum from './pages/CreateAlbum';
import PlaylistPage from './pages/PlaylistPage';
import MessagesPage from './pages/MessagesPage';
import Player from './components/player/Player';
import CreateEmojiPack from './pages/CreateEmojiPack';
import TrackPage from './pages/TrackPage';
import TagPage from './pages/TagPage';
import BottomNavBar from './components/layout/BottomNavBar'; 
import EmojiPacksSettings from './components/chat/EmojiPacksSettings';
import EditEmojiPack from './pages/EditEmojiPack';
import AdminRoute from './components/layout/AdminRoute';
import AdminPage from './pages/AdminPage';
import ArtistDashboard from './pages/ArtistDashboard';
import NotificationsPage from './pages/NotificationsPage'; // <-- Додайте цей імпорт

import './styles/index.css';
import './components/posts/Post.css';

const queryClient = new QueryClient();

const AppLayout = () => {
    const { notification, currentTrack } = usePlayerContext();
    const isPlayerVisible = !!currentTrack;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    
    const isSidebarPage = location.pathname.startsWith('/tags/') || location.pathname === '/dashboard';

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
                showTagPageMenu={isSidebarPage}
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
                    <Route path="/tags/:tagName" element={<TagPage isSidebarOpen={isSidebarOpen} />} />
                    <Route path="/notifications" element={<NotificationsPage />} /> {/* <-- Додайте цей рядок */}

                    <Route 
                        path="/dashboard" 
                        element={
                            <AdminRoute>
                                <ArtistDashboard isSidebarOpen={isSidebarOpen} />
                            </AdminRoute>
                        } 
                    />
                    
                    <Route 
                        path="/admin" 
                        element={
                            <AdminRoute>
                                <AdminPage />
                            </AdminRoute>
                        } 
                    />
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