import React from 'react';
import { useQuery } from 'react-query';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PostCard from './PostCard';
import './Post.css';

const fetchPosts = async (userId, followingList) => {
  let postsQuery;
  
  if (userId) {
    postsQuery = query(
      collection(db, 'posts'), 
      where('authorUids', 'array-contains', userId), 
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
  } else if (followingList) {
    const followedIds = followingList.length > 0 ? followingList.slice(0, 10) : [ 'placeholder' ];
    postsQuery = query(
      collection(db, 'posts'),
      where('authorUids', 'array-contains-any', followedIds),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  } else {
    postsQuery = query(
      collection(db, 'posts'), 
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
  }

  const querySnapshot = await getDocs(postsQuery);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const Feed = ({ userId = null, followingList = null, openBrowser, openShareModal }) => {
  const queryKey = ['feedPosts', userId, JSON.stringify(followingList)];

  const { data: posts, isLoading, error } = useQuery(
    queryKey, 
    () => fetchPosts(userId, followingList)
  );

  if (isLoading) {
    return <div className="feed-loader">Завантаження дописів...</div>;
  }

  if (error) {
    return <div className="feed-error">Не вдалося завантажити дописи: {error.message}</div>;
  }

  return (
    <div className="feed-container">
      {posts && posts.length > 0 ? (
        posts.map(post => 
            <PostCard 
                key={post.id} 
                post={post} 
                openBrowser={openBrowser} 
                openShareModal={openShareModal}
            />)
      ) : (
        <p className="feed-placeholder">Тут поки що немає дописів.</p>
      )}
    </div>
  );
};

export default Feed;