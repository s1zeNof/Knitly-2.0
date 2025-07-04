import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerContext } from '../../contexts/PlayerContext';
import { useUserContext } from '../../contexts/UserContext';
import { useUserTracks } from '../../hooks/useUserTracks';
import { db, storage } from '../../services/firebase';
import { doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, increment, getDoc, collection, query, where, getDocs, runTransaction, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { ref, deleteObject } from 'firebase/storage';
import './TrackList.css';
import AnimatedCounter from './AnimatedCounter';

const DEFAULT_COVER_URL = 'https://placehold.co/256x256/181818/333333?text=K';

const PlayIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const ListIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const GridIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const OptionsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>;
const HeartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const HeadsetIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H5V10a7 7 0 0 1 14 0v1h-2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9z"></path></svg>;


const TrackList = ({ userId, initialTracks = null, isLoading: isLoadingInitial = false }) => {
    const { user: currentUser, refreshUser } = useUserContext();
    const { currentTrack, isPlaying, handlePlayPause, addToQueue, showNotification } = usePlayerContext();
    const { tracks: fetchedTracks, loading } = useUserTracks(userId);
    
    const [displayTracks, setDisplayTracks] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [processingLikes, setProcessingLikes] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [activeMenu, setActiveMenu] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(null);
    
    const menuRef = useRef(null);
    
    useEffect(() => {
        if (initialTracks !== null) {
            setDisplayTracks(initialTracks);
            setIsDataLoading(isLoadingInitial);
        } else {
            setDisplayTracks(fetchedTracks);
            setIsDataLoading(loading);
        }
    }, [initialTracks, fetchedTracks, loading, isLoadingInitial]);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLikeToggle = async (track) => {
        if (!currentUser) {
            showNotification("Будь ласка, увійдіть, щоб оцінити трек.", "error");
            return;
        }
        if (processingLikes.includes(track.id)) return;

        setProcessingLikes(prev => [...prev, track.id]);

        const trackRef = doc(db, 'tracks', track.id);
        const userRef = doc(db, 'users', currentUser.uid);
        const isLiked = currentUser.likedTracks?.includes(track.id);

        try {
            await runTransaction(db, async (transaction) => {
                const trackDoc = await transaction.get(trackRef);
                if (!trackDoc.exists()) throw "Трек не знайдено!";
                const currentLikes = trackDoc.data().likesCount || 0;
                if (isLiked) {
                    if (currentLikes > 0) transaction.update(trackRef, { likesCount: increment(-1) });
                    transaction.update(userRef, { likedTracks: arrayRemove(track.id) });
                } else {
                    transaction.update(trackRef, { likesCount: increment(1) });
                    transaction.update(userRef, { likedTracks: arrayUnion(track.id) });
                }
            });

            await refreshUser();
            
            if (!isLiked && track.authorId !== currentUser.uid) {
                const notificationRef = collection(db, 'users', track.authorId, 'notifications');
                await addDoc(notificationRef, {
                    type: 'track_like',
                    fromUser: { uid: currentUser.uid, nickname: currentUser.nickname, photoURL: currentUser.photoURL },
                    entityId: track.id,
                    entityTitle: track.title,
                    entityLink: `/track/${track.id}`,
                    timestamp: serverTimestamp(),
                    read: false
                });
            }

        } catch (error) {
            console.error("Помилка транзакції лайку:", error);
            showNotification("Не вдалося оцінити трек. Спробуйте знову.", "error");
        } finally {
            setProcessingLikes(prev => prev.filter(id => id !== track.id));
        }
    };

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
            
            setDisplayTracks(prevTracks => prevTracks.filter(t => t.id !== trackToDelete.id));
            
            showNotification(`Трек "${trackToDelete.title}" успішно видалено.`, 'info');
        } catch (error) {
            console.error("Помилка видалення треку:", error);
            showNotification("Не вдалося видалити трек. Спробуйте ще раз.", 'error');
        } finally {
            setShowDeleteModal(null);
        }
    };
    
    if (isDataLoading) return <div className="tracklist-placeholder">Завантаження треків...</div>;
    if (!displayTracks || displayTracks.length === 0) return <div className="tracklist-placeholder">Тут поки що немає треків.</div>;

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
                    {displayTracks.map(track => {
                        const isLiked = currentUser?.likedTracks?.includes(track.id);
                        return (
                            <div key={track.id} className="track-item-list">
                                <Link to={`/track/${track.id}`}>
                                    <img src={track.coverArtUrl || DEFAULT_COVER_URL} alt={track.title} className="track-cover-list"/>
                                </Link>
                                <button className="play-button-list" onClick={() => handlePlayPause(track)}>
                                    {isPlaying && currentTrack?.id === track.id ? <PauseIcon /> : <PlayIcon />}
                                </button>
                                <div className="track-info-list">
                                    <Link to={`/track/${track.id}`} className="track-title-list-link">
                                        <p className="track-title-list">{track.title}</p>
                                    </Link>
                                    <p className="track-artist-list">{track.authorName}</p>
                                </div>
                                <div className="track-stats-list">
                                    <span className="stat-item">
                                        <HeadsetIcon/> 
                                        <AnimatedCounter count={track.playCount || 0} />
                                    </span>
                                    <span className="stat-item">
                                        <button 
                                            className={`like-button ${isLiked ? 'liked' : ''}`} 
                                            onClick={() => handleLikeToggle(track)}
                                            disabled={processingLikes.includes(track.id)}
                                        >
                                            <HeartIcon/>
                                        </button>
                                        <AnimatedCounter count={track.likesCount || 0} />
                                    </span>
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
                        )
                    })}
                </div>
            ) : (
                 <div className="tracks-as-grid">
                    {displayTracks.map(track => {
                        const isLiked = currentUser?.likedTracks?.includes(track.id);
                        return (
                             <div key={track.id} className="track-card-grid">
                                <div className="cover-container-grid" onClick={() => handlePlayPause(track)}>
                                    <img src={track.coverArtUrl || DEFAULT_COVER_URL} alt={track.title} className="track-cover-grid"/>
                                    <div className="play-overlay-grid">
                                        {isPlaying && currentTrack?.id === track.id ? <PauseIcon /> : <PlayIcon />}
                                    </div>
                                </div>
                                <Link to={`/track/${track.id}`}><p className="track-title-grid">{track.title}</p></Link>
                                <div className="track-card-footer">
                                    <div className="track-stats-grid">
                                        <span className="stat-item"><HeadsetIcon/> <AnimatedCounter count={track.playCount || 0} /></span>
                                        <span className="stat-item"><HeartIcon/> <AnimatedCounter count={track.likesCount || 0} /></span>
                                    </div>
                                    <button 
                                        className={`like-button-grid ${isLiked ? 'liked' : ''}`} 
                                        onClick={() => handleLikeToggle(track)}
                                        disabled={processingLikes.includes(track.id)}
                                    >
                                        <HeartIcon/>
                                    </button>
                                </div>
                             </div>
                        )
                    })}
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