import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getTagIllustration } from '../config/tagConfig';
import { usePlayerContext } from '../PlayerContext'; 

// --- ПОЧАТОК ЗМІН ---
import LeftSidebar from '../LeftSidebar'; // Імпортуємо новий компонент
// --- КІНЕЦЬ ЗМІН ---

import TrackList from '../TrackList';
import './TagPage.css';
import default_picture from '../img/Default-Images/default-picture.svg';

const PlayAllIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;

// --- ПОЧАТОК ЗМІН ---
const TagPage = ({ isSidebarOpen }) => {
// --- КІНЕЦЬ ЗМІН ---
    const { tagName } = useParams();
    const { handlePlayPause, addToQueue } = usePlayerContext();

    const [popularTracks, setPopularTracks] = useState([]);
    const [newTracks, setNewTracks] = useState([]);
    const [relatedTags, setRelatedTags] = useState([]);
    const [themedPlaylists, setThemedPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalTracks, setTotalTracks] = useState(0);

    const illustration = getTagIllustration(tagName.toLowerCase());
    const formattedTagName = tagName.charAt(0).toUpperCase() + tagName.slice(1).replace(/-/g, ' ');

    useEffect(() => {
        const fetchTagData = async () => {
            if (!tagName) return;
            setLoading(true);
            
            const lowerCaseTagName = tagName.toLowerCase();
            const tagQuery = `#${lowerCaseTagName}`;
            const tracksRef = collection(db, 'tracks');

            try {
                const popularQuery = query(tracksRef, where('tags_search', 'array-contains', tagQuery), orderBy('playCount', 'desc'), limit(10));
                const newQuery = query(tracksRef, where('tags_search', 'array-contains', tagQuery), orderBy('createdAt', 'desc'), limit(10));
                const countQuery = query(tracksRef, where('tags_search', 'array-contains', tagQuery));

                const [popularSnap, newSnap, countSnap] = await Promise.all([
                    getDocs(popularQuery),
                    getDocs(newQuery),
                    getDocs(countQuery)
                ]);
                
                const popular = popularSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const fresh = newSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                setPopularTracks(popular);
                setNewTracks(fresh);
                setTotalTracks(countSnap.size);

                const allFetchedTracks = [...popular, ...fresh];
                
                if (popular.length > 0) {
                    const popularTrackIds = popular.map(t => t.id).slice(0, 10);
                    const playlistsQuery = query(
                        collection(db, 'playlists'),
                        where('trackIds', 'array-contains-any', popularTrackIds),
                        limit(4)
                    );
                    const playlistsSnap = await getDocs(playlistsQuery);
                    setThemedPlaylists(playlistsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }

                const tagFrequency = new Map();
                allFetchedTracks.forEach(track => {
                    track.tags?.forEach(tag => {
                        const cleanTag = tag.replace('#', '').toLowerCase();
                        if (cleanTag !== lowerCaseTagName) {
                            tagFrequency.set(cleanTag, (tagFrequency.get(cleanTag) || 0) + 1);
                        }
                    });
                });
                const sortedRelatedTags = [...tagFrequency.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(item => item[0]);
                
                setRelatedTags(sortedRelatedTags);

            } catch (error) {
                console.error("Error fetching tag data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTagData();
    }, [tagName]);

    const playAll = () => {
        if (popularTracks.length === 0) return;
        handlePlayPause(popularTracks[0]);
        popularTracks.slice(1).forEach(track => addToQueue(track));
    };

    if (loading) {
        return <div className="tag-page-loader">Завантаження...</div>;
    }

    // --- ПОЧАТОК ЗМІН ---
    return (
        <div className="tag-page-wrapper">
            <LeftSidebar isOpen={isSidebarOpen} />
            <div className={`tag-page-content-pusher ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="tag-page-container">
                    <header className="tag-hero-section" style={{ backgroundImage: `url(${illustration})` }}>
                        <div className="tag-hero-overlay"></div>
                        <div className="tag-hero-content">
                            <h1 className="tag-name">#{formattedTagName}</h1>
                            <p className="tag-metadata">{totalTracks} треків • 12.4k слухачів</p>
                            <button className="tag-play-all-button" onClick={playAll}>
                                <PlayAllIcon /> Слухати все
                            </button>
                        </div>
                    </header>

                    <main className="tag-page-main-content">
                        <section className="tag-content-section">
                            <h2 className="tag-section-title">Популярне в #{formattedTagName}</h2>
                            <TrackList initialTracks={popularTracks} isLoading={loading} />
                        </section>
                        
                        <section className="tag-content-section">
                            <h2 className="tag-section-title">Новинки</h2>
                            <TrackList initialTracks={newTracks} isLoading={loading} />
                        </section>

                        {themedPlaylists.length > 0 && (
                            <section className="tag-content-section">
                                <h2 className="tag-section-title">Тематичні плейлисти</h2>
                                <div className="themed-playlist-grid">
                                    {themedPlaylists.map((pl) => (
                                        <Link to={`/playlist/${pl.id}`} key={pl.id} className="themed-playlist-card">
                                            <div className="themed-playlist-artwork">
                                                <img src={pl.coverArtUrl || default_picture} alt={pl.title}/>
                                            </div>
                                            <div className="themed-playlist-info">
                                                <p>{pl.title}</p>
                                                <span>від {pl.creatorName}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {relatedTags.length > 0 && (
                            <section className="tag-content-section">
                                <h2 className="tag-section-title">Схожі теги</h2>
                                <div className="related-tags-container">
                                    {relatedTags.map(tag => (
                                        <Link to={`/tags/${tag}`} key={tag} className="related-tag">
                                            #{tag}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
    // --- КІНЕЦЬ ЗМІН ---
};

export default TagPage;