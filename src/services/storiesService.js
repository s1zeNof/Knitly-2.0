/**
 * storiesService.js
 * Firestore CRUD + Cloudinary upload for the Stories feature.
 *
 * Firestore schema:
 *   stories/{storyId} {
 *     uid           : string          — author uid
 *     userNickname  : string
 *     userDisplayName: string
 *     userPhotoURL  : string | null
 *     mediaType     : 'photo' | 'video'
 *     mediaUrl      : string          — Cloudinary URL
 *     caption       : string          — optional text overlay
 *     createdAt     : Timestamp
 *     expiresAt     : Timestamp       — createdAt + 24 h
 *     views         : string[]        — UIDs who viewed
 *   }
 */

import {
    collection, addDoc, getDocs, query, where,
    orderBy, serverTimestamp, Timestamp, doc, updateDoc, arrayUnion, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadFileWithProgress } from './supabase'; // uses Cloudinary under the hood

const STORIES_COLLECTION = 'stories';
const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Upload media to Cloudinary ──────────────────────────────────────────────

/**
 * Upload a photo or video blob to Cloudinary.
 * Returns the secure URL.
 */
export const uploadStoryMedia = (file, onProgress) => {
    return uploadFileWithProgress(file, 'stories', `stories/${Date.now()}_${file.name || 'story'}`, onProgress);
};

// ─── Create a story ───────────────────────────────────────────────────────────

/**
 * Publish a new story to Firestore.
 * @param {{ uid, userNickname, userDisplayName, userPhotoURL }} author
 * @param {'photo'|'video'} mediaType
 * @param {string} mediaUrl
 * @param {string} [caption]
 */
export const createStory = async (author, mediaType, mediaUrl, caption = '') => {
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + STORY_DURATION_MS);

    const storyData = {
        uid: author.uid,
        userNickname: author.userNickname || author.nickname || '',
        userDisplayName: author.userDisplayName || author.displayName || '',
        userPhotoURL: author.userPhotoURL || author.photoURL || null,
        mediaType,
        mediaUrl,
        caption,
        createdAt: serverTimestamp(),
        expiresAt,
        views: [],
    };

    const docRef = await addDoc(collection(db, STORIES_COLLECTION), storyData);
    return { id: docRef.id, ...storyData };
};

// ─── Fetch active stories ─────────────────────────────────────────────────────

/**
 * Fetch all non-expired stories for a list of UIDs (following + self).
 * Stories are grouped by UID and sorted newest-first within each group.
 */
export const fetchStoriesForFeed = async (uids) => {
    if (!uids || uids.length === 0) return [];

    const now = Timestamp.now();
    // Firestore `in` supports max 30 items; split if needed
    const chunks = [];
    for (let i = 0; i < uids.length; i += 30) {
        chunks.push(uids.slice(i, i + 30));
    }

    const allDocs = [];
    for (const chunk of chunks) {
        const q = query(
            collection(db, STORIES_COLLECTION),
            where('uid', 'in', chunk),
            where('expiresAt', '>', now),
            orderBy('expiresAt', 'asc'),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        snap.forEach(d => allDocs.push({ id: d.id, ...d.data() }));
    }

    return allDocs;
};

/**
 * Fetch all active stories for a single user (for profile view).
 */
export const fetchUserStories = async (uid) => {
    if (!uid) return [];
    const now = Timestamp.now();
    const q = query(
        collection(db, STORIES_COLLECTION),
        where('uid', '==', uid),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc'),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Real-time listener for feed stories.
 * Calls onUpdate(stories[]) whenever data changes.
 */
export const subscribeToFeedStories = (uids, onUpdate) => {
    if (!uids || uids.length === 0) {
        onUpdate([]);
        return () => {};
    }
    const now = Timestamp.now();
    // Only listen to the first chunk (≤30) for real-time; larger lists use polling
    const chunk = uids.slice(0, 30);
    const q = query(
        collection(db, STORIES_COLLECTION),
        where('uid', 'in', chunk),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc'),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(
        q,
        (snap) => {
            const stories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            onUpdate(stories);
        },
        (error) => {
            // Graceful degradation: if Firestore rules haven't been deployed yet
            // or the index is missing, show empty stories (don't crash the app)
            if (error.code === 'permission-denied') {
                console.warn('[Stories] Firestore permission denied — check firestore.rules. Stories disabled until rules are deployed.');
            } else if (error.code === 'failed-precondition') {
                console.warn('[Stories] Firestore composite index missing. Create the index from the link in the console.');
            } else {
                console.warn('[Stories] Firestore error:', error.code, error.message);
            }
            onUpdate([]);
        }
    );
};

// ─── Mark as viewed ───────────────────────────────────────────────────────────

export const markStoryViewed = async (storyId, viewerUid) => {
    if (!storyId || !viewerUid) return;
    try {
        await updateDoc(doc(db, STORIES_COLLECTION, storyId), {
            views: arrayUnion(viewerUid),
        });
    } catch (e) {
        // non-critical — ignore
    }
};

// ─── Group by user ────────────────────────────────────────────────────────────

/**
 * Group a flat list of stories by uid.
 * Returns [{ uid, userNickname, userDisplayName, userPhotoURL, stories[] }]
 * sorted so own profile comes first, then others in chronological order of
 * their newest story.
 */
export const groupStoriesByUser = (stories, currentUid) => {
    const map = new Map();
    for (const story of stories) {
        if (!map.has(story.uid)) {
            map.set(story.uid, {
                uid: story.uid,
                userNickname: story.userNickname,
                userDisplayName: story.userDisplayName,
                userPhotoURL: story.userPhotoURL,
                stories: [],
            });
        }
        map.get(story.uid).stories.push(story);
    }

    // Sort stories within each group newest-first
    for (const group of map.values()) {
        group.stories.sort((a, b) => {
            const aMs = a.createdAt?.toMillis?.() ?? 0;
            const bMs = b.createdAt?.toMillis?.() ?? 0;
            return bMs - aMs;
        });
    }

    const groups = Array.from(map.values());
    // Own stories first, then others sorted by newest story
    groups.sort((a, b) => {
        if (a.uid === currentUid) return -1;
        if (b.uid === currentUid) return 1;
        const aMs = a.stories[0]?.createdAt?.toMillis?.() ?? 0;
        const bMs = b.stories[0]?.createdAt?.toMillis?.() ?? 0;
        return bMs - aMs;
    });

    return groups;
};
