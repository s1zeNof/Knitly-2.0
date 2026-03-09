/**
 * @fileoverview Knitly Bot API — Standard error classes and response utilities.
 *
 * Every API response follows a consistent envelope shape:
 *   Success: { ok: true,  result: <any> }
 *   Error:   { ok: false, error: { code: string, message: string, details?: any } }
 *
 * This makes client-side error handling trivially predictable:
 *   const { ok, result, error } = await res.json();
 */

// ─── HTTP Status Codes ────────────────────────────────────────────────────────

export const HTTP = Object.freeze({
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL: 500,
});

// ─── Machine-readable error codes ────────────────────────────────────────────

export const ERROR_CODE = Object.freeze({
    INVALID_TOKEN:    'INVALID_TOKEN',
    UNAUTHORIZED:     'UNAUTHORIZED',
    FORBIDDEN:        'FORBIDDEN',
    NOT_FOUND:        'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CONFLICT:         'CONFLICT',
    RATE_LIMITED:     'RATE_LIMITED',
    METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
    INTERNAL:         'INTERNAL_SERVER_ERROR',
});

// ─── ApiError class ───────────────────────────────────────────────────────────

/**
 * Structured error that carries an HTTP status code and a machine-readable code.
 * Throw this anywhere in a handler — the top-level errorResponse() will serialize it.
 *
 * @example
 *   throw new ApiError(ERROR_CODE.NOT_FOUND, 'Track not found.', HTTP.NOT_FOUND);
 */
export class ApiError extends Error {
    /**
     * @param {string}    code    - Machine-readable code from ERROR_CODE
     * @param {string}    message - Human-readable description (safe to expose)
     * @param {number}    [status=400] - HTTP status code
     * @param {any}       [details]    - Optional structured detail (e.g. missing fields list)
     */
    constructor(code, message, status = HTTP.BAD_REQUEST, details = undefined) {
        super(message);
        this.name    = 'ApiError';
        this.code    = code;
        this.status  = status;
        this.details = details;
    }
}

// ─── Response helpers ─────────────────────────────────────────────────────────

/**
 * Sends a 200 (or custom) success response.
 *
 * @param {import('@vercel/node').VercelResponse} res
 * @param {any}    result
 * @param {number} [status=200]
 */
export function successResponse(res, result, status = HTTP.OK) {
    return res.status(status).json({ ok: true, result });
}

/**
 * Sends an error response. Handles both ApiError and unexpected errors.
 * Unexpected errors are logged server-side but never leak internals to the client.
 *
 * @param {import('@vercel/node').VercelResponse} res
 * @param {ApiError | Error | unknown}            error
 */
export function errorResponse(res, error) {
    if (error instanceof ApiError) {
        const body = {
            ok: false,
            error: {
                code:    error.code,
                message: error.message,
                ...(error.details !== undefined && { details: error.details }),
            },
        };
        return res.status(error.status).json(body);
    }

    // Unknown / unexpected errors — log but never expose stack traces
    console.error('[KnitlyAPI] Unhandled error:', error);
    return res.status(HTTP.INTERNAL).json({
        ok: false,
        error: {
            code:    ERROR_CODE.INTERNAL,
            message: 'An unexpected error occurred. Please try again later.',
        },
    });
}

/**
 * Convenience: send 405 Method Not Allowed with Allow header.
 *
 * @param {import('@vercel/node').VercelResponse} res
 * @param {string[]} allowed - Array of allowed HTTP methods, e.g. ['GET', 'POST']
 */
export function methodNotAllowed(res, allowed = []) {
    if (allowed.length > 0) {
        res.setHeader('Allow', allowed.join(', '));
    }
    return errorResponse(res, new ApiError(
        ERROR_CODE.METHOD_NOT_ALLOWED,
        `Method not allowed. Accepted: ${allowed.join(', ')}.`,
        405,
    ));
}
