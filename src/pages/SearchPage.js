import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import TrackList from '../components/common/TrackList';
import { Link } from 'react-router-dom';
import default_picture from '../img/Default-Images/default-picture.svg';
import './SearchPage.css';

const SearchIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

const searchAll = async (term) => {
    if (!term) return { tracks: [], artists: [], users: [] };

    const lowerCaseTerm = term.toLowerCase();
    const endTerm = lowerCaseTerm + '\uf8ff';

    const tracksQuery = query(collection(db, 'tracks'), where('title_lowercase', '>=', lowerCaseTerm), where('title_lowercase', '<=', endTerm), limit(10));
    
    const usersByNicknameQuery = query(collection(db, 'users'), where('nickname', '>=', lowerCaseTerm), where('nickname', '<=', endTerm), limit(10));
    
    const usersByDisplayNameQuery = query(collection(db, 'users'), where('displayName_lowercase', '>=', lowerCaseTerm), where('displayName_lowercase', '<=', endTerm), limit(10));

    const [tracksSnap, usersByNicknameSnap, usersByDisplayNameSnap] = await Promise.all([
        getDocs(tracksQuery),
        getDocs(usersByNicknameQuery),
        getDocs(usersByDisplayNameQuery),
    ]);

    const tracks = tracksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const usersMap = new Map();
    usersByNicknameSnap.docs.forEach(doc => {
        usersMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    usersByDisplayNameSnap.docs.forEach(doc => {
        if (!usersMap.has(doc.id)) {
            usersMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
    });
    
    const allUsers = Array.from(usersMap.values());
    
    const artists = allUsers.filter(u => u.tracksCount > 0);
    const users = allUsers.filter(u => !u.tracksCount || u.tracksCount === 0);

    return { tracks, artists, users };
};

const SearchPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

    const { data: results, isLoading } = useQuery(
        ['search', debouncedSearchTerm],
        () => searchAll(debouncedSearchTerm),
        {
            enabled: !!debouncedSearchTerm,
        }
    );

    const renderResults = () => {
        if (isLoading) {
            return <div className="search-loader">Шукаємо...</div>;
        }
        if (!results && debouncedSearchTerm) {
            return <div className="search-placeholder">Нічого не знайдено.</div>;
        }
        if (!results) {
            return <div className="search-placeholder">Почніть вводити текст для пошуку...</div>;
        }

        const isResultsEmpty = results.tracks.length === 0 && results.artists.length === 0 && results.users.length === 0;
        if (isResultsEmpty) {
             return <div className="search-placeholder">Нічого не знайдено за запитом "{debouncedSearchTerm}".</div>;
        }
        
        return (
            <div className="search-results-tabs">
                <div className="tabs-header">
                    <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>Все</button>
                    {results.tracks.length > 0 && <button className={activeTab === 'tracks' ? 'active' : ''} onClick={() => setActiveTab('tracks')}>Треки</button>}
                    {results.artists.length > 0 && <button className={activeTab === 'artists' ? 'active' : ''} onClick={() => setActiveTab('artists')}>Артисти</button>}
                    {results.users.length > 0 && <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Слухачі</button>}
                </div>
                <div className="tabs-content">
                    {(activeTab === 'all' || activeTab === 'tracks') && results.tracks.length > 0 && (
                        <div className="result-section">
                            <h4>Треки</h4>
                            <TrackList initialTracks={results.tracks} isLoading={false} />
                        </div>
                    )}
                    {(activeTab === 'all' || activeTab === 'artists') && results.artists.length > 0 && (
                        <div className="result-section">
                            <h4>Артисти</h4>
                            <div className="artist-results-grid">
                                {results.artists.map(artist => (
                                    <Link to={`/user/${artist.nickname}`} key={artist.id} className="artist-card">
                                        <img src={artist.photoURL || default_picture} alt={artist.displayName}/>
                                        <p>{artist.displayName}</p>
                                        <span>@{artist.nickname}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                     {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                        <div className="result-section">
                            <h4>Слухачі</h4>
                            <div className="artist-results-grid">
                                {results.users.map(user => (
                                    <Link to={`/user/${user.nickname}`} key={user.id} className="artist-card">
                                        <img src={user.photoURL || default_picture} alt={user.displayName}/>
                                        <p>{user.displayName}</p>
                                        <span>@{user.nickname}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="search-page-container">
            <div className="search-bar-wrapper">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Пошук треків, артистів, дописів..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="search-results-container">
                {renderResults()}
            </div>
        </div>
    );
};

export default SearchPage;