/**
 * TrackSharePanel.jsx — Share a track via DM or external methods.
 *
 * Adapts the ShareModal pattern for tracks instead of posts.
 * Uses shareTrackToChats() to DM tracks to selected users.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import {
    searchUsers,
    getUsersFromRecentChats,
    getFollowing,
    shareTrackToChats,
} from '../../services/firebase';
import toast from 'react-hot-toast';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './TrackSharePanel.css';

/* ── Icons ───────────────────────────────────────────────────── */
const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);
const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
);
const ClearIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const CopyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
);
const ExternalShareIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
    </svg>
);

/* ── User row ─────────────────────────────────────────────────── */
const UserRow = ({ user, selected, onToggle }) => (
    <button
        className={`tsp-user-row${selected ? ' tsp-user-row--selected' : ''}`}
        onClick={() => onToggle(user)}
        type="button"
    >
        <img
            src={user.photoURL || default_picture}
            alt={user.displayName || user.nickname}
            className="tsp-user-avatar"
            onError={e => { e.target.onerror = null; e.target.src = default_picture; }}
        />
        <div className="tsp-user-info">
            <span className="tsp-user-name">{user.displayName || user.nickname || 'Користувач'}</span>
            {user.nickname && <span className="tsp-user-nick">@{user.nickname}</span>}
        </div>
        <span className={`tsp-user-check${selected ? ' tsp-user-check--on' : ''}`}>
            {selected && <CheckIcon />}
        </span>
    </button>
);

/* ── Skeleton ─────────────────────────────────────────────────── */
const SkeletonRow = () => (
    <div className="tsp-skeleton-row">
        <div className="tsp-skeleton-avatar" />
        <div className="tsp-skeleton-body">
            <div className="tsp-skeleton-line long" />
            <div className="tsp-skeleton-line short" />
        </div>
    </div>
);

/* ══════════════════════════════════════════════════════════════ */
/**
 * TrackSharePanel
 * @param {object} track    — track object { id, title, authorName, coverArtUrl }
 * @param {function} onClose
 */
