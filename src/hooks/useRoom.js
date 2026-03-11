/**
 * useRoom.js — Knitly Rooms
 * Core React hook: real-time room state + drift-corrected audio sync.
 * Pattern: subscribe → compute → expose actions (no side-effects in callers needed).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserContext } from '../contexts/UserContext';
import {
    listenToRoom,
    listenToMessages,
    joinRoom,
    leaveRoom,
    syncPlayback,
    playTrack,
    skipTrack,
    addToQueue,
    removeFromQueue,
    sendMessage,
    sendSystemMessage,
} from '../services/roomService';

const SYNC_INTERVAL_MS = 5000; // How often host broadcasts playback position

export const useRoom = (roomId) => {
    const { user } = useUserContext();

    const [room, setRoom]         = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);
    const [joined, setJoined]     = useState(false);
    const [volume, setVolumeState] = useState(0.7);

    // Local audio element managed by this hook
    const audioRef      = useRef(new Audio());
    const lastTrackId   = useRef(null);
    const syncTimerRef  = useRef(null);

    /* ── Derived ───────────────────────────────────────────────── */
    const isHost        = !!(room && user && room.hostId === user.uid);
    const isParticipant = !!(room && user && room.participants?.[user.uid]);

    /**
     * Calculate where the track *should* be playing right now,
     * accounting for server→client timestamp drift.
     */
    const getExpectedTime = useCallback(() => {
        if (!room || !room.syncedAt) return room?.playbackOffset || 0;
        if (!room.isPlaying)        return room.playbackOffset || 0;

        const syncedAtMs = room.syncedAt?.toMillis
            ? room.syncedAt.toMillis()
            : Date.now();
        const elapsed = (Date.now() - syncedAtMs) / 1000;
        return (room.playbackOffset || 0) + elapsed;
    }, [room]);

    /* ── Subscribe to room doc ─────────────────────────────────── */
    useEffect(() => {
        if (!roomId) return;
        setLoading(true);
        setError(null);

        const unsubRoom = listenToRoom(roomId, (data) => {
            setRoom(data);
            setLoading(false);
            if (!data) setError('Кімнату не знайдено або її закрито.');
        });

        const unsubMsgs = listenToMessages(roomId, setMessages);

        return () => {
            unsubRoom();
            unsubMsgs();
        };
    }, [roomId]);

    /* ── Auto-join once room is loaded ────────────────────────── */
    useEffect(() => {
        if (!room || !user || joined || isParticipant) return;
        joinRoom(roomId, user)
            .then(() => {
                setJoined(true);
                sendSystemMessage(roomId, `${user.displayName} приєднався до кімнати 🎧`).catch(() => {});
            })
            .catch((e) => console.warn('[useRoom] joinRoom error:', e));
    }, [room, user, joined, isParticipant, roomId]);

    /* ── Audio sync ────────────────────────────────────────────── */
    useEffect(() => {
        if (!room) return;
        const audio = audioRef.current;

        // Track changed
        const newSrc = room.currentTrack?.audioUrl || '';
        if (room.currentTrack?.id !== lastTrackId.current) {
            lastTrackId.current = room.currentTrack?.id || null;
            audio.src = newSrc;
            if (newSrc) {
                const seekTo = getExpectedTime();
                audio.currentTime = seekTo > 0 ? seekTo : 0;
            }
        }

        // Sync play state
        if (room.isPlaying && newSrc) {
            audio.play().catch(() => {
                // Autoplay policy — user interaction required; UI shows "click to resume"
            });
        } else {
            audio.pause();
        }

        // Re-sync time if drift > 2.5s (e.g. after background tab)
        if (room.isPlaying && newSrc) {
            const expected = getExpectedTime();
            if (Math.abs(audio.currentTime - expected) > 2.5) {
                audio.currentTime = expected;
            }
        }
    }, [room?.currentTrack?.id, room?.isPlaying, room?.syncedAt]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Host: broadcast playback position periodically ───────── */
    useEffect(() => {
        if (!isHost || !room?.isPlaying) {
            clearInterval(syncTimerRef.current);
            return;
        }
        syncTimerRef.current = setInterval(() => {
            const audio = audioRef.current;
            if (!audio.paused) {
                syncPlayback(roomId, {
                    isPlaying: true,
                    playbackOffset: audio.currentTime,
                }).catch(() => {});
            }
        }, SYNC_INTERVAL_MS);

        return () => clearInterval(syncTimerRef.current);
    }, [isHost, room?.isPlaying, roomId]);

    /* ── Volume ─────────────────────────────────────────────────── */
    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    /* ── Cleanup on unmount ─────────────────────────────────────── */
    useEffect(() => {
        const audio = audioRef.current;
        return () => {
            clearInterval(syncTimerRef.current);
            audio.pause();
            audio.src = '';
            if (user?.uid && roomId) {
                leaveRoom(roomId, user.uid).catch(() => {});
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Exposed actions ─────────────────────────────────────────── */
    const handlePlayTrack = useCallback((track) => {
        if (!isHost) return Promise.resolve();
        return playTrack(roomId, track);
    }, [isHost, roomId]);

    const handleTogglePlay = useCallback(() => {
        if (!isHost) return Promise.resolve();
        const audio = audioRef.current;
        const nowPlaying = !room?.isPlaying;
        return syncPlayback(roomId, {
            isPlaying: nowPlaying,
            playbackOffset: audio.currentTime,
        });
    }, [isHost, roomId, room?.isPlaying]);

    const handleSkipTrack = useCallback(() => {
        if (!isHost) return Promise.resolve();
        return skipTrack(roomId, room?.queue || []);
    }, [isHost, roomId, room?.queue]);

    const handleAddToQueue = useCallback((track) => {
        if (!isHost) return Promise.resolve();
        return addToQueue(roomId, track);
    }, [isHost, roomId]);

    const handleRemoveFromQueue = useCallback((track) => {
        if (!isHost) return Promise.resolve();
        return removeFromQueue(roomId, track);
    }, [isHost, roomId]);

    const handleSeek = useCallback((seconds) => {
        if (!isHost) return Promise.resolve();
        audioRef.current.currentTime = seconds;
        return syncPlayback(roomId, {
            isPlaying: room?.isPlaying ?? false,
            playbackOffset: seconds,
        });
    }, [isHost, roomId, room?.isPlaying]);

    const handleSendMessage = useCallback((text) => {
        if (!user) return Promise.resolve();
        return sendMessage(roomId, user, text);
    }, [user, roomId]);

    const handleSetVolume = useCallback((v) => {
        setVolumeState(v);
    }, []);

    return {
        // State
        room,
        messages,
        loading,
        error,
        isHost,
        isParticipant,
        volume,
        // Audio ref (exposed so RoomPlayer can render a progress bar)
        audioRef,
        getExpectedTime,
        // Actions
        handlePlayTrack,
        handleTogglePlay,
        handleSkipTrack,
        handleAddToQueue,
        handleRemoveFromQueue,
        handleSeek,
        handleSendMessage,
        handleSetVolume,
    };
};
