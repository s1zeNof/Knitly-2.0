import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { UserProvider, useUserContext } from './contexts/UserContext';
import { PlayerProvider, usePlayerContext } from './contexts/PlayerContext';

import Header from './components/layout/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';
import Settings from './pages/Settings';
import UserList from './pages/UserList';
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
import CreatorRoute from './components/layout/CreatorRoute';
import AdminPage from './pages/AdminPage';
import CreatorStudio from './pages/CreatorStudio';
import NotificationsPage from './pages/NotificationsPage';
import SearchPage from './pages/SearchPage';

import './styles/index.css';
import './components/posts/Post.css';
import './styles/App.css';

const queryClient = new QueryClient();

const AppLayout = () => {
    const { notification, currentTrack } = usePlayerContext();
    const { user } = useUserContext();
    const isPlayerVisible = !!currentTrack;
    const location = useLocation();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const isSidebarPage = location.pathname.startsWith('/tags/') || location.pathname === '/studio';
    const inChatView = location.pathname === '/messages' && document.body.classList.contains('in-chat-view');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const hasBottomNav = isMobile && user && !inChatView;
        if (hasBottomNav) {
            document.body.classList.add('mobile-nav-visible');
        } else {
            document.body.classList.remove('mobile-nav-visible');
        }

        if (isPlayerVisible && hasBottomNav) {
            document.body.classList.add('player-on-mobile');
        } else {
            document.body.classList.remove('player-on-mobile');
        }
    }, [isMobile, user, isPlayerVisible, inChatView]);

    const handleToggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

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
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/user/:userNickname" element={<ProfilePage />} />
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
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/studio" element={<CreatorStudio />} />
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
            <Player />
            {notification.message && (
                <div className={`toast-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}
        </>
    );
};

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