const TrackSharePanel = ({ track, onClose }) => {
    const { user: currentUser } = useUserContext();
    const trackUrl = `${window.location.origin}/tracks/${track?.id}`;

    const [query, setQuery]               = useState('');
    const [suggestedUsers, setSuggested]  = useState([]);
    const [searchResults, setResults]     = useState([]);
    const [selectedUsers, setSelected]    = useState([]);
    const [initialLoading, setInitLoad]   = useState(true);
    const [searching, setSearching]       = useState(false);
    const [sending, setSending]           = useState(false);

    const inputRef    = useRef(null);
    const debounceRef = useRef(null);
    const [followingUids, setFollowingUids] = useState(new Set());

    /* ── Load suggested users ────────────────────────────────── */
    useEffect(() => {
        if (!currentUser) return;
        (async () => {
            const [following, recent] = await Promise.all([
                getFollowing(currentUser.uid),
                getUsersFromRecentChats(currentUser.uid),
            ]);
            const uids = new Set(following.map(u => u.uid));
            setFollowingUids(uids);
            const map = new Map();
            recent.forEach(u => map.set(u.uid, u));
            following.forEach(u => map.set(u.uid, u));
            map.delete(currentUser.uid);
            const filtered = Array.from(map.values()).filter(u => {
                const p = u.settings?.privacy?.messagePrivacy ?? 'everyone';
                return p !== 'nobody';
            });
            setSuggested(filtered);
            setInitLoad(false);
        })();
    }, [currentUser]);

    /* ── Debounced search ────────────────────────────────────── */
    const handleQueryChange = useCallback((e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);
        if (!val.trim()) { setResults([]); setSearching(false); return; }
        setSearching(true);
        debounceRef.current = setTimeout(async () => {
            const res = await searchUsers(val.trim(), currentUser?.uid);
            setResults(res);
            setSearching(false);
        }, 350);
    }, [currentUser?.uid]);

    /* ── Privacy filter ──────────────────────────────────────── */
    const canReceiveFrom = useCallback((u) => {
        const p = u.settings?.privacy?.messagePrivacy ?? 'everyone';
        if (p === 'nobody') return false;
        if (p === 'following' && !followingUids.has(u.uid)) return false;
        return true;
    }, [followingUids]);

    /* ── Displayed list ──────────────────────────────────────── */
    const displayedUsers = useMemo(() => {
        if (!query.trim()) return suggestedUsers;
        const q = query.trim().toLowerCase();
        const clientFiltered = suggestedUsers.filter(u =>
            u.nickname?.toLowerCase().startsWith(q) ||
            u.displayName?.toLowerCase().startsWith(q)
        );
        const seen = new Set(clientFiltered.map(u => u.uid));
        const merged = [...clientFiltered];
        searchResults.forEach(u => {
            if (!seen.has(u.uid) && canReceiveFrom(u)) {
                seen.add(u.uid);
                merged.push(u);
            }
        });
        return merged;
    }, [query, suggestedUsers, searchResults, canReceiveFrom]);

    /* ── Toggle selection ────────────────────────────────────── */
    const toggleUser = useCallback((user) => {
        setSelected(prev =>
            prev.some(u => u.uid === user.uid)
                ? prev.filter(u => u.uid !== user.uid)
                : [...prev, user]
        );
    }, []);

    /* ── Send ────────────────────────────────────────────────── */
    const handleSend = async () => {
        if (!selectedUsers.length || sending) return;
        setSending(true);
        const toastId = toast.loading(
            `Надсилання до ${selectedUsers.length} ${selectedUsers.length === 1 ? 'отримувача' : 'отримувачів'}...`
        );
        try {
            const { sent, blocked } = await shareTrackToChats(
                currentUser.uid,
                selectedUsers.map(u => u.uid),
                track
            );
            if (blocked.length > 0 && sent.length === 0) {
                const names = blocked.map(b => b.displayName || `@${b.uid}`).join(', ');
                toast.error(`Не доставлено: ${names} не приймають повідомлення.`, { id: toastId, duration: 5000 });
                setSending(false);
                return;
            }
            if (blocked.length > 0) {
                const names = blocked.map(b => b.displayName || `@${b.uid}`).join(', ');
                toast.success(`Надіслано! Але ${names} не отримали — налаштування приватності.`, { id: toastId, duration: 5000 });
            } else {
                toast.success('Надіслано!', { id: toastId });
            }
            onClose();
        } catch (err) {
            toast.error(`Помилка: ${err.message}`, { id: toastId });
            setSending(false);
        }
    };

    /* ── Copy / native share ─────────────────────────────────── */
    const handleCopy = () => {
        navigator.clipboard.writeText(trackUrl);
        toast.success('Посилання скопійовано!');
    };
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${track?.title} — ${track?.authorName}`,
                    text: 'Послухай цей трек у Knitly!',
                    url: trackUrl,
                });
            } catch (_) { }
        } else {
            toast.error('Ваш браузер не підтримує цю функцію.');
        }
    };

    const hasSelected = selectedUsers.length > 0;
    const isLoading   = initialLoading || searching;

    /* ── Sections ────────────────────────────────────────────── */
    const renderSections = () => {
        if (isLoading && displayedUsers.length === 0) {
            return Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />);
        }
        if (!query.trim()) {
            return (
                <>
                    {displayedUsers.length > 0 && (
                        <p className="tsp-section-label">Підписки та чати</p>
                    )}
                    {displayedUsers.map(u => (
                        <UserRow
                            key={u.uid}
                            user={u}
                            selected={selectedUsers.some(s => s.uid === u.uid)}
                            onToggle={toggleUser}
                        />
                    ))}
                    {!isLoading && displayedUsers.length === 0 && (
                        <p className="tsp-empty">Починай підписуватись на людей, щоб ділитись музикою</p>
                    )}
                </>
            );
        }
        return (
            <>
                {searching && displayedUsers.length === 0 &&
                    Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                }
                {displayedUsers.map(u => (
                    <UserRow
                        key={u.uid}
                        user={u}
                        selected={selectedUsers.some(s => s.uid === u.uid)}
                        onToggle={toggleUser}
                    />
                ))}
                {!searching && displayedUsers.length === 0 && (
                    <p className="tsp-empty">Нікого не знайдено по «{query}»</p>
                )}
            </>
        );
    };

    /* ── Render ──────────────────────────────────────────────── */
    return (
        <div className="tsp-overlay" onClick={onClose}>
            <div className="tsp-panel" onClick={e => e.stopPropagation()}>

                {/* Drag handle */}
                <div className="tsp-drag-handle" />

                {/* Header */}
                <div className="tsp-header">
                    <button className="tsp-close-btn" onClick={onClose} aria-label="Закрити">
                        <CloseIcon />
                    </button>
                    <span className="tsp-header-title">Поділитись треком</span>
                    {hasSelected && (
                        <button
                            className="tsp-send-btn"
                            onClick={handleSend}
                            disabled={sending}
                        >
                            {sending ? '...' : `Надіслати${selectedUsers.length > 1 ? ` (${selectedUsers.length})` : ''}`}
                        </button>
                    )}
                </div>

                {/* Track mini-card */}
                {track && (
                    <div className="tsp-track-card">
                        <img
                            src={track.coverArtUrl || 'https://placehold.co/48x48/181818/333?text=K'}
                            alt={track.title}
                            className="tsp-track-cover"
                            onError={e => { e.target.src = 'https://placehold.co/48x48/181818/333?text=K'; }}
                        />
                        <div className="tsp-track-info">
                            <span className="tsp-track-title">{track.title}</span>
                            <span className="tsp-track-author">{track.authorName}</span>
                        </div>
                    </div>
                )}

                {/* Selected chips */}
                {hasSelected && (
                    <div className="tsp-chips">
                        {selectedUsers.map(u => (
                            <button key={u.uid} className="tsp-chip" onClick={() => toggleUser(u)}>
                                <img
                                    src={u.photoURL || default_picture}
                                    alt=""
                                    onError={e => { e.target.src = default_picture; }}
                                />
                                <span>{u.nickname || u.displayName}</span>
                                <ClearIcon />
                            </button>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="tsp-search-wrap">
                    <span className="tsp-search-icon"><SearchIcon /></span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="tsp-search-input"
                        placeholder="Пошук за ніком або іменем..."
                        value={query}
                        onChange={handleQueryChange}
                        autoFocus
                    />
                    {query && (
                        <button
                            className="tsp-search-clear"
                            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                        >
                            <ClearIcon />
                        </button>
                    )}
                </div>

                {/* User list */}
                <div className="tsp-list">
                    {renderSections()}
                </div>

                {/* Bottom actions */}
                <div className="tsp-bottom-actions">
                    <button className="tsp-action-btn" onClick={handleCopy}>
                        <CopyIcon />
                        <span>Скопіювати</span>
                    </button>
                    <button className="tsp-action-btn" onClick={handleNativeShare}>
                        <ExternalShareIcon />
                        <span>Поширити через...</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrackSharePanel;
