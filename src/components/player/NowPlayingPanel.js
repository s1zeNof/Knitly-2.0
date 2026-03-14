import React, { useState, useRef, useCallback } from 'react';
import { usePlayerContext, usePlayerTime } from '../../contexts/PlayerContext';
import { useUserContext } from '../../contexts/UserContext';
import { db } from '../../services/firebase';
import { doc, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
import DynamicWaveform from './DynamicWaveform';
import AudioVisualizer from './AudioVisualizer';
import TrackComments from './TrackComments';
import TrackSharePanel from './TrackSharePanel';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './NowPlayingPanel.css';

/* ── Icons ───────────────────────────────────────────────────── */
const ChevronDownIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 9l6 6 6-6" />
    </svg>
);
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);
const PlayIcon = () => (
    <svg height="36" width="36" viewBox="0 0 24 24">
        <path fill="currentColor" d="M8 5v14l11-7z" />
    </svg>
);
const PauseIcon = () => (
    <svg height="36" width="36" viewBox="0 0 24 24">
        <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);
const NextIcon = () => (
    <svg height="28" width="28" viewBox="0 0 24 24">
        <path fill="currentColor" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
);
const PrevIcon = () => (
    <svg height="28" width="28" viewBox="0 0 24 24">
        <path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
);
const HeartIcon = () => (
    <svg viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);
const CommentIcon = () => (
    <svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
    </svg>
);
const ShareIcon = () => (
    <svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
    </svg>
);
const OptionsIcon = () => (
    <svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
);

