/**
 * RoomsPage.jsx — Browse & discover public listening rooms
 * Real-time grid via Firestore onSnapshot
 */

import React, { useState, useEffect } from 'react';
import { useUserContext } from '../contexts/UserContext';
import { listenToPublicRooms } from '../services/roomService';
import RoomCard from '../components/rooms/RoomCard';
import CreateRoomSheet from '../components/rooms/CreateRoomSheet';
import './RoomsPage.css';

/* ── Icons ────────────────────────────────────────────────────── */
const HeadphonesIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h1v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-2v8h1c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
    </svg>
);
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
);

const FILTER_TAGS = ['all', 'поп', 'рок', 'джаз', 'електронна', 'хіп-хоп', 'lo-fi', 'indie'];

const RoomsPage = () => {
    const { user } = useUserContext();
    const [rooms, setRooms]             = useState([]);
    const [loading, setLoading]         = useState(true);
    const [activeTag, setActiveTag]     = useState('all');
    const [showCreate, setShowCreate]   = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    /* ── Real-time subscription ─────────────────────────────── */
    useEffect(() => {
        setLoading(true);
        const unsub = listenToPublicRooms((data) => {
            setRooms(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    /* ── Filter ─────────────────────────────────────────────── */
    const filtered = rooms.filter((r) => {
        const matchTag = activeTag === 'all' || r.tags?.includes(activeTag);
        const matchSearch = !searchQuery ||
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.hostInfo?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTag && matchSearch;
    });

    const liveCount = rooms.filter(r => r.isPlaying).length;

    return (
        <div className="rooms-page">
            {/* ── Hero ──────────────────────────────────────────── */}
            <div className="rooms-hero">
                <span className="rooms-hero-glow rooms-hero-glow--purple" aria-hidden="true" />
                <span className="rooms-hero-glow rooms-hero-glow--blue"   aria-hidden="true" />

                <div className="rooms-hero-inner">
                    <div className="rooms-hero-icon">
                        <HeadphonesIcon />
                    </div>
                    <div className="rooms-hero-text">
                        <h1 className="rooms-hero-title">Кімнати 🎧</h1>
                        <p className="rooms-hero-sub">
                            Слухайте музику разом у реальному часі.
                            {liveCount > 0 && (
                                <span className="rooms-hero-live">
                                    &nbsp;·&nbsp;🔴 {liveCount} {liveCount === 1 ? 'кімната' : 'кімнати'} зараз активні
                                </span>
                            )}
                        </p>
                    </div>
                    {user && (
                        <button className="rooms-create-btn" onClick={() => setShowCreate(true)}>
                            <PlusIcon />
                            Створити кімнату
                        </button>
                    )}
                </div>
            </div>

            {/* ── Toolbar ───────────────────────────────────────── */}
            <div className="rooms-toolbar">
                <div className="rooms-search-wrap">
                    <input
                        className="rooms-search"
                        type="search"
                        placeholder="Пошук кімнати…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="rooms-tag-filters">
                    {FILTER_TAGS.map((tag) => (
                        <button
                            key={tag}
                            className={`rooms-tag-btn${activeTag === tag ? ' rooms-tag-btn--active' : ''}`}
                            onClick={() => setActiveTag(tag)}
                        >
                            {tag === 'all' ? 'Всі' : `#${tag}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Stats bar ─────────────────────────────────────── */}
            <div className="rooms-stats-bar">
                <span className="rooms-stat">
                    <span className="rooms-stat-val">{rooms.length}</span>
                    &nbsp;активних кімнат
                </span>
                <span className="rooms-stat-sep" />
                <span className="rooms-stat">
                    <span className="rooms-stat-val">
                        {rooms.reduce((s, r) => s + (r.participantsCount || 0), 0)}
                    </span>
                    &nbsp;слухачів онлайн
                </span>
            </div>

            {/* ── Grid ──────────────────────────────────────────── */}
            <div className="rooms-grid-wrap">
                {loading ? (
                    <div className="rooms-skeleton-grid">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rooms-skeleton-card">
                                <div className="rooms-sk-img" />
                                <div className="rooms-sk-line rooms-sk-line--title" />
                                <div className="rooms-sk-line rooms-sk-line--sub" />
                                <div className="rooms-sk-line rooms-sk-line--short" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rooms-empty">
                        <HeadphonesIcon />
                        <h3>Кімнат поки немає</h3>
                        <p>
                            {searchQuery || activeTag !== 'all'
                                ? 'Спробуй інші фільтри або пошуковий запит.'
                                : 'Будь першим — відкрий кімнату та запроси друзів!'}
                        </p>
                        {user && (
                            <button className="rooms-create-btn rooms-create-btn--empty" onClick={() => setShowCreate(true)}>
                                <PlusIcon /> Створити першу кімнату
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="rooms-grid">
                        {filtered.map((room) => (
                            <RoomCard key={room.id} room={room} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Create Room Sheet ──────────────────────────────── */}
            <CreateRoomSheet
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
            />
        </div>
    );
};

export default RoomsPage;
