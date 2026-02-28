import React from 'react';
import { usePlayerContext, usePlayerTime } from '../../contexts/PlayerContext';
import './PlayerDebugger.css';

const PlayerDebugger = () => {
    const { currentTrack, isPlaying } = usePlayerContext();
    const { duration, currentTime } = usePlayerTime();

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="debugger-container">
            <h4 className="debugger-title">Player State</h4>
            <p><strong>Status:</strong> {isPlaying ? 'Playing' : 'Paused'}</p>
            <p><strong>Track:</strong> {currentTrack?.title || 'None'}</p>
            <p><strong>URL:</strong> <span className="debugger-url">{currentTrack?.trackUrl || 'N/A'}</span></p>
            <p><strong>Time:</strong> {formatTime(currentTime)} / {formatTime(duration)}</p>
        </div>
    );
};

export default PlayerDebugger;