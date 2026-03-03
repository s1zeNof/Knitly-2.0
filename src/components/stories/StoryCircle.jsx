import React from 'react';
import './StoryCircle.css';
import default_picture from '../../img/Default-Images/default-picture.svg';

/**
 * StoryCircle — one avatar circle in the Stories row.
 *
 * Props:
 *   group          { uid, userNickname, userDisplayName, userPhotoURL, stories[] }
 *   isOwn          boolean — current user's own circle (shows + button)
 *   hasUnseen      boolean — shows gradient ring if user has unseen stories
 *   onClick        () => void
 *   onAddClick     () => void — only for own circle
 */
const StoryCircle = ({ group, isOwn, hasUnseen, onClick, onAddClick }) => {
    const photoURL = group?.userPhotoURL || null;
    const label = isOwn ? 'Ваша' : (group?.userDisplayName || group?.userNickname || 'Користувач');

    const handleAdd = (e) => {
        e.stopPropagation();
        onAddClick?.();
    };

    return (
        <div className="story-circle-wrapper" onClick={onClick} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
            aria-label={`Сторіс ${label}`}
        >
            <div className={`story-circle-ring ${hasUnseen ? 'story-circle-ring--unseen' : 'story-circle-ring--seen'} ${!group?.stories?.length && isOwn ? 'story-circle-ring--empty' : ''}`}>
                <div className="story-circle-avatar-wrap">
                    <img
                        src={photoURL || default_picture}
                        alt={label}
                        className="story-circle-avatar"
                        onError={(e) => { e.target.onerror = null; e.target.src = default_picture; }}
                    />
                </div>
            </div>

            {/* + button for own circle */}
            {isOwn && (
                <button
                    className="story-circle-add-btn"
                    onClick={handleAdd}
                    aria-label="Додати сторіс"
                    title="Додати сторіс"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            )}

            <span className="story-circle-label">{isOwn ? 'Ваша' : label}</span>
        </div>
    );
};

export default StoryCircle;
