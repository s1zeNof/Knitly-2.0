/**
 * /api/v1/webhooks
 *
 * GET  — List all webhooks registered for the authenticated bot.
 * POST — Register a new webhook URL.
 *
 * A bot may register up to 5 webhook endpoints.
 * Knitly delivers POST requests to these URLs when subscribed events occur.
 *
 * Supported events:
 *   gift.received   — A gift was sent to a user monitored by the bot
 *   track.play      — A track owned by the bot's owner was played
 *   follower.new    — The bot owner received a new follower
 *
 * Webhook payload structure (delivered to your URL):
 *   {
 *     event:     'gift.received',
 *     apiVersion: '1.0',
 *     timestamp:  '2025-01-15T12:00:00.000Z',
 *     data:       { ...event-specific fields }
 *   }
 */

import { getDb, FieldValue }                         from '../../_lib/firebase.js';
import { authenticate, setCorsHeaders, validateBody } from '../../_lib/middleware.js';
import {
    ApiError, ERROR_CODE, HTTP,
    successResponse, errorResponse, methodNotAllowed,
} from '../../_lib/errors.js';

export const SUPPORTED_EVENTS = ['gift.received', 'track.play', 'follower.new'];
const MAX_WEBHOOKS_PER_BOT    = 5;

export default async function handler(req, res) {
    if (!setCorsHeaders(req, res)) return;

    const bot = await authenticate(req, res);
    if (!bot) return;

    if (req.method === 'GET') {
        return successResponse(res, {
            webhooks: (bot.webhooks ?? []).map((wh, index) => ({ index, ...wh })),
        });
    }

    if (req.method === 'POST') {
        return registerWebhook(req, res, bot);
    }

    return methodNotAllowed(res, ['GET', 'POST']);
}

async function registerWebhook(req, res, bot) {
    const body = validateBody(req, res, ['url', 'events']);
    if (!body) return;

    const { url, events } = body;

    // Validate URL format
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') throw new Error();
    } catch {
        return errorResponse(res, new ApiError(
            ERROR_CODE.VALIDATION_ERROR,
            'url must be a valid HTTPS URL (e.g. https://your-server.com/webhook).',
        ));
    }

    // Validate events array
    if (!Array.isArray(events) || events.length === 0) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.VALIDATION_ERROR,
            'events must be a non-empty array.',
        ));
    }

    const unknown = events.filter((e) => !SUPPORTED_EVENTS.includes(e));
    if (unknown.length > 0) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.VALIDATION_ERROR,
            `Unknown event type(s): ${unknown.join(', ')}.`,
            HTTP.BAD_REQUEST,
            { supported: SUPPORTED_EVENTS },
        ));
    }

    // Enforce limit
    const current = bot.webhooks ?? [];
    if (current.length >= MAX_WEBHOOKS_PER_BOT) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.CONFLICT,
            `Maximum of ${MAX_WEBHOOKS_PER_BOT} webhooks per bot reached.`,
            HTTP.CONFLICT,
        ));
    }

    const newWebhook = {
        url,
        events: [...new Set(events)],          // deduplicate
        createdAt: new Date().toISOString(),
    };

    await getDb().collection('bots').doc(bot.id).update({
        webhooks:  FieldValue.arrayUnion(newWebhook),
        updatedAt: FieldValue.serverTimestamp(),
    });

    return successResponse(res, {
        index:   current.length,               // position in the array
        webhook: newWebhook,
    }, HTTP.CREATED);
}
