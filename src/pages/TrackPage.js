import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { usePlayerContext } from '../contexts/PlayerContext';
import Waveform from '../components/player/Waveform'; // <<< ПЕРЕВІРТЕ НАЯВНІСТЬ ЦЬОГО ІМПОРТУ
import TrackList from '../components/common/TrackList';
import './TrackPage.css';
import default_picture from '../img/Default-Images/default-picture.svg';

// Icons
const PlayIcon = () => <svg height="32" width="32" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg height="32" width="32" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const HeartIcon = () => <svg viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const ShareIcon = () => <svg viewBox="0 0 24 24"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"></path></svg>;
const OptionsIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="5" cy="12" r="2"></circle></svg>;

const TrackPage = () => {
    const { trackId } = useParams();
    const { handlePlayPause, isPlaying, currentTrack } = usePlayerContext();
    const [track, setTrack] = useState(null);
    const [author, setAuthor] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [popularTracks, setPopularTracks] = useState([]);
    const [visiblePopularCount, setVisiblePopularCount] = useState(5);
    const [albums, setAlbums] = useState([]);
    const [loadingPopular, setLoadingPopular] = useState(true);

    useEffect(() => {
        const fetchTrackData = async () => {
            setLoading(true);
            try {
                const trackRef = doc(db, 'tracks', trackId);
                const trackSnap = await getDoc(trackRef);

                if (trackSnap.exists()) {
                    const trackData = { id: trackSnap.id, ...trackSnap.data() };
                    setTrack(trackData);

                    const authorRef = doc(db, 'users', trackData.authorId);
                    const authorSnap = await getDoc(authorRef);
                    if (authorSnap.exists()) {
                        setAuthor({ id: authorSnap.id, ...authorSnap.data() });
                        fetchAuthorContent(trackData.authorId);
                    }
                } else {
                    console.log("No such track!");
                }
            } catch (error) {
                console.error("Error fetching track data:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchAuthorContent = async (authorId) => {
            setLoadingPopular(true);
            try {
                const tracksQuery = query(
                    collection(db, 'tracks'), 
                    where('authorId', '==', authorId), 
                    orderBy('playCount', 'desc'),
                    limit(10)
                );
                const tracksSnapshot = await getDocs(tracksQuery);
                setPopularTracks(tracksSnapshot.docs.map(d => ({id: d.id, ...d.data()})));
                
                const albumsQuery = query(
                    collection(db, 'albums'),
                    where('artistId', '==', authorId),
                    orderBy('releaseDate', 'desc')
                );
                const albumsSnapshot = await getDocs(albumsQuery);
                setAlbums(albumsSnapshot.docs.map(d => ({id: d.id, ...d.data()})));

            } catch (error) {
                console.error("Error fetching author content:", error);
            } finally {
                setLoadingPopular(false);
            }
        };

        fetchTrackData();
    }, [trackId]);

    const toggleVisiblePopular = () => {
        setVisiblePopularCount(prev => prev === 5 ? 10 : 5);
    };

    if (loading) {
        return <div className="track-page-loading">Завантаження треку...</div>;
    }

    if (!track) {
        return <div className="track-page-loading">Трек не знайдено.</div>;
    }

    const isThisTrackPlaying = isPlaying && currentTrack?.id === track.id;

    return (
        <div className="track-page-container">
            <header className="track-page-header">
                <div className="track-header-info">
                    <button className="track-page-play-button" onClick={() => handlePlayPause(track)}>
                        {isThisTrackPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <div className="track-header-details">
                        <h1>{track.title}</h1>
                        <Link to={`/${author?.nickname}`}>{track.authorName}</Link>
                    </div>
                </div>
                <div className="track-header-waveform">
                    <Waveform /> {/* <<< ДЕКОРАТИВНА ХВИЛЯ МАЄ БУТИ ТУТ */}
                </div>
                <img src={track.coverArtUrl || default_picture} alt={track.title} className="track-header-cover" />
            </header>

            <main className="track-page-body">
                <div className="track-main-content">
                    <div className="track-actions-bar">
                        <button className="action-button disabled" disabled><HeartIcon /> Like</button>
                        <button className="action-button disabled" disabled><ShareIcon /> Share</button>
                        <button className="action-button disabled" disabled><OptionsIcon /> More</button>
                    </div>

                    <div className="track-author-card">
                         {author && (
                            <>
                                <Link to={`/${author.nickname}`}>
                                    <img src={author.photoURL || default_picture} alt={author.displayName} />
                                </Link>
                                <div className="track-author-info">
                                    <Link to={`/${author.nickname}`}>{author.displayName}</Link>
                                    <span>{author.followers?.length || 0} підписників</span>
                                </div>
                                <button className="follow-button disabled" disabled>Підписатися</button>
                            </>
                         )}
                    </div>
                    
                    {track.description && <p className="track-description">{track.description}</p>}

                    <div className="track-content-section">
                        <h3>Популярні треки від {author?.displayName || 'виконавця'}</h3>
                        {loadingPopular ? (
                            <p>Завантаження...</p>
                        ) : popularTracks.length > 0 ? (
                            <>
                                <TrackList initialTracks={popularTracks.slice(0, visiblePopularCount)} />
                                {popularTracks.length > 5 && (
                                    <button onClick={toggleVisiblePopular} className="more-button">
                                        {visiblePopularCount === 5 ? 'Показати більше' : 'Приховати'}
                                    </button>
                                )}
                            </>
                        ) : (
                            <p>У цього виконавця немає інших треків.</p>
                        )}
                    </div>

                    <div className="track-content-section">
                        <h3>Альбоми</h3>
                        {loadingPopular ? <p>Завантаження...</p> : albums.length > 0 ? (
                             <div className="albums-grid">
                                {albums.map(album => (
                                    <div key={album.id} className="album-card">
                                        <img src={album.coverArtUrl || default_picture} alt={album.title} />
                                        <p className="album-title">{album.title}</p>
                                        <p className="album-year">{new Date(album.releaseDate.seconds * 1000).getFullYear()}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <p>У цього виконавця немає альбомів.</p>}
                    </div>
                    
                    <div className="track-content-section">
                        <h3>Рекомендації (Blank)</h3>
                        <p className="sidebar-placeholder">Алгоритм рекомендацій буде додано згодом.</p>
                    </div>


                     <div className="track-comments-section">
                        <h4>Коментарі (Blank)</h4>
                        <div className="comment-input-placeholder">
                            <img src={author?.photoURL || default_picture} alt="avatar"/>
                            <input type="text" placeholder="Написати коментар..." disabled />
                        </div>
                    </div>
                </div>
                <aside className="track-sidebar">
                     <div className="sidebar-module">
                        <h5>Статистика</h5>
                        <div className="stats-grid">
                            <span>{track.playCount || 0} прослуховувань</span>
                            <span>{track.likesCount || 0} лайків</span>
                            <span>0 репостів</span>
                            <span>0 коментарів</span>
                        </div>
                    </div>
                    <div className="sidebar-module">
                        <h5>Хештеги</h5>
                        <div className="tags-container">
                            {track.tags?.map(tag => <span key={tag} className="tag-item">{tag}</span>)}
                        </div>
                    </div>
                     <div className="sidebar-module">
                        <h5>Схожі треки (Blank)</h5>
                        <p className="sidebar-placeholder">Цей функціонал буде додано пізніше.</p>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default TrackPage;