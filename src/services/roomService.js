/**
 * roomService.js — Knitly Rooms
 * All Firestore operations for collaborative listening rooms.
 * Architecture: pure functions, no React dependencies.
 */

import { db } from './firebase';
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    increment,
    deleteField,
} from 'firebase/firestore';

/* ── Helpers ───────────────────────────────────────────────────── */
const normalizeTrack = (track) => ({
    id: track.id || '',
    title: track.title || 'Невідомий трек',
    artist: track.artist || track.authorName || track.authors?.[0]?.displayName || 'Невідомий артист',
    coverArtUrl: track.coverArtUrl || track.coverUrl || track.imageUrl || null,
    audioUrl: track.audioUrl || track.url || track.fileUrl || '',
    duration: track.duration || 0,
});

/* ── Create ────────────────────────────────────────────────────── */
/**
 * Create a new room. Returns the new room's ID.
 */
export const createRoom = async (hostUser, roomData) => {
    const roomRef = doc(collection(db, 'rooms'));

    const room = {
        name: (roomData.name || '').trim(),
        description: (roomData.description || '').trim(),
        hostId: hostUser.uid,
        hostInfo: {
            uid: hostUser.uid,
            displayName: hostUser.displayName || 'Артист',
            photoURL: hostUser.photoURL || null,
            nickname: hostUser.nickname || hostUser.slug || '',
        },
        isPublic: roomData.isPublic ?? true,
        maxParticipants: roomData.maxParticipants || 50,
        tags: roomData.tags || [],
        coverUrl: roomData.coverUrl || null,
        // Playback state
        currentTrack: null,
        isPlaying: false,
        playbackOffset: 0,
        syncedAt: null,
        // Queue
        queue: [],
        // Participants map — uid → { displayName, photoURL, joinedAt }
        participants: {
            [hostUser.uid]: {
                displayName: hostUser.displayName || '',
                photoURL: hostUser.photoURL || null,
                joinedAt: serverTimestamp(),
            },
        },
        participantsCount: 1,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(roomRef, room);
    return roomRef.id;
};

/* ── Join / Leave ──────────────────────────────────────────────── */
export const joinRoom = async (roomId, user) => {
    if (!roomId || !user?.uid) return;
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
        [`participants.${user.uid}`]: {
            displayName: user.displayName || '',
            photoURL: user.photoURL || null,
            joinedAt: serverTimestamp(),
        },
        participantsCount: increment(1),
        updatedAt: serverTimestamp(),
    });
};

export const leaveRoom = async (roomId, userId) => {
    if (!roomId || !userId) return;
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;

    // Always just remove the participant — room keeps running even if host leaves
    await updateDoc(roomRef, {
        [`participants.${userId}`]: deleteField(),
        participantsCount: increment(-1),
        updatedAt: serverTimestamp(),
    });
};

// Explicitly end the room — only callable by the host via UI button
export const endRoom = async (roomId) => {
    if (!roomId) return;
    await updateDoc(doc(db, 'rooms', roomId), {
        status: 'ended',
        updatedAt: serverTimestamp(),
    });
};

/* ── Playback (host only) ──────────────────────────────────────── */
export const playTrack = async (roomId, track) => {
    await updateDoc(doc(db, 'rooms', roomId), {
        currentTrack: normalizeTrack(track),
        isPlaying: true,
        playbackOffset: 0,
        syncedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

export const syncPlayback = async (roomId, { isPlaying, playbackOffset }) => {
    await updateDoc(doc(db, 'rooms', roomId), {
        isPlaying,
        playbackOffset,
        syncedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

export const skipTrack = async (roomId, currentQueue) => {
    if (!currentQueue || currentQueue.length === 0) {
        await updateDoc(doc(db, 'rooms', roomId), {
            currentTrack: null,
            isPlaying: false,
            playbackOffset: 0,
            syncedAt: null,
            updatedAt: serverTimestamp(),
        });
        return;
    }

    const [nextTrack, ...remainingQueue] = currentQueue;
    await updateDoc(doc(db, 'rooms', roomId), {
        currentTrack: normalizeTrack(nextTrack),
        isPlaying: true,
        playbackOffset: 0,
        syncedAt: serverTimestamp(),
        queue: remainingQueue,
        updatedAt: serverTimestamp(),
    });
};

/* ── Queue (host only) ─────────────────────────────────────────── */
export const addToQueue = async (roomId, track) => {
    await updateDoc(doc(db, 'rooms', roomId), {
        queue: arrayUnion(normalizeTrack(track)),
        updatedAt: serverTimestamp(),
    });
};

export const removeFromQueue = async (roomId, track) => {
    await updateDoc(doc(db, 'rooms', roomId), {
        queue: arrayRemove(normalizeTrack(track)),
        updatedAt: serverTimestamp(),
    });
};

/* ── Messages ──────────────────────────────────────────────────── */
export const sendMessage = async (roomId, user, text) => {
    if (!text?.trim()) return;
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        senderId: user.uid,
        senderDisplayName: user.displayName || 'Користувач',
        senderPhotoURL: user.photoURL || null,
        text: text.trim(),
        type: 'text',
        timestamp: serverTimestamp(),
    });
};

export const sendSystemMessage = async (roomId, text) => {
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        senderId: 'system',
        senderDisplayName: 'Knitly',
        senderPhotoURL: null,
        text,
        type: 'system',
        timestamp: serverTimestamp(),
    });
};

/* ── Real-time listeners ───────────────────────────────────────── */
export const listenToRoom = (roomId, callback) => {
    if (!roomId) return () => {};
    return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
        callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    }, (error) => {
        console.error('[listenToRoom] error:', error);
        callback(null);
    });
};

export const listenToMessages = (roomId, callback, msgLimit = 150) => {
    if (!roomId) return () => {};
    const q = query(
        collection(db, 'rooms', roomId, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(msgLimit)
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
        console.error('[listenToMessages] error:', error);
    });
};

export const listenToPublicRooms = (callback, limitCount = 50) => {
    // Only single equality filter — no orderBy on a different field to avoid composite index.
    // Sorting is done client-side: by participantsCount desc, then updatedAt desc.
    const q = query(
        collection(db, 'rooms'),
        where('status', '==', 'active'),
        limit(limitCount)
    );
    return onSnapshot(q, (snap) => {
        const rooms = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(r => r.isPublic !== false)
            .sort((a, b) => {
                const countDiff = (b.participantsCount || 0) - (a.participantsCount || 0);
                if (countDiff !== 0) return countDiff;
                const aTime = a.updatedAt?.toMillis?.() || 0;
                const bTime = b.updatedAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
        callback(rooms);
    }, (error) => {
        console.error('[listenToPublicRooms] error:', error);
        callback([]);
    });
};
