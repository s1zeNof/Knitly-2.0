import React, { useState, useEffect } from 'react';
import { usePlayerContext, usePlayerTime } from '../../contexts/PlayerContext';
import NowPlayingPanel from './NowPlayingPanel';
import './Player.css';

// Іконки
const PlayIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const ExpandIcon = () => <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M10 4H4v6l1.8-1.8L11 13.4V20h2v-8.4L7.8 6.4 10 4z"/></svg>;
const NextIcon = () => <svg height="20" width="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path></svg>;
const PrevIcon = () => <svg height="20" width="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path></svg>;
const VolumeHighIcon = () => <svg height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>;
const VolumeMutedIcon = () => <svg height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>;

const Player = () => { // Забираємо пропс className, він більше не потрібен
    const { currentTrack, isPlaying, togglePlayPause, seek, volume, setVolume, playNext, playPrev } = usePlayerContext();
    const { currentTime, duration } = usePlayerTime();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // --- ПОЧАТОК ЗМІН ---
    const [isHiding, setIsHiding] = useState(false);

    useEffect(() => {
        const handleClassChange = () => {
            const inChatView = document.body.classList.contains('in-chat-view');
            setIsHiding(inChatView);
        };

        const observer = new MutationObserver(handleClassChange);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);
    // --- КІНЕЦЬ ЗМІН ---

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleContainerClick = () => {
        if (isMobile && currentTrack) {
            setIsPanelOpen(true);
        }
    };
    
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    // --- ПОЧАТОК ЗМІН ---
    // Не рендеримо плеєр, якщо немає треку
    if (!currentTrack) {
        return null;
    }

    const playerClassName = `player-container ${isMobile ? 'mobile-view' : ''} visible ${isHiding ? 'hiding' : ''}`;
    // --- КІНЕЦЬ ЗМІН ---


    return (
        <>
            <div 
                className={playerClassName} // Використовуємо нову змінну
                onClick={handleContainerClick}
            >
                <div className="mini-player-progress" style={{ width: `${progress}%` }}></div>
                
                <div className="player-track-info">
                    <img src={currentTrack.coverArtUrl || 'https://placehold.co/56x56/181818/333333?text=K'} alt={currentTrack.title} />
                    <div>
                        <p className="player-title">{currentTrack.title}</p>
                        <p className="player-author">{currentTrack.authorName}</p>
                    </div>
                </div>

                <div className="player-center-section">
                    <div className="player-controls">
                        <button onClick={(e) => { e.stopPropagation(); playPrev(); }} className="player-control-button"><PrevIcon /></button>
                        <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="player-main-button">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="player-control-button"><NextIcon /></button>
                    </div>

                    <div className="player-progress-container">
                        <span>{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0" max={duration || 0}
                            value={currentTime}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => seek(parseFloat(e.target.value))}
                            className="player-progress-bar"
                        />
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
                
                <div className="player-actions">
                     <button className="player-action-button" onClick={(e) => { e.stopPropagation(); setIsPanelOpen(true); }}>
                        <ExpandIcon />
                    </button>
                    <div className="volume-container">
                        <button className="player-action-button" onClick={(e) => { e.stopPropagation(); setVolume(volume > 0 ? 0 : 0.75); }}>
                           {volume > 0 ? <VolumeHighIcon/> : <VolumeMutedIcon/>}
                        </button>
                        <input
                            type="range"
                            min="0" max="1" step="0.01"
                            value={volume}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="volume-slider"
                        />
                    </div>
                </div>
                 
                 <div className="mobile-play-pause">
                    <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="player-main-button mobile">
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                </div>
            </div>
            {isPanelOpen && <NowPlayingPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />}
        </>
    );
    function formatTime(time) {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
};

export default Player;