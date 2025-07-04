import React from 'react';
import { useQuery } from 'react-query';
// --- ЗМІНА: Додаємо limit ---
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PostCard from './PostCard';
import './Post.css';

// --- ЗМІНА: Логіка завантаження тепер використовує 'array-contains' ---
const fetchPosts = async (userId, followingList) => {
  let postsQuery;
  
  if (userId) {
    // Для сторінки профілю: завантажуємо пости, де користувач є одним з авторів
    postsQuery = query(
      collection(db, 'posts'), 
      where('authorUids', 'array-contains', userId), 
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
  } else if (followingList) {
    // Для головної стрічки: завантажуємо пости від людей, на яких підписаний користувач
    // Firestore 'array-contains-any' обмежений 10 елементами в масиві, тому якщо підписок більше,
    // треба буде реалізовувати складнішу логіку. Поки що для MVP робимо для 10.
    const followedIds = followingList.length > 0 ? followingList.slice(0, 10) : [ 'placeholder' ]; // Запобіжник, щоб запит не падав, якщо масив порожній
    postsQuery = query(
      collection(db, 'posts'),
      where('authorUids', 'array-contains-any', followedIds),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  } else {
    // Для неавторизованих користувачів або якщо немає підписок - показуємо останні пости
    postsQuery = query(
      collection(db, 'posts'), 
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
  }

  const querySnapshot = await getDocs(postsQuery);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- ЗМІНА: Компонент тепер приймає 'userId' та 'followingList' ---
const Feed = ({ userId = null, followingList = null }) => {
  // Ключ запиту тепер унікальний для кожної стрічки
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
        posts.map(post => <PostCard key={post.id} post={post} />)
      ) : (
        <p className="feed-placeholder">Тут поки що немає дописів.</p>
      )}
    </div>
  );
};

export default Feed;