/* ══════════════════════════════════════════════════════════════ */
const NowPlayingPanel = ({ isOpen, onClose }) => {
    const { user: currentUser, refreshUser } = useUserContext();
    const {
        currentTrack, isPlaying,
        togglePlayPause, playNext, playPrev,
        queue, history, showNotification,
    } = usePlayerContext();
    const { currentTime, duration } = usePlayerTime();

    const [isAnimatingOut, setIsAnimatingOut]     = useState(false);
    const [processingLike, setProcessingLike]     = useState(false);
    const [showSharePanel, setShowSharePanel]     = useState(false);
    const [showCommentsSheet, setShowCommentsSheet] = useState(false);

    /* ── Drag-to-close refs ──────────────────────────────────── */
    const panelRef      = useRef(null);
    const dragStartYRef = useRef(null);
    const isDraggingRef = useRef(false);
    const dragDeltaRef  = useRef(0);

    const isLiked = currentUser?.likedTracks?.includes(currentTrack?.id);

    /* ── Like toggle ────────────────────────────────────────── */
    const handleLikeToggle = async () => {
        if (!currentUser || !currentTrack) {
            showNotification('Будь ласка, увійдіть, щоб оцінити трек.', 'error');
            return;
        }
        if (processingLike) return;
        setProcessingLike(true);

        const trackRef = doc(db, 'tracks', currentTrack.id);
        const userRef  = doc(db, 'users', currentUser.uid);

        try {
            await runTransaction(db, async (transaction) => {
                const trackDoc = await transaction.get(trackRef);
                if (!trackDoc.exists()) throw new Error('Трек не знайдено!');

                const newCount = (trackDoc.data().likesCount || 0) + (isLiked ? -1 : 1);
                transaction.update(trackRef, { likesCount: newCount });
                transaction.update(userRef, {
                    likedTracks: isLiked
                        ? arrayRemove(currentTrack.id)
                        : arrayUnion(currentTrack.id),
                });
            });
            await refreshUser();
        } catch (err) {
            console.error('[NowPlayingPanel] like error:', err);
            showNotification('Не вдалося оцінити трек.', 'error');
        } finally {
            setProcessingLike(false);
        }
    };

    /* ── Close animation ────────────────────────────────────── */
    const handleClose = () => setIsAnimatingOut(true);
    const handleAnimationEnd = () => {
        if (isAnimatingOut) {
            onClose();
            setIsAnimatingOut(false);
        }
    };

    /* ── Drag-to-close gesture ──────────────────────────────── */
    const handleDragStart = useCallback((e) => {
        dragStartYRef.current = e.touches[0].clientY;
        isDraggingRef.current = false;
        dragDeltaRef.current  = 0;
    }, []);

    const handleDragMove = useCallback((e) => {
        if (dragStartYRef.current === null) return;
        const delta = e.touches[0].clientY - dragStartYRef.current;

        if (!isDraggingRef.current) {
            if (Math.abs(delta) < 8) return;
            isDraggingRef.current = true;
            if (panelRef.current) {
                panelRef.current.style.animation  = 'none';
                panelRef.current.style.transition = 'none';
            }
        }

        dragDeltaRef.current = delta;
        if (panelRef.current && delta > 0) {
            panelRef.current.style.transform = `translateY(${delta}px)`;
        }
    }, []);

    const handleDragEnd = useCallback(() => {
        dragStartYRef.current = null;
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;

        const delta = dragDeltaRef.current;
        dragDeltaRef.current = 0;

        if (delta > 120) {
            if (panelRef.current) {
                panelRef.current.style.transition = 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)';
                panelRef.current.style.transform  = 'translateY(100%)';
            }
            setTimeout(onClose, 380);
        } else {
            if (panelRef.current) {
                panelRef.current.style.transition = 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)';
                panelRef.current.style.transform  = 'translateY(0)';
            }
            setTimeout(() => {
                if (panelRef.current) {
                    panelRef.current.style.transition = '';
                    panelRef.current.style.transform  = '';
                    panelRef.current.style.animation  = '';
                }
            }, 320);
        }
    }, [onClose]);

    /* ── Helpers ────────────────────────────────────────────── */
    const formatTime = (time) => {
        if (isNaN(time) || time === 0) return '0:00';
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const carouselTracks = currentTrack
        ? [...(history || []).slice(-2), currentTrack, ...(queue || []).slice(0, 2)]
        : [];
    const activeIndex = currentTrack
        ? carouselTracks.findIndex(t => t.id === currentTrack.id)
        : -1;

    if (!isOpen || !currentTrack) return null;

    const coverUrl = currentTrack.coverArtUrl || '';

    return (
        <div
            ref={panelRef}
            className={`now-playing-panel ${isAnimatingOut ? 'closing' : ''}`}
            onAnimationEnd={handleAnimationEnd}
        >
            {/* Blurred atmospheric background */}
            {coverUrl && (
                <div
                    className="panel-artwork-bg"
                    style={{ backgroundImage: `url(${coverUrl})` }}
                />
            )}

            {/* Header — drag handle + close chevron */}
            <div
                className="panel-header"
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
            >
                <button onClick={handleClose} className="panel-close-btn" aria-label="Закрити">
                    <ChevronDownIcon />
                </button>
            </div>

            {/* Main content */}
            <div className="panel-content">

                {/* Artwork carousel */}
                <div className="cover-carousel">
                    {carouselTracks.map((track, index) => {
                        const diff = index - activeIndex;
                        let positionClass = 'hidden';
                        if      (diff ===  0) positionClass = 'active';
                        else if (diff === -1) positionClass = 'prev-1';
                        else if (diff === -2) positionClass = 'prev-2';
                        else if (diff ===  1) positionClass = 'next-1';
                        else if (diff ===  2) positionClass = 'next-2';

                        return (
                            <img
                                key={track.id}
                                src={track.coverArtUrl || default_picture}
                                alt={track.title}
                                className={`carousel-artwork ${positionClass}`}
                                onError={e => { e.target.onerror = null; e.target.src = default_picture; }}
                            />
                        );
                    })}
                </div>

                {/* Track title + artist + like button */}
                <div className="track-details">
                    <div className="track-details-text">
                        <h2>{currentTrack.title}</h2>
                        <h3>{currentTrack.authorName}</h3>
                    </div>
                    <button
                        className={`track-like-btn ${isLiked ? 'liked' : ''}`}
                        onClick={handleLikeToggle}
                        disabled={processingLike}
                        aria-label={isLiked ? 'Прибрати лайк' : 'Вподобати'}
                    >
                        <HeartIcon />
                    </button>
                </div>

                {/* Waveform + timestamps */}
                <div className="progress-section">
                    <DynamicWaveform />
                    <div className="time-stamps">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Playback controls */}
                <div className="main-controls">
                    <button onClick={playPrev} aria-label="Попередній трек">
                        <PrevIcon />
                    </button>
                    <button
                        onClick={togglePlayPause}
                        className="play-pause-main"
                        aria-label={isPlaying ? 'Пауза' : 'Відтворити'}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <button onClick={playNext} aria-label="Наступний трек">
                        <NextIcon />
                    </button>
                </div>

                {/* Ambient audio visualizer — desktop only */}
                <div className="panel-visualizer-wrap">
                    <AudioVisualizer />
                </div>

                {/* Secondary actions */}
                <div className="actions-bar">
                    <button className="action-btn" onClick={() => setShowCommentsSheet(true)}>
                        <CommentIcon />
                        <span>{currentTrack.commentsCount || 0}</span>
                    </button>
                    <button className="action-btn" onClick={() => setShowSharePanel(true)}>
                        <ShareIcon />
                    </button>
                    <button className="action-btn">
                        <OptionsIcon />
                    </button>
                </div>
            </div>

            {/* Comments bottom sheet */}
            {showCommentsSheet && (
                <>
                    <div
                        className="comments-sheet-overlay"
                        onClick={() => setShowCommentsSheet(false)}
                    />
                    <div className="comments-sheet">
                        <div className="comments-sheet-handle" />
                        <div className="comments-sheet-header">
                            <span className="comments-sheet-title">Коментарі</span>
                            <button
                                className="comments-sheet-close"
                                onClick={() => setShowCommentsSheet(false)}
                                aria-label="Закрити коментарі"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="comments-sheet-content">
                            <TrackComments
                                trackId={currentTrack.id}
                                trackAuthorId={currentTrack.authorId}
                                compact={true}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Share panel */}
            {showSharePanel && (
                <TrackSharePanel
                    track={currentTrack}
                    onClose={() => setShowSharePanel(false)}
                />
            )}
        </div>
    );
};

export default NowPlayingPanel;
