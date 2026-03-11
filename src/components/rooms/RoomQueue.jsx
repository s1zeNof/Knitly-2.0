/**
 * RoomQueue.jsx — track queue management
 * Host: can play tracks, remove from queue, add from search
 * Guest: view-only
 */

import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import './RoomQueue.css';

/* ── Icons ────────────────────────────────────────────────────── */
const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
);
const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
);
const MusicIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
);
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
);

const TrackRow = ({ track, index, isHost, onPlay, onRemove }) => (
    <div className="rq-track">
        <span className="rq-track-num">{index + 1}</span>
        <div className="rq-track-cover">
            {track.coverArtUrl ? (
                <img src={track.coverArtUrl} alt={track.title} />
            ) : (
                <div className="rq-track-cover--empty"><MusicIcon /></div>
            )}
        </div>
        <div className="rq-track-meta">
            <p className="rq-track-title">{track.title}</p>
            <p className="rq-track-artist">{track.artist}</p>
        </div>
        {isHost && (
            <div className="rq-track-actions">
                <button
                    className="rq-action-btn rq-action-btn--play"
                    onClick={() => onPlay(track)}
                    title="Грати зараз"
                    aria-label={`Відтворити ${track.title}`}
                >
                    <PlayIcon />
                </button>
                <button
                    className="rq-action-btn rq-action-btn--remove"
                    onClick={() => onRemove(track)}
                    title="Видалити з черги"
                    aria-label={`Видалити ${track.title}`}
                >
                    <TrashIcon />
                </button>
            </div>
        )}
    </div>
);

/* ── Search tracks (from Firestore) ────────────────────────────── */
const useTrackSearch = () => {
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const search = async (term) => {
        if (!term.trim()) { setResults([]); return; }
        setSearching(true);
        try {
            const end = term.toLowerCase() + '\uf8ff';
            const q = query(
                collection(db, 'tracks'),
                where('titleLower', '>=', term.toLowerCase()),
                where('titleLower', '<=', end),
                orderBy('titleLower'),
                limit(10)
            );
            const snap = await getDocs(q);
            setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('[RoomQueue] search error:', e);
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    return { results, searching, search };
};

const RoomQueue = ({ queue = [], currentTrack, isHost, onPlayTrack, onRemoveFromQueue, onAddToQueue }) => {
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { results, searching, search } = useTrackSearch();

    const handleSearchInput = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        search(val);
    };

    const handleAddTrack = (track) => {
        onAddToQueue(track);
        setShowSearch(false);
        setSearchTerm('');
    };

    return (
        <div className="rq-root">
            {/* Header */}
            <div className="rq-header">
                <h3 className="rq-title">Черга ({queue.length})</h3>
                {isHost && (
                    <button
                        className="rq-add-btn"
                        onClick={() => setShowSearch((s) => !s)}
                        aria-label="Додати трек"
                    >
                        <PlusIcon />
                        {showSearch ? 'Закрити' : 'Додати'}
                    </button>
                )}
            </div>

            {/* Search panel (host only) */}
            {isHost && showSearch && (
                <div className="rq-search">
                    <div className="rq-search-row">
                        <SearchIcon />
                        <input
                            type="text"
                            className="rq-search-input"
                            placeholder="Пошук треку…"
                            value={searchTerm}
                            onChange={handleSearchInput}
                            autoFocus
                        />
                    </div>
                    <div className="rq-search-results">
                        {searching && <p className="rq-search-loading">Пошук…</p>}
                        {!searching && results.length === 0 && searchTerm && (
                            <p className="rq-search-empty">Нічого не знайдено</p>
                        )}
                        {results.map((track) => (
                            <div key={track.id} className="rq-result-row">
                                <div className="rq-result-info">
                                    <span className="rq-result-title">{track.title}</span>
                                    <span className="rq-result-artist">{track.authorName || track.artist}</span>
                                </div>
                                <button
                                    className="rq-result-add"
                                    onClick={() => handleAddTrack(track)}
                                >
                                    + Додати
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Current track */}
            {currentTrack && (
                <div className="rq-now-playing">
                    <span className="rq-now-label">Зараз грає</span>
                    <div className="rq-track rq-track--active">
                        <span className="rq-eq">
                            <span /><span /><span />
                        </span>
                        <div className="rq-track-cover">
                            {currentTrack.coverArtUrl ? (
                                <img src={currentTrack.coverArtUrl} alt={currentTrack.title} />
                            ) : (
                                <div className="rq-track-cover--empty"><MusicIcon /></div>
                            )}
                        </div>
                        <div className="rq-track-meta">
                            <p className="rq-track-title">{currentTrack.title}</p>
                            <p className="rq-track-artist">{currentTrack.artist}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Queue list */}
            <div className="rq-list">
                {queue.length === 0 && (
                    <div className="rq-empty">
                        <MusicIcon />
                        <p>{isHost ? 'Черга порожня. Додай треки!' : 'Хост ще не додав треків до черги.'}</p>
                    </div>
                )}
                {queue.map((track, i) => (
                    <TrackRow
                        key={`${track.id}-${i}`}
                        track={track}
                        index={i}
                        isHost={isHost}
                        onPlay={onPlayTrack}
                        onRemove={onRemoveFromQueue}
                    />
                ))}
            </div>
        </div>
    );
};

export default RoomQueue;
