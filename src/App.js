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
import MessagesPage from './MessagesPage';
import Player from './Player';
import CreateEmojiPack from './CreateEmojiPack';

import './App.css';

const queryClient = new QueryClient();

// Створюємо компонент-обгортку, щоб мати доступ до контексту
const AppLayout = () => {
    const { notification, currentTrack } = usePlayerContext();
    const isPlayerVisible = !!currentTrack;

    return (
        <>
            <Header />
            <main className="app-main-content">
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
                    <Route path="/create-emoji-pack" element={<CreateEmojiPack />} />
                </Routes>
            </main>
            
            <Player className={isPlayerVisible ? 'visible' : ''} />
            
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
                        <AppLayout />
                    </Router>
                </PlayerProvider>
            </UserProvider>
        </QueryClientProvider>
    );
};

export default App;