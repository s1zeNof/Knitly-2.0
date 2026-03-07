import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

// Minimal icons matching Vite admin style
const IcoRefresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>;
const IcoCopy = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>;
const IcoExternal = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;

const MAIN_APP_URL = 'https://knitly-demo.vercel.app'; // Update this to local if needed, or use relative paths if hosted together

export default function UnclaimedTracksTable() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTracks = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'tracks'), where('contentType', '==', 'fan_upload'));
            const snapshot = await getDocs(q);

            const fetchedTracks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Sort by descending
            fetchedTracks.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });

            // Fetch uploader info
            const tracksWithUsers = await Promise.all(fetchedTracks.map(async (track) => {
                let uploaderName = 'Unknown';
                if (track.authorId) {
                    const userDoc = await getDoc(doc(db, 'users', track.authorId));
                    if (userDoc.exists()) uploaderName = userDoc.data().displayName || userDoc.data().nickname;
                }
                return { ...track, uploaderName };
            }));

            setTracks(tracksWithUsers);
        } catch (err) {
            console.error("Error fetching unclaimed tracks:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTracks();
    }, []);

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
    };

    return (
        <div className="ud-card" style={{ marginTop: '1.5rem', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="ud-section-title" style={{ margin: 0 }}>Unclaimed Fan Uploads</div>
                <button className="adm-btn adm-btn--ghost" onClick={fetchTracks} disabled={loading} style={{ padding: '0.25rem 0.5rem' }}>
                    <IcoRefresh /> {loading ? '...' : 'Оновити'}
                </button>
            </div>

            <div className="adm-table-wrap">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Трек</th>
                            <th>Оригінальний Artist</th>
                            <th>Фан-аплоадер</th>
                            <th>ID треку</th>
                            <th className="adm-text-right">Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Завантаження...</td></tr>
                        ) : tracks.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Немає фан-завантажень.</td></tr>
                        ) : (
                            tracks.map(track => (
                                <tr key={track.id}>
                                    <td>
                                        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{track.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {track.createdAt ? new Date(track.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </td>
                                    <td>{track.originalArtist || '—'}</td>
                                    <td>{track.uploaderName}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                {track.id.substring(0, 8)}...
                                            </code>
                                            <button
                                                onClick={() => handleCopyId(track.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                                                title="Копіювати ID"
                                            >
                                                <IcoCopy />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="adm-text-right">
                                        {/* To actually open localhost:3000 during dev, we hack the URL */}
                                        <a
                                            href={`http://localhost:3000/track/${track.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="adm-btn adm-btn--ghost"
                                            style={{ display: 'inline-flex', padding: '4px 8px' }}
                                        >
                                            <IcoExternal /> Link
                                        </a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
