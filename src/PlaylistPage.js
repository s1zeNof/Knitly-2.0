import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs, updateDoc } from 'firebase/firestore';
import { usePlayerContext } from './PlayerContext';
import { useUserContext } from './UserContext';
import TrackList from './TrackList';
import './PlaylistPage.css';

// Іконки
const PlayIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>;
const OptionsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="5" cy="12" r="2"></circle></svg>;
// Нова іконка для кастомізації
const CustomizeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;


const PlaylistPage = () => {
    const { playlistId } = useParams();
    const { user: currentUser } = useUserContext();
    const { addToQueue, handlePlayPause, showNotification } = usePlayerContext();
    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const optionsMenuRef = useRef(null);

    // Нові стани для кастомізації
    const [showCustomizePanel, setShowCustomizePanel] = useState(false);
    const [selectedGradient, setSelectedGradient] = useState('gradient-default');
    const [isSavingStyle, setIsSavingStyle] = useState(false);


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

                    // Встановлюємо збережений стиль або стиль за замовчуванням
                    if (playlistData.customization?.gradient) {
                        setSelectedGradient(playlistData.customization.gradient);
                    }

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

    const handleSaveStyle = async () => {
        if (!playlist || !isOwner) return;
        setIsSavingStyle(true);
        try {
            const playlistRef = doc(db, "playlists", playlist.id);
            await updateDoc(playlistRef, {
                "customization.gradient": selectedGradient
            });
            showNotification("Стиль плейлиста оновлено!", "info");
            setShowCustomizePanel(false);
        } catch (error) {
            console.error("Помилка збереження стилю:", error);
            showNotification("Не вдалося зберегти стиль.", "error");
        } finally {
            setIsSavingStyle(false);
        }
    };

    if (loading) return <div className="loading-placeholder">Завантаження плейлиста...</div>;
    if (!playlist) return <div className="loading-placeholder">Плейлист не знайдено.</div>;

    const isOwner = currentUser?.uid === playlist.creatorId;
    const gradients = Array.from({ length: 16 }, (_, i) => `gradient-${i + 1}`);

    return (
        <div className={`playlist-page-container ${selectedGradient}`}>
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
                {/* --- Нова кнопка поруч із трьома крапками --- */}
                {isOwner && (
                    <button className="playlist-options-button" onClick={() => setShowCustomizePanel(true)}>
                        <CustomizeIcon />
                    </button>
                )}
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
            
            {/* Панель кастомізації */}
            {showCustomizePanel && (
                <div className="customize-panel">
                    <div className="customize-panel-header">
                        <h4>Налаштувати плейлист</h4>
                        <button onClick={() => setShowCustomizePanel(false)}>&times;</button>
                    </div>
                    <div className="customize-panel-content">
                        <h5>Оберіть фон</h5>
                        <div className="gradient-grid">
                            {gradients.map(gradientClass => (
                                <div 
                                    key={gradientClass}
                                    className={`gradient-option ${gradientClass} ${selectedGradient === gradientClass ? 'selected' : ''}`}
                                    onClick={() => setSelectedGradient(gradientClass)}
                                />
                            ))}
                        </div>
                        {/* Тут буде секція для ефектів */}
                    </div>
                    <div className="customize-panel-footer">
                        <button className="button-primary" onClick={handleSaveStyle} disabled={isSavingStyle}>
                            {isSavingStyle ? 'Збереження...' : 'Зберегти'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlaylistPage;