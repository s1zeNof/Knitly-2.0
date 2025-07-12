import React from 'react';
import { useQuery } from 'react-query';
import { db } from '../../shared/services/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useUserContext } from '../../contexts/UserContext';
import PostAnalyticsCard from '../posts/PostAnalyticsCard';

const fetchArtistPosts = async (artistId) => {
    if (!artistId) return [];
    const postsQuery = query(
        collection(db, 'posts'),
        where('authorUids', 'array-contains', artistId),
        orderBy('createdAt', 'desc'),
        limit(10)
    );
    const snapshot = await getDocs(postsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const PostsAnalyticsTab = () => {
    const { user: currentUser } = useUserContext();

    const { data: artistPosts, isLoading: postsLoading } = useQuery(
        ['artistPosts', currentUser?.uid],
        () => fetchArtistPosts(currentUser?.uid),
        { enabled: !!currentUser?.uid }
    );

    return (
        <div>
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
    );
};

export default PostsAnalyticsTab;