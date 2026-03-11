import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useUserContext } from '../contexts/UserContext';
import default_picture from '../img/Default-Images/default-picture.svg';
import './LibraryPage.css';

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const PlaylistIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const LibraryPage = () => {
  const { user, authLoading } = useUserContext();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('playlists');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchLibrary = async () => {
      setLoading(true);
      try {
        const [playlistsSnap, tracksSnap] = await Promise.all([
          getDocs(query(
            collection(db, 'playlists'),
            where('creatorId', '==', user.uid),
            orderBy('createdAt', 'desc')
          )),
          getDocs(query(
            collection(db, 'tracks'),
            where('authorId', '==', user.uid),
            orderBy('createdAt', 'desc')
          )),
        ]);

        setPlaylists(playlistsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTracks(tracksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('LibraryPage: помилка завантаження:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <div className="library-page">
      <div className="library-header">
        <h1 className="library-title">Моя бібліотека</h1>
        <div className="library-tabs">
          <button
            className={`library-tab${activeTab === 'playlists' ? ' active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            <PlaylistIcon />
            Плейлисти
          </button>
          <button
            className={`library-tab${activeTab === 'tracks' ? ' active' : ''}`}
            onClick={() => setActiveTab('tracks')}
          >
            <MusicIcon />
            Мої треки
          </button>
        </div>
      </div>

      {loading ? (
        <div className="library-loader">
          <div className="loader-spinner" />
        </div>
      ) : (
        <>
          {activeTab === 'playlists' && (
            <div className="library-section">
              {playlists.length > 0 ? (
                <div className="library-grid">
                  {playlists.map(playlist => (
                    <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="library-card">
                      <div className="library-card-cover">
                        <img
                          src={playlist.coverArtUrl || default_picture}
                          alt={playlist.title}
                          onError={e => { e.target.onerror = null; e.target.src = default_picture; }}
                        />
                      </div>
                      <div className="library-card-info">
                        <span className="library-card-title">{playlist.title || 'Без назви'}</span>
                        <span className="library-card-meta">
                          {playlist.trackIds?.length || 0} {pluralizeTracks(playlist.trackIds?.length || 0)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="library-empty">
                  <PlaylistIcon />
                  <p>Ще немає плейлистів</p>
                  <Link to="/upload" className="library-cta">Завантажити музику</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tracks' && (
            <div className="library-section">
              {tracks.length > 0 ? (
                <div className="library-list">
                  {tracks.map(track => (
                    <Link to={`/track/${track.id}`} key={track.id} className="library-track-row">
                      <img
                        src={track.coverArtUrl || default_picture}
                        alt={track.title}
                        className="library-track-cover"
                        onError={e => { e.target.onerror = null; e.target.src = default_picture; }}
                      />
                      <div className="library-track-info">
                        <span className="library-track-title">{track.title || 'Без назви'}</span>
                        <span className="library-track-meta">{track.authorName || ''}</span>
                      </div>
                      <span className="library-track-plays">{track.playsCount || 0} прослуховувань</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="library-empty">
                  <MusicIcon />
                  <p>Ще немає завантажених треків</p>
                  <Link to="/upload" className="library-cta">Завантажити трек</Link>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const pluralizeTracks = (n) => {
  if (n % 10 === 1 && n % 100 !== 11) return 'трек';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'треки';
  return 'треків';
};

export default LibraryPage;
