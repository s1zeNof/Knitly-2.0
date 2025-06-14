import React from 'react';
import { usePlayerContext } from './PlayerContext';
import './QueuePanel.css'; // Новий файл стилів

const RemoveIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const QueuePanel = ({ isVisible, onClose }) => {
    const { queue, currentTrack, removeFromQueue, handlePlayPause } = usePlayerContext();

    if (!isVisible) return null;

    return (
        <div className="queue-panel-overlay" onClick={onClose}>
            <div className="queue-panel" onClick={e => e.stopPropagation()}>
                <div className="queue-panel-header">
                    <h3>Черга відтворення</h3>
                    <button className="queue-panel-close" onClick={onClose}>&times;</button>
                </div>
                <div className="queue-panel-list">
                    {currentTrack && (
                        <div className="queue-item now-playing">
                            <img src={currentTrack.coverArtUrl || 'https://via.placeholder.com/40'} alt={currentTrack.title} />
                            <div className="queue-item-info">
                                <p>{currentTrack.title}</p>
                                <span>Зараз грає</span>
                            </div>
                        </div>
                    )}
                    {queue.length > 0 ? (
                        queue.map((track, index) => (
                             <div key={`${track.id}-${index}`} className="queue-item">
                                <img src={track.coverArtUrl || 'https://via.placeholder.com/40'} alt={track.title} />
                                <div className="queue-item-info">
                                    <p>{track.title}</p>
                                    <span>{track.authorName}</span>
                                </div>
                                <button className="queue-item-remove" onClick={() => removeFromQueue(index)}>
                                    <RemoveIcon />
                                </button>
                            </div>
                        ))
                    ) : (
                       !currentTrack && <p className="queue-empty">Черга порожня</p> 
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueuePanel;