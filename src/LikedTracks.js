import React from 'react';
import { useUserContext } from './UserContext';
import { db } from './firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { useQuery } from 'react-query';
import TrackList from './TrackList';

// Функція для завантаження даних про треки на основі масиву їхніх ID
const fetchLikedTracks = async (likedTrackIds) => {
    // Якщо масив ID порожній, нічого не завантажуємо
    if (!likedTrackIds || likedTrackIds.length === 0) {
        return [];
    }
    
    // Firestore має обмеження в 10 елементів для оператора 'in'.
    // Тому ми розбиваємо великий масив ID на менші частини (чанки) по 10.
    const chunks = [];
    for (let i = 0; i < likedTrackIds.length; i += 10) {
        chunks.push(likedTrackIds.slice(i, i + 10));
    }
    
    const tracksRef = collection(db, 'tracks');
    // Створюємо масив промісів, де кожен проміс - це запит для одного чанка
    const promises = chunks.map(chunk => {
        const q = query(tracksRef, where(documentId(), 'in', chunk));
        return getDocs(q);
    });
    
    // Виконуємо всі запити паралельно
    const snapshots = await Promise.all(promises);
    
    // Збираємо результати з усіх запитів в один масив
    const tracks = snapshots.flatMap(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    // Сортуємо отримані треки в тому ж порядку, в якому вони були лайкнуті,
    // щоб найновіші лайки були зверху.
    const orderedTracks = likedTrackIds
        .map(id => tracks.find(track => track.id === id))
        .filter(Boolean) // Видаляємо undefined, якщо трек раптом був видалений з бази
        .reverse(); // Перевертаємо, щоб показати останні лайкнуті першими

    return orderedTracks;
};

const LikedTracks = () => {
    const { user: currentUser } = useUserContext();

    // Використовуємо react-query для завантаження та кешування даних
    const { data: tracks, isLoading } = useQuery(
        // Ключ запиту: він унікальний для користувача та його списку лайків
        ['likedTracks', currentUser?.uid, currentUser?.likedTracks], 
        () => fetchLikedTracks(currentUser.likedTracks),
        {
            // Запит буде виконуватися тільки якщо користувач залогінений і має лайки
            enabled: !!currentUser?.likedTracks && currentUser.likedTracks.length > 0,
        }
    );
    
    // Компонент сам не малює список. Він лише завантажує дані
    // і передає їх у TrackList, який вже вміє все гарно відображати.
    return (
        <TrackList 
            initialTracks={tracks} 
            isLoading={isLoading} 
            listTitle="Вподобана музика"
        />
    );
};

export default LikedTracks;