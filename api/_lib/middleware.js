/**
 * @fileoverview Knitly Bot API — Composable middleware utilities.
 *
 * Each function is an async guard that either returns data (success) or
 * writes an error response and returns null/false.
 *
 * The handler idiom:
 *   const bot = await authenticate(req, res);
 *   if (!bot) return;                         // response already sent
 *
 *   const ok = await rateLimit(req, res, bot.id);
 *   if (!ok) return;
 *
 *   const body = validateBody(req, res, ['field1', 'field2']);
 *   if (!body) return;
 *
 *   // safe to use bot + body here
 */

import { getDb }                from './firebase.js';
import { hashToken, extractBotId } from './tokens.js';
import { ApiError, ERROR_CODE, HTTP, errorResponse } from './errors.js';

// ─── authenticate ─────────────────────────────────────────────────────────────

/**
 * Verifies the Bearer token in the Authorization header.
 * Looks up the bot document, checks its status and token hash.
 *
 * @param   {import('@vercel/node').VercelRequest}  req
 * @param   {import('@vercel/node').VercelResponse} res
 * @returns {Promise<{ id: string } & Record<string, any> | null>}
 *          The bot data object (with id injected) on success, null on failure.
 */
export async function authenticate(req, res) {
    const authHeader = req.headers['authorization'] ?? '';

    if (!authHeader.startsWith('Bearer ')) {
        errorResponse(res, new ApiError(
            ERROR_CODE.UNAUTHORIZED,
            'Missing or malformed Authorization header. Expected: "Bearer knt_..."',
            HTTP.UNAUTHORIZED,
        ));
        return null;
    }

    const raw   = authHeader.slice(7).trim();
    const botId = extractBotId(raw);

    if (!botId) {
        errorResponse(res, new ApiError(
            ERROR_CODE.INVALID_TOKEN,
            'Malformed token. Expected format: knt_{botId}_{secret}',
            HTTP.UNAUTHORIZED,
        ));
        return null;
    }

    try {
        const snap = await getDb().collection('bots').doc(botId).get();

        if (!snap.exists) {
            errorResponse(res, new ApiError(
                ERROR_CODE.INVALID_TOKEN,
                'Token is invalid or has been revoked.',
                HTTP.UNAUTHORIZED,
            ));
            return null;
        }

        const bot = snap.data();

        if (bot.status === 'suspended') {
            errorResponse(res, new ApiError(
                ERROR_CODE.FORBIDDEN,
                'This bot has been suspended. Contact support@knitly.app.',
                HTTP.FORBIDDEN,
            ));
            return null;
        }

        if (bot.status === 'deleted') {
            errorResponse(res, new ApiError(
                ERROR_CODE.INVALID_TOKEN,
                'Token is invalid or has been revoked.',
                HTTP.UNAUTHORIZED,
            ));
            return null;
        }

        if (hashToken(raw) !== bot.tokenHash) {
            errorResponse(res, new ApiError(
                ERROR_CODE.INVALID_TOKEN,
                'Token is invalid or has been revoked.',
                HTTP.UNAUTHORIZED,
            ));
            return null;
        }

        return { id: botId, ...bot };
    } catch (err) {
        errorResponse(res, err);
        return null;
    }
}

// ─── rateLimit ────────────────────────────────────────────────────────────────

/**
 * Simple in-memory rate limiter keyed by an arbitrary string.
 *
 * PRODUCTION NOTE: Vercel serverless functions are stateless — this store resets
 * on every cold start and is NOT shared between concurrent instances.
 * For production-grade rate limiting, replace with Upstash Redis:
 *   https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *
 * Even so, this provides meaningful per-request protection within a warm instance.
 *
 * @param   {import('@vercel/node').VercelRequest}  req
 * @param   {import('@vercel/node').VercelResponse} res
 * @param   {string} key          - Unique key (e.g. `${bot.id}:send_gift`)
 * @param   {{ limit?: number, windowSec?: number }} [opts]
 * @returns {Promise<boolean>}    false if rate-limited (response already sent)
 */
const _store = new Map();

export async function rateLimit(req, res, key, { limit = 60, windowSec = 60 } = {}) {
    const now      = Date.now();
    const windowMs = windowSec * 1000;

    let entry = _store.get(key);
    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
    }
    entry.count += 1;
    _store.set(key, entry);

    const remaining = Math.max(0, limit - entry.count);

    res.setHeader('X-RateLimit-Limit',     String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset',     String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > limit) {
        errorResponse(res, new ApiError(
            ERROR_CODE.RATE_LIMITED,
            `Rate limit exceeded. Maximum ${limit} requests per ${windowSec}s.`,
            HTTP.TOO_MANY_REQUESTS,
        ));
        return false;
    }

    return true;
}

// ─── validateBody ─────────────────────────────────────────────────────────────

/**
 * Validates that all required fields are present and non-empty in req.body.
 * Returns the parsed body object, or null if validation failed (response sent).
 *
 * @param   {import('@vercel/node').VercelRequest}  req
 * @param   {import('@vercel/node').VercelResponse} res
 * @param   {string[]} required - Field names that must be present
 * @returns {Record<string, any> | null}
 */
export function validateBody(req, res, required = []) {
    const body = req.body ?? {};

    const missing = required.filter(
        (key) => body[key] === undefined || body[key] === null || body[key] === '',
    );

    if (missing.length > 0) {
        errorResponse(res, new ApiError(
            ERROR_CODE.VALIDATION_ERROR,
            'Missing required fields.',
            HTTP.BAD_REQUEST,
            { missing },
        ));
        return null;
    }

    return body;
}

// ─── setCorsHeaders ───────────────────────────────────────────────────────────

/**
 * Applies CORS headers to a response.
 * Returns false and sends a 204 if this is a preflight OPTIONS request.
 *
 * @param   {import('@vercel/node').VercelRequest}  req
 * @param   {import('@vercel/node').VercelResponse} res
 * @returns {boolean} false means "stop here, preflight handled"
 */
export function setCorsHeaders(req, res) {
    const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const origin  = req.headers['origin'] ?? '';

    const allowOrigin =
        !origin ||
        process.env.NODE_ENV !== 'production' ||
        allowed.includes(origin)
            ? (origin || '*')
            : '';

    if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Firebase-Token');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return false;
    }

    return true;
}
