import React, { useState } from 'react';
import { usePlayerContext } from './PlayerContext';
import DynamicWaveform from './DynamicWaveform';
import './NowPlayingPanel.css';

// Іконки (без змін)
const ChevronDownIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"></path></svg>;
const PlayIcon = () => <svg height="36" width="36" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg height="36" width="36" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const NextIcon = () => <svg height="28" width="28" viewBox="0 0 24 24"><path fill="currentColor" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path></svg>;
const PrevIcon = () => <svg height="28" width="28" viewBox="0 0 24 24"><path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path></svg>;
const HeartIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const CommentIcon = () => <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>;
const ShareIcon = () => <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"></path></svg>;
const OptionsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>;


const NowPlayingPanel = ({ isOpen, onClose }) => {
    const { 
        currentTrack, isPlaying, togglePlayPause, duration, currentTime,
        playNext, playPrev, queue, history
    } = usePlayerContext();

    // --- ВИПРАВЛЕННЯ 1: Логіка для анімації закриття ---
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const handleClose = () => {
        setIsAnimatingOut(true);
    };

    const handleAnimationEnd = () => {
        // Коли анімація закриття завершилась, викликаємо onClose, щоб прибрати компонент
        if (isAnimatingOut) {
            onClose();
            setIsAnimatingOut(false); // Скидаємо стан на майбутнє
        }
    };

    const formatTime = (time) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // --- ВИПРАВЛЕННЯ 2: Більш надійна логіка для каруселі ---
    const carouselTracks = currentTrack ? [
        ...(history || []).slice(-2),
        currentTrack,
        ...(queue || []).slice(0, 2)
    ] : [];

    // Знаходимо індекс активного треку в масиві каруселі
    const activeIndex = currentTrack ? carouselTracks.findIndex(t => t.id === currentTrack.id) : -1;

    // Компонент не рендериться, якщо не відкритий або немає треку
    if (!isOpen || !currentTrack) return null;

    return (
        <div 
            className={`now-playing-panel ${isAnimatingOut ? 'closing' : ''}`}
            onAnimationEnd={handleAnimationEnd}
        >
            <div className="panel-header">
                {/* Викликаємо нашу функцію для анімації закриття */}
                <button onClick={handleClose} className="panel-close-btn"><ChevronDownIcon /></button>
            </div>
            <div className="panel-content">
                <div className="cover-carousel">
                    {carouselTracks.map((track, index) => {
                         // Розраховуємо позицію кожної обкладинки відносно активної
                         const diff = index - activeIndex;
                         let positionClass = '';
                         if (diff === 0) positionClass = 'active';
                         else if (diff === -1) positionClass = 'prev-1';
                         else if (diff === -2) positionClass = 'prev-2';
                         else if (diff === 1) positionClass = 'next-1';
                         else if (diff === 2) positionClass = 'next-2';
                         else positionClass = 'hidden'; // Ховаємо занадто далекі обкладинки

                         return (
                            <img 
                                key={`${track.id}-${index}`} // Більш унікальний ключ
                                src={track.coverArtUrl || 'https://placehold.co/280x280/181818/333333?text=K'} 
                                alt={track.title} 
                                className={`carousel-artwork ${positionClass}`}
                            />
                         )
                    })}
                </div>

                <div className="track-details">
                    <h2>{currentTrack.title}</h2>
                    <h3>{currentTrack.authorName}</h3>
                </div>

                <div className="progress-section">
                    <DynamicWaveform />
                    <div className="time-stamps">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="main-controls">
                    <button onClick={playPrev}><PrevIcon/></button>
                    <button onClick={togglePlayPause} className="play-pause-main">{isPlaying ? <PauseIcon/> : <PlayIcon/>}</button>
                    <button onClick={playNext}><NextIcon/></button>
                </div>
                
                <div className="comment-placeholder">Drop a comment...</div>

                <div className="actions-bar">
                    <button className="action-btn"><HeartIcon/> <span>{currentTrack.likesCount || 0}</span></button>
                    <button className="action-btn"><CommentIcon/> <span>0</span></button>
                    <button className="action-btn"><ShareIcon/></button>
                    <button className="action-btn"><OptionsIcon/></button>
                </div>
            </div>
        </div>
    );
};

export default NowPlayingPanel;