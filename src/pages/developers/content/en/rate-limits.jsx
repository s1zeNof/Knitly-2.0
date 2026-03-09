import React from 'react';
import { Link } from 'react-router-dom';
import CodeBlock from '../../CodeBlock';

export default function RateLimitsContentEn() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Table of Contents">
                <p className="dp-toc-title">On this page</p>
                <ol className="dp-toc-list">
                    <li><a href="#default-limits">Default limits</a></li>
                    <li><a href="#endpoint-limits">Endpoint-specific limits</a></li>
                    <li><a href="#rate-limit-headers">Rate limit headers</a></li>
                    <li><a href="#best-practices">Best practices</a></li>
                </ol>
            </nav>

            {/* Default limits */}
            <section id="default-limits" className="dp-section">
                <h2 className="dp-section-title">Default limits</h2>
                <p className="dp-paragraph">
                    Rate limits are applied per bot token using a sliding window counter.
                    Unless specified otherwise, every endpoint allows up to{' '}
                    <strong>60 requests per 60 seconds</strong>.
                </p>
                <p className="dp-paragraph">
                    When a limit is exceeded, the API returns{' '}
                    <code className="dp-inline-code">429 Too Many Requests</code> with error code{' '}
                    <code className="dp-inline-code">RATE_LIMITED</code>.
                </p>

                <div className="dp-note dp-note--warning">
                    <span className="dp-note-icon">⚠</span>
                    <span>
                        The current rate limiter uses an in-memory sliding window.
                        Limits reset on each cold start and are not shared across concurrent serverless instances.
                        A distributed rate limiter (Upstash Redis) will replace this in v1.1.
                    </span>
                </div>
            </section>

            {/* Endpoint limits */}
            <section id="endpoint-limits" className="dp-section">
                <h2 className="dp-section-title">Endpoint-specific limits</h2>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Endpoint</th><th>Method</th><th>Limit</th><th>Window</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/bots</code></td>
                            <td>GET, POST</td>
                            <td>60 req</td>
                            <td>60 s</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/bots/me</code></td>
                            <td>GET, PUT</td>
                            <td>60 req</td>
                            <td>60 s</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/bots/token</code></td>
                            <td>POST</td>
                            <td>60 req</td>
                            <td>60 s</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/gifts/send</code></td>
                            <td>POST</td>
                            <td><strong>30 req</strong></td>
                            <td>60 s</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/gifts/collection/:uid</code></td>
                            <td>GET</td>
                            <td>60 req</td>
                            <td>60 s</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/tracks</code></td>
                            <td>GET</td>
                            <td>60 req</td>
                            <td>60 s</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/tracks/:id</code></td>
                            <td>GET</td>
                            <td>60 req</td>
                            <td>60 s</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/webhooks</code></td>
                            <td>GET, POST</td>
                            <td>60 req</td>
                            <td>60 s</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">/api/v1/webhooks/:index</code></td>
                            <td>DELETE</td>
                            <td>60 req</td>
                            <td>60 s</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Rate limit headers */}
            <section id="rate-limit-headers" className="dp-section">
                <h2 className="dp-section-title">Rate limit headers</h2>
                <p className="dp-paragraph">
                    Every response includes headers that tell you your current rate limit status.
                    Use these to implement proactive backoff before hitting the limit.
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Header</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">X-RateLimit-Limit</code></td>
                            <td>Maximum number of requests allowed in the current window.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">X-RateLimit-Remaining</code></td>
                            <td>Number of requests remaining in the current window.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">X-RateLimit-Reset</code></td>
                            <td>Unix timestamp (seconds) when the current window resets.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">Retry-After</code></td>
                            <td>Seconds to wait before retrying. Present only on <code className="dp-inline-code">429</code> responses.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="http">{`HTTP/2 429 Too Many Requests
X-RateLimit-Limit:     30
X-RateLimit-Remaining: 0
X-RateLimit-Reset:     1737028860
Retry-After:           12

{
  "ok": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please slow down."
  }
}`}</CodeBlock>
            </section>

            {/* Best practices */}
            <section id="best-practices" className="dp-section">
                <h2 className="dp-section-title">Best practices</h2>

                <ul className="dp-list">
                    <li>
                        <strong>Use webhooks instead of polling.</strong> If you are checking for new events
                        by calling the API in a loop, switch to{' '}
                        <Link to="/developers/webhooks">Webhooks</Link> instead.
                        Webhooks eliminate polling traffic entirely and react to events in real time.
                    </li>
                    <li>
                        <strong>Implement exponential backoff.</strong> When you receive a{' '}
                        <code className="dp-inline-code">429</code>, wait for the number of seconds
                        specified in <code className="dp-inline-code">Retry-After</code>, then retry.
                        Double the wait on each subsequent failure.
                    </li>
                    <li>
                        <strong>Read the rate limit headers.</strong> Check{' '}
                        <code className="dp-inline-code">X-RateLimit-Remaining</code> before each
                        burst operation. Slow down proactively rather than waiting for a 429.
                    </li>
                    <li>
                        <strong>Batch gift sends where possible.</strong> If your bot needs to send
                        the same gift to many users, space out the requests evenly across the minute
                        rather than firing all at once.
                    </li>
                    <li>
                        <strong>Cache track and gift data.</strong> The <code className="dp-inline-code">/tracks</code> and
                        gift catalogue endpoints return slowly-changing data. Cache responses for
                        at least 60 seconds to avoid burning through your limit on lookups.
                    </li>
                </ul>

                <p className="dp-paragraph"><strong>Backoff example (JavaScript)</strong></p>
                <CodeBlock lang="javascript">{`async function sendWithBackoff(payload, maxRetries = 3) {
  let delay = 1000; // 1 second
  for (let i = 0; i <= maxRetries; i++) {
    const res = await fetch('https://knitly-demo.vercel.app/api/v1/gifts/send', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer knt_abc123def456_a1b2c3...',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (res.status !== 429) return res.json();
    const retryAfter = Number(res.headers.get('Retry-After') ?? 1) * 1000;
    await new Promise(r => setTimeout(r, Math.max(delay, retryAfter)));
    delay *= 2; // exponential backoff
  }
  throw new Error('Max retries exceeded');
}`}</CodeBlock>
            </section>

        </div>
    );
}
