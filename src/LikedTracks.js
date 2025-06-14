import React from 'react';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext';
import { db } from './firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { useQuery } from 'react-query';
import './TrackList.css'; 

const DEFAULT_COVER_URL = 'https://placehold.co/256x256/181818/333333?text=K';

const PlayIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;

const fetchLikedTracks = async (likedTrackIds) => {
    if (!likedTrackIds || likedTrackIds.length === 0) {
        return [];
    }
    const tracksRef = collection(db, 'tracks');
    const q = query(tracksRef, where(documentId(), 'in', likedTrackIds.slice(0, 10)));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const LikedTracks = () => {
    const { user: currentUser } = useUserContext();
    const { currentTrack, isPlaying, handlePlayPause } = usePlayerContext();

    const { data: tracks, isLoading } = useQuery(
        ['likedTracks', currentUser?.uid], 
        () => fetchLikedTracks(currentUser.likedTracks),
        {
            enabled: !!currentUser?.likedTracks,
        }
    );
    
    if (isLoading) return <div className="tracklist-placeholder">Завантаження...</div>;
    if (!tracks || tracks.length === 0) return <div className="tracklist-placeholder">Ви ще не вподобали жодного треку.</div>;

    return (
        <div className="tracks-as-list">
            {tracks.map(track => (
                <div key={track.id} className="track-item-list">
                    <img src={track.coverArtUrl || DEFAULT_COVER_URL} alt={track.title} className="track-cover-list"/>
                    <button className="play-button-list" onClick={() => handlePlayPause(track)}>
                        {isPlaying && currentTrack?.id === track.id ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <div className="track-info-list">
                        <p className="track-title-list">{track.title}</p>
                        <p className="track-artist-list">{track.authorName}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LikedTracks;