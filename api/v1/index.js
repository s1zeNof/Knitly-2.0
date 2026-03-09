/**
 * GET /api/v1
 *
 * Health check and API discovery endpoint.
 * Returns the current API version, status, and available resource paths.
 * No authentication required.
 */

import { setCorsHeaders } from '../_lib/middleware.js';

export default function handler(req, res) {
    if (!setCorsHeaders(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'GET only.' } });
    }

    return res.status(200).json({
        ok: true,
        result: {
            api:     'Knitly Bot API',
            version: '1.0.0',
            status:  'operational',
            docs:    'https://knitly-demo.vercel.app/developers',
            resources: {
                bots:     '/api/v1/bots',
                gifts:    '/api/v1/gifts',
                tracks:   '/api/v1/tracks',
                webhooks: '/api/v1/webhooks',
            },
        },
    });
}
