import React from 'react';
import CodeBlock from '../../CodeBlock';

export default function BotsContentEn() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Table of Contents">
                <p className="dp-toc-title">On this page</p>
                <ol className="dp-toc-list">
                    <li><a href="#bot-object">Bot object</a></li>
                    <li><a href="#list-bots">List your bots</a></li>
                    <li><a href="#create-bot">Create a bot</a></li>
                    <li><a href="#get-me">Get current bot</a></li>
                    <li><a href="#update-me">Update current bot</a></li>
                    <li><a href="#rotate-token">Rotate token</a></li>
                </ol>
            </nav>

            {/* Bot object */}
            <section id="bot-object" className="dp-section">
                <h2 className="dp-section-title">Bot object</h2>
                <p className="dp-paragraph">
                    Every API response that returns a bot includes the following fields.
                    The <code className="dp-inline-code">token</code> field is only returned once —
                    at creation or rotation time.
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">id</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Firestore document ID of the bot.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">name</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Display name. 2–64 characters.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">description</code></td>
                            <td><span className="dp-param-type">string | null</span></td>
                            <td>Short description shown on the bot's public profile. Max 200 characters.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">avatarUrl</code></td>
                            <td><span className="dp-param-type">string | null</span></td>
                            <td>URL to the bot's avatar image.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">ownerId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Firebase Auth UID of the user who registered the bot.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">status</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><code className="dp-inline-code">active</code> | <code className="dp-inline-code">suspended</code></td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">webhooks</code></td>
                            <td><span className="dp-param-type">array</span></td>
                            <td>List of registered webhook objects. See <a href="/developers/webhooks">Webhooks</a>.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">createdAt</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>ISO 8601 timestamp of creation.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">token</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Raw API token. Only returned once at creation or rotation.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* List bots */}
            <section id="list-bots" className="dp-section">
                <h2 className="dp-section-title">List your bots</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/bots</code>
                    <span className="dp-endpoint-desc">Returns all bots owned by the authenticated Firebase user.</span>
                </div>

                <p className="dp-paragraph">
                    This endpoint requires your Firebase ID token (not a bot token) in the{' '}
                    <code className="dp-inline-code">X-Firebase-Token</code> header.
                    It returns all bots you own, up to 10.
                </p>

                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/bots \\
  -H "X-Firebase-Token: YOUR_FIREBASE_ID_TOKEN"`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": [
    {
      "id": "abc123def456",
      "name": "MyCuratorBot",
      "description": "Sends gifts to top listeners",
      "status": "active",
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ]
}`}</CodeBlock>
            </section>

            {/* Create bot */}
            <section id="create-bot" className="dp-section">
                <h2 className="dp-section-title">Create a bot</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--post">POST</span>
                    <code className="dp-endpoint-path">/api/v1/bots</code>
                    <span className="dp-endpoint-desc">Registers a new bot under your Knitly account.</span>
                </div>

                <p className="dp-paragraph">
                    Requires your Firebase ID token in <code className="dp-inline-code">X-Firebase-Token</code>.
                    One user may own up to <strong>10 bots</strong>.
                </p>

                <p className="dp-paragraph"><strong>Request body</strong></p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">name</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--yes">required</span></td>
                            <td>Bot display name. 2–64 characters.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">description</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--no">optional</span></td>
                            <td>Short description. Max 200 characters.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">avatarUrl</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--no">optional</span></td>
                            <td>URL to the bot's avatar image. Must be HTTPS.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/bots \\
  -H "Content-Type: application/json" \\
  -H "X-Firebase-Token: YOUR_FIREBASE_ID_TOKEN" \\
  -d '{
    "name": "MyCuratorBot",
    "description": "Sends gifts to top listeners"
  }'`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "abc123def456",
    "name": "MyCuratorBot",
    "description": "Sends gifts to top listeners",
    "ownerId": "USER_FIREBASE_UID",
    "status": "active",
    "webhooks": [],
    "createdAt": "2026-01-15T10:30:00.000Z",
    "token": "knt_abc123def456_a1b2c3d4e5f6789012345678901234567890ab",
    "warning": "Store this token securely. It cannot be retrieved again."
  }
}`}</CodeBlock>

                <div className="dp-note dp-note--warning">
                    <span className="dp-note-icon">⚠</span>
                    <span>
                        Copy the <code className="dp-inline-code">token</code> value immediately.
                        It will never be shown again. If lost, use{' '}
                        <a href="#rotate-token">Rotate token</a> to generate a new one.
                    </span>
                </div>
            </section>

            {/* Get current bot */}
            <section id="get-me" className="dp-section">
                <h2 className="dp-section-title">Get current bot</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/bots/me</code>
                    <span className="dp-endpoint-desc">Returns the bot associated with the provided Bearer token.</span>
                </div>

                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/bots/me \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "abc123def456",
    "name": "MyCuratorBot",
    "description": "Sends gifts to top listeners",
    "avatarUrl": null,
    "ownerId": "USER_FIREBASE_UID",
    "status": "active",
    "webhooks": [],
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}`}</CodeBlock>
            </section>

            {/* Update bot */}
            <section id="update-me" className="dp-section">
                <h2 className="dp-section-title">Update current bot</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--put">PUT</span>
                    <code className="dp-endpoint-path">/api/v1/bots/me</code>
                    <span className="dp-endpoint-desc">Updates the name, description, or avatar of the authenticated bot.</span>
                </div>

                <p className="dp-paragraph"><strong>Request body</strong> (all fields optional — include only those you want to change)</p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">name</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>New display name. 2–64 characters.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">description</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>New description. Max 200 characters.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">avatarUrl</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>New avatar URL. Must be HTTPS.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl -X PUT https://knitly-demo.vercel.app/api/v1/bots/me \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{"description": "Updated: Rewards early listeners with NFT gifts"}'`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "abc123def456",
    "name": "MyCuratorBot",
    "description": "Updated: Rewards early listeners with NFT gifts",
    "status": "active"
  }
}`}</CodeBlock>
            </section>

            {/* Rotate token */}
            <section id="rotate-token" className="dp-section">
                <h2 className="dp-section-title">Rotate token</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--post">POST</span>
                    <code className="dp-endpoint-path">/api/v1/bots/token</code>
                    <span className="dp-endpoint-desc">Generates a new token. The old token is immediately invalidated.</span>
                </div>

                <div className="dp-note dp-note--danger">
                    <span className="dp-note-icon">✕</span>
                    <span>
                        Rotating a token is <strong>irreversible</strong>. Any service using the old token
                        will receive <code className="dp-inline-code">401 INVALID_TOKEN</code> immediately.
                        Update all your integrations before or right after rotating.
                    </span>
                </div>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/bots/token \\
  -H "Authorization: Bearer knt_OLD_TOKEN"`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "token": "knt_abc123def456_NEW_SECRET_40_HEX_CHARS_HERE",
    "warning": "Your previous token is now invalidated."
  }
}`}</CodeBlock>
            </section>

        </div>
    );
}
