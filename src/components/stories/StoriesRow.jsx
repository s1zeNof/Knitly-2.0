import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import { subscribeToFeedStories, groupStoriesByUser } from '../../services/storiesService';
import StoryCircle from './StoryCircle';
import StoryViewer from './StoryViewer';
import CreateStoryModal from './CreateStoryModal';
import './StoriesRow.css';

/**
 * StoriesRow — horizontal scrollable strip of story circles shown at the top
 * of the feed (Home page). Subscribes real-time to Firestore stories.
 *
 * Props:
 *   feedUids  string[]  — UIDs to show stories for (currentUser + following)
 */
const StoriesRow = ({ feedUids = [] }) => {
    const { user: currentUser } = useUserContext();

    const [storyGroups, setStoryGroups] = useState([]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
    const [createOpen, setCreateOpen] = useState(false);

    const scrollRef = useRef(null);

    // ─── Real-time subscription ───────────────────────────────────────────────
    useEffect(() => {
        if (!currentUser?.uid) {
            setStoryGroups([]);
            return;
        }

        // Include own uid
        const uids = [...new Set([currentUser.uid, ...feedUids])];

        const unsubscribe = subscribeToFeedStories(uids, (stories) => {
            const groups = groupStoriesByUser(stories, currentUser.uid);
            setStoryGroups(groups);
        });

        return () => unsubscribe();
    }, [currentUser?.uid, feedUids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Seen state (localStorage) ───────────────────────────────────────────
    const getSeenStoryIds = useCallback(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('knitly_seen_stories') || '[]'));
        } catch {
            return new Set();
        }
    }, []);

    const markStoriesSeen = useCallback((storyIds) => {
        try {
            const seen = getSeenStoryIds();
            storyIds.forEach(id => seen.add(id));
            // Keep only last 500 to avoid localStorage bloat
            const arr = [...seen].slice(-500);
            localStorage.setItem('knitly_seen_stories', JSON.stringify(arr));
        } catch {
            // ignore
        }
    }, [getSeenStoryIds]);

    const hasUnseen = useCallback((group) => {
        if (!group?.stories?.length) return false;
        const seen = getSeenStoryIds();
        return group.stories.some(s => !seen.has(s.id));
    }, [getSeenStoryIds]);

    // ─── Open viewer ─────────────────────────────────────────────────────────
    const openViewer = (groupIndex) => {
        setViewerGroupIndex(groupIndex);
        setViewerOpen(true);
    };

    const handleCircleClick = (group, index) => {
        // If it's the own circle with no stories, open creator instead
        if (group.uid === currentUser?.uid && group.stories.length === 0) {
            setCreateOpen(true);
            return;
        }
        openViewer(index);
    };

    // ─── Scroll ───────────────────────────────────────────────────────────────
    const scroll = (dir) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    };

    // ─── Own circle placeholder (always shown when logged in) ─────────────────
    const ownGroup = storyGroups.find(g => g.uid === currentUser?.uid) || {
        uid: currentUser?.uid,
        userNickname: currentUser?.nickname,
        userDisplayName: currentUser?.displayName,
        userPhotoURL: currentUser?.photoURL,
        stories: [],
    };

    const otherGroups = storyGroups.filter(g => g.uid !== currentUser?.uid);
    const displayGroups = currentUser ? [ownGroup, ...otherGroups] : otherGroups;

    if (!currentUser) return null; // Hide for guests
    if (displayGroups.length === 0 && storyGroups.length === 0) {
        // Show only own placeholder
        return (
            <section className="stories-row-section">
                <div className="stories-row-scroll" ref={scrollRef}>
                    <StoryCircle
                        key="own-empty"
                        group={ownGroup}
                        isOwn
                        hasUnseen={false}
                        onClick={() => setCreateOpen(true)}
                        onAddClick={() => setCreateOpen(true)}
                    />
                </div>
                {createOpen && (
                    <CreateStoryModal onClose={() => setCreateOpen(false)} />
                )}
            </section>
        );
    }

    return (
        <section className="stories-row-section">
            {/* Left scroll arrow */}
            <button className="stories-row-arrow stories-row-arrow--left" onClick={() => scroll(-1)} aria-label="Прокрутити ліворуч">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <div className="stories-row-scroll" ref={scrollRef}>
                {displayGroups.map((group, idx) => {
                    const isOwn = group.uid === currentUser?.uid;
                    return (
                        <StoryCircle
                            key={group.uid}
                            group={group}
                            isOwn={isOwn}
                            hasUnseen={hasUnseen(group)}
                            onClick={() => handleCircleClick(group, idx)}
                            onAddClick={isOwn ? () => setCreateOpen(true) : undefined}
                        />
                    );
                })}
            </div>

            {/* Right scroll arrow */}
            <button className="stories-row-arrow stories-row-arrow--right" onClick={() => scroll(1)} aria-label="Прокрутити праворуч">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* Story Viewer */}
            {viewerOpen && (
                <StoryViewer
                    groups={displayGroups}
                    initialGroupIndex={viewerGroupIndex}
                    currentUserUid={currentUser?.uid}
                    onClose={() => setViewerOpen(false)}
                    onStoriesSeen={markStoriesSeen}
                />
            )}

            {/* Create Story Modal */}
            {createOpen && (
                <CreateStoryModal onClose={() => setCreateOpen(false)} />
            )}
        </section>
    );
};

export default StoriesRow;
