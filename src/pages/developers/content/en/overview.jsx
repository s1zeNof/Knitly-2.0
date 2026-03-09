import React from 'react';
import { Link } from 'react-router-dom';
import CodeBlock from '../../CodeBlock';

export default function OverviewContentEn() {
    return (
        <div className="dp-content">

            {/* TOC */}
            <nav className="dp-toc" aria-label="Table of Contents">
                <p className="dp-toc-title">On this page</p>
                <ol className="dp-toc-list">
                    <li><a href="#what-you-can-build">What you can build</a></li>
                    <li><a href="#key-concepts">Key concepts</a></li>
                    <li><a href="#quick-start">Quick start</a></li>
                    <li><a href="#base-url">Base URL</a></li>
                    <li><a href="#response-format">Response format</a></li>
                    <li><a href="#errors">Errors</a></li>
                </ol>
            </nav>

            {/* What you can build */}
            <section id="what-you-can-build" className="dp-section">
                <h2 className="dp-section-title">What you can build</h2>
                <p className="dp-paragraph">
                    The Knitly Bot API gives your application a first-class citizen on the platform.
                    Bots can act on behalf of services, curators, and automation workflows — without
                    impersonating any real user.
                </p>
                <ul className="dp-list">
                    <li><strong>Music curation bots</strong> — automatically send a gift to a user when they listen to a track for the first time.</li>
                    <li><strong>Fan engagement tools</strong> — reward top listeners with limited-edition NFT gifts on album release day.</li>
                    <li><strong>Analytics integrations</strong> — receive play and follower events via webhooks to feed your own dashboards.</li>
                    <li><strong>Community bots</strong> — greet new followers with a personal welcome gift.</li>
                    <li><strong>Artist drop automation</strong> — trigger gift distributions at a scheduled time when an album drops.</li>
                </ul>
            </section>

            {/* Key concepts */}
            <section id="key-concepts" className="dp-section">
                <h2 className="dp-section-title">Key concepts</h2>

                <p className="dp-paragraph"><strong>Bot</strong></p>
                <p className="dp-paragraph">
                    A bot is a non-human account linked to a Knitly user (the owner).
                    It authenticates via a secret Bearer token and can only perform the actions
                    granted by the API — it cannot log in, post content, or access private data.
                </p>

                <p className="dp-paragraph"><strong>Token</strong></p>
                <p className="dp-paragraph">
                    Each bot has exactly one active token at a time. Tokens start with{' '}
                    <code className="dp-inline-code">knt_</code> and contain the bot ID embedded in them,
                    which allows fast lookups without a database scan. Only a SHA-256 hash is stored
                    server-side — the raw token is shown once and must be stored securely by you.
                </p>

                <p className="dp-paragraph"><strong>Webhook</strong></p>
                <p className="dp-paragraph">
                    Instead of polling the API for new events, register an HTTPS endpoint on your server.
                    Knitly will POST a JSON payload to it every time a subscribed event fires.
                    See <Link to="/developers/webhooks">Webhooks</Link> for the full event catalogue.
                </p>

                <p className="dp-paragraph"><strong>Gifts</strong></p>
                <p className="dp-paragraph">
                    Gifts are animated digital items that bots can send to users, optionally tied to
                    a specific track. Limited-edition and NFT gifts have a fixed supply — once sold out,
                    they cannot be sent. See <Link to="/developers/gifts">Gifts</Link> for the full reference.
                </p>
            </section>

            {/* Quick start */}
            <section id="quick-start" className="dp-section">
                <h2 className="dp-section-title">Quick start</h2>
                <p className="dp-paragraph">
                    Get from zero to your first API call in three steps.
                </p>

                <div className="dp-steps">
                    <div className="dp-step">
                        <span className="dp-step-num" aria-hidden="true"></span>
                        <div className="dp-step-body">
                            <h4>Register your bot</h4>
                            <p>Use your Firebase ID token to register a new bot. The raw API token is returned once.</p>
                        </div>
                    </div>
                </div>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/bots \\
  -H "Content-Type: application/json" \\
  -H "X-Firebase-Token: YOUR_FIREBASE_ID_TOKEN" \\
  -d '{"name": "MyCuratorBot", "description": "Sends gifts to top listeners"}'`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "abc123def456",
    "name": "MyCuratorBot",
    "token": "knt_abc123def456_a1b2c3d4e5f6...",
    "warning": "Store this token securely. It cannot be retrieved again."
  }
}`}</CodeBlock>

                <div className="dp-steps">
                    <div className="dp-step">
                        <span className="dp-step-num" aria-hidden="true"></span>
                        <div className="dp-step-body">
                            <h4>Verify your bot</h4>
                            <p>Use the token to confirm authentication is working.</p>
                        </div>
                    </div>
                </div>

                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/bots/me \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."}`}</CodeBlock>

                <div className="dp-steps">
                    <div className="dp-step">
                        <span className="dp-step-num" aria-hidden="true"></span>
                        <div className="dp-step-body">
                            <h4>Send your first gift</h4>
                            <p>Send an animated gift to a user, optionally attached to a track.</p>
                        </div>
                    </div>
                </div>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/gifts/send \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientId": "USER_UID",
    "giftId": "GIFT_FIRESTORE_ID",
    "trackId": "TRACK_ID",
    "message": "Loved your track!"
  }'`}</CodeBlock>
            </section>

            {/* Base URL */}
            <section id="base-url" className="dp-section">
                <h2 className="dp-section-title">Base URL</h2>
                <p className="dp-paragraph">
                    All API endpoints are relative to the following base URL:
                </p>
                <CodeBlock lang="text">{`https://knitly-demo.vercel.app/api/v1`}</CodeBlock>
                <div className="dp-note dp-note--info">
                    <span className="dp-note-icon">ℹ</span>
                    <span>When knitly.app launches, the base URL will become{' '}
                    <code className="dp-inline-code">https://knitly.app/api/v1</code>.
                    We will provide a migration period with both URLs active.</span>
                </div>
            </section>

            {/* Response format */}
            <section id="response-format" className="dp-section">
                <h2 className="dp-section-title">Response format</h2>
                <p className="dp-paragraph">
                    Every response — success or error — is a JSON object with an{' '}
                    <code className="dp-inline-code">ok</code> boolean at the top level.
                </p>
                <p className="dp-paragraph"><strong>Success</strong></p>
                <CodeBlock lang="json">{`{
  "ok": true,
  "result": { ...resource data }
}`}</CodeBlock>
                <p className="dp-paragraph"><strong>Error</strong></p>
                <CodeBlock lang="json">{`{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields.",
    "details": { "missing": ["recipientId"] }
  }
}`}</CodeBlock>
                <p className="dp-paragraph">
                    The <code className="dp-inline-code">error.code</code> is a machine-readable string
                    you can switch on in your error handler. The{' '}
                    <code className="dp-inline-code">error.message</code> is human-readable and
                    safe to display to end users.
                </p>
            </section>

            {/* Errors */}
            <section id="errors" className="dp-section">
                <h2 className="dp-section-title">Error codes</h2>

                <table className="dp-param-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>HTTP Status</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">UNAUTHORIZED</code></td>
                            <td>401</td>
                            <td>Missing or malformed Authorization header.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">INVALID_TOKEN</code></td>
                            <td>401</td>
                            <td>Token does not exist or has been revoked.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">FORBIDDEN</code></td>
                            <td>403</td>
                            <td>The bot exists but is suspended.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">NOT_FOUND</code></td>
                            <td>404</td>
                            <td>The requested resource does not exist.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">VALIDATION_ERROR</code></td>
                            <td>400</td>
                            <td>A required field is missing or invalid. Check <code className="dp-inline-code">details.missing</code>.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">CONFLICT</code></td>
                            <td>409</td>
                            <td>A uniqueness or supply constraint was violated (e.g. gift sold out).</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">RATE_LIMITED</code></td>
                            <td>429</td>
                            <td>Too many requests. See <Link to="/developers/rate-limits">Rate Limits</Link>.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">INTERNAL_SERVER_ERROR</code></td>
                            <td>500</td>
                            <td>An unexpected server error. Please retry with exponential backoff.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

        </div>
    );
}
