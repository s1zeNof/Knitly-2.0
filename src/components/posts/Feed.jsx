import React from 'react';
import { useQuery } from 'react-query'; // Переконайтесь, що використовуєте 'react-query'
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { db } from '../../firebase';
import PostCard from './PostCard';
import './Post.css';

// <<< ЗМІНА: Функція тепер приймає userId >>>
const fetchPosts = async (userId) => {
  let postsQuery;
  
  // Якщо userId передано, фільтруємо пости за автором
  if (userId) {
    postsQuery = query(
      collection(db, 'posts'), 
      where('authorId', '==', userId), 
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
  } else {
    // Якщо userId НЕ передано (для головної сторінки), завантажуємо всі пости
    postsQuery = query(
      collection(db, 'posts'), 
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
  }

  const querySnapshot = await getDocs(postsQuery);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// <<< ЗМІНА: Компонент тепер приймає проп 'userId' >>>
const Feed = ({ userId = null }) => {
  // <<< ЗМІНА: Ключ запиту тепер унікальний для кожного користувача >>>
  // Це важливо, щоб React Query кешував стрічку кожного користувача окремо
  const queryKey = ['feedPosts', userId];

  const { data: posts, isLoading, error } = useQuery(
    queryKey, 
    () => fetchPosts(userId) // Передаємо userId у функцію завантаження
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
        posts.map(post => <PostCard key={post.id} post={post} />)
      ) : (
        <p className="feed-placeholder">Тут поки що немає дописів.</p>
      )}
    </div>
  );
};

export default Feed;