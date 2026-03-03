import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { markStoryViewed } from '../../services/storiesService';
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
    const holdTimer = useRef(null);

    const handlePointerDown = (e) => {
        holdTimer.current = setTimeout(() => {
            setPaused(true);
        }, 150);
    };

    const handlePointerUp = (e) => {
        clearTimeout(holdTimer.current);
        if (paused) {
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

    // ─── Keyboard ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNextStory();
            if (e.key === 'ArrowLeft') goPrevStory();
            if (e.key === ' ') setPaused(p => !p);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goNextStory, goPrevStory, onClose]);

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
                    onMouseDown={handlePointerDown}
                    onMouseUp={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchEnd={handlePointerUp}
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
            </div>
        </div>
    );
};

export default StoryViewer;
