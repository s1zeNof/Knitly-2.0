import React from 'react';
import CodeBlock from '../../CodeBlock';

export default function TracksContentEn() {
    return (
        <div className="dp-content">

            <nav className="dp-toc" aria-label="Table of Contents">
                <p className="dp-toc-title">On this page</p>
                <ol className="dp-toc-list">
                    <li><a href="#track-object">Track object</a></li>
                    <li><a href="#list-tracks">List tracks</a></li>
                    <li><a href="#get-track">Get a track</a></li>
                </ol>
            </nav>

            {/* Track object */}
            <section id="track-object" className="dp-section">
                <h2 className="dp-section-title">Track object</h2>
                <p className="dp-paragraph">
                    The API exposes only the public fields of a track. Sensitive metadata
                    (uploader UID, storage paths, moderation flags) is never returned.
                </p>

                <table className="dp-param-table">
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="dp-param-name">id</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Firestore document ID of the track.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">title</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Track title.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">artistName</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Display name of the artist.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">artistId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>Firebase Auth UID of the artist.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">coverArtUrl</code></td>
                            <td><span className="dp-param-type">string | null</span></td>
                            <td>URL to the cover art image.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">duration</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>Track duration in seconds.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">genre</code></td>
                            <td><span className="dp-param-type">string | null</span></td>
                            <td>Genre tag (e.g. <code className="dp-inline-code">hip-hop</code>, <code className="dp-inline-code">electronic</code>).</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">tags</code></td>
                            <td><span className="dp-param-type">string[]</span></td>
                            <td>Array of custom tags added by the artist.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">playsCount</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>Total play count.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">likesCount</code></td>
                            <td><span className="dp-param-type">number</span></td>
                            <td>Total like count.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">type</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td><code className="dp-inline-code">original</code> | <code className="dp-inline-code">cover</code> | <code className="dp-inline-code">remix</code> | <code className="dp-inline-code">mashup</code> | <code className="dp-inline-code">fan_upload</code></td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">createdAt</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>ISO 8601 upload timestamp.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* List tracks */}
            <section id="list-tracks" className="dp-section">
                <h2 className="dp-section-title">List tracks</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/tracks</code>
                    <span className="dp-endpoint-desc">Returns a paginated list of public tracks, newest first.</span>
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
                            <td>Number of tracks to return. Maximum 50.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">startAfter</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>—</td>
                            <td>Cursor for pagination. Use <code className="dp-inline-code">nextCursor</code> from the previous response.</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">genre</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>—</td>
                            <td>Filter by genre slug (e.g. <code className="dp-inline-code">hip-hop</code>).</td>
                        </tr>
                        <tr>
                            <td><code className="dp-param-name">artistId</code></td>
                            <td><span className="dp-param-type">string</span></td>
                            <td>—</td>
                            <td>Filter by artist UID.</td>
                        </tr>
                    </tbody>
                </table>

                <CodeBlock lang="bash">{`curl "https://knitly-demo.vercel.app/api/v1/tracks?limit=5&genre=hip-hop" \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "items": [
      {
        "id": "TRACK_ID",
        "title": "Midnight Flow",
        "artistName": "SomeArtist",
        "artistId": "ARTIST_UID",
        "coverArtUrl": "https://...",
        "duration": 214,
        "genre": "hip-hop",
        "tags": ["underground", "boom-bap"],
        "playsCount": 1204,
        "likesCount": 87,
        "type": "original",
        "createdAt": "2026-01-10T09:00:00.000Z"
      }
    ],
    "nextCursor": "TRACK_ID",
    "hasMore": true
  }
}`}</CodeBlock>
            </section>

            {/* Get track */}
            <section id="get-track" className="dp-section">
                <h2 className="dp-section-title">Get a track</h2>

                <div className="dp-endpoint">
                    <span className="dp-method dp-method--get">GET</span>
                    <code className="dp-endpoint-path">/api/v1/tracks/:id</code>
                    <span className="dp-endpoint-desc">Returns a single public track by its Firestore ID.</span>
                </div>

                <CodeBlock lang="bash">{`curl https://knitly-demo.vercel.app/api/v1/tracks/TRACK_ID \\
  -H "Authorization: Bearer knt_abc123def456_a1b2c3..."`}</CodeBlock>

                <CodeBlock lang="json">{`{
  "ok": true,
  "result": {
    "id": "TRACK_ID",
    "title": "Midnight Flow",
    "artistName": "SomeArtist",
    "artistId": "ARTIST_UID",
    "coverArtUrl": "https://...",
    "duration": 214,
    "genre": "hip-hop",
    "tags": ["underground", "boom-bap"],
    "playsCount": 1204,
    "likesCount": 87,
    "type": "original",
    "createdAt": "2026-01-10T09:00:00.000Z"
  }
}`}</CodeBlock>
            </section>

        </div>
    );
}
