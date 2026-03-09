/**
 * GET /api/v1/tracks/:id
 *
 * Returns a single public track by its Firestore document ID.
 * Returns 404 if the track does not exist or is not public.
 */

import { getDb }                              from '../../_lib/firebase.js';
import { authenticate, setCorsHeaders }       from '../../_lib/middleware.js';
import {
    ApiError, ERROR_CODE, HTTP,
    successResponse, errorResponse, methodNotAllowed,
} from '../../_lib/errors.js';

const PUBLIC_FIELDS = [
    'title', 'artistName', 'artistId', 'coverArtUrl',
    'duration', 'genre', 'tags', 'playsCount', 'likesCount', 'type',
];

export default async function handler(req, res) {
    if (!setCorsHeaders(req, res)) return;

    if (req.method !== 'GET') {
        return methodNotAllowed(res, ['GET']);
    }

    const bot = await authenticate(req, res);
    if (!bot) return;

    const { id } = req.query;
    const snap   = await getDb().collection('tracks').doc(id).get();

    if (!snap.exists || !snap.data().isPublic) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.NOT_FOUND,
            'Track not found.',
            HTTP.NOT_FOUND,
        ));
    }

    const data  = snap.data();
    const track = { id: snap.id };
    for (const field of PUBLIC_FIELDS) {
        if (data[field] !== undefined) track[field] = data[field];
    }
    track.createdAt = data.createdAt?.toDate?.()?.toISOString() ?? null;

    return successResponse(res, track);
}
