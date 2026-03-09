/**
 * POST /api/v1/bots/token
 *
 * Regenerates the bot's API token.
 * The previous token is immediately invalidated upon success.
 * The new raw token is returned once and must be stored securely.
 */

import { getDb, FieldValue }         from '../../_lib/firebase.js';
import { generateBotToken }          from '../../_lib/tokens.js';
import { authenticate, setCorsHeaders } from '../../_lib/middleware.js';
import { successResponse, methodNotAllowed } from '../../_lib/errors.js';

export default async function handler(req, res) {
    if (!setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
        return methodNotAllowed(res, ['POST']);
    }

    const bot = await authenticate(req, res);
    if (!bot) return;

    const { raw, hash } = generateBotToken(bot.id);

    await getDb().collection('bots').doc(bot.id).update({
        tokenHash: hash,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return successResponse(res, {
        token:   raw,
        warning: 'Your previous token is now invalidated. Store this token securely.',
    });
}
