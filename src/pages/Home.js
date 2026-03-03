import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlayerContext } from '../contexts/PlayerContext';
import { useUserContext } from '../contexts/UserContext';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getTagIllustration } from '../config/tagConfig';

import './Home.css';
import default_picture from '../img/Default-Images/default-picture.svg';

import Feed from '../components/posts/Feed';
import StoriesRow from '../components/stories/StoriesRow';


const CreatePostForm = React.lazy(() => import('../components/posts/CreatePostForm'));

const HomeLoader = () => (<div className="home-loader-container"><div className="loader-spinner"></div></div>);

const formatRelativeTime = (timestamp) => {
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

const Home = ({ openBrowser, openShareModal }) => {
    const { handlePlayPause } = usePlayerContext();
    const { user: currentUser, authLoading } = useUserContext();
    const navigate = useNavigate();

    const [newRelease, setNewRelease] = useState(null);
    const [spotlightAlbum, setSpotlightAlbum] = useState(null);
    const [recommendedPlaylist, setRecommendedPlaylist] = useState(null);
    const [suggestedArtist, setSuggestedArtist] = useState(null);
    const [trendingCategories, setTrendingCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    // Відкладаємо рендер CreatePostForm (Lexical editor) щоб він не блокував GSAP анімацію Feed
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Відкладаємо ініціалізацію Lexical editor на 900мс — після завершення GSAP анімації
    useEffect(() => {
        const timer = setTimeout(() => setShowCreateForm(true), 900);
        return () => {
            clearTimeout(timer);
            setShowCreateForm(false);
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
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
                    illustration: getTagIllustration(slug)
                }));
                setTrendingCategories(topTags);
            } catch (error) {
                console.error("Error fetching home page data:", error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        document.body.classList.add('home-page-background');
        return () => document.body.classList.remove('home-page-background');
    }, []);

    // useMemo без JSON.stringify у залежностях — стабільна посилання на масив
    const followingRef = useMemo(() => currentUser?.following || [], [currentUser?.uid, currentUser?.following?.length]); // eslint-disable-line react-hooks/exhaustive-deps
    const feedIds = useMemo(() => {
        if (!currentUser) return null;
        const ids = [currentUser.uid, ...followingRef];
        return ids;
    }, [currentUser?.uid, followingRef]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="home-container">
            <main className="main-content">
                    {(loading || authLoading) ? <HomeLoader /> : (
                        <>
                            {/* Hero Section */}
                            {currentUser && (
                                <div className="hero-section">
                                    <div className="hero-content">
                                        <h1 className="hero-title">
                                            Привіт, {currentUser.displayName || 'Музиканте'}! 🎵
                                        </h1>
                                        <p className="hero-subtitle">
                                            Відкривай нову музику, ділися своїми треками та спілкуйся з артистами
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!currentUser && (
                                <div className="hero-section">
                                    <div className="hero-content">
                                        <h1 className="hero-title">
                                            Твоя музична соцмережа 🎸
                                        </h1>
                                        <p className="hero-subtitle">
                                            Слухай, ділись та створюй музику разом з тисячами музикантів
                                        </p>
                                        <div className="hero-cta-buttons">
                                            <button className="hero-btn hero-btn-primary" onClick={() => navigate('/register')}>
                                                Почати зараз
                                            </button>
                                            <button className="hero-btn hero-btn-secondary" onClick={() => navigate('/login')}>
                                                Увійти
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Discovery Grid - Dashboard Style */}
                            <div className="discovery-grid">
                                <div className="discovery-column">
                                    {spotlightAlbum && (
                                        <div className="feed-card spotlight-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                            <img src={spotlightAlbum.coverArtUrl || default_picture} alt={spotlightAlbum.title} className="spotlight-bg" />
                                            <div className="spotlight-overlay"></div>
                                            <div className="card-content">
                                                <h3>В центрі уваги: '{spotlightAlbum.title}' від {spotlightAlbum.artistName}</h3>
                                                <p>{spotlightAlbum.description || `Останній альбом ${spotlightAlbum.artistName} - це справжня подорож крізь звук.`}</p>
                                                <button className="card-button light" onClick={() => {/* TODO */ }}>Слухати зараз</button>
                                            </div>
                                        </div>
                                    )}

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
                                </div>

                                <div className="discovery-column">
                                    {trendingCategories.length > 0 && (
                                        <div className="trending-section animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                            <h2 className="section-title">В тренді</h2>
                                            <div className="trending-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                                                {trendingCategories.slice(0, 3).map(cat => (
                                                    <Link to={`/tags/${cat.slug}`} key={cat.slug} className="trending-card" style={{ backgroundImage: `url(${cat.illustration})`, height: '120px' }}>
                                                        <span>{cat.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stories Row — shown for logged-in users */}
                            {!authLoading && currentUser && (
                                <StoriesRow feedUids={feedIds || []} />
                            )}

                            {/* Feed Section */}
                            {!authLoading && currentUser && showCreateForm && (
                                <React.Suspense fallback={null}>
                                    <CreatePostForm />
                                </React.Suspense>
                            )}

                            <Feed
                                followingList={feedIds}
                                openBrowser={openBrowser}
                                openShareModal={openShareModal}
                            />

                            <hr className="feed-divider" />

                            {recommendedPlaylist && (
                                <div className="feed-card horizontal-card recommended-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                    <img src={recommendedPlaylist.coverArtUrl || default_picture} alt={recommendedPlaylist.title} />
                                    <div className="card-content">
                                        <h3>Плейлист: {recommendedPlaylist.title}</h3>
                                        <p>Розслабтеся та відпочиньте з цією добіркою м'яких треків.</p>
                                        <button className="card-button" onClick={() => {/* TODO */ }}>Слухати</button>
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