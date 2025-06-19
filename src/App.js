import React from 'react';
// <<< КРОК 1.1: ІМПОРТУЄМО useLocation
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

import './App.css';

const queryClient = new QueryClient();

const AppContent = () => {
    const { notification } = usePlayerContext();
    const location = useLocation(); // <<< КРОК 1.2: ОТРИМУЄМО ПОТОЧНИЙ ШЛЯХ

    // Перевіряємо, чи ми на сторінці повідомлень
    const isMessagesPage = location.pathname.startsWith('/messages');

    return (
        <>
            {/* <<< КРОК 1.3: ДОДАЄМО УМОВНИЙ СТИЛЬ */}
            <div style={{ paddingBottom: isMessagesPage ? '0px' : '90px' }}>
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/user/:userNickname" element={<UserProfile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/upload" element={<UploadMusic />} />
                    <Route path="/create-album" element={<CreateAlbum />} />
                    <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/userlist" element={<UserList />} />
                </Routes>
            </div>
            <Player />
            
            {notification.message && (
                <div className={`toast-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}
        </>
    );
}

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <UserProvider>
                <PlayerProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </PlayerProvider>
            </UserProvider>
        </QueryClientProvider>
    );
};

export default App;