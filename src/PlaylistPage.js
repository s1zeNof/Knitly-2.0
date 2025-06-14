import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { usePlayerContext } from './PlayerContext';
import { useUserContext } from './UserContext';
import TrackList from './TrackList';
import './PlaylistPage.css';

// Іконки
const PlayIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>;
const OptionsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="5" cy="12" r="2"></circle></svg>;

const PlaylistPage = () => {
    const { playlistId } = useParams();
    const { user: currentUser } = useUserContext();
    const { addToQueue, handlePlayPause } = usePlayerContext();
    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const optionsMenuRef = useRef(null);

    useEffect(() => {
        const fetchPlaylistData = async () => {
            if (!playlistId) return;
            setLoading(true);
            try {
                const playlistRef = doc(db, 'playlists', playlistId);
                const playlistSnap = await getDoc(playlistRef);

                if (playlistSnap.exists()) {
                    const playlistData = { id: playlistSnap.id, ...playlistSnap.data() };
                    setPlaylist(playlistData);

                    const trackIds = playlistData.trackIds;
                    if (trackIds && trackIds.length > 0) {
                        const chunks = [];
                        for (let i = 0; i < trackIds.length; i += 10) {
                            chunks.push(trackIds.slice(i, i + 10));
                        }
                        
                        const trackPromises = chunks.map(chunk => 
                            getDocs(query(collection(db, 'tracks'), where(documentId(), 'in', chunk)))
                        );

                        const trackSnapshots = await Promise.all(trackPromises);
                        const tracksData = trackSnapshots.flatMap(snapshot => 
                            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                        );
                        
                        setTracks(tracksData);
                    }
                } else {
                    console.error("Плейлист не знайдено!");
                }
            } catch (error) {
                console.error("Помилка завантаження даних плейлиста:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlaylistData();
    }, [playlistId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
                setShowOptionsMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const playAllTracks = () => {
        if(tracks.length > 0){
            handlePlayPause(tracks[0]);
            tracks.slice(1).forEach(track => addToQueue(track));
        }
    }

    if (loading) return <div className="loading-placeholder">Завантаження плейлиста...</div>;
    if (!playlist) return <div className="loading-placeholder">Плейлист не знайдено.</div>;

    const isOwner = currentUser?.uid === playlist.creatorId;

    return (
        <div className="playlist-page-container">
            <header className="playlist-header">
                <div className="playlist-cover-art">
                    {playlist.coverArtUrl ? (
                        <img src={playlist.coverArtUrl} alt={playlist.title} />
                    ) : (
                        <div className="cover-placeholder">♫</div>
                    )}
                </div>
                <div className="playlist-details">
                    <p className="playlist-type">Плейлист</p>
                    <h1 className="playlist-title">{playlist.title}</h1>
                    <p className="playlist-creator">
                        Створено <Link to={`/user/${playlist.creatorName}`}>{playlist.creatorName}</Link> • {playlist.trackIds.length} треків
                    </p>
                </div>
            </header>

            <div className="playlist-actions-bar">
                <button className="playlist-play-button" onClick={playAllTracks}>
                    <PlayIcon />
                </button>
                <div className="playlist-options-container" ref={optionsMenuRef}>
                    <button className="playlist-options-button" onClick={() => setShowOptionsMenu(!showOptionsMenu)}>
                        <OptionsIcon />
                    </button>
                    {showOptionsMenu && (
                         <div className="options-menu">
                            {isOwner ? (
                                <>
                                    <button>Редагувати деталі</button>
                                    <button className="option-delete">Видалити плейлист</button>
                                </>
                            ) : (
                                <button>Поскаржитись</button>
                            )}
                             <button>Поділитися</button>
                        </div>
                    )}
                </div>
            </div>

            <main className="playlist-content">
                <TrackList initialTracks={tracks} />
            </main>
        </div>
    );
};

export default PlaylistPage;