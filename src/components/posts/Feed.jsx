import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from 'react-query';
import { collection, query, orderBy, getDocs, limit, where, startAfter } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PostCard from './PostCard';
import './Post.css';

const POSTS_PER_PAGE = 20;

// Reddit/HN-style hot score: engagement / time decay
const computeHotScore = (post) => {
  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const reactions = post.reactions
    ? Object.values(post.reactions).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
    : 0;
  const score = likes + reactions * 0.5 + comments * 1.5;
  const createdAtMs = post.createdAt?.toMillis?.() || Date.now();
  const hoursAge = Math.max((Date.now() - createdAtMs) / 3_600_000, 0.01);
  return score / Math.pow(hoursAge + 2, 1.5);
};

const fetchPage = async ({ pageParam = null }, { userId, followingList, feedType }) => {
  try {
    // Profile page: posts by a specific user only
    if (feedType === 'user' && userId) {
      const q = pageParam
        ? query(collection(db, 'posts'), where('authorUids', 'array-contains', userId), orderBy('createdAt', 'desc'), startAfter(pageParam), limit(POSTS_PER_PAGE))
        : query(collection(db, 'posts'), where('authorUids', 'array-contains', userId), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE));
      const snap = await getDocs(q);
      const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lastPost = posts[posts.length - 1];
      return { posts, nextCursor: lastPost?.createdAt || null, hasMore: snap.docs.length === POSTS_PER_PAGE };
    }

    // Following feed: posts from specific user IDs
    if (feedType === 'following' && followingList && followingList.length > 0) {
      const CHUNK_SIZE = 30;
      const chunks = [];
      for (let i = 0; i < followingList.length; i += CHUNK_SIZE) {
        chunks.push(followingList.slice(i, i + CHUNK_SIZE));
      }
      const results = await Promise.all(
        chunks.map(chunk => getDocs(
          pageParam
            ? query(collection(db, 'posts'), where('authorUids', 'array-contains-any', chunk), orderBy('createdAt', 'desc'), startAfter(pageParam), limit(POSTS_PER_PAGE))
            : query(collection(db, 'posts'), where('authorUids', 'array-contains-any', chunk), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE))
        ))
      );
      const seen = new Set();
      const merged = [];
      results.forEach(snap => snap.docs.forEach(doc => {
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          merged.push({ id: doc.id, ...doc.data() });
        }
      }));
      const sorted = merged
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
        .slice(0, POSTS_PER_PAGE);
      const lastPost = sorted[sorted.length - 1];
      return {
        posts: sorted,
        nextCursor: lastPost?.createdAt || null,
        hasMore: merged.length >= POSTS_PER_PAGE,
      };
    }

    // Hot feed: fetch 2x batch, sort by engagement score
    if (feedType === 'hot') {
      const hotLimit = POSTS_PER_PAGE * 2;
      const snap = await getDocs(
        pageParam
          ? query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(pageParam), limit(hotLimit))
          : query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(hotLimit))
      );
      const lastDoc = snap.docs[snap.docs.length - 1];
      const posts = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => computeHotScore(b) - computeHotScore(a));
      return {
        posts,
        nextCursor: lastDoc?.data()?.createdAt || null,
        hasMore: snap.docs.length === hotLimit,
      };
    }

    // New feed: simple chronological public feed
    const snap = await getDocs(
      pageParam
        ? query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(pageParam), limit(POSTS_PER_PAGE))
        : query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE))
    );
    const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastPost = posts[posts.length - 1];
    return {
      posts,
      nextCursor: lastPost?.createdAt || null,
      hasMore: snap.docs.length === POSTS_PER_PAGE,
    };
  } catch (err) {
    console.error('Feed: помилка завантаження:', err);
    return { posts: [], nextCursor: null, hasMore: false };
  }
};

const Feed = ({
  userId = null,
  followingList = null,
  feedType = 'new',
  feedFilter = 'threads',
  openBrowser,
  openShareModal,
}) => {
  const loaderRef = useRef(null);

  const enabled = useMemo(() => {
    if (feedType === 'hot' || feedType === 'new') return true;
    if (feedType === 'user') return !!userId;
    if (feedType === 'following') return followingList !== null;
    return false;
  }, [feedType, userId, followingList]);

  const queryKey = useMemo(
    () => ['feedPosts', feedType, userId, JSON.stringify(followingList)],
    [feedType, userId, followingList]
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    queryKey,
    ({ pageParam }) => fetchPage({ pageParam }, { userId, followingList, feedType }),
    {
      enabled,
      getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
      staleTime: 60_000,
      cacheTime: 5 * 60_000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );

  const posts = useMemo(() => {
    if (!data) return [];
    const seen = new Set();
    return data.pages
      .flatMap(page => page.posts)
      .filter(post => {
        if (seen.has(post.id)) return false;
        seen.add(post.id);
        return true;
      });
  }, [data]);

  const filteredPosts = useMemo(() => {
    if (feedFilter === 'media') return posts.filter(p => p.attachment && p.attachment.type !== 'poll');
    return posts;
  }, [posts, feedFilter]);

  const handleObserver = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: '200px', threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="feed-loader-container" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="loader-spinner" />
      </div>
    );
  }

  if (error) return <div className="feed-error">Не вдалося завантажити дописи.</div>;

  return (
    <div className="feed-container">
      {filteredPosts.length > 0 ? (
        <>
          {filteredPosts.map(post => (
            <div key={post.id} className="post-card-anim">
              <PostCard post={post} openBrowser={openBrowser} openShareModal={openShareModal} />
            </div>
          ))}
          <div ref={loaderRef} className="feed-sentinel">
            {isFetchingNextPage && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <div className="loader-spinner" />
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="feed-placeholder">Тут поки що немає дописів.</p>
      )}
    </div>
  );
};

export default React.memo(Feed);
