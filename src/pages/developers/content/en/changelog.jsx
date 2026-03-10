import React from 'react';

export default function ChangelogContentEn() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Table of Contents">
                <p className="dp-toc-title">On this page</p>
                <ol className="dp-toc-list">
                    <li><a href="#v1-0-0">v1.0.0 — Initial release</a></li>
                    <li><a href="#upcoming">Upcoming in v1.1</a></li>
                </ol>
            </nav>

            {/* v1.0.0 */}
            <section id="v1-0-0" className="dp-section">
                <h2 className="dp-section-title">v1.0.0 — Initial release</h2>
                <p className="dp-meta">Released 2026-03-09 · <span className="dp-badge" style={{ display: 'inline', padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>stable</span></p>

                <p className="dp-paragraph">
                    The first public release of the Knitly Bot API. This version establishes the
                    core authentication model, bot management, gift sending, and webhook system.
                </p>

                <p className="dp-paragraph"><strong>New endpoints</strong></p>
                <ul className="dp-list">
                    <li>
                        <code className="dp-inline-code">GET /api/v1</code> — health check and version info
                    </li>
                    <li>
                        <code className="dp-inline-code">GET /api/v1/bots</code>{' '}
                        <code className="dp-inline-code">POST /api/v1/bots</code> — list and create bots
                    </li>
                    <li>
                        <code className="dp-inline-code">GET /api/v1/bots/me</code>{' '}
                        <code className="dp-inline-code">PUT /api/v1/bots/me</code> — get and update the current bot
                    </li>
                    <li>
                        <code className="dp-inline-code">POST /api/v1/bots/token</code> — rotate the API token
                    </li>
                    <li>
                        <code className="dp-inline-code">POST /api/v1/gifts/send</code> — send a gift to a user
                    </li>
                    <li>
                        <code className="dp-inline-code">GET /api/v1/gifts/collection/:uid</code> — read a user's gift collection
                    </li>
                    <li>
                        <code className="dp-inline-code">GET /api/v1/tracks</code>{' '}
                        <code className="dp-inline-code">GET /api/v1/tracks/:id</code> — public track catalogue
                    </li>
                    <li>
                        <code className="dp-inline-code">GET /api/v1/webhooks</code>{' '}
                        <code className="dp-inline-code">POST /api/v1/webhooks</code> — list and register webhooks
                    </li>
                    <li>
                        <code className="dp-inline-code">DELETE /api/v1/webhooks/:index</code> — remove a webhook by index
                    </li>
                </ul>

                <p className="dp-paragraph"><strong>Authentication</strong></p>
                <ul className="dp-list">
                    <li>
                        Bot token format: <code className="dp-inline-code">knt_{'{botId}'}_{'{40-char hex}'}</code>.
                        Only a SHA-256 hash is stored server-side.
                    </li>
                    <li>
                        Bot registration uses Firebase ID tokens in the{' '}
                        <code className="dp-inline-code">X-Firebase-Token</code> header — no separate sign-up flow required.
                    </li>
                    <li>
                        Token rotation immediately invalidates the previous token.
                    </li>
                </ul>

                <p className="dp-paragraph"><strong>Webhook events</strong></p>
                <ul className="dp-list">
                    <li><code className="dp-inline-code">gift.received</code> — gift successfully delivered</li>
                    <li><code className="dp-inline-code">track.play</code> — user started playing a track</li>
                    <li><code className="dp-inline-code">follower.new</code> — new follower on the bot owner's account</li>
                </ul>

                <p className="dp-paragraph"><strong>Rate limits</strong></p>
                <ul className="dp-list">
                    <li>Default: 60 requests / 60 seconds per bot token.</li>
                    <li><code className="dp-inline-code">POST /api/v1/gifts/send</code>: reduced to 30 requests / 60 seconds.</li>
                </ul>

                <p className="dp-paragraph"><strong>Known limitations in v1.0.0</strong></p>
                <ul className="dp-list">
                    <li>Rate limiter is in-memory and resets on serverless cold starts. Not suitable for high-throughput production use cases until v1.1 (Upstash Redis).</li>
                    <li>Webhook delivery is best-effort with no retry. Retry logic planned for v1.1.</li>
                    <li>Webhook signatures (HMAC-SHA256) not yet implemented — do not rely on webhook authenticity for critical operations.</li>
                    <li>Max 10 bots per user. Max 5 webhooks per bot.</li>
                </ul>
            </section>

            {/* Upcoming */}
            <section id="upcoming" className="dp-section">
                <h2 className="dp-section-title">Upcoming in v1.1</h2>

                <div className="dp-note dp-note--info">
                    <span className="dp-note-icon">ℹ</span>
                    <span>
                        These features are in planning and are subject to change.
                        Follow the changelog to be notified when v1.1 ships.
                    </span>
                </div>

                <ul className="dp-list">
                    <li>
                        <strong>Distributed rate limiting</strong> — replace in-memory counter with Upstash Redis,
                        making limits accurate across all serverless instances.
                    </li>
                    <li>
                        <strong>Webhook signatures</strong> — every POST will include an{' '}
                        <code className="dp-inline-code">X-Knitly-Signature</code> header containing an
                        HMAC-SHA256 signature of the body, signed with a secret you configure.
                    </li>
                    <li>
                        <strong>Webhook retry with exponential backoff</strong> — failed deliveries
                        (non-2xx or timeout) will be retried up to 3 times over 24 hours.
                    </li>
                    <li>
                        <strong>Additional webhook events</strong> — <code className="dp-inline-code">comment.new</code>,{' '}
                        <code className="dp-inline-code">track.like</code>, <code className="dp-inline-code">playlist.add</code>.
                    </li>
                    <li>
                        <strong>NFT provenance endpoints</strong> — query the provenance chain of an NFT gift
                        and verify its serial number uniqueness.
                    </li>
                    <li>
                        <strong>Pagination cursor improvements</strong> — stable opaque cursors replacing
                        document IDs for collection endpoints.
                    </li>
                </ul>
            </section>

        </div>
    );
}
