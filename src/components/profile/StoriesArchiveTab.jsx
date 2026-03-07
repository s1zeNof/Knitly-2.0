import React, { useState, useEffect } from 'react';
import { fetchAllUserStories } from '../../services/storiesService';
import StoryViewer from '../stories/StoryViewer';
import './StoriesArchiveTab.css';

const IcoPlay = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z" /></svg>;
const IcoClock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48" style={{ opacity: 0.5, marginBottom: '1rem' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

export default function StoriesArchiveTab({ profileUser }) {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [initialStoryIndex, setInitialStoryIndex] = useState(0);

    useEffect(() => {
        if (!profileUser?.uid) return;

        const loadArchive = async () => {
            setLoading(true);
            try {
                // Fetch ALL stories for the user, regardless of expiration
                const allStories = await fetchAllUserStories(profileUser.uid);
                setStories(allStories);
            } catch (error) {
                console.error("Error fetching archived stories:", error);
            } finally {
                setLoading(false);
            }
        };

        loadArchive();
    }, [profileUser?.uid]);

    const handleOpenStory = (index) => {
        // By reversing the index, we make sure the viewer opens the exact story clicked
        // Note: stories array is sorted descending (newest first). 
        // The StoryViewer usually expects chronological arrays for a given user if we want them to play sequentially.
        // Reversing here so they play from oldest to newest in the viewer, but are shown newest first in the grid?
        // Actually, let's keep the grid sorting as is (newest first). 
        // In the viewer, they play 0 -> n. If we pass the array as is, they will play newest -> oldest.
        // Let's pass the array reversed to the viewer, so it plays chronologically (oldest -> newest).

        // The clicked index in the original array (newest first) 
        // needs to be mapped to the chronological array (oldest first)
        const reversedIndex = (stories.length - 1) - index;

        setInitialStoryIndex(reversedIndex);
        setViewerOpen(true);
    };

    if (loading) {
        return (
            <div className="archive-loading">
                <div className="adm-spinner"></div>
            </div>
        );
    }

    if (stories.length === 0) {
        return (
            <div className="page-profile-tab-placeholder">
                <IcoClock />
                <p>Архів історій порожній</p>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ваші опубліковані історії з'являтимуться тут після закінчення терміну дії.</span>
            </div>
        );
    }

    return (
        <div className="archive-tab-container">
            <div className="archive-header">
                <h3>Архів історій</h3>
                <span className="archive-count">{stories.length} {stories.length === 1 ? 'історія' : 'історій'}</span>
            </div>

            <div className="archive-grid">
                {stories.map((story, index) => {
                    const isVideo = story.mediaType === 'video';
                    const date = story.createdAt?.toDate ? story.createdAt.toDate() : new Date();
                    const dateStr = date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });

                    return (
                        <div
                            key={story.id}
                            className="archive-grid-item"
                            onClick={() => handleOpenStory(index)}
                        >
                            <div className="archive-media-wrapper">
                                {isVideo ? (
                                    <>
                                        <video src={story.mediaUrl} className="archive-media" preload="none" muted />
                                        <div className="archive-video-indicator"><IcoPlay /></div>
                                    </>
                                ) : (
                                    <img src={story.mediaUrl} alt="Story thumbnail" className="archive-media" />
                                )}
                                <div className="archive-overlay"></div>
                                <div className="archive-date-badge">{dateStr}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {viewerOpen && (
                <StoryViewer
                    // Map correctly to chronological order for the viewer
                    groups={[{
                        uid: profileUser.uid,
                        userNickname: profileUser.nickname,
                        userDisplayName: profileUser.displayName,
                        userPhotoURL: profileUser.photoURL || null,
                        stories: [...stories].reverse()
                    }]}
                    initialGroupIndex={0}
                    initialStoryIndex={initialStoryIndex} // Pass the explicitly mapped index
                    currentUserUid={profileUser.uid}
                    onClose={() => setViewerOpen(false)}
                />
            )}
        </div>
    );
}
