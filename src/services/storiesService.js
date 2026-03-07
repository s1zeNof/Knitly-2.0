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
    serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadFileWithProgress } from './supabase'; // uses Cloudinary under the hood

const STORIES_COLLECTION = 'stories';
const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Compress image before upload ────────────────────────────────────────────

/**
 * Compress an image File using canvas.
 * Resizes to max 1920px on the longest side, outputs JPEG at 85% quality.
 * Keeps video/non-image files untouched.
 * Target output: < 3 MB for a 1920px image.
 */
const compressImageFile = (file) => {
    // Only compress images; leave videos/other files alone
    if (!file.type.startsWith('image/')) return Promise.resolve(file);

    // If already small enough (< 3 MB), skip compression
    const MB3 = 3 * 1024 * 1024;
    if (file.size <= MB3) {
        console.log(`[Upload] File ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB — no compression needed`);
        return Promise.resolve(file);
    }

    console.log(`[Upload] Compressing ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB → target < 3 MB`);

    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const MAX_DIM = 1920;
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                    height = Math.round((height * MAX_DIM) / width);
                    width = MAX_DIM;
                } else {
                    width = Math.round((width * MAX_DIM) / height);
                    height = MAX_DIM;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) return resolve(file); // fallback to original if canvas fails
                    const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    console.log(`[Upload] Compressed: ${(compressed.size / 1024 / 1024).toFixed(2)} MB`);
                    resolve(compressed);
                },
                'image/jpeg',
                0.85
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(file); // fallback to original on error
        };

        img.src = objectUrl;
    });
};

/**
 * Upload a photo or video blob to Cloudinary.
 * Automatically compresses large images before upload.
 * Returns the secure URL.
 */
export const uploadStoryMedia = async (file, onProgress) => {
    const fileToUpload = await compressImageFile(file);
    return uploadFileWithProgress(fileToUpload, 'stories', `stories/${Date.now()}_${fileToUpload.name || 'story'}`, onProgress);
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
        likes: [],
    };

    const docRef = await addDoc(collection(db, STORIES_COLLECTION), storyData);
    return { id: docRef.id, ...storyData };
};

// ─── Like / Unlike a story ───────────────────────────────────────────────────

/**
 * Toggle like on a story. Optimistic — returns new liked state.
 */
export const likeStory = (storyId, uid) =>
    updateDoc(doc(db, STORIES_COLLECTION, storyId), { likes: arrayUnion(uid) });

export const unlikeStory = (storyId, uid) =>
    updateDoc(doc(db, STORIES_COLLECTION, storyId), { likes: arrayRemove(uid) });

/**
 * Send a notification to the story author when someone likes their story.
 */
export const sendStoryLikeNotification = async (storyAuthorUid, storyId, fromUser, mediaUrl) => {
    if (storyAuthorUid === fromUser.uid) return; // don't notify yourself
    const notifRef = collection(db, 'users', storyAuthorUid, 'notifications');
    await addDoc(notifRef, {
        type: 'story_like',
        fromUser: {
            uid: fromUser.uid,
            displayName: fromUser.displayName || fromUser.userDisplayName || '',
            nickname: fromUser.nickname || fromUser.userNickname || '',
            photoURL: fromUser.photoURL || fromUser.userPhotoURL || null,
        },
        storyId,
        mediaUrl: mediaUrl || null, // thumbnail for notification
        entityLink: null, // viewer opens by storyId on author profile
        read: false,
        timestamp: serverTimestamp(),
    });
};

// ─── Fetch active stories ─────────────────────────────────────────────────────

/**
 * Fetch all non-expired stories for a list of UIDs (following + self).
 * Stories are grouped by UID and sorted newest-first within each group.
 */
export const fetchStoriesForFeed = async (uids) => {
    if (!uids || uids.length === 0) return [];

    // No orderBy/expiresAt filter in Firestore query — avoids composite index.
    // Expiry + sort is handled client-side.
    const chunks = [];
    for (let i = 0; i < uids.length; i += 30) {
        chunks.push(uids.slice(i, i + 30));
    }

    const now = Timestamp.now();
    const allDocs = [];
    for (const chunk of chunks) {
        const q = query(
            collection(db, STORIES_COLLECTION),
            where('uid', 'in', chunk)
        );
        const snap = await getDocs(q);
        snap.forEach(d => {
            const data = { id: d.id, ...d.data() };
            if (data.expiresAt && data.expiresAt.toMillis() > now.toMillis()) {
                allDocs.push(data);
            }
        });
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
        where('uid', '==', uid)
    );
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.expiresAt && s.expiresAt.toMillis() > now.toMillis())
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
};

/**
 * Fetch ALL stories for a single user (for Archive view), including expired ones.
 */
export const fetchAllUserStories = async (uid) => {
    if (!uid) return [];
    const q = query(
        collection(db, STORIES_COLLECTION),
        where('uid', '==', uid)
    );
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
};

/**
 * Real-time listener for feed stories.
 * Calls onUpdate(stories[]) whenever data changes.
 */
export const subscribeToFeedStories = (uids, onUpdate) => {
    if (!uids || uids.length === 0) {
        onUpdate([]);
        return () => { };
    }
    // Simple query — no orderBy/inequality filter — avoids composite index entirely.
    // Expiry filter and sort are done client-side.
    const chunk = uids.slice(0, 30);
    const q = query(
        collection(db, STORIES_COLLECTION),
        where('uid', 'in', chunk)
    );
    return onSnapshot(
        q,
        (snap) => {
            const now = Timestamp.now();
            const stories = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(s => s.expiresAt && s.expiresAt.toMillis() > now.toMillis());
            onUpdate(stories);
        },
        (error) => {
            if (error.code === 'permission-denied') {
                console.warn('[Stories] Firestore permission denied — check firestore.rules.');
            } else {
                console.warn('[Stories] Firestore error:', error.code, error.message);
            }
            onUpdate([]);
        }
    );
};

/**
 * Real-time listener for a single user's active stories.
 * Used on profile pages to show story ring + open viewer.
 */
export const subscribeToUserStories = (uid, onUpdate) => {
    if (!uid) {
        onUpdate([]);
        return () => { };
    }
    const q = query(
        collection(db, STORIES_COLLECTION),
        where('uid', '==', uid)
    );
    return onSnapshot(
        q,
        (snap) => {
            const now = Timestamp.now();
            const stories = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(s => s.expiresAt && s.expiresAt.toMillis() > now.toMillis())
                .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
            onUpdate(stories);
        },
        (error) => {
            console.warn('[Stories] subscribeToUserStories error:', error.code);
            onUpdate([]);
        }
    );
};

// ─── Delete a story ───────────────────────────────────────────────────────────

export const deleteStory = async (storyId) => {
    await deleteDoc(doc(db, STORIES_COLLECTION, storyId));
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
