import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import './UnclaimedTracksTable.css';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const UnclaimedTracksTable = () => {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTracks = async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(
                collection(db, 'tracks'),
                where('contentType', '==', 'fan_upload')
            );
            const snapshot = await getDocs(q);

            const fetchedTracks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by createdAt desc in JS
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
                    if (userDoc.exists()) {
                        uploaderName = userDoc.data().displayName || userDoc.data().nickname;
                    }
                }
                return { ...track, uploaderName };
            }));

            setTracks(tracksWithUsers);
        } catch (err) {
            console.error("Error fetching unclaimed tracks:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTracks();
    }, []);

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        alert('ID скопійовано: ' + id);
    };

    return (
        <div className="unclaimed-tracks-section">
            <div className="unclaimed-header">
                <h2>Unclaimed Fan Uploads</h2>
                <button className="refresh-btn" onClick={fetchTracks} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    Оновити
                </button>
            </div>

            {error && <div className="admin-page-error">{error}</div>}

            <div className="table-container">
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Назва треку</th>
                            <th>Оригінальний Artist</th>
                            <th>Завантажив (Фан)</th>
                            <th>Дата</th>
                            <th>ID треку</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Завантаження...</td></tr>
                        ) : tracks.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Немає фан-завантажень.</td></tr>
                        ) : (
                            tracks.map(track => (
                                <tr key={track.id}>
                                    <td data-label="Назва треку">
                                        <div className="track-title-cell">
                                            <strong>{track.title}</strong>
                                        </div>
                                    </td>
                                    <td data-label="Оригінальний Artist">{track.originalArtist || '—'}</td>
                                    <td data-label="Завантажив (Фан)">{track.uploaderName}</td>
                                    <td data-label="Дата">
                                        {track.createdAt ? new Date(track.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td data-label="ID треку">
                                        <div className="track-id-cell">
                                            <span>{track.id.substring(0, 8)}...</span>
                                            <button className="icon-btn" onClick={() => handleCopyId(track.id)} title="Копіювати ID">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td data-label="Дії">
                                        <div className="action-buttons">
                                            <Link className="detail-link" to={`/track/${track.id}`} target="_blank">
                                                <ExternalLink size={14} /> Відкрити
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UnclaimedTracksTable;
