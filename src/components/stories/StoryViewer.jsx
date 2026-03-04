import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { markStoryViewed, deleteStory } from '../../services/storiesService';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './StoryViewer.css';

const STORY_DURATION_MS = 5000; // 5s per story slide

/**
 * StoryViewer — fullscreen overlay viewer (Instagram/Telegram style).
 *
 * Props:
 *   groups              [{ uid, userNickname, userDisplayName, userPhotoURL, stories[] }]
 *   initialGroupIndex   number
 *   currentUserUid      string
 *   onClose             () => void
 *   onStoriesSeen       (storyIds: string[]) => void
 */
const StoryViewer = ({
    groups = [],
    initialGroupIndex = 0,
    currentUserUid,
    onClose,
    onStoriesSeen,
}) => {
    const navigate = useNavigate();

    const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
    const [storyIdx, setStoryIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [mediaLoaded, setMediaLoaded] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showViewersSheet, setShowViewersSheet] = useState(false);
    const [viewerProfiles, setViewerProfiles] = useState([]);
    const [loadingViewers, setLoadingViewers] = useState(false);

    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const elapsedRef = useRef(0);
    const videoRef = useRef(null);

    const currentGroup = groups[groupIdx];
    const currentStory = currentGroup?.stories?.[storyIdx];
    const totalStories = currentGroup?.stories?.length || 0;

    // ─── Mark viewed ─────────────────────────────────────────────────────────
    const seenInSession = useRef(new Set());

    useEffect(() => {
        if (currentStory?.id && !seenInSession.current.has(currentStory.id)) {
            seenInSession.current.add(currentStory.id);
            markStoryViewed(currentStory.id, currentUserUid);
            onStoriesSeen?.([currentStory.id]);
        }
    }, [currentStory?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Navigation helpers ───────────────────────────────────────────────────
    const goNextStory = useCallback(() => {
        if (storyIdx + 1 < totalStories) {
            setStoryIdx(s => s + 1);
            setProgress(0);
            elapsedRef.current = 0;
            setMediaLoaded(false);
        } else {
            // Move to next group
            if (groupIdx + 1 < groups.length) {
                setGroupIdx(g => g + 1);
                setStoryIdx(0);
                setProgress(0);
                elapsedRef.current = 0;
                setMediaLoaded(false);
            } else {
                onClose();
            }
        }
    }, [storyIdx, totalStories, groupIdx, groups.length, onClose]);

    const goPrevStory = useCallback(() => {
        if (storyIdx > 0) {
            setStoryIdx(s => s - 1);
        } else if (groupIdx > 0) {
            const prevGroup = groups[groupIdx - 1];
            setGroupIdx(g => g - 1);
            setStoryIdx((prevGroup?.stories?.length || 1) - 1);
        }
        setProgress(0);
        elapsedRef.current = 0;
        setMediaLoaded(false);
    }, [storyIdx, groupIdx, groups]);

    // ─── Progress timer ───────────────────────────────────────────────────────
    const startTimer = useCallback(() => {
        clearInterval(timerRef.current);
        startTimeRef.current = Date.now() - elapsedRef.current;

        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
            setProgress(pct);
            if (pct >= 100) {
                clearInterval(timerRef.current);
                goNextStory();
            }
        }, 50);
    }, [goNextStory]);

    const stopTimer = useCallback(() => {
        clearInterval(timerRef.current);
        elapsedRef.current = Date.now() - (startTimeRef.current || Date.now());
    }, []);

    // Start timer when media loads (photo) or on slide change for video
    useEffect(() => {
        if (!currentStory) return;
        if (currentStory.mediaType === 'video') {
            // For video, let the video element drive timing
            setProgress(0);
            elapsedRef.current = 0;
        } else {
            if (mediaLoaded && !paused) startTimer();
        }
        return () => clearInterval(timerRef.current);
    }, [currentStory?.id, mediaLoaded, paused]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pause / resume
    useEffect(() => {
        if (paused) {
            stopTimer();
            videoRef.current?.pause();
        } else {
            if (currentStory?.mediaType !== 'video') {
                if (mediaLoaded) startTimer();
            } else {
                videoRef.current?.play().catch(() => {});
            }
        }
    }, [paused]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Video progress sync ──────────────────────────────────────────────────
    const handleVideoTimeUpdate = () => {
        const v = videoRef.current;
        if (!v || !v.duration) return;
        const pct = (v.currentTime / v.duration) * 100;
        setProgress(pct);
    };

    const handleVideoEnded = () => {
        goNextStory();
    };

    const handleVideoLoaded = () => {
        setMediaLoaded(true);
        if (!paused) videoRef.current?.play().catch(() => {});
    };

    // ─── Touch / click: left half = prev, right half = next ─────────────────
    // Using Pointer Events API (onPointerDown/Up) instead of mixing
    // onMouseDown/Up + onTouchStart/End, which would fire twice on mobile.
    const holdTimer = useRef(null);
    const pointerDownX = useRef(null);
    const isHolding = useRef(false);

    const handlePointerDown = (e) => {
        pointerDownX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        isHolding.current = false;
        holdTimer.current = setTimeout(() => {
            isHolding.current = true;
            setPaused(true);
        }, 180);
    };

    const handlePointerUp = (e) => {
        clearTimeout(holdTimer.current);
        // If was holding → resume, don't navigate
        if (isHolding.current) {
            isHolding.current = false;
            setPaused(false);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0) - rect.left;
        if (x < rect.width / 2) {
            goPrevStory();
        } else {
            goNextStory();
        }
    };

    // ─── Pause timer when delete confirmation is open ─────────────────────────
    useEffect(() => {
        if (showDeleteConfirm) {
            stopTimer();
            videoRef.current?.pause();
        } else if (!paused) {
            if (currentStory?.mediaType !== 'video') {
                if (mediaLoaded) startTimer();
            } else {
                videoRef.current?.play().catch(() => {});
            }
        }
    }, [showDeleteConfirm]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Delete story ─────────────────────────────────────────────────────────
    const isOwnStory = currentGroup?.uid === currentUserUid;

    const handleDeleteConfirm = async () => {
        if (!currentStory?.id || deleting) return;
        setDeleting(true);
        try {
            await deleteStory(currentStory.id);
            setShowDeleteConfirm(false);
            if (totalStories > 1) {
                goNextStory();
            } else {
                onClose();
            }
        } catch (err) {
            console.error('[StoryViewer] delete error:', err);
            setDeleting(false);
        }
    };

    // ─── Viewers sheet ────────────────────────────────────────────────────────
    // Reset cached profiles when story changes
    useEffect(() => { setViewerProfiles([]); }, [currentStory?.id]);

    const openViewersSheet = async () => {
        setShowViewersSheet(true);
        const views = currentStory?.views || [];
        if (views.length === 0 || viewerProfiles.length > 0) return;
        setLoadingViewers(true);
        try {
            const profiles = await Promise.all(
                views.map(uid =>
                    getDoc(doc(db, 'users', uid)).then(snap =>
                        snap.exists() ? { uid, ...snap.data() } : { uid }
                    )
                )
            );
            setViewerProfiles(profiles.filter(Boolean));
        } catch (e) {
            console.warn('[StoryViewer] could not load viewer profiles', e);
        } finally {
            setLoadingViewers(false);
        }
    };

    // ─── Keyboard ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                if (showDeleteConfirm) { setShowDeleteConfirm(false); return; }
                onClose();
            }
            if (showDeleteConfirm) return; // block navigation when confirm open
            if (e.key === 'ArrowRight') goNextStory();
            if (e.key === 'ArrowLeft') goPrevStory();
            if (e.key === ' ') setPaused(p => !p);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goNextStory, goPrevStory, onClose, showDeleteConfirm]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Format time left ─────────────────────────────────────────────────────
    const formatRelative = (ts) => {
        if (!ts) return '';
        const ms = ts.toMillis?.() ?? 0;
        const diff = Date.now() - ms;
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        if (mins < 1) return 'щойно';
        if (hrs < 1) return `${mins}хв тому`;
        if (hrs < 24) return `${hrs}год тому`;
        return `${Math.floor(hrs / 24)}д тому`;
    };

    if (!currentGroup || !currentStory) return null;

    return (
        <div className="sv-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="sv-container">
                {/* ─── Progress bars ───────────────────────────────────── */}
                <div className="sv-progress-bars">
                    {currentGroup.stories.map((s, i) => (
                        <div key={s.id} className="sv-progress-track">
                            <div
                                className="sv-progress-fill"
                                style={{
                                    width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
                                    transition: i === storyIdx ? 'none' : undefined,
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* ─── Top bar ─────────────────────────────────────────── */}
                <div className="sv-topbar">
                    <button
                        className="sv-user-info"
                        onClick={() => { onClose(); navigate(`/${currentGroup.userNickname}`); }}
                        aria-label={`Профіль ${currentGroup.userDisplayName}`}
                    >
                        <img
                            src={currentGroup.userPhotoURL || default_picture}
                            alt={currentGroup.userDisplayName}
                            className="sv-avatar"
                            onError={(e) => { e.target.onerror = null; e.target.src = default_picture; }}
                        />
                        <div className="sv-user-text">
                            <span className="sv-user-name">{currentGroup.userDisplayName || currentGroup.userNickname}</span>
                            <span className="sv-user-time">{formatRelative(currentStory.createdAt)}</span>
                        </div>
                    </button>

                    <div className="sv-topbar-actions">
                        {/* Pause / play */}
                        <button
                            className="sv-icon-btn"
                            onClick={() => setPaused(p => !p)}
                            aria-label={paused ? 'Відновити' : 'Пауза'}
                        >
                            {paused ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            )}
                        </button>
                        {/* Delete — only for own stories */}
                        {isOwnStory && (
                            <button
                                className="sv-icon-btn sv-icon-btn--danger"
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                                aria-label="Видалити сторіс"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6M14 11v6" />
                                    <path d="M9 6V4h6v2" />
                                </svg>
                            </button>
                        )}
                        {/* Close */}
                        <button className="sv-icon-btn" onClick={onClose} aria-label="Закрити">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ─── Media area (tap zones) ───────────────────────────── */}
                <div
                    className="sv-media-area"
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                >
                    {/* Left tap zone label */}
                    <div className="sv-tap-hint sv-tap-hint--left">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.5">
                            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        </svg>
                    </div>

                    {/* Media */}
                    {currentStory.mediaType === 'photo' ? (
                        <img
                            key={currentStory.id}
                            src={currentStory.mediaUrl}
                            alt={currentStory.caption || 'Story'}
                            className="sv-media sv-media--photo"
                            onLoad={() => setMediaLoaded(true)}
                            draggable={false}
                        />
                    ) : (
                        <video
                            key={currentStory.id}
                            ref={videoRef}
                            src={currentStory.mediaUrl}
                            className="sv-media sv-media--video"
                            playsInline
                            muted={false}
                            onLoadedData={handleVideoLoaded}
                            onTimeUpdate={handleVideoTimeUpdate}
                            onEnded={handleVideoEnded}
                        />
                    )}

                    {/* Caption overlay */}
                    {currentStory.caption && (
                        <div className="sv-caption">{currentStory.caption}</div>
                    )}

                    {/* Right tap zone label */}
                    <div className="sv-tap-hint sv-tap-hint--right">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.5">
                            <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        </svg>
                    </div>
                </div>

                {/* ─── Viewers bar — only for own stories ──────────────── */}
                {isOwnStory && (
                    <button
                        className="sv-viewers-bar"
                        onClick={(e) => { e.stopPropagation(); openViewersSheet(); }}
                        aria-label="Хто переглянув"
                    >
                        <div className="sv-viewers-avatars">
                            {(currentStory.views || []).slice(0, 3).map((uid, i) => {
                                const p = viewerProfiles.find(x => x.uid === uid);
                                return (
                                    <img
                                        key={uid}
                                        src={p?.photoURL || default_picture}
                                        alt=""
                                        className="sv-viewers-avatar"
                                        style={{ zIndex: 3 - i, marginLeft: i > 0 ? '-8px' : 0 }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = default_picture; }}
                                    />
                                );
                            })}
                        </div>
                        <span className="sv-viewers-count">
                            {(currentStory.views || []).length > 0
                                ? `${(currentStory.views || []).length} ${(currentStory.views || []).length === 1 ? 'перегляд' : 'переглядів'}`
                                : 'Ще немає переглядів'}
                        </span>
                        <svg className="sv-viewers-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                )}

                {/* ─── Group navigation arrows (outside viewport) ───────── */}
                {groupIdx > 0 && (
                    <button className="sv-group-nav sv-group-nav--prev" onClick={goPrevStory} aria-label="Попередній користувач">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
                {groupIdx < groups.length - 1 && (
                    <button className="sv-group-nav sv-group-nav--next" onClick={goNextStory} aria-label="Наступний користувач">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                        </svg>
                    </button>
                )}

                {/* ─── Delete confirmation sheet ────────────────────────── */}
                {showDeleteConfirm && (
                    <div className="sv-sheet-backdrop" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="sv-sheet sv-delete-sheet" onClick={e => e.stopPropagation()}>
                            <div className="sv-sheet-handle" />
                            <p className="sv-sheet-title">Видалити цей сторіс?</p>
                            <p className="sv-sheet-sub">Його буде видалено назавжди без можливості відновлення</p>
                            <button
                                className="sv-sheet-btn sv-sheet-btn--danger"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                            >
                                {deleting ? 'Видаляємо...' : 'Видалити'}
                            </button>
                            <button
                                className="sv-sheet-btn sv-sheet-btn--cancel"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                            >
                                Скасувати
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Viewers sheet ────────────────────────────────────── */}
                {showViewersSheet && (
                    <div className="sv-sheet-backdrop" onClick={() => setShowViewersSheet(false)}>
                        <div className="sv-sheet sv-viewers-sheet" onClick={e => e.stopPropagation()}>
                            <div className="sv-sheet-handle" />
                            <p className="sv-sheet-title">
                                Переглянули
                                {(currentStory.views || []).length > 0 && (
                                    <span className="sv-sheet-count"> · {(currentStory.views || []).length}</span>
                                )}
                            </p>
                            <div className="sv-viewers-list">
                                {loadingViewers && (
                                    <div className="sv-viewers-loading">
                                        <div className="sv-viewers-spinner" />
                                    </div>
                                )}
                                {!loadingViewers && (currentStory.views || []).length === 0 && (
                                    <p className="sv-viewers-empty">Ще ніхто не переглянув цей сторіс</p>
                                )}
                                {!loadingViewers && viewerProfiles.map((profile, i) => (
                                    <button
                                        key={profile.uid}
                                        className="sv-viewer-item"
                                        style={{ animationDelay: `${i * 40}ms` }}
                                        onClick={() => { setShowViewersSheet(false); onClose(); navigate(`/${profile.nickname || profile.uid}`); }}
                                    >
                                        <img
                                            src={profile.photoURL || default_picture}
                                            alt={profile.displayName || ''}
                                            className="sv-viewer-item-avatar"
                                            onError={(e) => { e.target.onerror = null; e.target.src = default_picture; }}
                                        />
                                        <div className="sv-viewer-item-info">
                                            <span className="sv-viewer-item-name">{profile.displayName || profile.nickname || 'Користувач'}</span>
                                            {profile.nickname && <span className="sv-viewer-item-nick">@{profile.nickname}</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoryViewer;
