import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext';
import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getTagIllustration } from './config/tagConfig'; // --- ЗМІНА: Імпортуємо одну функцію ---
import './Home.css';
import default_picture from './img/Default-Images/default-picture.svg';

// Іконки та інші компоненти без змін
const UploadIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>;
const LibraryIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const BellIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
const MessagesIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const HelpIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const HomeLoader = () => ( <div className="home-loader-container"><div className="loader-spinner"></div></div> );

const formatRelativeTime = (timestamp) => {
    // ... (код без змін)
    if (!timestamp) return '';
    const now = new Date();
    const past = timestamp.toDate();
    const diffInSeconds = Math.floor((now - past) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return "щойно";
    if (diffInMinutes < 60) return `${diffInMinutes} хвилин${diffInMinutes > 1 && diffInMinutes < 5 ? 'и' : ''} тому`;
    if (diffInHours < 24) return `${diffInHours} годин${diffInHours > 1 && diffInHours < 5 ? 'и' : ''} тому`;
    if (diffInDays === 1) return `вчора о ${past.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffInDays < 7) return `${diffInDays} дн${diffInDays > 1 ? 'і' : 'ень'} тому`;
    
    return past.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
};

const Home = () => {
    const { user } = useUserContext();
    const { handlePlayPause } = usePlayerContext();

    const [newRelease, setNewRelease] = useState(null);
    const [spotlightAlbum, setSpotlightAlbum] = useState(null);
    const [recommendedPlaylist, setRecommendedPlaylist] = useState(null);
    const [suggestedArtist, setSuggestedArtist] = useState(null);
    const [trendingCategories, setTrendingCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // ... (запити до бази даних без змін)
                const queries = {
                    newRelease: query(collection(db, 'tracks'), orderBy('createdAt', 'desc'), limit(1)),
                    spotlightAlbum: query(collection(db, 'albums'), orderBy('releaseDate', 'desc'), limit(1)),
                    recommendedPlaylist: query(collection(db, 'playlists'), orderBy('createdAt', 'desc'), limit(1)),
                    suggestedArtist: query(collection(db, 'users'), where('followersCount', '>', 5), limit(1)),
                    recentTracksForTags: query(collection(db, 'tracks'), orderBy('createdAt', 'desc'), limit(50))
                };

                const [releaseSnap, albumSnap, playlistSnap, artistSnap, tagsSnap] = await Promise.all(
                    Object.values(queries).map(q => getDocs(q))
                );

                if (!releaseSnap.empty) setNewRelease({ id: releaseSnap.docs[0].id, ...releaseSnap.docs[0].data() });
                if (!albumSnap.empty) setSpotlightAlbum({ id: albumSnap.docs[0].id, ...albumSnap.docs[0].data() });
                if (!playlistSnap.empty) setRecommendedPlaylist({ id: playlistSnap.docs[0].id, ...playlistSnap.docs[0].data() });
                if (!artistSnap.empty) setSuggestedArtist({ id: artistSnap.docs[0].id, ...artistSnap.docs[0].data() });
                
                // --- ЗМІНА: Логіка тепер використовує нову функцію getTagIllustration ---
                const tagCounts = new Map();
                tagsSnap.docs.forEach(doc => {
                    const tags = doc.data().tags || [];
                    tags.forEach(tag => {
                        const cleanTag = tag.replace('#', '');
                        tagCounts.set(cleanTag, (tagCounts.get(cleanTag) || 0) + 1);
                    });
                });

                const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
                
                const topTags = sortedTags.slice(0, 3).map(([slug]) => ({
                    slug,
                    name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
                    illustration: getTagIllustration(slug) // Використовуємо нашу нову функцію
                }));
                setTrendingCategories(topTags);
                
            } catch (error) { console.error("Error fetching home page data:", error); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        document.body.classList.add('home-page-background');
        return () => document.body.classList.remove('home-page-background');
    }, []);

    // JSX розмітка залишається без змін, оскільки вона вже використовує `cat.illustration`
    return (
        <div className="home-container">
            <aside className="left-sidebar">
                 <div>
                    {user ? (
                        <Link to="/profile" className="sidebar-user-info">
                            <img src={user.photoURL || default_picture} alt="Avatar" className="profile-avatar" />
                            <div className="profile-info">
                                <span className="profile-name">{user.displayName || 'Мій Профіль'}</span>
                                <span className="profile-nickname">@{user.nickname || 'nickname'}</span>
                            </div>
                        </Link>
                    ) : (
                         <div className="sidebar-login-prompt">
                            <p>Увійдіть, щоб бачити персоналізований контент.</p>
                            <Link to="/login" className="login-button">Увійти</Link>
                        </div>
                    )}
                    <nav className="sidebar-nav">
                        <Link to="/upload" className="nav-item"><UploadIcon /> Завантажити</Link>
                        <Link to="/library" className="nav-item"><LibraryIcon /> Моя бібліотека</Link>
                        <Link to="/messages" className="nav-item"><MessagesIcon/> Повідомлення</Link>
                        <Link to="/notifications" className="nav-item"><BellIcon /> Сповіщення</Link>
                    </nav>
                </div>
                <div className="sidebar-footer">
                    <Link to="/settings" className="nav-item"><SettingsIcon /> Налаштування</Link>
                    <Link to="/help" className="nav-item"><HelpIcon /> Допомога</Link>
                </div>
            </aside>

            <main className="main-content">
                {loading ? <HomeLoader /> : (
                    <>
                        <h1 className="feed-title">Стрічка</h1>
                        {newRelease && (
                             <div className="feed-card horizontal-card new-release-card animate-fade-in-up">
                                <img src={newRelease.coverArtUrl || default_picture} alt={newRelease.title} />
                                <div className="card-content">
                                    <h3>Новий реліз: '{newRelease.title}' від {newRelease.authorName}</h3>
                                    <p>{newRelease.description || `Слухайте новий трек від ${newRelease.authorName}.`}</p>
                                    <span>Завантажено {formatRelativeTime(newRelease.createdAt)}</span>
                                    <button className="card-button" onClick={() => handlePlayPause(newRelease)}>Слухати</button>
                                </div>
                            </div>
                        )}
                        {spotlightAlbum && (
                            <div className="feed-card spotlight-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <img src={spotlightAlbum.coverArtUrl || default_picture} alt={spotlightAlbum.title} className="spotlight-bg" />
                                <div className="spotlight-overlay"></div>
                                <div className="card-content">
                                    <h3>В центрі уваги: '{spotlightAlbum.title}' від {spotlightAlbum.artistName}</h3>
                                    <p>{spotlightAlbum.description || `Останній альбом ${spotlightAlbum.artistName} - це справжня подорож крізь звук.`}</p>
                                    <button className="card-button light" onClick={() => {/* TODO */}}>Слухати зараз</button>
                                </div>
                            </div>
                        )}

                        {trendingCategories.length > 0 && (
                             <div className="trending-section animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                <h2 className="section-title">В тренді</h2>
                                <div className="trending-grid">
                                    {trendingCategories.map(cat => (
                                        <Link 
                                          to={`/tags/${cat.slug}`} 
                                          key={cat.slug} 
                                          className="trending-card" 
                                          style={{backgroundImage: `url(${cat.illustration})`}}
                                        >
                                            <span>{cat.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {recommendedPlaylist && (
                             <div className="feed-card horizontal-card recommended-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                <img src={recommendedPlaylist.coverArtUrl || default_picture} alt={recommendedPlaylist.title} />
                                <div className="card-content">
                                    <h3>Плейлист: {recommendedPlaylist.title}</h3>
                                    <p>Розслабтеся та відпочиньте з цією добіркою м'яких треків.</p>
                                    <button className="card-button" onClick={() => {/* TODO */}}>Слухати</button>
                                </div>
                            </div>
                        )}
                        {suggestedArtist && (
                             <div className="feed-card horizontal-card artist-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                <img src={suggestedArtist.photoURL || default_picture} alt={suggestedArtist.displayName} />
                                <div className="card-content">
                                    <h3>Артист: {suggestedArtist.displayName}</h3>
                                    <p>Слідкуйте за {suggestedArtist.displayName}, щоб не пропустити нову музику.</p>
                                    <button className="card-button follow">Слідкувати</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Home;