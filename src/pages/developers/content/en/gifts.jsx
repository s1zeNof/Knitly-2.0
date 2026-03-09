import React from 'react';
import CodeBlock from '../../CodeBlock';

export default function GiftsContentEn() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Table of Contents">
                <p className="dp-toc-title">On this page</p>
                <ol className="dp-toc-list">
                    <li><a href="#gift-types">Gift types</a></li>
                    <li><a href="#gift-object">Gift object</a></li>
                    <li><a href="#send-gift">Send a gift</a></li>
                    <li><a href="#get-collection">Get a user's collection</a></li>
                </ol>
            </nav>

            {/* Gift types */}
            <section id="gift-types" className="dp-section">
                <h2 className="dp-section-title">Gift types</h2>
                <p className="dp-paragraph">
                    Knitly supports two distinct gift types. Both are animated digital items,
                    but they differ in supply, ownership semantics, and revenue model.
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Type</th><th>Supply</th><th>Ownership</th><th>Artist cut</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">regular</code></td>
                            <td>Unlimited or limited</td>
                            <td>Display item, no blockchain record</td>
                            <td>90% primary</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">nft</code></td>
                            <td>Fixed mint cap</td>
                            <td>Unique serial, provenance chain, chain-ready</td>
                            <td>80% primary · 10% royalty on resale</td>
                        </tr>
                    </tbody>
                </table>

                <p className="dp-paragraph"><strong>Rarity tiers</strong></p>
                <p className="dp-paragraph">
                    Both gift types can have a rarity tier. Rarity is cosmetic and informational —
                    it does not enforce supply caps on its own (use <code className="dp-inline-code">maxMints</code> for that).
                </p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Rarity</th><th>Typical use</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code className="dp-param-name">common</code></td><td>Everyday gifts, unlimited supply</td></tr>
                        <tr><td><code className="dp-param-name">rare</code></td><td>Monthly drops, capped at a few thousand</td></tr>
                        <tr><td><code className="dp-param-name">epic</code></td><td>Album release gifts, capped at a few hundred</td></tr>
                        <tr><td><code className="dp-param-name">legendary</code></td><td>One-of-a-kind, NFT only, single mint</td></tr>
                    </tbody>
                </table>
            </section>

            {/* Gift object */}
            <section id="gift-object" className="dp-section">
                <h2 className="dp-section-title">Gift object</h2>
                <p className="dp-paragraph">
                    The gift catalogue lives in Firestore under the <code className="dp-inline-code">gifts</code> collection.
                    When sending a gift, you reference it by its <code className="dp-inline-code">giftId</code>.
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">id</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Firestore document ID — use this as <code className="dp-inline-code">giftId</code> when sending.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">name</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Display name of the gift (e.g. "Golden Vinyl").</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">type</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><code className="dp-inline-code">regular</code> | <code className="dp-inline-code">nft</code></td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">rarity</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><code className="dp-inline-code">common</code> | <code className="dp-inline-code">rare</code> | <code className="dp-inline-code">epic</code> | <code className="dp-inline-code">legendary</code></td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">price</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>Price in Knitly Notes (internal currency).</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">animationUrl</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>URL to the Lottie JSON animation file.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">isActive</code></td>
                            <td><span className="dp-param-type">boolean</span></td>
                            <td>If <code className="dp-inline-code">false</code>, the gift cannot be sent.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">maxMints</code></td>
                            <td><span className="dp-param-type">number | null</span></td>
                            <td><code className="dp-inline-code">null</code> means unlimited supply.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">mintedCount</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>How many copies have been sent so far.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">availableUntil</code></td>
                            <td><span className="dp-param-type">string | null</span></td>
                            <td>ISO 8601 expiry. After this date the gift cannot be sent.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Send a gift */}
            <section id="send-gift" className="dp-section">
                <h2 className="dp-section-title">Send a gift</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--post">POST</span>
                    <code className="dp-endpoint-path">/api/v1/gifts/send</code>
                    <span className="dp-endpoint-desc">Sends a gift to a Knitly user, optionally tied to a track.</span>
                </div>

                <p className="dp-paragraph">
                    Rate limited to <strong>30 requests / minute</strong> per bot token.
                    The operation is atomic — the recipient's collection is updated, the supply counter is decremented,
                    and a notification is created in a single Firestore batch write.
                </p>

                <p className="dp-paragraph"><strong>Request body</strong></p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">recipientId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--yes">required</span></td>
                            <td>Firebase Auth UID of the gift recipient.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">giftId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--yes">required</span></td>
                            <td>Firestore document ID of the gift to send.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">trackId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--no">optional</span></td>
                            <td>Firestore track ID to attach the gift to. Displayed on the track page.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">message</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><span className="dp-param-required--no">optional</span></td>
                            <td>Personal message included with the gift. Max 280 characters.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl -X POST https://knitly-demo.vercel.app/api/v1/gifts/send \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientId": "USER_FIREBASE_UID",
    "giftId": "GIFT_FIRESTORE_ID",
    "trackId": "TRACK_FIRESTORE_ID",
    "message": "Loved your track! Here is a small gift."
  }'`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "sent_gift_doc_id",
    "giftId": "GIFT_FIRESTORE_ID",
    "recipientId": "USER_FIREBASE_UID",
    "trackId": "TRACK_FIRESTORE_ID",
    "message": "Loved your track! Here is a small gift.",
    "status": "received",
    "createdAt": "2026-01-15T12:00:00.000Z"
  }
}`}</CodeBlock>

                <p className="dp-paragraph"><strong>Error cases</strong></p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Code</th><th>Reason</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">NOT_FOUND</code></td>
                            <td>The <code className="dp-inline-code">giftId</code> or <code className="dp-inline-code">recipientId</code> does not exist.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">CONFLICT</code></td>
                            <td>Gift is sold out (<code className="dp-inline-code">mintedCount</code> reached <code className="dp-inline-code">maxMints</code>) or past its <code className="dp-inline-code">availableUntil</code> date.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">FORBIDDEN</code></td>
                            <td>Gift is inactive (<code className="dp-inline-code">isActive: false</code>).</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">RATE_LIMITED</code></td>
                            <td>More than 30 send requests in a 60-second window.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Get collection */}
            <section id="get-collection" className="dp-section">
                <h2 className="dp-section-title">Get a user's collection</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/gifts/collection/:uid</code>
                    <span className="dp-endpoint-desc">Returns the gifts received by a specific user, paginated.</span>
                </div>

                <p className="dp-paragraph"><strong>Query parameters</strong></p>
                <table className="dp-param-table">
                    <thead>
                        <tr><th>Parameter</th><th>Type</th><th>Default</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">limit</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>20</td>
                            <td>Number of items to return. Maximum 50.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">startAfter</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>—</td>
                            <td>Cursor for pagination. Use <code className="dp-inline-code">nextCursor</code> from the previous response.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl "https://knitly-demo.vercel.app/api/v1/gifts/collection/USER_UID?limit=10" \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "items": [
      {
        "id": "sent_gift_doc_id",
        "giftId": "GIFT_FIRESTORE_ID",
        "giftName": "Golden Vinyl",
        "type": "nft",
        "rarity": "legendary",
        "animationUrl": "https://...",
        "trackId": "TRACK_FIRESTORE_ID",
        "message": "Loved your track!",
        "status": "received",
        "createdAt": "2026-01-15T12:00:00.000Z"
      }
    ],
    "nextCursor": "sent_gift_doc_id",
    "hasMore": false
  }
}`}</CodeBlock>
            </section>

        </div>
    );
}
