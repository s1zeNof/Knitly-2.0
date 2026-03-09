/**
 * /api/v1/bots/me
 *
 * GET — Return the authenticated bot's public profile.
 * PUT — Update the bot's name, description, or avatarUrl.
 */

import { getDb, FieldValue }             from '../../_lib/firebase.js';
import { authenticate, setCorsHeaders, validateBody } from '../../_lib/middleware.js';
import {
    ApiError, ERROR_CODE, HTTP,
    successResponse, errorResponse, methodNotAllowed,
} from '../../_lib/errors.js';

export default async function handler(req, res) {
    if (!setCorsHeaders(req, res)) return;

    if (req.method === 'GET') {
        const bot = await authenticate(req, res);
        if (!bot) return;
        return getProfile(res, bot);
    }

    if (req.method === 'PUT') {
        const bot = await authenticate(req, res);
        if (!bot) return;
        return updateProfile(req, res, bot);
    }

    return methodNotAllowed(res, ['GET', 'PUT']);
}

function getProfile(res, bot) {
    return successResponse(res, {
        id:            bot.id,
        name:          bot.name,
        description:   bot.description ?? '',
        avatarUrl:     bot.avatarUrl   ?? '',
        ownerId:       bot.ownerId,
        status:        bot.status,
        webhooksCount: (bot.webhooks ?? []).length,
        createdAt:     bot.createdAt,
    });
}

async function updateProfile(req, res, bot) {
    const { name, description, avatarUrl } = req.body ?? {};
    const updates = {};

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 32) {
            return errorResponse(res, new ApiError(
                ERROR_CODE.VALIDATION_ERROR,
                'name must be 3–32 characters.',
            ));
        }
        updates.name = name.trim();
    }

    if (description !== undefined) {
        updates.description = String(description).slice(0, 256).trim();
    }

    if (avatarUrl !== undefined) {
        updates.avatarUrl = String(avatarUrl).slice(0, 512).trim();
    }

    if (Object.keys(updates).length === 0) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.VALIDATION_ERROR,
            'Provide at least one of: name, description, avatarUrl.',
        ));
    }

    updates.updatedAt = FieldValue.serverTimestamp();
    await getDb().collection('bots').doc(bot.id).update(updates);

    return successResponse(res, { id: bot.id, ...updates });
}
