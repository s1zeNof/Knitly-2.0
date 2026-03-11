/**
 * RoomPlayer.jsx — synchronized room audio player UI
 * Host: full playback controls (play/pause, skip, seek, volume)
 * Guest: view-only with live sync indicator + volume slider
 */

import React, { useState, useEffect, useRef } from 'react';
import './RoomPlayer.css';

/* ── Icons ────────────────────────────────────────────────────── */
const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
);
const SkipIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" /></svg>
);
const VolumeIcon = ({ muted }) => muted ? (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
) : (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
);

/* ── Format seconds → MM:SS ────────────────────────────────────── */
const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

const RoomPlayer = ({
    room,
    isHost,
    audioRef,
    volume,
    onTogglePlay,
    onSkip,
    onSeek,
    onSetVolume,
}) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration]       = useState(0);
    const [muted, setMuted] = useState(false);
    const seekBarRef = useRef(null);

    /* ── Sync local time with audio ────────────────────────────── */
    useEffect(() => {
        const audio = audioRef?.current;
        if (!audio) return;

        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onDuration   = () => setDuration(audio.duration || 0);

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onDuration);
        audio.addEventListener('durationchange', onDuration);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onDuration);
            audio.removeEventListener('durationchange', onDuration);
        };
    }, [audioRef]);

    /* ── Mute ──────────────────────────────────────────────────── */
    const toggleMute = () => {
        const audio = audioRef?.current;
        if (!audio) return;
        audio.muted = !muted;
        setMuted(!muted);
    };

    /* ── Seek ──────────────────────────────────────────────────── */
    const handleSeekClick = (e) => {
        if (!isHost || !duration) return;
        const bar  = seekBarRef.current;
        const rect = bar.getBoundingClientRect();
        const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const sec  = pct * duration;
        setCurrentTime(sec);
        onSeek(sec);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const { currentTrack, isPlaying } = room || {};

    return (
        <div className="rp-player">
            {/* Track info */}
            <div className="rp-track-info">
                {currentTrack?.coverArtUrl ? (
                    <img className="rp-cover" src={currentTrack.coverArtUrl} alt={currentTrack.title} />
                ) : (
                    <div className="rp-cover rp-cover--empty">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="rp-cover-icon">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                )}
                <div className="rp-meta">
                    <p className="rp-title">
                        {currentTrack?.title || (isHost ? 'Вибери трек для відтворення' : 'Хост ще не додав трек')}
                    </p>
                    {currentTrack?.artist && (
                        <p className="rp-artist">{currentTrack.artist}</p>
                    )}
                </div>

                {/* Sync badge for guests */}
                {!isHost && currentTrack && (
                    <span className={`rp-sync-badge${isPlaying ? ' rp-sync-badge--live' : ''}`}>
                        {isPlaying ? '🔴 LIVE' : '⏸ Пауза'}
                    </span>
                )}
            </div>

            {/* Seek bar */}
            <div className="rp-progress-row">
                <span className="rp-time">{fmt(currentTime)}</span>
                <div
                    ref={seekBarRef}
                    className={`rp-seek-bar${isHost ? ' rp-seek-bar--interactive' : ''}`}
                    onClick={handleSeekClick}
                    title={isHost ? 'Перемотати' : 'Синхронізовано з хостом'}
                >
                    <div className="rp-seek-bg" />
                    <div className="rp-seek-fill" style={{ width: `${progress}%` }} />
                    {isHost && <div className="rp-seek-thumb" style={{ left: `${progress}%` }} />}
                </div>
                <span className="rp-time">{fmt(duration)}</span>
            </div>

            {/* Controls row */}
            <div className="rp-controls">
                {/* Host controls */}
                {isHost && (
                    <div className="rp-host-controls">
                        <button
                            className="rp-btn rp-btn--primary"
                            onClick={onTogglePlay}
                            disabled={!currentTrack}
                            aria-label={isPlaying ? 'Пауза' : 'Відтворити'}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button
                            className="rp-btn"
                            onClick={onSkip}
                            disabled={!room?.queue?.length}
                            aria-label="Наступний трек"
                        >
                            <SkipIcon />
                        </button>
                    </div>
                )}

                {/* Guest: show playing status */}
                {!isHost && (
                    <div className="rp-guest-status">
                        {isPlaying ? (
                            <>
                                <span className="rp-eq-bar" /><span className="rp-eq-bar" /><span className="rp-eq-bar" />
                            </>
                        ) : (
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>На паузі</span>
                        )}
                    </div>
                )}

                {/* Volume (everyone) */}
                <div className="rp-volume">
                    <button className="rp-mute-btn" onClick={toggleMute} aria-label="Вимкнути звук">
                        <VolumeIcon muted={muted} />
                    </button>
                    <input
                        type="range"
                        className="rp-volume-slider"
                        min={0}
                        max={1}
                        step={0.01}
                        value={muted ? 0 : volume}
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            if (muted && v > 0) setMuted(false);
                            onSetVolume(v);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default RoomPlayer;
