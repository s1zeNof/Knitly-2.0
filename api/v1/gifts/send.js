/**
 * POST /api/v1/gifts/send
 *
 * Send a gift to a Knitly user. Optionally attach the gift to a specific track.
 *
 * Body:
 *   recipientId  {string}  required — UID of the receiving user
 *   giftId       {string}  required — Firestore ID of the gift to send
 *   trackId      {string}  optional — Attach the gift to this track
 *   message      {string}  optional — Personal message (max 200 chars)
 *
 * The operation is performed as a Firestore batch write to ensure atomicity:
 *   1. A sent_gift document is created
 *   2. mintedCount is incremented (for limited gifts)
 *   3. A notification is delivered to the recipient
 */

import { getDb, FieldValue }                          from '../../_lib/firebase.js';
import { authenticate, rateLimit, setCorsHeaders, validateBody } from '../../_lib/middleware.js';
import {
    ApiError, ERROR_CODE, HTTP,
    successResponse, errorResponse, methodNotAllowed,
} from '../../_lib/errors.js';

const MAX_MESSAGE_LEN = 200;

export default async function handler(req, res) {
    if (!setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
        return methodNotAllowed(res, ['POST']);
    }

    const bot = await authenticate(req, res);
    if (!bot) return;

    // 30 gift sends per minute per bot — prevents spam
    const ok = await rateLimit(req, res, `gifts:send:${bot.id}`, { limit: 30, windowSec: 60 });
    if (!ok) return;

    const body = validateBody(req, res, ['recipientId', 'giftId']);
    if (!body) return;

    const { recipientId, giftId, trackId = null, message = '' } = body;

    if (message && message.length > MAX_MESSAGE_LEN) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.VALIDATION_ERROR,
            `message must be ${MAX_MESSAGE_LEN} characters or fewer.`,
        ));
    }

    const db = getDb();

    // Resolve gift
    const giftSnap = await db.collection('gifts').doc(giftId).get();
    if (!giftSnap.exists || giftSnap.data().status !== 'active') {
        return errorResponse(res, new ApiError(
            ERROR_CODE.NOT_FOUND,
            'Gift not found or not available.',
            HTTP.NOT_FOUND,
        ));
    }

    // Resolve recipient
    const recipientSnap = await db.collection('users').doc(recipientId).get();
    if (!recipientSnap.exists) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.NOT_FOUND,
            'Recipient user not found.',
            HTTP.NOT_FOUND,
        ));
    }

    const giftData = giftSnap.data();

    // Enforce limited-supply gifts
    if (giftData.isLimited) {
        const remaining = (giftData.maxSupply ?? 0) - (giftData.mintedCount ?? 0);
        if (remaining <= 0) {
            return errorResponse(res, new ApiError(
                ERROR_CODE.CONFLICT,
                'This gift is sold out.',
                HTTP.CONFLICT,
            ));
        }
    }

    // Time-limited gifts
    if (giftData.isTimeLimited) {
        const now = Date.now();
        const from = giftData.availableFrom?.toMillis?.() ?? 0;
        const to   = giftData.availableTo?.toMillis?.()   ?? Infinity;
        if (now < from || now > to) {
            return errorResponse(res, new ApiError(
                ERROR_CODE.CONFLICT,
                'This gift is not available at this time.',
                HTTP.CONFLICT,
            ));
        }
    }

    const now         = FieldValue.serverTimestamp();
    const batch       = db.batch();
    const sentGiftRef = db.collection('sent_gifts').doc();

    // Record the sent gift
    batch.set(sentGiftRef, {
        giftId,
        senderId:    `bot:${bot.id}`,
        recipientId,
        trackId,
        message:     message.trim(),
        price:       giftData.price,
        type:        giftData.type,         // 'regular' | 'nft'
        status:      'received',            // 'received' | 'displayed' | 'listed' | 'sold'
        createdAt:   now,
    });

    // Increment minted counter for limited gifts
    if (giftData.isLimited) {
        batch.update(db.collection('gifts').doc(giftId), {
            mintedCount: FieldValue.increment(1),
        });
    }

    // Push in-app notification to recipient
    const notifRef = db.collection('users').doc(recipientId).collection('notifications').doc();
    batch.set(notifRef, {
        type:        'gift_received',
        fromBotId:   bot.id,
        fromBotName: bot.name,
        giftId,
        giftName:    giftData.name,
        sentGiftId:  sentGiftRef.id,
        trackId,
        message:     message.trim(),
        read:        false,
        createdAt:   now,
    });

    await batch.commit();

    return successResponse(res, {
        sentGiftId:  sentGiftRef.id,
        recipientId,
        giftId,
        giftName:    giftData.name,
        trackId,
    }, HTTP.CREATED);
}
