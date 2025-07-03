import React, { createContext, useState, useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import { db } from './firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.75);
    const [queue, setQueue] = useState([]);
    const [history, setHistory] = useState([]);
    const [notification, setNotification] = useState({ message: '', type: 'info' });

    const audioRef = useRef(new Audio());
    audioRef.current.crossOrigin = 'anonymous';

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

    const value = useMemo(() => ({
        currentTrack, 
        isPlaying, 
        duration, 
        currentTime, 
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
        showNotification
    }), [
        currentTrack, isPlaying, duration, currentTime, volume, queue, history, notification, 
        handlePlayPause, togglePlayPause, seek, setVolume, addToQueue, removeFromQueue, playNext, playPrev, showNotification
    ]);

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayerContext = () => useContext(PlayerContext);