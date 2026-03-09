/**
 * /api/v1/bots
 *
 * GET  — (reserved for future: list bots owned by a user)
 * POST — Register a new bot.
 *
 * Registering a bot requires a valid Firebase user ID token in the
 * X-Firebase-Token header. This links the bot to a Knitly user account.
 *
 * On success the raw token is returned ONCE and must be stored securely.
 * It is never shown again — only a SHA-256 hash is stored in Firestore.
 */

import { getAdminAuth, getDb, FieldValue } from '../../_lib/firebase.js';
import { generateBotToken }               from '../../_lib/tokens.js';
import { setCorsHeaders, validateBody }   from '../../_lib/middleware.js';
import {
    ApiError, ERROR_CODE, HTTP,
    successResponse, errorResponse, methodNotAllowed,
} from '../../_lib/errors.js';

// Constraints
const BOT_NAME_MIN   = 3;
const BOT_NAME_MAX   = 32;
const MAX_BOTS_PER_USER = 10;

export default async function handler(req, res) {
    if (!setCorsHeaders(req, res)) return;

    if (req.method === 'GET') {
        // Reserved — future pagination of owned bots
        return successResponse(res, { message: 'List endpoint coming soon. Use GET /api/v1/bots/me.' });
    }

    if (req.method === 'POST') {
        return createBot(req, res);
    }

    return methodNotAllowed(res, ['GET', 'POST']);
}

async function createBot(req, res) {
    // 1. Verify the caller's Firebase user identity
    const rawUserToken = (req.headers['x-firebase-token'] ?? '').trim();
    if (!rawUserToken) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.UNAUTHORIZED,
            'Missing X-Firebase-Token header. Provide your Firebase ID token to register a bot.',
            HTTP.UNAUTHORIZED,
        ));
    }

    let uid;
    try {
        const decoded = await getAdminAuth().verifyIdToken(rawUserToken);
        uid = decoded.uid;
    } catch {
        return errorResponse(res, new ApiError(
            ERROR_CODE.INVALID_TOKEN,
            'Invalid or expired Firebase user token.',
            HTTP.UNAUTHORIZED,
        ));
    }

    // 2. Validate the request body
    const body = validateBody(req, res, ['name']);
    if (!body) return;

    const { name, description = '', avatarUrl = '' } = body;

    if (typeof name !== 'string' || name.length < BOT_NAME_MIN || name.length > BOT_NAME_MAX) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.VALIDATION_ERROR,
            `Bot name must be ${BOT_NAME_MIN}–${BOT_NAME_MAX} characters.`,
        ));
    }

    const db = getDb();

    // 3. Enforce the per-user bot limit
    const ownedSnap = await db.collection('bots')
        .where('ownerId', '==', uid)
        .where('status', 'in', ['active', 'suspended'])
        .get();

    if (ownedSnap.size >= MAX_BOTS_PER_USER) {
        return errorResponse(res, new ApiError(
            ERROR_CODE.CONFLICT,
            `You have reached the maximum of ${MAX_BOTS_PER_USER} bots per account.`,
            HTTP.CONFLICT,
        ));
    }

    // 4. Persist the bot document and generate the token
    const botRef           = db.collection('bots').doc();
    const { raw, hash }    = generateBotToken(botRef.id);
    const now              = FieldValue.serverTimestamp();

    await botRef.set({
        name:        name.trim(),
        description: String(description).slice(0, 256).trim(),
        avatarUrl:   String(avatarUrl).slice(0, 512).trim(),
        ownerId:     uid,
        status:      'active',     // 'active' | 'suspended' | 'deleted'
        tokenHash:   hash,
        webhooks:    [],
        createdAt:   now,
        updatedAt:   now,
    });

    return successResponse(res, {
        id:          botRef.id,
        name:        name.trim(),
        description: String(description).slice(0, 256).trim(),
        avatarUrl:   String(avatarUrl).slice(0, 512).trim(),
        token:       raw,
        warning:     'Store this token securely. It cannot be retrieved again.',
    }, HTTP.CREATED);
}
