import React, { useState } from 'react';
import { usePlayerContext } from './PlayerContext';
import QueuePanel from './QueuePanel';
import './Player.css';

const DEFAULT_COVER_URL = 'https://placehold.co/256x256/181818/333333?text=K';

// Іконки
const PlayIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg height="24" width="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const NextIcon = () => <svg height="20" width="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path></svg>;
const PrevIcon = () => <svg height="20" width="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path></svg>;
const VolumeHighIcon = () => <svg height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>;
const VolumeMutedIcon = () => <svg height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>;
const QueueIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;

const Player = () => {
    const { 
        currentTrack, isPlaying, togglePlayPause, duration, currentTime, seek, 
        volume, setVolume, playNext, playPrev 
    } = usePlayerContext();
    const [isQueueVisible, setIsQueueVisible] = useState(false);

    if (!currentTrack) {
        return null;
    }

    const formatTime = (time) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <>
            <div className="player-container">
                <div className="player-track-info">
                    <img src={currentTrack.coverArtUrl || DEFAULT_COVER_URL} alt={currentTrack.title} />
                    <div>
                        <p className="player-title">{currentTrack.title}</p>
                        <p className="player-author">{currentTrack.authorName}</p>
                    </div>
                </div>

                <div className="player-center-section">
                    <div className="player-controls">
                        <button className="player-control-button" onClick={playPrev}><PrevIcon /></button>
                        <button onClick={togglePlayPause} className="player-main-button">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button className="player-control-button" onClick={playNext}><NextIcon /></button>
                    </div>

                    <div className="player-progress-container">
                        <span>{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => seek(e.target.value)}
                            className="player-progress-bar"
                        />
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
                
                <div className="player-actions">
                    <button className="player-action-button" onClick={() => setIsQueueVisible(!isQueueVisible)}>
                        <QueueIcon />
                    </button>
                    <div className="volume-container">
                        <button className="player-action-button" onClick={() => setVolume(volume > 0 ? 0 : 0.75)}>
                           {volume > 0 ? <VolumeHighIcon/> : <VolumeMutedIcon/>}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                            className="volume-slider"
                        />
                    </div>
                </div>
            </div>
            <QueuePanel isVisible={isQueueVisible} onClose={() => setIsQueueVisible(false)} />
        </>
    );
};

export default Player;