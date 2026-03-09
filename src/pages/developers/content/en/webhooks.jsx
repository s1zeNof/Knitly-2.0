import React from 'react';
import CodeBlock from '../../CodeBlock';

export default function WebhooksContentEn() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Table of Contents">
                <p className="dp-toc-title">On this page</p>
                <ol className="dp-toc-list">
                    <li><a href="#how-it-works">How it works</a></li>
                    <li><a href="#webhook-object">Webhook object</a></li>
                    <li><a href="#register">Register a webhook</a></li>
                    <li><a href="#list-webhooks">List webhooks</a></li>
                    <li><a href="#delete-webhook">Delete a webhook</a></li>
                    <li><a href="#event-reference">Event reference</a></li>
                </ol>
            </nav>

            {/* How it works */}
            <section id="how-it-works" className="dp-section">
                <h2 className="dp-section-title">How it works</h2>
                <p className="dp-paragraph">
                    Instead of polling the API repeatedly, register an HTTPS endpoint on your server.
                    When a subscribed event fires on Knitly, the server makes a{' '}
                    <code className="dp-inline-code">POST</code> request to your URL with a JSON payload
                    describing the event.
                </p>
                <p className="dp-paragraph">
                    Webhooks are stored on the bot document and are immediately active after registration.
                    Each bot may have up to <strong>5 webhooks</strong>.
                </p>

                <div className="dp-note dp-note--info">
                    <span className="dp-note-icon">ℹ</span>
                    <span>
                        Your endpoint must respond with a <code className="dp-inline-code">2xx</code> status
                        within <strong>10 seconds</strong>. Knitly will attempt one delivery per event.
                        Retry logic with exponential backoff is planned for v1.1.
                    </span>
                </div>

                <p className="dp-paragraph"><strong>Payload envelope</strong></p>
                <p className="dp-paragraph">Every webhook POST body follows this structure:</p>
                <CodeBlock lang="json">{`{
  "event":   "gift.received",
  "botId":   "abc123def456",
  "ts":      "2026-01-15T12:00:00.000Z",
  "data":    { ...event-specific data }
}`}</CodeBlock>
            </section>

            {/* Webhook object */}
            <section id="webhook-object" className="dp-section">
                <h2 className="dp-section-title">Webhook object</h2>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">url</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Your HTTPS endpoint URL.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">events</code></td>
                            <td><span className="dp-param-type">string[]</span></td>
                            <td>List of subscribed event names.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">createdAt</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>ISO 8601 timestamp of registration.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Register */}
            <section id="register" className="dp-section">
                <h2 className="dp-section-title">Register a webhook</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--post">POST</span>
                    <code className="dp-endpoint-path">/api/v1/webhooks</code>
                    <span className="dp-endpoint-desc">Adds a new webhook to the authenticated bot.</span>
                </div>

                <p className="dp-paragraph"><strong>Request body</strong></p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">url</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--yes">required</span></td>
                            <td>Your endpoint. Must start with <code className="dp-inline-code">https://</code>.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">events</code></td>
                            <td><span className="dp-param-type">string[]</span></td>
                            <td><span className="dp-param-required--yes">required</span></td>
                            <td>One or more event names to subscribe to. See <a href="#event-reference">Event reference</a>.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/webhooks \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://myserver.example.com/knitly/events",
    "events": ["gift.received", "follower.new"]
  }'`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "index": 0,
    "url": "https://myserver.example.com/knitly/events",
    "events": ["gift.received", "follower.new"],
    "createdAt": "2026-01-15T12:00:00.000Z"
  }
}`}</CodeBlock>

                <div className="dp-note dp-note--warning">
                    <span className="dp-note-icon">⚠</span>
                    <span>
                        Plain HTTP URLs are rejected. Your endpoint must use HTTPS to protect event data in transit.
                    </span>
                </div>
            </section>

            {/* List webhooks */}
            <section id="list-webhooks" className="dp-section">
                <h2 className="dp-section-title">List webhooks</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/webhooks</code>
                    <span className="dp-endpoint-desc">Returns all webhooks registered to the authenticated bot.</span>
                </div>

                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/webhooks \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": [
    {
      "index": 0,
      "url": "https://myserver.example.com/knitly/events",
      "events": ["gift.received", "follower.new"],
      "createdAt": "2026-01-15T12:00:00.000Z"
    }
  ]
}`}</CodeBlock>
            </section>

            {/* Delete webhook */}
            <section id="delete-webhook" className="dp-section">
                <h2 className="dp-section-title">Delete a webhook</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--delete">DELETE</span>
                    <code className="dp-endpoint-path">/api/v1/webhooks/:index</code>
                    <span className="dp-endpoint-desc">Removes the webhook at the given zero-based index.</span>
                </div>

                <p className="dp-paragraph">
                    Use the <code className="dp-inline-code">index</code> field from the list response.
                    Indices are zero-based and stable until a webhook is deleted, after which the remaining
                    webhooks retain their positions.
                </p>

                <CodeBlock lang="bash">{`curl -X DELETE https://knitly-demo.vercel.app/api/v1/webhooks/0 \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": { "deleted": true }
}`}</CodeBlock>
            </section>

            {/* Event reference */}
            <section id="event-reference" className="dp-section">
                <h2 className="dp-section-title">Event reference</h2>

                <p className="dp-paragraph"><strong>gift.received</strong></p>
                <p className="dp-paragraph">
                    Fired when your bot sends a gift and it is successfully delivered to the recipient.
                </p>
                <CodeBlock lang="json">{`{
  "event": "gift.received",
  "botId": "abc123def456",
  "ts":    "2026-01-15T12:00:00.000Z",
  "data": {
    "giftId":      "GIFT_FIRESTORE_ID",
    "recipientId": "USER_FIREBASE_UID",
    "trackId":     "TRACK_FIRESTORE_ID",
    "message":     "Loved your track!"
  }
}`}</CodeBlock>

                <p className="dp-paragraph"><strong>track.play</strong></p>
                <p className="dp-paragraph">
                    Fired when a user starts playing a track. Useful for triggering curation logic.
                </p>
                <CodeBlock lang="json">{`{
  "event": "track.play",
  "botId": "abc123def456",
  "ts":    "2026-01-15T12:05:00.000Z",
  "data": {
    "trackId":  "TRACK_FIRESTORE_ID",
    "userId":   "USER_FIREBASE_UID",
    "playCount": 1
  }
}`}</CodeBlock>

                <p className="dp-paragraph"><strong>follower.new</strong></p>
                <p className="dp-paragraph">
                    Fired when a user follows the owner of the bot. Useful for sending welcome gifts.
                </p>
                <CodeBlock lang="json">{`{
  "event": "follower.new",
  "botId": "abc123def456",
  "ts":    "2026-01-15T12:10:00.000Z",
  "data": {
    "followerId": "NEW_FOLLOWER_UID",
    "followedId": "ARTIST_UID"
  }
}`}</CodeBlock>

                <div className="dp-note dp-note--info">
                    <span className="dp-note-icon">ℹ</span>
                    <span>
                        Additional events (<code className="dp-inline-code">comment.new</code>,{' '}
                        <code className="dp-inline-code">track.like</code>) are planned for v1.1.
                    </span>
                </div>
            </section>

        </div>
    );
}
