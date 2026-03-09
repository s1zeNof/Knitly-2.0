/**
 * DELETE /api/v1/webhooks/:index
 *
 * Removes the webhook at the given zero-based index from the bot's webhook list.
 * Other webhooks are not affected. After deletion, indices of subsequent webhooks shift down.
 *
 * Use GET /api/v1/webhooks to list current webhooks with their indices.
 */

import { getDb, FieldValue }             from '../../_lib/firebase.js';
import { authenticate, setCorsHeaders }  from '../../_lib/middleware.js';
import {
    ApiError, ERROR_CODE, HTTP,
    successResponse, errorResponse, methodNotAllowed,
} from '../../_lib/errors.js';

export default async function handler(req, res) {
    if (!setCorsHeaders(req, res)) return;

    if (req.method !== 'DELETE') {
        return methodNotAllowed(res, ['DELETE']);
    }

    const bot = await authenticate(req, res);
    if (!bot) return;

    const index    = parseInt(req.query.index, 10);
    const webhooks = [...(bot.webhooks ?? [])];

    if (Number.isNaN(index) || index < 0 || index >= webhooks.length) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.NOT_FOUND,
            `No webhook at index ${req.query.index}. Use GET /api/v1/webhooks to list current webhooks.`,
            HTTP.NOT_FOUND,
        ));
    }

    const removed = webhooks.splice(index, 1)[0];

    await getDb().collection('bots').doc(bot.id).update({
        webhooks,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return successResponse(res, { removed: true, webhook: removed });
}
