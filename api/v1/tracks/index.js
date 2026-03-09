/**
 * GET /api/v1/tracks
 *
 * Returns a paginated list of public tracks.
 *
 * Query params:
 *   limit      {number}  Items per page (1–100, default 20)
 *   startAfter {string}  Cursor for pagination
 *   genre      {string}  Filter by genre slug
 *   artistId   {string}  Filter by artist UID
 */

import { getDb }                              from '../../_lib/firebase.js';
import { authenticate, setCorsHeaders, rateLimit } from '../../_lib/middleware.js';
import { successResponse, methodNotAllowed }       from '../../_lib/errors.js';

// Fields that are safe to expose externally
const PUBLIC_FIELDS = [
    'title', 'artistName', 'artistId', 'coverArtUrl',
    'duration', 'genre', 'tags', 'playsCount', 'likesCount',
    'type',    // 'original' | 'cover' | 'remix' | 'mashup' | 'fan_upload'
];

function toPublic(id, data) {
    const track = { id };
    for (const field of PUBLIC_FIELDS) {
        if (data[field] !== undefined) track[field] = data[field];
    }
    track.createdAt = data.createdAt?.toDate?.()?.toISOString() ?? null;
    return track;
}

export default async function handler(req, res) {
    if (!setCorsHeaders(req, res)) return;

    if (req.method !== 'GET') {
        return methodNotAllowed(res, ['GET']);
    }

    const bot = await authenticate(req, res);
    if (!bot) return;

    const ok = await rateLimit(req, res, `tracks:list:${bot.id}`, { limit: 60, windowSec: 60 });
    if (!ok) return;

    const rawLimit    = parseInt(req.query.limit ?? '20', 10);
    const parsedLimit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);
    const { startAfter, genre, artistId } = req.query;

    const db = getDb();

    let query = db.collection('tracks')
        .where('isPublic', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(parsedLimit);

    if (genre)    query = query.where('genre',    '==', genre);
    if (artistId) query = query.where('artistId', '==', artistId);

    if (startAfter) {
        const cursorSnap = await db.collection('tracks').doc(startAfter).get();
        if (cursorSnap.exists) query = query.startAfter(cursorSnap);
    }

    const snap   = await query.get();
    const tracks = snap.docs.map((d) => toPublic(d.id, d.data()));

    return successResponse(res, {
        tracks,
        nextCursor: snap.size === parsedLimit ? (tracks[tracks.length - 1]?.id ?? null) : null,
    });
}
