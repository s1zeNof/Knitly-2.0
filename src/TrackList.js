import React, { useState, useEffect, useRef } from 'react';
import { usePlayerContext } from './PlayerContext';
import { useUserContext } from './UserContext';
import { useUserTracks } from './hooks/useUserTracks';
import { db, storage } from './firebase';
import { doc, deleteDoc, updateDoc, arrayUnion, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import './TrackList.css';

const DEFAULT_COVER_URL = 'https://placehold.co/256x256/181818/333333?text=K';

// Іконки
const PlayIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const ListIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const GridIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const OptionsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>;

const TrackList = ({ userId, initialTracks = null }) => {
    // ВИКЛИКАЄМО ХУКИ НА НАЙВИЩОМУ РІВНІ, ЯК ВИМАГАЄ REACT
    const { tracks: fetchedTracks, loading, setTracks: setFetchedTracks } = useUserTracks(userId);
    const [displayTracks, setDisplayTracks] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const { user: currentUser } = useUserContext();
    const { currentTrack, isPlaying, handlePlayPause, addToQueue, showNotification } = usePlayerContext();

    const [viewMode, setViewMode] = useState('list');
    const [activeMenu, setActiveMenu] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(null);
    
    const menuRef = useRef(null);
    
    // ВИРІШУЄМО, ЯКІ ТРЕКИ ПОКАЗУВАТИ: ПЕРЕДАНІ ЧИ ЗАВАНТАЖЕНІ
    useEffect(() => {
        if (initialTracks !== null) {
            setDisplayTracks(initialTracks);
            setIsDataLoading(false);
        } else {
            setDisplayTracks(fetchedTracks);
            setIsDataLoading(loading);
        }
    }, [initialTracks, fetchedTracks, loading]);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openAddToPlaylistModal = async (track) => {
        if (!currentUser) return;
        setSelectedTrack(track);
        
        try {
            const q = query(collection(db, 'playlists'), where('creatorId', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);
            const playlists = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserPlaylists(playlists);
            setShowAddToPlaylistModal(true);
            setActiveMenu(null);
        } catch (error) {
            console.error("Помилка завантаження плейлистів:", error);
            showNotification("Не вдалося завантажити ваші плейлисти.", "error");
        }
    };
    
    const handleAddTrackToPlaylist = async (playlistId) => {
        if (!selectedTrack) return;
        try {
            const playlistRef = doc(db, 'playlists', playlistId);
            await updateDoc(playlistRef, {
                trackIds: arrayUnion(selectedTrack.id)
            });
            showNotification(`Трек "${selectedTrack.title}" додано до плейлиста!`, "info");
            setShowAddToPlaylistModal(false);
        } catch (error) {
            console.error("Помилка додавання треку в плейлист:", error);
            showNotification("Не вдалося додати трек.", "error");
        }
    };

    const handleDeleteTrack = async (trackToDelete) => {
        if (!trackToDelete) return;
        try {
            await deleteDoc(doc(db, "tracks", trackToDelete.id));

            if (trackToDelete.trackUrl) {
                const audioRef = ref(storage, trackToDelete.trackUrl);
                await deleteObject(audioRef).catch(e => console.warn("Audio file not found or deletion failed:", e));
            }
            if (trackToDelete.coverArtUrl) {
                const coverRef = ref(storage, trackToDelete.coverArtUrl);
                await deleteObject(coverRef).catch(e => console.warn("Cover art not found or deletion failed:", e));
            }
            
            // Оновлюємо той стан, з яким ми працюємо
            if (initialTracks !== null) {
                setDisplayTracks(prevTracks => prevTracks.filter(t => t.id !== trackToDelete.id));
            } else {
                setFetchedTracks(prevTracks => prevTracks.filter(t => t.id !== trackToDelete.id));
            }

            showNotification(`Трек "${trackToDelete.title}" успішно видалено.`, 'info');
        } catch (error) {
            console.error("Помилка видалення треку:", error);
            showNotification("Не вдалося видалити трек. Спробуйте ще раз.", 'error');
        } finally {
            setShowDeleteModal(null);
        }
    };
    
    if (isDataLoading) return <div className="tracklist-placeholder">Завантаження треків...</div>;
    if (displayTracks.length === 0) return <div className="tracklist-placeholder">Тут поки що немає треків.</div>;

    return (
        <div className="tracklist-container">
            <div className="tracklist-header">
                <h3>Усі треки ({displayTracks.length})</h3>
                <div className="view-mode-toggle">
                    <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''}><ListIcon /></button>
                    <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}><GridIcon /></button>
                </div>
            </div>
           
            {viewMode === 'list' ? (
                <div className="tracks-as-list">
                    {displayTracks.map(track => (
                        <div key={track.id} className="track-item-list">
                            <img src={track.coverArtUrl || DEFAULT_COVER_URL} alt={track.title} className="track-cover-list"/>
                            <button className="play-button-list" onClick={() => handlePlayPause(track)}>
                                {isPlaying && currentTrack?.id === track.id ? <PauseIcon /> : <PlayIcon />}
                            </button>
                            <div className="track-info-list">
                                <p className="track-title-list">{track.title}</p>
                            </div>
                            <div className="options-container" ref={activeMenu === track.id ? menuRef : null}>
                                <button className="options-button-list" onClick={() => setActiveMenu(activeMenu === track.id ? null : track.id)}>
                                    <OptionsIcon/>
                                </button>
                                {activeMenu === track.id && (
                                    <div className="options-menu">
                                        <button onClick={() => { addToQueue(track); setActiveMenu(null); }}>Додати в чергу</button>
                                        <button onClick={() => openAddToPlaylistModal(track)}>Додати в плейлист</button>
                                        {track.authorId === currentUser?.uid && (
                                            <>
                                                <button className="option-edit">Редагувати</button>
                                                <button className="option-delete" onClick={() => { setShowDeleteModal(track); setActiveMenu(null); }}>Видалити</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="tracks-as-grid">
                     {/* Тут буде логіка для відображення сіткою */}
                </div>
            )}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4>Підтвердити видалення</h4>
                        <p>Ви впевнені, що хочете назавжди видалити трек "{showDeleteModal.title}"?</p>
                        <div className="modal-actions">
                            <button className="modal-button-cancel" onClick={() => setShowDeleteModal(null)}>Скасувати</button>
                            <button className="modal-button-confirm" onClick={() => handleDeleteTrack(showDeleteModal)}>Видалити</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showAddToPlaylistModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                         <button className="modal-close-button" onClick={() => setShowAddToPlaylistModal(false)}>&times;</button>
                        <h4>Додати до плейлиста</h4>
                        <div className="add-to-playlist-list">
                            {userPlaylists.length > 0 ? (
                                userPlaylists.map(playlist => (
                                    <button key={playlist.id} className="add-to-playlist-item" onClick={() => handleAddTrackToPlaylist(playlist.id)}>
                                        <img src={playlist.coverArtUrl || 'https://placehold.co/64x64/181818/333?text=♫'} alt={playlist.title} />
                                        <span>{playlist.title}</span>
                                    </button>
                                ))
                            ) : (
                                <p>У вас ще немає створених плейлистів.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackList;