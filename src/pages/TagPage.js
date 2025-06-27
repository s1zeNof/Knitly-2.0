// src/pages/TagPage.js

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getTagIllustration } from '../config/tagConfig';
import { usePlayerContext } from '../PlayerContext'; 

import TrackList from '../TrackList';
import './TagPage.css';

const PlayAllIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;

const TagPage = () => {
    const { tagName } = useParams();
    const { handlePlayPause, addToQueue } = usePlayerContext();

    const [popularTracks, setPopularTracks] = useState([]);
    const [newTracks, setNewTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalTracks, setTotalTracks] = useState(0);

    const illustration = getTagIllustration(tagName);
    const formattedTagName = tagName.charAt(0).toUpperCase() + tagName.slice(1).replace(/-/g, ' ');

    useEffect(() => {
        const fetchTagData = async () => {
            if (!tagName) return;
            setLoading(true);
            
            const tagQuery = `#${tagName.toLowerCase()}`;
            const tracksRef = collection(db, 'tracks');

            try {
                const popularQuery = query(
                    tracksRef, 
                    where('tags_search', 'array-contains', tagQuery), 
                    orderBy('playCount', 'desc'), 
                    limit(10)
                );

                const newQuery = query(
                    tracksRef,
                    where('tags_search', 'array-contains', tagQuery),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                );
                
                const countQuery = query(tracksRef, where('tags_search', 'array-contains', tagQuery));

                const [popularSnap, newSnap, countSnap] = await Promise.all([
                    getDocs(popularQuery),
                    getDocs(newQuery),
                    getDocs(countQuery)
                ]);

                setPopularTracks(popularSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setNewTracks(newSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setTotalTracks(countSnap.size);

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

    return (
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

            <main className="tag-page-content">
                <section className="tag-content-section">
                    <h2 className="tag-section-title">Популярне в #{formattedTagName}</h2>
                    <TrackList initialTracks={popularTracks} isLoading={loading} />
                </section>
                
                <section className="tag-content-section">
                    <h2 className="tag-section-title">Новинки</h2>
                    <TrackList initialTracks={newTracks} isLoading={loading} />
                </section>

                <section className="tag-content-section">
                    <h2 className="tag-section-title">Тематичні плейлисти</h2>
                    <div className="placeholder-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="placeholder-playlist-card">
                                <div className="placeholder-artwork">🎵</div>
                                <div className="placeholder-info">
                                    <p>Phonk for Drift</p>
                                    <span>Скоро...</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="tag-content-section">
                    <h2 className="tag-section-title">Схожі теги</h2>
                    <div className="related-tags-container">
                        <Link to="/tags/drift" className="related-tag">#drift</Link>
                        <Link to="/tags/memphis-rap" className="related-tag">#memphis-rap</Link>
                        <Link to="/tags/electronic" className="related-tag">#electronic</Link>
                        <Link to="/tags/dark" className="related-tag">#dark</Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default TagPage;