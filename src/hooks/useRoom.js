/**
 * useRoom.js — Knitly Rooms
 * Core React hook: real-time room state + drift-corrected audio sync.
 * Pattern: subscribe → compute → expose actions (no side-effects in callers needed).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserContext } from '../contexts/UserContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
    listenToRoom,
    listenToMessages,
    joinRoom,
    leaveRoom,
    endRoom,
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

    const notFoundTimerRef  = useRef(null);
    // Tracks whether leave/end was already called explicitly — prevents double leaveRoom on unmount
    const hasLeftExplicitlyRef = useRef(false);

    // Local audio element managed by this hook
    const audioRef      = useRef(new Audio());
    const lastTrackId   = useRef(null);
    const syncTimerRef  = useRef(null);
    // Keep latest isHost value accessible in stale closures (e.g. unmount cleanup)
    const isHostRef     = useRef(false);

    /* ── Derived ───────────────────────────────────────────────── */
    const isHost        = !!(room && user && room.hostId === user.uid);
    const isParticipant = !!(room && user && room.participants?.[user.uid]);

    // Keep ref in sync so the unmount cleanup always has the latest value
    useEffect(() => { isHostRef.current = isHost; }, [isHost]);

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
            if (data) {
                clearTimeout(notFoundTimerRef.current);
                setRoom(data);
                setLoading(false);
                setError(null);
            } else {
                // Give Firestore 3s to propagate a newly created room before showing error
                notFoundTimerRef.current = setTimeout(() => {
                    setRoom(null);
                    setLoading(false);
                    setError('Кімнату не знайдено або її закрито.');
                }, 3000);
            }
        });

        const unsubMsgs = listenToMessages(roomId, setMessages);

        return () => {
            unsubRoom();
            unsubMsgs();
            clearTimeout(notFoundTimerRef.current);
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

        // Track changed — also check trackUrl for backward-compat (old normalized data)
        const newSrc = room.currentTrack?.audioUrl || room.currentTrack?.trackUrl || '';
        if (room.currentTrack?.id !== lastTrackId.current) {
            lastTrackId.current = room.currentTrack?.id || null;
            if (newSrc) {
                audio.src = newSrc;
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

    /* ── Fallback: fetch real audio URL from Firestore when stored one is empty ──
     * Covers tracks that were normalized before the trackUrl fix was applied. */
    useEffect(() => {
        const trackId = room?.currentTrack?.id;
        const alreadyHasUrl = !!(room?.currentTrack?.audioUrl || room?.currentTrack?.trackUrl);
        if (!trackId || alreadyHasUrl) return;

        let cancelled = false;
        const fetchUrl = async () => {
            try {
                const snap = await getDoc(doc(db, 'tracks', trackId));
                if (cancelled || !snap.exists()) return;
                const data = snap.data();
                const url = data.audioUrl || data.trackUrl || data.url || data.fileUrl || '';
                if (!url) return;
                const audio = audioRef.current;
                audio.src = url;
                if (room?.isPlaying) {
                    audio.play().catch(() => {});
                }
            } catch (err) {
                console.warn('[useRoom] fallback track URL fetch failed:', err);
            }
        };
        fetchUrl();
        return () => { cancelled = true; };
    }, [room?.currentTrack?.id, room?.currentTrack?.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

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
            // Skip leaveRoom if:
            // (a) user is the host — host navigating away keeps room alive
            // (b) explicit leave/end was already called — prevents double call
            if (!isHostRef.current && !hasLeftExplicitlyRef.current && user?.uid && roomId) {
                leaveRoom(roomId, user.uid).catch(() => {});
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Exposed actions ─────────────────────────────────────────── */
    const handlePlayTrack = useCallback((track) => {
        if (!isHost) return Promise.resolve();
        const audio = audioRef.current;
        const normalizedUrl = track.audioUrl || track.url || track.fileUrl || '';

        // Pre-set lastTrackId so the audio sync effect won't re-assign src
        // when the Firestore snapshot arrives (avoiding a double-load reset).
        lastTrackId.current = track.id || null;

        if (normalizedUrl) {
            audio.src = normalizedUrl;
            audio.currentTime = 0;
            // Wait for audio to load before playing — avoids 0:00 stuck state.
            // 'canplay' fires when browser has enough data to start playback.
            const tryPlay = () => {
                audio.play().catch(() => {});
                audio.removeEventListener('canplay', tryPlay);
            };
            audio.addEventListener('canplay', tryPlay);
            // Fallback: if 'canplay' never fires (e.g. already loaded), try once
            if (audio.readyState >= 3) tryPlay();
        }

        return playTrack(roomId, track);
    }, [isHost, roomId]);

    const handleTogglePlay = useCallback(() => {
        if (!isHost) return Promise.resolve();
        const audio = audioRef.current;
        const nowPlaying = !room?.isPlaying;
        // Immediately play/pause locally while user gesture is still active.
        // We cannot wait for the Firestore round-trip — by then the browser
        // will have lost the user-interaction context and block autoplay.
        if (nowPlaying && audio.src) {
            audio.play().catch(() => {}); // will succeed — called from user gesture
        } else {
            audio.pause();
        }
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

    // Explicit leave for participants — call before navigate('/rooms')
    const handleLeaveRoom = useCallback(() => {
        hasLeftExplicitlyRef.current = true;
        if (!user?.uid || !roomId) return Promise.resolve();
        return leaveRoom(roomId, user.uid).catch(() => {});
    }, [user?.uid, roomId]);

    const handleEndRoom = useCallback(() => {
        hasLeftExplicitlyRef.current = true; // skip leaveRoom in cleanup
        if (!isHost) return Promise.resolve();
        return endRoom(roomId);
    }, [isHost, roomId]);

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
        handleLeaveRoom,
        handleEndRoom,
    };
};
