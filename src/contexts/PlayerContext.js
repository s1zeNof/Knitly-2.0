import React, { createContext, useState, useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useUserContext } from './UserContext';

const PlayerContext = createContext();
const PlayerTimeContext = createContext();

export const PlayerProvider = ({ children }) => {
    const { user } = useUserContext();

    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.75);
    const [queue, setQueue] = useState([]);
    const [history, setHistory] = useState([]);
    const [notification, setNotification] = useState({ message: '', type: 'info' });
    // Track that was manually shared via "НОВІ" button (null = none)
    const [liveSharedTrackId, setLiveSharedTrackId] = useState(null);

    const audioRef = useRef(new Audio());
    // crossOrigin має встановлюватись один раз, не на кожен рендер
    useEffect(() => {
        audioRef.current.crossOrigin = 'anonymous';
    }, []);

    const playNext = useCallback(() => {
        if (queue.length > 0) {
            const nextTrack = queue[0];
            if (currentTrack) setHistory(prev => [currentTrack, ...prev].slice(0, 20));
            setCurrentTrack(nextTrack);
            setQueue(prevQueue => prevQueue.slice(1));
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
        }
    }, [queue, currentTrack]);

    useEffect(() => {
        const audio = audioRef.current;
        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => playNext();

        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [playNext]);

    // --- ПОЧАТОК ЗМІН: Покращена логіка відтворення ---

    // Ефект для завантаження нового треку
    useEffect(() => {
        const audio = audioRef.current;
        if (currentTrack?.trackUrl) {
            if (audio.src !== currentTrack.trackUrl) {
                audio.src = currentTrack.trackUrl;
                audio.load(); // Явно вказуємо браузеру завантажити новий ресурс
            }
        } else {
            audio.src = ''; // Очищуємо, якщо треку немає
        }
    }, [currentTrack]); // Цей ефект залежить ТІЛЬКИ від зміни треку

    // Ефект для керування станом play/pause
    useEffect(() => {
        const audio = audioRef.current;
        if (isPlaying && currentTrack) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Обробка помилок, напр. блокування автоплею браузером
                    console.error("Playback failed:", error);
                    setIsPlaying(false); // Синхронізуємо стан, якщо відтворення не вдалося
                });
            }
        } else {
            audio.pause();
        }
    }, [isPlaying, currentTrack]); // Цей ефект залежить від isPlaying та currentTrack

    // --- КІНЕЦЬ ЗМІН ---
    
    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    const handlePlayPause = useCallback((track) => {
        if (currentTrack?.id === track.id) {
            setIsPlaying(prev => !prev);
        } else {
            if (currentTrack) {
                setHistory(prev => [currentTrack, ...prev].slice(0, 20));
            }
            setCurrentTrack(track);
            setIsPlaying(true);
            const trackRef = doc(db, 'tracks', track.id);
            updateDoc(trackRef, { playCount: increment(1) }).catch(err => console.error(err));
        }
    }, [currentTrack]);
    
    const togglePlayPause = useCallback(() => {
        if (currentTrack) {
            setIsPlaying(prev => !prev);
        }
    }, [currentTrack]);
    
    const seek = useCallback((time) => {
        if (audioRef.current && isFinite(time)) {
            audioRef.current.currentTime = parseFloat(time);
            setCurrentTime(parseFloat(time)); 
        }
    }, []);

    const playPrev = useCallback(() => {
        if (currentTime > 3) {
            seek(0);
        } else if (history.length > 0) {
            const prevTrack = history[0];
            if (currentTrack) setQueue(prev => [currentTrack, ...prev]);
            setHistory(prevHistory => prevHistory.slice(1));
            setCurrentTrack(prevTrack);
            setIsPlaying(true);
        }
    }, [history, currentTrack, seek, currentTime]);
    
    const showNotification = useCallback((message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: 'info' }), 3000);
    }, []);
    
    const addToQueue = useCallback((track) => {
        setQueue(prevQueue => {
            if (prevQueue.find(item => item.id === track.id) || currentTrack?.id === track.id) {
                 showNotification(`Трек "${track.title}" вже у черзі або грає.`, 'error');
                 return prevQueue;
            }
            showNotification(`Трек "${track.title}" додано в чергу`);
            return [...prevQueue, track];
        });
    }, [currentTrack, showNotification]);

    const removeFromQueue = useCallback((trackIndex) => {
        const trackToRemove = queue[trackIndex];
        setQueue(prevQueue => prevQueue.filter((_, index) => index !== trackIndex));
        showNotification(`Трек "${trackToRemove.title}" видалено з черги`);
    }, [queue, showNotification]);

    // ── NOW PLAYING ────────────────────────────────────────────────

    /** Write the current nowPlaying to the user's Firestore document */
    const writeNowPlaying = useCallback(async (track) => {
        if (!user?.uid || !track) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                nowPlaying: {
                    id: track.id,
                    title: track.title,
                    artist: track.authorName || '',
                    coverUrl: track.coverArtUrl || null,
                    updatedAt: serverTimestamp(),
                },
            });
        } catch (err) {
            console.error('writeNowPlaying error:', err);
        }
    }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

    /** Remove nowPlaying from the user's Firestore document */
    const clearNowPlayingInFirestore = useCallback(async () => {
        if (!user?.uid) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), { nowPlaying: null });
        } catch (err) {
            console.error('clearNowPlaying error:', err);
        }
    }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

    /** Auto-broadcast: write/clear when track changes or setting is toggled */
    useEffect(() => {
        if (!user?.uid) return;
        const showNowPlaying = user?.settings?.privacy?.showNowPlaying;
        if (showNowPlaying) {
            if (currentTrack) writeNowPlaying(currentTrack);
            else clearNowPlayingInFirestore();
        } else if (!liveSharedTrackId) {
            // Setting turned off and no manual share → clear
            clearNowPlayingInFirestore();
        }
        // writeNowPlaying / clearNowPlayingInFirestore are stable callbacks — safe to omit
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrack?.id, user?.settings?.privacy?.showNowPlaying]);

    /** Reset liveSharedTrackId when the user moves to a different track */
    useEffect(() => {
        if (liveSharedTrackId && currentTrack?.id !== liveSharedTrackId) {
            setLiveSharedTrackId(null);
            if (!user?.settings?.privacy?.showNowPlaying) {
                clearNowPlayingInFirestore();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrack?.id]);

    /** Toggle the "НОВІ" live-share for the current track */
    const toggleLiveShare = useCallback(() => {
        if (!currentTrack) return;
        if (liveSharedTrackId === currentTrack.id) {
            // Toggle off — stop sharing
            setLiveSharedTrackId(null);
            if (!user?.settings?.privacy?.showNowPlaying) {
                clearNowPlayingInFirestore();
            }
        } else {
            // Toggle on — start sharing
            setLiveSharedTrackId(currentTrack.id);
            writeNowPlaying(currentTrack);
        }
    }, [currentTrack, liveSharedTrackId, user, writeNowPlaying, clearNowPlayingInFirestore]);

    // ──────────────────────────────────────────────────────────────

    // Стабільний контекст — не змінюється кожні 250мс при відтворенні
    const value = useMemo(() => ({
        currentTrack,
        isPlaying,
        volume,
        queue,
        history,
        notification,
        audioElement: audioRef.current,
        handlePlayPause,
        togglePlayPause,
        seek,
        setVolume,
        addToQueue,
        removeFromQueue,
        playNext,
        playPrev,
        showNotification,
        // Now Playing
        liveSharedTrackId,
        toggleLiveShare,
    }), [
        currentTrack, isPlaying, volume, queue, history, notification,
        handlePlayPause, togglePlayPause, seek, setVolume, addToQueue, removeFromQueue, playNext, playPrev, showNotification,
        liveSharedTrackId, toggleLiveShare,
    ]);

    // Volatile контекст — змінюється кожні 250мс при відтворенні треку
    const timeValue = useMemo(() => ({
        currentTime,
        duration,
    }), [currentTime, duration]);

    return (
        <PlayerContext.Provider value={value}>
            <PlayerTimeContext.Provider value={timeValue}>
                {children}
            </PlayerTimeContext.Provider>
        </PlayerContext.Provider>
    );
};

export const usePlayerContext = () => useContext(PlayerContext);
export const usePlayerTime = () => useContext(PlayerTimeContext);