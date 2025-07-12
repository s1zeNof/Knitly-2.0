import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { db } from '../../shared/services/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { Link, useNavigate } from 'react-router-dom';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './HeaderSearch.css';

const SearchIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

const fetchLiveResults = async (term) => {
    if (!term) return null;

    const lowerCaseTerm = term.toLowerCase();
    const endTerm = lowerCaseTerm + '\uf8ff';

    const tracksQuery = query(collection(db, 'tracks'), where('title_lowercase', '>=', lowerCaseTerm), where('title_lowercase', '<=', endTerm), limit(3));
    const usersByNicknameQuery = query(collection(db, 'users'), where('nickname', '>=', lowerCaseTerm), where('nickname', '<=', endTerm), limit(2));
    const usersByDisplayNameQuery = query(collection(db, 'users'), where('displayName_lowercase', '>=', lowerCaseTerm), where('displayName_lowercase', '<=', endTerm), limit(2));

    // --- ПОЧАТОК ВИПРАВЛЕННЯ ---
    // Виправлено помилку: usersByDisplayNameSnap -> usersByDisplayNameQuery
    const [tracksSnap, usersByNicknameSnap, usersByDisplayNameSnap] = await Promise.all([
        getDocs(tracksQuery),
        getDocs(usersByNicknameQuery),
        getDocs(usersByDisplayNameQuery) 
    ]);
    // --- КІНЕЦЬ ВИПРАВЛЕННЯ ---

    const tracks = tracksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const artistsMap = new Map();
    usersByNicknameSnap.docs.forEach(doc => {
        artistsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    usersByDisplayNameSnap.docs.forEach(doc => {
        if (!artistsMap.has(doc.id)) {
            artistsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
    });

    const artists = Array.from(artistsMap.values());

    return { tracks, artists };
};

const HeaderSearch = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const searchWrapperRef = useRef(null);

    const { data: results, isLoading } = useQuery(
        ['liveSearch', debouncedSearchTerm],
        () => fetchLiveResults(debouncedSearchTerm),
        { enabled: !!debouncedSearchTerm }
    );
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setDropdownVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setDropdownVisible(false);
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };
    
    const closeDropdown = () => {
        setDropdownVisible(false);
    }

    return (
        <div className="header-search-wrapper" ref={searchWrapperRef}>
            <form className="desktop-search-form" onSubmit={handleSearchSubmit}>
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Пошук..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setDropdownVisible(true)}
                />
            </form>
            {isDropdownVisible && debouncedSearchTerm && (
                <div className="search-dropdown">
                    {isLoading && <div className="dropdown-item loader">Пошук...</div>}
                    {results?.tracks?.map(track => (
                        <Link to={`/track/${track.id}`} key={track.id} className="dropdown-item track" onClick={closeDropdown}>
                            <img src={track.coverArtUrl || default_picture} alt={track.title} />
                            <div className="item-info">
                                <p>{track.title}</p>
                                <span>{track.authorName}</span>
                            </div>
                        </Link>
                    ))}
                    {results?.artists?.map(artist => (
                        <Link to={`/user/${artist.nickname}`} key={artist.id} className="dropdown-item artist" onClick={closeDropdown}>
                            <img src={artist.photoURL || default_picture} alt={artist.displayName} />
                             <div className="item-info">
                                <p>{artist.displayName}</p>
                                <span>@{artist.nickname}</span>
                            </div>
                        </Link>
                    ))}
                    {results && (results.tracks?.length > 0 || results.artists?.length > 0) && (
                         <Link to={`/search?q=${encodeURIComponent(searchTerm.trim())}`} className="dropdown-item see-all" onClick={closeDropdown}>
                            Шукати скрізь "{searchTerm}"
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default HeaderSearch;