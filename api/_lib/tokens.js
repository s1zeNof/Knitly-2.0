/**
 * @fileoverview Knitly Bot API — Bot token generation and verification.
 *
 * Token format:  knt_{botId}_{40-char hex random}
 * Example:       knt_abc123def_a1b2c3d4e5f6...
 *
 * Security model:
 *   - The raw token is shown to the developer ONCE at creation time.
 *   - We store only a SHA-256 hash in Firestore — never the raw token.
 *   - On each request we hash the incoming token and compare to the stored hash.
 *   - The botId is embedded in the token so we can look up the correct document
 *     without an expensive collection-wide query.
 *
 * This pattern (HMAC/SHA-256 stored hash) is the same used by GitHub PATs,
 * Stripe API keys, and npm access tokens.
 */

import { createHash, randomBytes } from 'crypto';

/** All Knitly Bot API tokens start with this prefix for instant recognition. */
export const TOKEN_PREFIX = 'knt_';

/**
 * Generates a new raw bot token and its SHA-256 hash.
 * The raw value must be returned to the developer and never stored.
 *
 * @param   {string} botId - Firestore document ID of the bot
 * @returns {{ raw: string, hash: string }}
 */
export function generateBotToken(botId) {
    const random = randomBytes(20).toString('hex'); // 40 hex chars = 160 bits of entropy
    const raw    = `${TOKEN_PREFIX}${botId}_${random}`;
    const hash   = hashToken(raw);
    return { raw, hash };
}

/**
 * Produces the SHA-256 hex digest of a raw token string.
 * Use this before any equality comparison with a stored hash.
 *
 * @param   {string} raw
 * @returns {string} 64-char hex digest
 */
export function hashToken(raw) {
    return createHash('sha256').update(raw).digest('hex');
}

/**
 * Extracts the botId segment embedded between the prefix and the random suffix.
 * Returns null if the token doesn't match the expected format.
 *
 * @param   {string} token - Raw token string (e.g. "knt_abc123_a1b2...")
 * @returns {string | null}
 */
export function extractBotId(token) {
    if (typeof token !== 'string') return null;
    if (!token.startsWith(TOKEN_PREFIX)) return null;

    const withoutPrefix = token.slice(TOKEN_PREFIX.length);
    const separatorIdx  = withoutPrefix.indexOf('_');
    if (separatorIdx === -1) return null;

    return withoutPrefix.slice(0, separatorIdx) || null;
}
