import React, { useEffect } from 'react';
import { useQuery } from 'react-query';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PostCard from './PostCard';
import './Post.css';

const POSTS_LIMIT = 20;

const fetchPosts = async (userId, followingList) => {
  try {
    if (userId && !followingList) {
      const postsQuery = query(collection(db, 'posts'), where('authorUids', 'array-contains', userId), orderBy('createdAt', 'desc'), limit(POSTS_LIMIT));
      const snap = await getDocs(postsQuery);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    if (followingList && followingList.length === 0) return [];
    if (followingList && followingList.length > 0) {
      const CHUNK_SIZE = 30;
      const chunks = [];
      for (let i = 0; i < followingList.length; i += CHUNK_SIZE) chunks.push(followingList.slice(i, i + CHUNK_SIZE));
      const results = await Promise.all(chunks.map(chunk => getDocs(query(collection(db, 'posts'), where('authorUids', 'array-contains-any', chunk), orderBy('createdAt', 'desc'), limit(POSTS_LIMIT)))));
      const allPosts = new Map();
      results.forEach(snap => snap.docs.forEach(doc => { if (!allPosts.has(doc.id)) allPosts.set(doc.id, { id: doc.id, ...doc.data() }); }));
      return [...allPosts.values()].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)).slice(0, POSTS_LIMIT);
    }
    const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(POSTS_LIMIT)));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Feed: помилка завантаження постів:', error);
    return [];
  }
};

const Feed = ({ userId = null, followingList = null, openBrowser, openShareModal }) => {
  useEffect(() => {
    return () => { };
  }, []);

  const queryKey = ['feedPosts', userId, JSON.stringify(followingList)];

  const { data: posts, isLoading, error } = useQuery(
    queryKey,
    async () => {
      const result = await fetchPosts(userId, followingList);
      return result;
    },
    {
      enabled: followingList !== null || userId !== null,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  );

  if (isLoading) return <div className="feed-loader-container" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="loader-spinner"></div></div>;
  if (error) return <div className="feed-error">Не вдалося завантажити дописи.</div>;

  return (
    <div className="feed-container">
      {posts && posts.length > 0 ? (
        posts.map(post => (
          <div key={post.id} className="post-card-anim">
            <PostCard post={post} openBrowser={openBrowser} openShareModal={openShareModal} />
          </div>
        ))
      ) : (
        <p className="feed-placeholder">Тут поки що немає дописів.</p>
      )}
    </div>
  );
};

export default React.memo(Feed);