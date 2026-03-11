import React from 'react';
import { useNavigate } from 'react-router-dom';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './RoomCard.css';

const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
);

const MusicNoteIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
);

const LiveDot = () => <span className="room-card__live-dot" aria-label="Живий ефір" />;

const RoomCard = ({ room }) => {
    const navigate = useNavigate();

    if (!room) return null;

    const {
        id,
        name,
        description,
        hostInfo,
        currentTrack,
        participantsCount = 0,
        maxParticipants = 50,
        tags = [],
        coverUrl,
        isPlaying,
    } = room;

    const coverSrc = coverUrl || currentTrack?.coverArtUrl || null;
    const isFull = participantsCount >= maxParticipants;

    return (
        <article
            className={`room-card${isFull ? ' room-card--full' : ''}`}
            onClick={() => navigate(`/rooms/${id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/rooms/${id}`)}
            aria-label={`Кімната: ${name}`}
        >
            {/* Cover */}
            <div className="room-card__cover">
                {coverSrc ? (
                    <img src={coverSrc} alt={name} className="room-card__cover-img" />
                ) : (
                    <div className="room-card__cover-placeholder">
                        <MusicNoteIcon />
                    </div>
                )}
                {isPlaying && <LiveDot />}
                {isFull && <span className="room-card__full-badge">Повно</span>}
            </div>

            {/* Body */}
            <div className="room-card__body">
                <h3 className="room-card__name">{name}</h3>

                {/* Host */}
                <div className="room-card__host">
                    <img
                        className="room-card__host-avatar"
                        src={hostInfo?.photoURL || default_picture}
                        alt={hostInfo?.displayName}
                        onError={(e) => { e.target.src = default_picture; }}
                    />
                    <span className="room-card__host-name">{hostInfo?.displayName}</span>
                </div>

                {/* Now playing */}
                {currentTrack && (
                    <p className="room-card__now-playing">
                        <MusicNoteIcon />
                        {currentTrack.title}
                        {currentTrack.artist && (
                            <span className="room-card__np-artist"> · {currentTrack.artist}</span>
                        )}
                    </p>
                )}

                {description && (
                    <p className="room-card__desc">{description}</p>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="room-card__tags">
                        {tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="room-card__tag">#{tag}</span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="room-card__footer">
                    <span className="room-card__count">
                        <UsersIcon />
                        {participantsCount} / {maxParticipants}
                    </span>
                    <button
                        className={`room-card__join-btn${isFull ? ' room-card__join-btn--disabled' : ''}`}
                        onClick={(e) => { e.stopPropagation(); navigate(`/rooms/${id}`); }}
                        disabled={isFull}
                    >
                        {isFull ? 'Повно' : 'Приєднатись'}
                    </button>
                </div>
            </div>
        </article>
    );
};

export default RoomCard;
