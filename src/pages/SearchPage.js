import React, { useState, useRef, useMemo } from 'react';
import { useQuery } from 'react-query';
import { db } from '../services/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import TrackList from '../components/common/TrackList';
import { Link } from 'react-router-dom';
import default_picture from '../img/Default-Images/default-picture.svg';
import VerifiedBadge from '../components/common/VerifiedBadge';
import './SearchPage.css';

/* ── Icons ─────────────────────────────────────────────────── */
const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const MusicIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
);
const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const MicIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);
const SparkleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
);
const TagIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
);

/* ── Multilingual Tag Synonyms ──────────────────────────────
   Canonical EN tag → all aliases (EN variants + UA + abbreviations)
   ─────────────────────────────────────────────────────────── */
const TAG_SYNONYMS = {
    'rap': ['rap', 'рап', 'реп'],
    'hiphop': ['hiphop', 'hip-hop', 'hip hop', 'хіп-хоп', 'хіпхоп', 'хіп хоп', 'хіп'],
    'pop': ['pop', 'поп'],
    'rock': ['rock', 'рок'],
    'electronic': ['electronic', 'electro', 'електронна', 'електроніка', 'електро'],
    'indie': ['indie', 'інді'],
    'alternative': ['alternative', 'alt', 'альтернатива', 'альт'],
    'phonk': ['phonk', 'фонк', 'fonk', 'фонкі'],
    'lofi': ['lofi', 'lo-fi', 'lo fi', 'лофай', 'лоу-фай'],
    'chill': ['chill', 'чіл', 'чилаут', 'chillout'],
    'jazz': ['jazz', 'джаз'],
    'classical': ['classical', 'classic', 'класика', 'класична'],
    'folk': ['folk', 'фолк'],
    'metal': ['metal', 'метал'],
    'punk': ['punk', 'панк'],
    'reggae': ['reggae', 'регі', 'реге'],
    'funk': ['funk', 'фанк'],
    'soul': ['soul', 'соул'],
    'rnb': ['rnb', 'r&b', 'ар-ен-бі', 'r n b'],
    'blues': ['blues', 'блюз'],
    'ambient': ['ambient', 'амбієнт'],
    'synthwave': ['synthwave', 'синтвейв', 'retrowave', 'ретровейв', '80s', '90s'],
    'underground': ['underground', 'андерграунд', 'андер', 'ундерграунд', 'undergrnd'],
    'trap': ['trap', 'треп'],
    'drill': ['drill', 'дрілл', 'дрил'],
    'acoustic': ['acoustic', 'акустика', 'акустична'],
    'instrumental': ['instrumental', 'інструментальна', 'інструментал'],
    'sad': ['sad', 'сумна', 'сум'],
    'happy': ['happy', 'весела', 'радість'],
    'energetic': ['energetic', 'енергійна', 'драйв'],
    'love': ['love', 'кохання', 'любов'],
    'summer': ['summer', 'літо', 'літня'],
    'winter': ['winter', 'зима', 'зимова'],
    'ukrainian': ['ukrainian', 'українська', 'укр', 'ukraine', 'ukrainian-music'],
    'cover': ['cover', 'кавер'],
    'remix': ['remix', 'ремікс'],
};

/**
 * findTagsByPrefix — prefix-aware multilingual tag resolver.
 * Returns an array of canonical EN tags whose aliases:
 *   a) exactly match the input, OR
 *   b) start with the input (prefix, min 2 chars)
 * Example: "ph" → ['phonk'], "хіп" → ['hiphop'], "андер" → ['underground']
 */
const findTagsByPrefix = (input) => {
    const clean = input.toLowerCase().trim().replace(/^#/, '');
    if (!clean) return [];
    const matches = new Set();
    for (const [canonical, aliases] of Object.entries(TAG_SYNONYMS)) {
        for (const alias of aliases) {
            // Exact match always works
            if (alias === clean) { matches.add(canonical); break; }
            // Prefix match — require at least 2 chars to avoid noise
            if (clean.length >= 2 && alias.startsWith(clean)) { matches.add(canonical); break; }
        }
    }
    return Array.from(matches);
};

/* ── Levenshtein distance ───────────────────────────────────── */
const levenshteinDistance = (a, b) => {
    const m = a.length, n = b.length;
    // Build DP table row by row (memory-efficient single row variant)
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
        const curr = [i];
        for (let j = 1; j <= n; j++) {
            curr[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
        }
        prev = curr;
    }
    return prev[n];
};

/**
 * findFuzzyTagSuggestions — typo-tolerant suggestions.
 * Returns canonical tags closest to the input (by edit distance),
 * excluding any already matched by prefix.
 * e.g. "Phomk" → ['phonk'], "Ponk" → ['phonk', 'punk']
 */
const findFuzzyTagSuggestions = (input) => {
    const clean = input.toLowerCase().trim().replace(/^#/, '');
    if (clean.length < 3) return [];

    // Skip if prefix already matched — no need for fuzzy
    const prefixMatches = findTagsByPrefix(clean);

    // Threshold scales with word length: short words need closer match
    const threshold = clean.length <= 4 ? 1 : 2;
    const scored = [];

    for (const [canonical, aliases] of Object.entries(TAG_SYNONYMS)) {
        if (prefixMatches.includes(canonical)) continue; // already found

        let minDist = Infinity;
        for (const alias of aliases) {
            // Skip aliases that are too different in length to match
            if (Math.abs(alias.length - clean.length) > threshold + 1) continue;
            const dist = levenshteinDistance(clean, alias);
            if (dist < minDist) minDist = dist;
        }
        if (minDist <= threshold) scored.push({ canonical, dist: minDist });
    }

    return scored
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3)
        .map(s => s.canonical);
};

/* ── Firebase search ────────────────────────────────────────── */
const searchAll = async (term) => {
    if (!term) return { tracks: [], artists: [], users: [] };

    const lower = term.toLowerCase().trim();
    const cleanLower = lower.replace(/^#/, ''); // strip leading #
    const end = cleanLower + '\uf8ff';

    // Run title + user queries in parallel with tag search
    const [tracksSnap, byNickname, byDisplayName] = await Promise.all([
        getDocs(query(collection(db, 'tracks'), where('title_lowercase', '>=', cleanLower), where('title_lowercase', '<=', end), limit(10))),
        getDocs(query(collection(db, 'users'), where('nickname', '>=', cleanLower), where('nickname', '<=', end), limit(10))),
        getDocs(query(collection(db, 'users'), where('displayName_lowercase', '>=', cleanLower), where('displayName_lowercase', '<=', end), limit(10))),
    ]);

    // Tag search — prefix-aware multilingual, uses array-contains-any for multiple possible tags
    let tagTracks = [];
    try {
        const matchingTags = findTagsByPrefix(cleanLower);
        if (matchingTags.length > 0) {
            const tagStrings = matchingTags.map(t => `#${t}`);
            const tagQuery = tagStrings.length === 1
                ? query(collection(db, 'tracks'), where('tags_search', 'array-contains', tagStrings[0]), limit(15))
                : query(collection(db, 'tracks'), where('tags_search', 'array-contains-any', tagStrings.slice(0, 10)), limit(15));
            const tagSnap = await getDocs(tagQuery);
            tagTracks = tagSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
    } catch (e) {
        console.warn('[Search] Tag search skipped:', e.message);
    }


    // Merge title results + tag results (deduplicate by id)
    const tracksMap = new Map();
    tracksSnap.docs.forEach(d => tracksMap.set(d.id, { id: d.id, ...d.data() }));
    tagTracks.forEach(t => { if (!tracksMap.has(t.id)) tracksMap.set(t.id, t); });
    const tracks = Array.from(tracksMap.values());

    // Merge user results
    const usersMap = new Map();
    byNickname.docs.forEach(d => usersMap.set(d.id, { id: d.id, ...d.data() }));
    byDisplayName.docs.forEach(d => { if (!usersMap.has(d.id)) usersMap.set(d.id, { id: d.id, ...d.data() }); });
    const allUsers = Array.from(usersMap.values());

    return {
        tracks,
        artists: allUsers.filter(u => u.tracksCount > 0),
        users: allUsers.filter(u => !u.tracksCount || u.tracksCount === 0),
    };
};

/* ── Genre chips — each has UA label + canonical EN tag ─────── */
const GENRES = [
    { label: 'Поп', tag: 'pop', emoji: '🎵' },
    { label: 'Хіп-хоп', tag: 'hiphop', emoji: '🎤' },
    { label: 'Рок', tag: 'rock', emoji: '🎸' },
    { label: 'Электронна', tag: 'electronic', emoji: '🎛️' },
    { label: 'Phonk', tag: 'phonk', emoji: '🌙' },
    { label: 'Trap', tag: 'trap', emoji: '🎯' },
    { label: 'Рап', tag: 'rap', emoji: '🎙️' },
    { label: 'Lo-Fi', tag: 'lofi', emoji: '☕' },
    { label: 'Indie', tag: 'indie', emoji: '🎨' },
    { label: 'Джаз', tag: 'jazz', emoji: '🎷' },
    { label: 'Класика', tag: 'classical', emoji: '🎻' },
    { label: 'Фолк', tag: 'folk', emoji: '🪕' },
    { label: 'Альтернатива', tag: 'alternative', emoji: '🔊' },
    { label: 'Метал', tag: 'metal', emoji: '⚡' },
    { label: 'R&B', tag: 'rnb', emoji: '🎶' },
    { label: 'Українська', tag: 'ukrainian', emoji: '🇺🇦' },
];

/* ── Skeleton loader ───────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="sp-skeleton-card">
        <div className="sp-skeleton-avatar" />
        <div className="sp-skeleton-line sp-skeleton-line--name" />
        <div className="sp-skeleton-line sp-skeleton-line--sub" />
    </div>
);
const SkeletonRow = () => (
    <div className="sp-skeleton-row">
        <div className="sp-skeleton-avatar sp-skeleton-avatar--sm" />
        <div className="sp-skeleton-text">
            <div className="sp-skeleton-line sp-skeleton-line--name" />
            <div className="sp-skeleton-line sp-skeleton-line--sub" />
        </div>
    </div>
);

/* ── Artist card ───────────────────────────────────────────── */
const ArtistCard = ({ user }) => (
    <Link to={`/${user.nickname}`} className="sp-artist-card">
        <div className="sp-artist-card__avatar-wrap">
            <img src={user.photoURL || default_picture} alt={user.displayName} className="sp-artist-card__avatar" />
            <span className="sp-artist-card__ring" aria-hidden="true" />
        </div>
        <p className="sp-artist-card__name">
            {user.displayName}
            {user.roles?.includes('verified') && <VerifiedBadge size="xs" />}
        </p>
        <span className="sp-artist-card__nick">@{user.nickname}</span>
        {user.tracksCount > 0 && (
            <span className="sp-artist-card__tracks">
                <MicIcon /> {user.tracksCount} {user.tracksCount === 1 ? 'трек' : 'треків'}
            </span>
        )}
    </Link>
);

/* ── User row (compact) ─────────────────────────────────────── */
const UserRow = ({ user }) => (
    <Link to={`/${user.nickname}`} className="sp-user-row">
        <img src={user.photoURL || default_picture} alt={user.displayName} className="sp-user-row__avatar" />
        <div className="sp-user-row__info">
            <span className="sp-user-row__name">
                {user.displayName}
                {user.roles?.includes('verified') && <VerifiedBadge size="xs" />}
            </span>
            <span className="sp-user-row__nick">@{user.nickname}</span>
        </div>
    </Link>
);

/* ── Main Component ─────────────────────────────────────────── */
const SearchPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [debouncedTerm] = useDebounce(searchTerm, 450);
    const inputRef = useRef(null);

    const { data: results, isLoading } = useQuery(
        ['search', debouncedTerm],
        () => searchAll(debouncedTerm),
        { enabled: !!debouncedTerm }
    );

    const hasResults = results && (results.tracks.length + results.artists.length + results.users.length) > 0;
    const isEmpty = !!debouncedTerm && !isLoading && !hasResults;

    const tabCounts = results
        ? { tracks: results.tracks.length, artists: results.artists.length, users: results.users.length }
        : { tracks: 0, artists: 0, users: 0 };

    const TABS = [
        { key: 'all', label: 'Все' },
        { key: 'tracks', label: 'Треки', count: tabCounts.tracks },
        { key: 'artists', label: 'Артисти', count: tabCounts.artists },
        { key: 'users', label: 'Слухачі', count: tabCounts.users },
    ];

    const handleClear = () => {
        setSearchTerm('');
        inputRef.current?.focus();
    };

    /** Clicking a genre chip sets searchTerm to "#canonical_tag" */
    const handleGenreClick = (tag) => {
        setSearchTerm(`#${tag}`);
        inputRef.current?.focus();
    };

    /** Fuzzy suggestions — only computed after debounce, min 3 chars */
    const fuzzyTagSuggestions = useMemo(() => {
        if (!debouncedTerm || debouncedTerm.replace(/^#/, '').length < 3) return [];
        return findFuzzyTagSuggestions(debouncedTerm);
    }, [debouncedTerm]);

    /** Show "did you mean" when no prefix match but fuzzy suggestions exist */
    const showDidYouMean = !isLoading && fuzzyTagSuggestions.length > 0 && debouncedTerm.length >= 3;

    return (
        <div className="sp-page">

            {/* ── HERO ── */}
            <div className="sp-hero">
                <span className="sp-hero-glow sp-hero-glow--purple" aria-hidden="true" />
                <span className="sp-hero-glow sp-hero-glow--blue" aria-hidden="true" />

                <div className="sp-hero-inner">
                    <div className="sp-input-wrap">
                        <span className="sp-input-icon"><SearchIcon /></span>
                        <input
                            ref={inputRef}
                            className="sp-input"
                            type="text"
                            placeholder="Пошук треків, артистів, #тегів..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                            autoComplete="off"
                        />
                        {searchTerm && (
                            <button className="sp-input-clear" onClick={handleClear} aria-label="Очистити">
                                <CloseIcon />
                            </button>
                        )}
                    </div>
                    {/* Hint — shown when term starts with # */}
                    {searchTerm.startsWith('#') && (
                        <p className="sp-input-hint">
                            <TagIcon />
                            Пошук за тегом · також підтримуються <strong>українські</strong> назви жанрів
                        </p>
                    )}
                    {/* Did You Mean — fuzzy suggestions for typos */}
                    {showDidYouMean && (
                        <div className="sp-did-you-mean">
                            <span className="sp-did-you-mean__label">Можливо ви мали на увазі:</span>
                            {fuzzyTagSuggestions.map(tag => (
                                <button
                                    key={tag}
                                    className="sp-did-you-mean__pill"
                                    onClick={() => handleGenreClick(tag)}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="sp-body">

                {/* ── IDLE STATE ── */}
                {!searchTerm && (
                    <div className="sp-idle">
                        <section className="sp-section">
                            <h2 className="sp-section-title">
                                <SparkleIcon /> Жанри
                            </h2>
                            <div className="sp-genre-chips">
                                {GENRES.map(g => (
                                    <button
                                        key={g.tag}
                                        className="sp-genre-chip"
                                        onClick={() => handleGenreClick(g.tag)}
                                    >
                                        <span>{g.emoji}</span> {g.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="sp-section">
                            <h2 className="sp-section-title">
                                <MusicIcon /> Популярне
                            </h2>
                            <div className="sp-popular-grid">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="sp-popular-card sp-popular-card--dim">
                                        <div className="sp-popular-card__cover" />
                                        <div className="sp-popular-card__info">
                                            <span className="sp-popular-card__title">—</span>
                                            <span className="sp-popular-card__artist">—</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* ── LOADING ── */}
                {isLoading && (
                    <div className="sp-loading">
                        <div className="sp-section">
                            <div className="sp-skeleton-section-title" />
                            <div className="sp-skeleton-grid">
                                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        </div>
                        <div className="sp-section">
                            <div className="sp-skeleton-section-title" />
                            {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
                        </div>
                    </div>
                )}

                {/* ── EMPTY STATE ── */}
                {isEmpty && (
                    <div className="sp-empty">
                        <div className="sp-empty__icon"><SearchIcon /></div>
                        <h3 className="sp-empty__title">Нічого не знайдено</h3>
                        <p className="sp-empty__desc">
                            За запитом <strong>"{debouncedTerm}"</strong> результатів немає.
                            Спробуй інший тег або назву.
                        </p>
                    </div>
                )}

                {/* ── RESULTS ── */}
                {hasResults && (
                    <div className="sp-results">
                        {/* Filter tabs */}
                        <div className="sp-tabs">
                            {TABS.filter(t => t.key === 'all' || tabCounts[t.key] > 0).map(tab => (
                                <button
                                    key={tab.key}
                                    className={`sp-tab${activeTab === tab.key ? ' sp-tab--active' : ''}`}
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    {tab.label}
                                    {tab.count > 0 && <span className="sp-tab__badge">{tab.count}</span>}
                                </button>
                            ))}
                        </div>

                        {/* Tracks */}
                        {(activeTab === 'all' || activeTab === 'tracks') && results.tracks.length > 0 && (
                            <section className="sp-section">
                                <h2 className="sp-section-title"><MusicIcon /> Треки</h2>
                                <div className="sp-track-list-wrap">
                                    <TrackList initialTracks={results.tracks} isLoading={false} />
                                </div>
                            </section>
                        )}

                        {/* Artists */}
                        {(activeTab === 'all' || activeTab === 'artists') && results.artists.length > 0 && (
                            <section className="sp-section">
                                <h2 className="sp-section-title"><MicIcon /> Артисти</h2>
                                <div className="sp-artist-grid">
                                    {results.artists.map(a => <ArtistCard key={a.id} user={a} />)}
                                </div>
                            </section>
                        )}

                        {/* Users */}
                        {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                            <section className="sp-section">
                                <h2 className="sp-section-title"><UsersIcon /> Слухачі</h2>
                                <div className="sp-user-list">
                                    {results.users.map(u => <UserRow key={u.id} user={u} />)}
                                </div>
                            </section>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default SearchPage;