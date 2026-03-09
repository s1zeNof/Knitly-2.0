/**
 * GET /api/v1/gifts/collection/:uid
 *
 * Returns the paginated list of gifts received by a user.
 * Only publicly visible gift data is exposed (no internal tokenHash etc.)
 *
 * Query params:
 *   limit      {number}  Max items to return (1–100, default 20)
 *   startAfter {string}  Cursor — ID of the last item from the previous page
 */

import { getDb }                     from '../../../_lib/firebase.js';
import { authenticate, setCorsHeaders, rateLimit } from '../../../_lib/middleware.js';
import { successResponse, methodNotAllowed }       from '../../../_lib/errors.js';

export default async function handler(req, res) {
    if (!setCorsHeaders(req, res)) return;

    if (req.method !== 'GET') {
        return methodNotAllowed(res, ['GET']);
    }

    const bot = await authenticate(req, res);
    if (!bot) return;

    const ok = await rateLimit(req, res, `gifts:collection:${bot.id}`, { limit: 60, windowSec: 60 });
    if (!ok) return;

    const { uid }        = req.query;
    const rawLimit       = parseInt(req.query.limit ?? '20', 10);
    const parsedLimit    = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);
    const { startAfter } = req.query;

    const db = getDb();

    let query = db.collection('sent_gifts')
        .where('recipientId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(parsedLimit);

    if (startAfter) {
        const cursorSnap = await db.collection('sent_gifts').doc(startAfter).get();
        if (cursorSnap.exists) query = query.startAfter(cursorSnap);
    }

    const snap  = await query.get();
    const gifts = snap.docs.map((d) => {
        const data = d.data();
        return {
            id:          d.id,
            giftId:      data.giftId,
            senderId:    data.senderId,
            trackId:     data.trackId   ?? null,
            message:     data.message   ?? '',
            type:        data.type,
            status:      data.status,
            createdAt:   data.createdAt?.toDate?.()?.toISOString() ?? null,
        };
    });

    const nextCursor = snap.size === parsedLimit ? (gifts[gifts.length - 1]?.id ?? null) : null;

    return successResponse(res, { gifts, nextCursor });
}
