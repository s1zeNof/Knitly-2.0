import React, { useState, useMemo } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import { useQuery } from 'react-query';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, documentId, orderBy } from 'firebase/firestore';
import './ShareMusicModal.css';
import default_picture from '../../img/Default-Images/default-picture.svg';

const ShareMusicModal = ({ isOpen, onClose, onShare }) => {
    const { user: currentUser } = useUserContext();
    const [activeTab, setActiveTab] = useState('my-tracks');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: myTracks = [], isLoading: isLoadingMyTracks } = useQuery(
        ['myTracksForSharing', currentUser?.uid],
        () => getDocs(query(collection(db, 'tracks'), where('authorId', '==', currentUser.uid), orderBy('createdAt', 'desc'))).then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        { enabled: !!currentUser }
    );

    const { data: likedTracks = [], isLoading: isLoadingLiked } = useQuery(
        ['likedTracksForSharing', currentUser?.uid],
        async () => {
            if (!currentUser?.likedTracks || currentUser.likedTracks.length === 0) return [];
            const chunks = [];
            for (let i = 0; i < currentUser.likedTracks.length; i += 10) {
                chunks.push(currentUser.likedTracks.slice(i, i + 10));
            }
            const trackPromises = chunks.map(chunk => getDocs(query(collection(db, 'tracks'), where(documentId(), 'in', chunk))));
            const trackSnapshots = await Promise.all(trackPromises);
            return trackSnapshots.flatMap(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        },
        { enabled: !!currentUser?.likedTracks?.length }
    );

    const { data: albums = [], isLoading: isLoadingAlbums } = useQuery(
        ['myAlbumsForSharing', currentUser?.uid],
        () => getDocs(query(collection(db, 'albums'), where('artistId', '==', currentUser.uid), orderBy('releaseDate', 'desc'))).then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        { enabled: !!currentUser }
    );
    
    const filteredContent = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (activeTab === 'my-tracks') return myTracks.filter(t => t.title.toLowerCase().includes(term));
        if (activeTab === 'liked') return likedTracks.filter(t => t.title.toLowerCase().includes(term));
        if (activeTab === 'albums') return albums.filter(a => a.title.toLowerCase().includes(term));
        return [];
    }, [searchTerm, activeTab, myTracks, likedTracks, albums]);


    const renderContent = () => {
        const isLoading = isLoadingMyTracks || isLoadingLiked || isLoadingAlbums;
        if(isLoading) return <div className="share-loading">Завантаження...</div>

        switch(activeTab) {
            case 'my-tracks':
            case 'liked':
                return filteredContent.length > 0 ? (
                    <div className="share-list">
                        {filteredContent.map(track => (
                            <div key={track.id} className="share-track-item">
                                <img src={track.coverArtUrl || default_picture} alt={track.title}/>
                                <div className="share-item-info">
                                    <p className="share-item-title">{track.title}</p>
                                    <p className="share-item-author">{track.authorName}</p>
                                </div>
                                <button onClick={() => onShare(track, 'track')}>Поділитись</button>
                            </div>
                        ))}
                    </div>
                ) : <p className="share-empty">Немає треків для відображення.</p>;
            case 'albums':
                 return filteredContent.length > 0 ? (
                    <div className="share-grid">
                        {filteredContent.map(album => (
                            <div key={album.id} className="share-album-card">
                                <img src={album.coverArtUrl || default_picture} alt={album.title}/>
                                <p className="share-item-title">{album.title}</p>
                                <button onClick={() => onShare(album, 'album')}>Поділитись</button>
                            </div>
                        ))}
                    </div>
                ) : <p className="share-empty">У вас ще немає створених альбомів.</p>;
            default:
                return null;
        }
    }


    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content share-music-modal" onClick={e => e.stopPropagation()}>
                <header className="share-music-header">
                    <h4>Поділитися музикою</h4>
                    <button onClick={onClose} className="modal-close-button">&times;</button>
                </header>
                <div className="share-music-body">
                    <input 
                        type="text" 
                        className="form-input search-music-input" 
                        placeholder="Пошук..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="share-music-tabs">
                        <button className={activeTab === 'my-tracks' ? 'active' : ''} onClick={() => setActiveTab('my-tracks')}>Мої треки</button>
                        <button className={activeTab === 'liked' ? 'active' : ''} onClick={() => setActiveTab('liked')}>Вподобані</button>
                        <button className={activeTab === 'albums' ? 'active' : ''} onClick={() => setActiveTab('albums')}>Альбоми</button>
                    </div>
                    <div className="share-music-content">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareMusicModal;