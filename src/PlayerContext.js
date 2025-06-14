import React, { createContext, useState, useContext, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.75);
    const [queue, setQueue] = useState([]);
    const [history, setHistory] = useState([]);
    const [notification, setNotification] = useState({ message: '', type: 'info' }); // type: 'info' | 'error'

    const audioRef = useRef(new Audio());

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: 'info' }), 3000);
    };

    useEffect(() => {
        const audio = audioRef.current;
        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => playNext();

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);
        audio.crossOrigin = "anonymous";

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [queue]); // Перезапускаємо ефект, коли змінюється черга

    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    useEffect(() => {
        if (currentTrack?.trackUrl) {
            if (audioRef.current.src !== currentTrack.trackUrl) {
                audioRef.current.src = currentTrack.trackUrl;
            }
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback error:", e));
            } else {
                audioRef.current.pause();
            }
        } else {
             audioRef.current.pause();
        }
    }, [currentTrack, isPlaying]);

    const handlePlayPause = (track) => {
        if (currentTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            if (currentTrack) {
                setHistory(prev => [currentTrack, ...prev]);
            }
            setCurrentTrack(track);
            setIsPlaying(true);
        }
    };
    
    const togglePlayPause = () => {
        if (currentTrack) {
            setIsPlaying(!isPlaying);
        }
    };
    
    const seek = (time) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const playNext = () => {
        if (queue.length > 0) {
            const nextTrack = queue[0];
            setHistory(prev => [currentTrack, ...prev]);
            setCurrentTrack(nextTrack);
            setQueue(prevQueue => prevQueue.slice(1));
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    };

    const playPrev = () => {
        if (currentTime > 5) {
            seek(0);
            return;
        }
        if (history.length > 0) {
            const prevTrack = history[0];
            setQueue(prev => [currentTrack, ...prev]);
            setCurrentTrack(prevTrack);
            setHistory(prevHistory => prevHistory.slice(1));
            setIsPlaying(true);
        }
    };
    
    const addToQueue = (track) => {
        setQueue(prevQueue => {
            if (prevQueue.find(item => item.id === track.id) || currentTrack?.id === track.id) {
                 showNotification(`Трек "${track.title}" вже у черзі або грає.`, 'error');
                 return prevQueue;
            }
            showNotification(`Трек "${track.title}" додано в чергу`);
            return [...prevQueue, track];
        });
    };

    const removeFromQueue = (trackIndex) => {
        const trackToRemove = queue[trackIndex];
        setQueue(prevQueue => prevQueue.filter((_, index) => index !== trackIndex));
        showNotification(`Трек "${trackToRemove.title}" видалено з черги`);
    };

    const value = {
        currentTrack, isPlaying, duration, currentTime, volume, queue,
        handlePlayPause, togglePlayPause, seek, setVolume, addToQueue,
        removeFromQueue, playNext, playPrev, showNotification, notification,
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayerContext = () => useContext(PlayerContext);