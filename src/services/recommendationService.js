// src/services/recommendationService.js
import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';

// Допоміжна функція для отримання даних про підписки користувача
const getFollowingList = async (userId) => {
  if (!userId) return [];
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists() && userDoc.data().following) {
    return userDoc.data().following;
  }
  return [];
};

// 1. Отримати пости від людей, на яких користувач підписаний
const getPostsFromFollowing = async (userId) => {
  const following = await getFollowingList(userId);
  if (following.length === 0) {
    return [];
  }

  const postsRef = collection(db, 'posts');
  // Firestore обмежує 'in' до 30 елементів
  const q = query(
    postsRef,
    where('authorUids', 'array-contains-any', following.slice(0, 30)),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// 2. Отримати популярні пости (для відкриття нового)
const getPopularPosts = async (limitCount = 10) => {
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    orderBy('likesCount', 'desc'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Головна функція, яка збирає та сортує стрічку
export const getRecommendedFeed = async (userId) => {
  if (!userId) {
    // Для незареєстрованих користувачів показуємо лише популярне
    return await getPopularPosts(20);
  }

  // Паралельно виконуємо запити
  const [followingPosts, popularPosts] = await Promise.all([
    getPostsFromFollowing(userId),
    getPopularPosts(10),
  ]);

  // Об'єднуємо та видаляємо дублікати
  const allPosts = [...followingPosts, ...popularPosts];
  const uniquePosts = allPosts.reduce((acc, current) => {
    if (!acc.find((item) => item.id === current.id)) {
      acc.push(current);
    }
    return acc;
  }, []);

  // Сортуємо за датою створення
  const sortedFeed = uniquePosts.sort((a, b) => {
    return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
  });

  return sortedFeed;
};

// Функція для пошуку користувачів для поширення
export const searchUsers = async (queryText) => {
  if (!queryText) return [];
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('nickname_lowercase', '>=', queryText.toLowerCase()),
    where('nickname_lowercase', '<=', queryText.toLowerCase() + '\uf8ff'),
    limit(10)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Функція для отримання списку підписок
export const getFollowingUsers = async (userId) => {
    const followingIds = await getFollowingList(userId);
    if (followingIds.length === 0) return [];
    
    const users = [];
    for (let i = 0; i < followingIds.length; i += 30) {
        const chunk = followingIds.slice(i, i + 30);
        const q = query(collection(db, 'users'), where('uid', 'in', chunk));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
    }
    return users;
};