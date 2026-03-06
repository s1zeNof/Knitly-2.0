import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './ShareModal.css';
import { useUserContext } from '../../contexts/UserContext';
import { searchUsers, getUsersFromRecentChats, getFollowing, sharePostToChats } from '../../services/firebase';
import toast from 'react-hot-toast';
import default_picture from '../../img/Default-Images/default-picture.svg';

/* ── Icons ───────────────────────────────────────────────────────────────── */
const BackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
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

/* ── User row ─────────────────────────────────────────────────────────────── */
const UserRow = ({ user, selected, onToggle }) => (
    <button
        className={`sp-user-row${selected ? ' sp-user-row--selected' : ''}`}
        onClick={() => onToggle(user)}
        type="button"
    >
        <img
            src={user.photoURL || default_picture}
            alt={user.displayName || user.nickname}
            className="sp-user-avatar"
            onError={e => { e.target.onerror = null; e.target.src = default_picture; }}
        />
        <div className="sp-user-info">
            <span className="sp-user-name">{user.displayName || user.nickname || 'Користувач'}</span>
            {user.nickname && <span className="sp-user-nick">@{user.nickname}</span>}
        </div>
        <span className={`sp-user-check${selected ? ' sp-user-check--on' : ''}`}>
            {selected && <CheckIcon />}
        </span>
    </button>
);

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
const SkeletonRow = () => (
    <div className="sp-skeleton-row">
        <div className="sp-skeleton-avatar" />
        <div className="sp-skeleton-body">
            <div className="sp-skeleton-line long" />
            <div className="sp-skeleton-line short" />
        </div>
    </div>
);

