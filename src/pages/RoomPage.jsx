/**
 * RoomPage.jsx — Individual room experience
 *
 * Layout:
 * Desktop (≥ 900px):
 *   Left column  → Queue (track list + search)
 *   Right column → Chat
 *   Bottom bar   → Player (always visible)
 *
 * Mobile (< 900px):
 *   Full-height tab-based view (Queue | Chat)
 *   Player pinned at top of content area
 *   Bottom tabs for switching
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { useRoom } from '../hooks/useRoom';
import { leaveRoom } from '../services/roomService';
import RoomPlayer from '../components/rooms/RoomPlayer';
import RoomChat   from '../components/rooms/RoomChat';
import RoomQueue  from '../components/rooms/RoomQueue';
import default_picture from '../img/Default-Images/default-picture.svg';
import './RoomPage.css';

/* ── Icons ────────────────────────────────────────────────────── */
const BackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M15 19l-7-7 7-7" />
    </svg>
);
const LeaveIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
);
const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
);
const QueueIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
);
const ChatIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
    </svg>
);
const CrownIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
);

/* ── Participants avatar strip ─────────────────────────────────── */
const ParticipantsStrip = ({ participants = {}, hostId, maxVisible = 8 }) => {
    const entries = Object.entries(participants);
    const visible = entries.slice(0, maxVisible);
    const overflow = entries.length - maxVisible;

    if (entries.length === 0) return null;

    return (
        <div className="rp-participants">
            {visible.map(([uid, info]) => (
                <div key={uid} className="rp-participant" title={info.displayName}>
                    <img
                        src={info.photoURL || default_picture}
                        alt={info.displayName}
                        onError={(e) => { e.target.src = default_picture; }}
                    />
                    {uid === hostId && (
                        <span className="rp-participant-crown" aria-label="Хост">
                            <CrownIcon />
                        </span>
                    )}
                </div>
            ))}
            {overflow > 0 && (
                <div className="rp-participant rp-participant--overflow">+{overflow}</div>
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════ */
const RoomPage = () => {
    const { roomId } = useParams();
    const navigate   = useNavigate();
    const { user }   = useUserContext();

    const {
        room, messages, loading, error, isHost,
        audioRef, volume,
        handlePlayTrack, handleTogglePlay, handleSkipTrack,
        handleAddToQueue, handleRemoveFromQueue, handleSeek,
        handleSendMessage, handleSetVolume, handleEndRoom,
    } = useRoom(roomId);

    // Mobile: which tab is active
    const [mobileTab, setMobileTab] = useState('queue');

    /* ── Leave room (participant) ──────────────────────────────── */
    const handleLeave = async () => {
        if (user?.uid && roomId) {
            await leaveRoom(roomId, user.uid).catch(() => {});
        }
        navigate('/rooms');
    };

    /* ── End room (host only) ──────────────────────────────────── */
    const handleEnd = async () => {
        if (!isHost) return;
        await handleEndRoom().catch(() => {});
        navigate('/rooms');
    };

    /* ── Redirect if room ended (guests only) ──────────────────── */
    useEffect(() => {
        if (room?.status === 'ended' && !isHost) {
            navigate('/rooms');
        }
    }, [room?.status, isHost, navigate]);

    /* ── Loading ─────────────────────────────────────────────────── */
    if (loading) {
        return (
            <div className="room-page room-page--loading">
                <div className="room-loader">
                    <div className="room-loader-spinner" />
                    <p>Підключення до кімнати…</p>
                </div>
            </div>
        );
    }

    /* ── Error ────────────────────────────────────────────────────── */
    if (error || !room) {
        return (
            <div className="room-page room-page--error">
                <div className="room-error-box">
                    <h2>😔 Кімнату не знайдено</h2>
                    <p>{error || 'Кімната могла бути закрита або не існує.'}</p>
                    <button onClick={() => navigate('/rooms')} className="room-back-home-btn">
                        ← Повернутись до кімнат
                    </button>
                </div>
            </div>
        );
    }

    const participantsCount = room.participantsCount || 0;

    return (
        <div className="room-page">
            {/* ── Top bar ─────────────────────────────────────────── */}
            <div className="room-topbar">
                <button className="room-back-btn" onClick={handleLeave} aria-label="Назад">
                    <BackIcon />
                </button>

                <div className="room-topbar-info">
                    <h1 className="room-topbar-name">{room.name}</h1>
                    <div className="room-topbar-meta">
                        <span className="room-topbar-host">
                            <img
                                src={room.hostInfo?.photoURL || default_picture}
                                alt={room.hostInfo?.displayName}
                                onError={(e) => { e.target.src = default_picture; }}
                            />
                            {room.hostInfo?.displayName}
                            {isHost && <span className="room-host-badge">Ви</span>}
                        </span>
                        <span className="room-topbar-sep">·</span>
                        <span className="room-topbar-count">
                            <UsersIcon />
                            {participantsCount}
                        </span>
                        {room.isPlaying && (
                            <>
                                <span className="room-topbar-sep">·</span>
                                <span className="room-live-badge">🔴 LIVE</span>
                            </>
                        )}
                    </div>
                </div>

                <ParticipantsStrip
                    participants={room.participants}
                    hostId={room.hostId}
                    maxVisible={5}
                />

                {isHost ? (
                    <button className="room-end-btn" onClick={handleEnd}>
                        <LeaveIcon />
                        <span className="room-leave-label">Завершити</span>
                    </button>
                ) : (
                    <button className="room-leave-btn" onClick={handleLeave}>
                        <LeaveIcon />
                        <span className="room-leave-label">Вийти</span>
                    </button>
                )}
            </div>

            {/* ── Main content ─────────────────────────────────────── */}
            <div className="room-body">

                {/* Desktop layout: two columns */}
                <div className="room-columns">

                    {/* Left: Queue */}
                    <aside className="room-col room-col--queue">
                        <RoomQueue
                            queue={room.queue || []}
                            currentTrack={room.currentTrack}
                            isHost={isHost}
                            onPlayTrack={handlePlayTrack}
                            onRemoveFromQueue={handleRemoveFromQueue}
                            onAddToQueue={handleAddToQueue}
                        />
                    </aside>

                    {/* Right: Chat */}
                    <section className="room-col room-col--chat">
                        <div className="room-chat-header">
                            <ChatIcon />
                            <span>Чат кімнати</span>
                            <span className="room-chat-count">{messages.length}</span>
                        </div>
                        <RoomChat
                            messages={messages}
                            currentUserId={user?.uid}
                            onSendMessage={handleSendMessage}
                        />
                    </section>
                </div>

                {/* Mobile tab content (visible via CSS) */}
                <div className="room-mobile-content">
                    {mobileTab === 'queue' ? (
                        <RoomQueue
                            queue={room.queue || []}
                            currentTrack={room.currentTrack}
                            isHost={isHost}
                            onPlayTrack={handlePlayTrack}
                            onRemoveFromQueue={handleRemoveFromQueue}
                            onAddToQueue={handleAddToQueue}
                        />
                    ) : (
                        <RoomChat
                            messages={messages}
                            currentUserId={user?.uid}
                            onSendMessage={handleSendMessage}
                        />
                    )}
                </div>
            </div>

            {/* ── Player bar (always at bottom of content) ──────────── */}
            <RoomPlayer
                room={room}
                isHost={isHost}
                audioRef={audioRef}
                volume={volume}
                onTogglePlay={handleTogglePlay}
                onSkip={handleSkipTrack}
                onSeek={handleSeek}
                onSetVolume={handleSetVolume}
            />

            {/* ── Mobile bottom tab bar ─────────────────────────────── */}
            <nav className="room-mobile-tabs" aria-label="Переключення вкладок">
                <button
                    className={`room-mobile-tab${mobileTab === 'queue' ? ' active' : ''}`}
                    onClick={() => setMobileTab('queue')}
                >
                    <QueueIcon />
                    <span>Черга</span>
                </button>
                <button
                    className={`room-mobile-tab${mobileTab === 'chat' ? ' active' : ''}`}
                    onClick={() => setMobileTab('chat')}
                >
                    <ChatIcon />
                    <span>Чат</span>
                </button>
            </nav>
        </div>
    );
};

export default RoomPage;
