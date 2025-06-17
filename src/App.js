import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import MessagesPage from './MessagesPage'; // <<< ДОДАНО ІМПОРТ
import Player from './Player';

import './App.css';

const queryClient = new QueryClient();

const AppContent = () => {
    const { notification } = usePlayerContext();

    return (
        <>
            <div style={{ paddingBottom: '90px' }}>
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
                    <Route path="/messages" element={<MessagesPage />} /> {/* <<< ДОДАНО МАРШРУТ */}
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