/* ── Main component ───────────────────────────────────────────────────────── */
const ShareModal = ({ post, onClose }) => {
    const { user: currentUser } = useUserContext();
    const postUrl = `${window.location.origin}/post/${post?.id}`;

    // ─── State ────────────────────────────────────────────────────────────
    const [query, setQuery] = useState('');
    const [suggestedUsers, setSuggestedUsers] = useState([]); // following + recent chats
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [sending, setSending] = useState(false);

    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // ─── Load suggested users on mount ───────────────────────────────────
    useEffect(() => {
        if (!currentUser) return;
        (async () => {
            const [following, recent] = await Promise.all([
                getFollowing(currentUser.uid),
                getUsersFromRecentChats(currentUser.uid),
            ]);
            const map = new Map();
            recent.forEach(u => map.set(u.uid, u));
            following.forEach(u => map.set(u.uid, u));
            map.delete(currentUser.uid);
            setSuggestedUsers(Array.from(map.values()));
            setInitialLoading(false);
        })();
    }, [currentUser]);

    // ─── Debounced search ─────────────────────────────────────────────────
    const handleQueryChange = useCallback((e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);

        if (!val.trim()) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        debounceRef.current = setTimeout(async () => {
            const results = await searchUsers(val.trim(), currentUser?.uid);
            setSearchResults(results);
            setSearching(false);
        }, 350);
    }, [currentUser?.uid]);

    // ─── Displayed list ───────────────────────────────────────────────────
    // When there's a query: show search results merged with client-side filter of suggested
    const displayedUsers = useMemo(() => {
        if (!query.trim()) return suggestedUsers;
        const q = query.trim().toLowerCase();
        const clientFiltered = suggestedUsers.filter(u =>
            u.nickname?.toLowerCase().startsWith(q) ||
            u.displayName?.toLowerCase().startsWith(q)
        );
        // Merge: client filtered first, then server results (dedup)
        const seen = new Set(clientFiltered.map(u => u.uid));
        const merged = [...clientFiltered];
        searchResults.forEach(u => { if (!seen.has(u.uid)) { seen.add(u.uid); merged.push(u); } });
        return merged;
    }, [query, suggestedUsers, searchResults]);

    // ─── Toggle selection ─────────────────────────────────────────────────
    const toggleUser = useCallback((user) => {
        setSelectedUsers(prev =>
            prev.some(u => u.uid === user.uid)
                ? prev.filter(u => u.uid !== user.uid)
                : [...prev, user]
        );
    }, []);

    // ─── Send ─────────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!selectedUsers.length || sending) return;
        setSending(true);
        const toastId = toast.loading(`Надсилання до ${selectedUsers.length} ${selectedUsers.length === 1 ? 'отримувача' : 'отримувачів'}...`);
        try {
            const { sent, blocked } = await sharePostToChats(currentUser.uid, selectedUsers.map(u => u.uid), post);

            if (blocked.length > 0 && sent.length === 0) {
                const names = blocked.map(b => b.displayName || `@${b.uid}`).join(', ');
                toast.error(`Не доставлено: ${names} не приймають повідомлення від незнайомців.`, { id: toastId, duration: 5000 });
                setSending(false);
                return;
            }
            if (blocked.length > 0) {
                const names = blocked.map(b => b.displayName || `@${b.uid}`).join(', ');
                toast.success(`Надіслано! Але ${names} не отримали — обмежені налаштуваннями приватності.`, { id: toastId, duration: 5000 });
            } else {
                toast.success('Надіслано!', { id: toastId });
            }
            onClose();
        } catch (err) {
            toast.error(`Помилка: ${err.message}`, { id: toastId });
            setSending(false);
        }
    };

    // ─── Copy / native share ──────────────────────────────────────────────
    const handleCopy = () => {
        navigator.clipboard.writeText(postUrl);
        toast.success('Посилання скопійовано!');
    };
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Допис від @${post?.authors?.[0]?.nickname || '...'}`,
                    text: 'Поглянь на цей допис у Knitly!',
                    url: postUrl,
                });
            } catch (_) { }
        } else {
            toast.error('Ваш браузер не підтримує цю функцію.');
        }
    };

    const hasSelected = selectedUsers.length > 0;
    const isLoading = initialLoading || searching;

    /* ── Section grouping ─────────────────────────────────────────────────── */
    const renderSections = () => {
        if (isLoading && displayedUsers.length === 0) {
            return Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />);
        }
        if (!query.trim()) {
            // Split into recent chats section (all suggested for now)
            return (
                <>
                    {displayedUsers.length > 0 && (
                        <p className="sp-section-label">Підписки та чати</p>
                    )}
                    {displayedUsers.map(u => (
                        <UserRow key={u.uid} user={u} selected={selectedUsers.some(s => s.uid === u.uid)} onToggle={toggleUser} />
                    ))}
                    {!isLoading && displayedUsers.length === 0 && (
                        <p className="sp-empty">Починай підписуватись на людей, щоб ділитись постами</p>
                    )}
                </>
            );
        }
        // Search mode
        return (
            <>
                {searching && displayedUsers.length === 0 && (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                )}
                {displayedUsers.map(u => (
                    <UserRow key={u.uid} user={u} selected={selectedUsers.some(s => s.uid === u.uid)} onToggle={toggleUser} />
                ))}
                {!searching && displayedUsers.length === 0 && (
                    <p className="sp-empty">Нікого не знайдено по запиту «{query}»</p>
                )}
            </>
        );
    };

    return (
        <div className="sp-overlay" onClick={onClose}>
            <div className="sp-panel" onClick={e => e.stopPropagation()}>
                {/* Drag handle */}
                <div className="sp-drag-handle" />

                {/* Header */}
                <div className="sp-header">
                    <button className="sp-back-btn" onClick={onClose} aria-label="Назад">
                        <BackIcon />
                    </button>
                    <span className="sp-header-title">Переслати до...</span>
                    {hasSelected && (
                        <button
                            className="sp-send-btn"
                            onClick={handleSend}
                            disabled={sending}
                        >
                            {sending ? '...' : `Надіслати${selectedUsers.length > 1 ? ` (${selectedUsers.length})` : ''}`}
                        </button>
                    )}
                </div>

                {/* Selected chips */}
                {hasSelected && (
                    <div className="sp-chips">
                        {selectedUsers.map(u => (
                            <button key={u.uid} className="sp-chip" onClick={() => toggleUser(u)}>
                                <img src={u.photoURL || default_picture} alt="" onError={e => { e.target.src = default_picture; }} />
                                <span>{u.nickname || u.displayName}</span>
                                <ClearIcon />
                            </button>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="sp-search-wrap">
                    <span className="sp-search-icon"><SearchIcon /></span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="sp-search-input"
                        placeholder="Пошук за ніком або іменем..."
                        value={query}
                        onChange={handleQueryChange}
                        autoFocus
                    />
                    {query && (
                        <button className="sp-search-clear" onClick={() => { setQuery(''); setSearchResults([]); inputRef.current?.focus(); }}>
                            <ClearIcon />
                        </button>
                    )}
                </div>

                {/* User list */}
                <div className="sp-list">
                    {renderSections()}
                </div>

                {/* Bottom actions */}
                <div className="sp-bottom-actions">
                    <button className="sp-action-btn" onClick={handleCopy}>
                        <CopyIcon />
                        <span>Скопіювати</span>
                    </button>
                    <button className="sp-action-btn" onClick={handleNativeShare}>
                        <ExternalShareIcon />
                        <span>Поширити через...</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;