import React from 'react';
import './NowPlayingBanner.css';

/**
 * NowPlayingBanner — glassmorphism widget shown on the profile banner
 * when the user is broadcasting their current track (via settings or "НОВІ" button).
 *
 * Props:
 *   nowPlaying: { id, title, artist, coverUrl, updatedAt }
 */
const NowPlayingBanner = ({ nowPlaying }) => {
    if (!nowPlaying) return null;

    return (
        <div className="now-playing-banner">
            {nowPlaying.coverUrl ? (
                <img
                    src={nowPlaying.coverUrl}
                    alt="Cover"
                    className="now-playing-banner-cover"
                />
            ) : (
                <div className="now-playing-banner-cover now-playing-banner-cover-placeholder" />
            )}
            <div className="now-playing-banner-body">
                {/* Animated equalizer bars */}
                <div className="now-playing-equalizer" aria-hidden="true">
                    <span /><span /><span /><span />
                </div>
                <div className="now-playing-banner-text">
                    <span className="now-playing-banner-label">Слухає зараз</span>
                    <span className="now-playing-banner-title">{nowPlaying.title}</span>
                    {nowPlaying.artist && (
                        <span className="now-playing-banner-artist">{nowPlaying.artist}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NowPlayingBanner;
