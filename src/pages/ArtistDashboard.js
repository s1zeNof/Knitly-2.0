import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { db } from '../services/firebase';
import { collection, query, where, documentId, getDocs, orderBy, limit } from 'firebase/firestore';
import { useUserContext } from '../contexts/UserContext';
import { useUserTracks } from '../hooks/useUserTracks';
import TrackList from '../components/common/TrackList';
import LeftSidebar from '../components/layout/LeftSidebar';
import default_picture from '../img/Default-Images/default-picture.svg';
// --- ВИПРАВЛЕНО ШЛЯХ: 'post' -> 'posts' ---
import PostAnalyticsCard from '../components/posts/PostAnalyticsCard';
import './ArtistDashboard.css';

// Іконки (без змін)
const PlayCountIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>;
const LikesIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const FollowersIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;

const fetchFollowersDetails = async (followerIds) => {
    if (!followerIds || followerIds.length === 0) return [];
    const chunks = [];
    for (let i = 0; i < followerIds.length; i += 10) {
        chunks.push(followerIds.slice(i, i + 10));
    }
    const userPromises = chunks.map(chunk => getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk))));
    const userSnapshots = await Promise.all(userPromises);
    return userSnapshots.flatMap(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};

const fetchArtistPosts = async (artistId) => {
    if (!artistId) return [];
    const postsQuery = query(
        collection(db, 'posts'), 
        where('authorId', '==', artistId), 
        orderBy('createdAt', 'desc'),
        limit(5)
    );
    const snapshot = await getDocs(postsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


const StatCard = ({ title, value, icon, isLoading }) => (
    <div className="stat-card">
        <div className="stat-card-icon">{icon}</div>
        <div className="stat-card-info">
            <p className="stat-card-title">{title}</p>
            {isLoading ? <div className="stat-card-loader"></div> : <p className="stat-card-value">{value.toLocaleString('uk-UA')}</p>}
        </div>
    </div>
);

const ArtistDashboard = ({ isSidebarOpen }) => {
    const { user: currentUser } = useUserContext();
    const { tracks, loading: tracksLoading } = useUserTracks(currentUser?.uid);
    const [isHeaderShrunk, setIsHeaderShrunk] = useState(false);

    const scrollContainerRef = useRef(null);
    const headerTriggerRef = useRef(null);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        const trigger = headerTriggerRef.current;
        if (!scrollContainer || !trigger) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsHeaderShrunk(!entry.isIntersecting);
            },
            { root: scrollContainer, threshold: 0 }
        );

        observer.observe(trigger);
        return () => observer.disconnect();
    }, []);

    const { data: followersDetails, isLoading: followersLoading } = useQuery(
        ['followersDetails', currentUser?.uid],
        () => fetchFollowersDetails(currentUser.followers),
        { enabled: !!currentUser?.followers?.length }
    );

    const { data: artistPosts, isLoading: postsLoading } = useQuery(
        ['artistPosts', currentUser?.uid],
        () => fetchArtistPosts(currentUser?.uid),
        { enabled: !!currentUser?.uid }
    );


    const stats = useMemo(() => {
        if (!tracks || tracks.length === 0) return { totalPlays: 0, totalLikes: 0, topTracks: [] };
        const totalPlays = tracks.reduce((sum, track) => sum + (track.playCount || 0), 0);
        const totalLikes = tracks.reduce((sum, track) => sum + (track.likesCount || 0), 0);
        const topTracks = [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 5);
        return { totalPlays, totalLikes, topTracks };
    }, [tracks]);

    const audienceAnalytics = useMemo(() => {
        if (!followersDetails) return { geography: [], recentFollowers: [] };
        const geographyMap = new Map();
        followersDetails.forEach(follower => {
            const country = follower.country || 'Не вказано';
            geographyMap.set(country, (geographyMap.get(country) || 0) + 1);
        });
        const totalFollowers = followersDetails.length;
        const geography = Array.from(geographyMap.entries())
            .map(([country, count]) => ({ country, count, percentage: (count / totalFollowers) * 100 }))
            .sort((a, b) => b.count - a.count);
        const recentFollowers = [...followersDetails].reverse().slice(0, 8);
        return { geography, recentFollowers };
    }, [followersDetails]);

    if (!currentUser) return <div className="dashboard-container">Помилка: користувач не знайдений.</div>;
    
    return (
        <div className="dashboard-wrapper">
            <LeftSidebar isOpen={isSidebarOpen} />
            <div 
                ref={scrollContainerRef}
                className={`dashboard-content-pusher ${isSidebarOpen ? 'sidebar-open' : ''}`}
            >
                <div className="dashboard-container">
                    <header className={`dashboard-header ${isHeaderShrunk ? 'shrunk' : ''}`}>
                        <h1>Панель артиста</h1>
                        <p>Ваша персональна статистика та аналітика, {currentUser.displayName}.</p>
                    </header>
                    
                    <div ref={headerTriggerRef} className="header-scroll-trigger"></div>

                    <div className="dashboard-content-body">
                        <div className="dashboard-grid-layout">
                            <div className="dashboard-main-column">
                                <section className="dashboard-section">
                                    <div className="stats-grid">
                                        <StatCard title="Всього прослуховувань" value={stats.totalPlays} icon={<PlayCountIcon />} isLoading={tracksLoading}/>
                                        <StatCard title="Всього вподобань" value={stats.totalLikes} icon={<LikesIcon />} isLoading={tracksLoading}/>
                                        <StatCard title="Підписників" value={currentUser.followers?.length || 0} icon={<FollowersIcon />} isLoading={false} />
                                    </div>
                                </section>
                                <section className="dashboard-section">
                                    <h2 className="dashboard-section-title">Топ-5 треків</h2>
                                    <div className="dashboard-track-list">
                                        <TrackList initialTracks={stats.topTracks} isLoading={tracksLoading} />
                                    </div>
                                </section>

                                <section className="dashboard-section">
                                    <h2 className="dashboard-section-title">Ефективність останніх дописів</h2>
                                    <div className="posts-analytics-list">
                                        {postsLoading && <p>Завантаження аналітики...</p>}
                                        {!postsLoading && artistPosts && artistPosts.length > 0 ? (
                                            artistPosts.map(post => <PostAnalyticsCard key={post.id} post={post} />)
                                        ) : (
                                            !postsLoading && <p className="no-data-placeholder">У вас ще немає дописів, щоб аналізувати їх ефективність.</p>
                                        )}
                                    </div>
                                </section>

                            </div>
                            <aside className="dashboard-side-column">
                                <section className="dashboard-section">
                                    <h2 className="dashboard-section-title">Географія аудиторії</h2>
                                    <div className="audience-geography-card">
                                        {followersLoading ? <p>Аналіз даних...</p> : audienceAnalytics.geography.length > 0 ? (
                                            <ul className="country-list">
                                                {audienceAnalytics.geography.slice(0, 5).map(item => (
                                                    <li key={item.country}>
                                                        <span className="country-name">{item.country}</span>
                                                        <div className="country-bar-container">
                                                            <div className="country-bar" style={{ width: `${item.percentage}%` }}></div>
                                                        </div>
                                                        <span className="country-percentage">{item.percentage.toFixed(1)}%</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="no-data-placeholder">Немає даних про підписників.</p>}
                                    </div>
                                </section>
                                <section className="dashboard-section">
                                    <h2 className="dashboard-section-title">Останні підписники</h2>
                                    <div className="recent-followers-card">
                                        {followersLoading ? <p>Завантаження...</p> : audienceAnalytics.recentFollowers.length > 0 ? (
                                            <div className="followers-grid">
                                                {audienceAnalytics.recentFollowers.map(follower => (
                                                    <div key={follower.id} className="follower-item" title={follower.displayName}>
                                                        <img src={follower.photoURL || default_picture} alt={follower.displayName} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="no-data-placeholder">У вас ще немає підписників.</p>}
                                    </div>
                                </section>
                            </aside>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtistDashboard;