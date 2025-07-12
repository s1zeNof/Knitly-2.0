import React, { useState, useEffect } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import { db, storage } from '../../shared/services/firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Link } from 'react-router-dom';
import './PlaylistTab.css';

// Іконки
const PlusIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const UploadIcon = () => <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>;

const PlaylistTab = ({ userId }) => {
    const { user: currentUser, showNotification } = useUserContext(); // Припускаємо, що showNotification є в UserContext
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistCover, setNewPlaylistCover] = useState(null);
    const [newPlaylistCoverPreview, setNewPlaylistCoverPreview] = useState(null);
    const [isPlaylistPublic, setIsPlaylistPublic] = useState(true);

    const fetchPlaylists = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'playlists'), where('creatorId', '==', userId), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const userPlaylists = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlaylists(userPlaylists);
        } catch (error) {
            console.error("Помилка завантаження плейлистів:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylists();
    }, [userId]);
    
    const resetModalState = () => {
        setNewPlaylistName('');
        setNewPlaylistCover(null);
        setNewPlaylistCoverPreview(null);
        setIsPlaylistPublic(true);
        setShowCreateModal(false);
        setIsCreating(false);
    }

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewPlaylistCover(file);
            setNewPlaylistCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        if (!newPlaylistName.trim() || !currentUser) {
            // Ви можете використовувати showNotification, якщо воно є
            // showNotification("Будь ласка, вкажіть назву плейлиста.", "error");
            alert("Будь ласка, вкажіть назву плейлиста.");
            return;
        }
        setIsCreating(true);
        try {
            const newPlaylistRef = doc(collection(db, 'playlists'));
            const playlistId = newPlaylistRef.id;
            let coverArtUrl = null;

            if (newPlaylistCover) {
                const coverRef = ref(storage, `playlists/${currentUser.uid}/${playlistId}/cover`);
                const uploadTask = uploadBytesResumable(coverRef, newPlaylistCover);
                await uploadTask;
                coverArtUrl = await getDownloadURL(uploadTask.snapshot.ref);
            }

            await setDoc(newPlaylistRef, {
                title: newPlaylistName,
                coverArtUrl,
                creatorId: currentUser.uid,
                creatorName: currentUser.displayName,
                isPublic: isPlaylistPublic,
                trackIds: [],
                likesCount: 0,
                createdAt: serverTimestamp(),
            });

            resetModalState();
            await fetchPlaylists(); // Оновлюємо список плейлистів
        } catch (error) {
            console.error("Помилка створення плейлиста:", error);
            // showNotification("Не вдалося створити плейлист.", "error");
            alert("Не вдалося створити плейлист.");
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) return <div className="playlist-placeholder">Завантаження плейлистів...</div>;

    return (
        <div className="playlist-tab-container">
            <div className="playlist-tab-header">
                <h3>Плейлисти</h3>
                {currentUser?.uid === userId && (
                    <button className="create-playlist-button" onClick={() => setShowCreateModal(true)}>
                        <PlusIcon /> Створити плейлист
                    </button>
                )}
            </div>

            {playlists.length > 0 ? (
                <div className="playlist-grid">
                    {playlists.map(playlist => (
                        <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="playlist-card">
                            <div className="playlist-card-cover">
                                {playlist.coverArtUrl ? (
                                    <img src={playlist.coverArtUrl} alt={playlist.title} />
                                ) : (
                                    <div className="cover-placeholder">♫</div>
                                )}
                            </div>
                            <p className="playlist-card-title">{playlist.title}</p>
                            <p className="playlist-card-author">
                                {playlist.trackIds?.length || 0} треків
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="playlist-placeholder">
                    <p>У вас ще немає створених плейлистів.</p>
                    {currentUser?.uid === userId && (
                        <button className="create-playlist-button-large" onClick={() => setShowCreateModal(true)}>
                            Створити свій перший плейлист
                        </button>
                    )}
                </div>
            )}
            
            {/* --- ВІДНОВЛЕНИЙ КОД МОДАЛЬНОГО ВІКНА --- */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4>Створити новий плейлист</h4>
                        <form onSubmit={handleCreatePlaylist} className="modal-form">
                            <div className="playlist-modal-layout">
                                <div className="playlist-modal-cover">
                                    <label htmlFor="playlist-cover-upload" className="cover-art-dropzone">
                                        {newPlaylistCoverPreview ? (
                                            <img src={newPlaylistCoverPreview} alt="preview" className="cover-preview" />
                                        ) : (
                                            <div className="dropzone-placeholder">
                                                <UploadIcon />
                                                <p>Обрати обкладинку</p>
                                            </div>
                                        )}
                                    </label>
                                    <input type="file" id="playlist-cover-upload" accept="image/*" onChange={handleCoverChange} />
                                </div>
                                <div className="playlist-modal-info">
                                    <div className="form-group">
                                        <label htmlFor="playlist-name">Назва*</label>
                                        <input
                                            type="text"
                                            id="playlist-name"
                                            className="form-input"
                                            value={newPlaylistName}
                                            onChange={(e) => setNewPlaylistName(e.target.value)}
                                            placeholder="Мій плейлист #1"
                                            required
                                        />
                                    </div>
                                    <div className="playlist-privacy-toggle">
                                        <label>
                                            <input type="checkbox" checked={isPlaylistPublic} onChange={(e) => setIsPlaylistPublic(e.target.checked)} />
                                            Публічний плейлист
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="modal-button-cancel" onClick={resetModalState}>Скасувати</button>
                                <button type="submit" className="modal-button-confirm" disabled={isCreating}>
                                    {isCreating ? 'Створення...' : 'Створити'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlaylistTab;