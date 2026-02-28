import React from 'react';
import { usePlayerTime } from '../../contexts/PlayerContext';
import DynamicWaveform from './DynamicWaveform';

const PlayerProgress = () => {
    const { duration, currentTime } = usePlayerTime();

    const formatTime = (time) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="player-progress-container">
            <span>{formatTime(currentTime)}</span>
            <div className="player-waveform-wrapper">
                <DynamicWaveform />
            </div>
            <span>{formatTime(duration)}</span>
        </div>
    );
};

export default PlayerProgress;