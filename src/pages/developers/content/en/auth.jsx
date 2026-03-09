import React from 'react';
import { Link } from 'react-router-dom';
import CodeBlock from '../../CodeBlock';

export default function AuthContentEn() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Table of Contents">
                <p className="dp-toc-title">On this page</p>
                <ol className="dp-toc-list">
                    <li><a href="#token-format">Token format</a></li>
                    <li><a href="#sending-requests">Sending authenticated requests</a></li>
                    <li><a href="#registering-bot">Registering a bot (X-Firebase-Token)</a></li>
                    <li><a href="#rotating-tokens">Rotating your token</a></li>
                    <li><a href="#security-best-practices">Security best practices</a></li>
                </ol>
            </nav>

            {/* Token format */}
            <section id="token-format" className="dp-section">
                <h2 className="dp-section-title">Token format</h2>
                <p className="dp-paragraph">
                    Every bot token follows a predictable structure that encodes the bot's ID
                    for fast server-side lookups without a full database scan:
                </p>
                <CodeBlock lang="text">{`knt_{botId}_{40-char hex random}`}</CodeBlock>
                <p className="dp-paragraph">
                    Example: <code className="dp-inline-code">knt_abc123def456_a1b2c3d4e5f6789012345678901234567890ab</code>
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Segment</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">knt_</code></td>
                            <td>Static prefix. Makes Knitly tokens instantly recognisable and easy to scan with secret-detection tools.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">{'{botId}'}</code></td>
                            <td>The Firestore document ID of your bot. Used by the server to locate the correct bot record without a query.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">{'{40-char hex}'}</code></td>
                            <td>160 bits of cryptographic randomness (20 bytes from <code className="dp-inline-code">crypto.randomBytes</code>). Only the SHA-256 hash of this is stored server-side.</td>
                        </tr>
                    </tbody>
                </table>

                <div className="dp-note dp-note--warning">
                    <span className="dp-note-icon">⚠</span>
                    <span>
                        Tokens are shown <strong>once</strong> — at creation time.
                        They are never stored in plaintext by Knitly.
                        If you lose your token, rotate it via <code className="dp-inline-code">POST /api/v1/bots/token</code>.
                    </span>
                </div>
            </section>

            {/* Sending requests */}
            <section id="sending-requests" className="dp-section">
                <h2 className="dp-section-title">Sending authenticated requests</h2>
                <p className="dp-paragraph">
                    Include your bot token in every request using the standard HTTP{' '}
                    <code className="dp-inline-code">Authorization</code> header:
                </p>
                <CodeBlock lang="http">{`Authorization: Bearer knt_abc123def456_a1b2c3...`}</CodeBlock>

                <p className="dp-paragraph">Full example with <code className="dp-inline-code">curl</code>:</p>
                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/bots/me \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <p className="dp-paragraph">Full example with <code className="dp-inline-code">fetch</code> (JavaScript):</p>
                <CodeBlock lang="javascript">{`const res = await fetch('https://knitly-demo.vercel.app/api/v1/bots/me', {
  headers: {
    Authorization: 'Bearer knt_abc123def456_a1b2c3...',
  },
});
const { ok, result, error } = await res.json();`}</CodeBlock>
            </section>

            {/* Registering bot */}
            <section id="registering-bot" className="dp-section">
                <h2 className="dp-section-title">Registering a bot (X-Firebase-Token)</h2>
                <p className="dp-paragraph">
                    To create a bot, you must prove you own a Knitly user account.
                    This is done with a Firebase ID token in the{' '}
                    <code className="dp-inline-code">X-Firebase-Token</code> header.
                </p>
                <p className="dp-paragraph">
                    Obtain a Firebase ID token on the client side using the Firebase JS SDK:
                </p>
                <CodeBlock lang="javascript">{`import { getAuth } from 'firebase/auth';

const auth      = getAuth();
const idToken   = await auth.currentUser.getIdToken();

const res = await fetch('https://knitly-demo.vercel.app/api/v1/bots', {
  method: 'POST',
  headers: {
    'Content-Type':     'application/json',
    'X-Firebase-Token': idToken,
  },
  body: JSON.stringify({
    name:        'MyCuratorBot',
    description: 'Sends gifts to top listeners',
  }),
});

const { ok, result } = await res.json();
// result.token — store this securely, it's shown only once`}</CodeBlock>

                <div className="dp-note dp-note--info">
                    <span className="dp-note-icon">ℹ</span>
                    <span>
                        Firebase ID tokens expire after 1 hour. Always call{' '}
                        <code className="dp-inline-code">getIdToken()</code> (not{' '}
                        <code className="dp-inline-code">getIdToken(false)</code>) to receive a fresh token.
                        Bot API tokens, on the other hand, do not expire unless you rotate them.
                    </span>
                </div>
            </section>

            {/* Rotating tokens */}
            <section id="rotating-tokens" className="dp-section">
                <h2 className="dp-section-title">Rotating your token</h2>
                <p className="dp-paragraph">
                    If your token is compromised or you simply want to rotate it for security reasons,
                    issue a <code className="dp-inline-code">POST</code> to{' '}
                    <code className="dp-inline-code">/api/v1/bots/token</code>.
                    The <strong>old token is immediately invalidated</strong> upon success.
                </p>
                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/bots/token \\
  -H "Authorization: Bearer knt_OLD_TOKEN"`}</CodeBlock>
                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "token": "knt_abc123def456_NEW_SECRET...",
    "warning": "Your previous token is now invalidated."
  }
}`}</CodeBlock>
            </section>

            {/* Security best practices */}
            <section id="security-best-practices" className="dp-section">
                <h2 className="dp-section-title">Security best practices</h2>

                <ul className="dp-list">
                    <li>
                        <strong>Never commit tokens to source control.</strong> Use environment variables
                        (e.g. <code className="dp-inline-code">process.env.KNITLY_BOT_TOKEN</code>) or a secrets manager.
                    </li>
                    <li>
                        <strong>Use HTTPS only.</strong> All API requests must go over HTTPS.
                        Plaintext HTTP is rejected.
                    </li>
                    <li>
                        <strong>Rotate periodically.</strong> Even if uncompromised, rotate tokens
                        every 90 days as a hygiene measure.
                    </li>
                    <li>
                        <strong>Scope your bot narrowly.</strong> Only register webhooks for events
                        you actually need. Unused subscriptions add unnecessary attack surface.
                    </li>
                    <li>
                        <strong>Verify webhook signatures.</strong> (Coming in v1.1) Knitly will sign
                        webhook payloads with HMAC-SHA256. Verify the signature before processing events.
                    </li>
                </ul>

                <div className="dp-note dp-note--danger">
                    <span className="dp-note-icon">✕</span>
                    <span>
                        <strong>Never expose your bot token in client-side JavaScript.</strong>{' '}
                        All API calls must originate from your server — not from a browser or mobile app.
                    </span>
                </div>
            </section>

        </div>
    );
}
