import React from 'react';
import { useUserContext } from './UserContext';
import { db } from './firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { useQuery } from 'react-query';
import TrackList from './TrackList';

const fetchLikedTracks = async (likedTrackIds) => {
    if (!likedTrackIds || likedTrackIds.length === 0) {
        return [];
    }
    
    const chunks = [];
    for (let i = 0; i < likedTrackIds.length; i += 10) {
        chunks.push(likedTrackIds.slice(i, i + 10));
    }
    
    const tracksRef = collection(db, 'tracks');
    const promises = chunks.map(chunk => {
        const q = query(tracksRef, where(documentId(), 'in', chunk));
        return getDocs(q);
    });
    
    const snapshots = await Promise.all(promises);
    const tracks = snapshots.flatMap(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    const orderedTracks = likedTrackIds
        .map(id => tracks.find(track => track.id === id))
        .filter(Boolean)
        .reverse();

    return orderedTracks;
};

// --- ЗМІНА: Компонент тепер приймає 'user' як пропс ---
const LikedTracks = ({ user: userProp }) => {
    const { user: currentUser } = useUserContext();

    // Визначаємо, чиї лайки показувати: переданого користувача чи поточного
    const targetUser = userProp || currentUser;

    const { data: tracks, isLoading } = useQuery(
        // --- ЗМІНА: Ключ запиту тепер залежить від ID цільового користувача ---
        ['likedTracks', targetUser?.uid, targetUser?.likedTracks], 
        () => fetchLikedTracks(targetUser.likedTracks),
        {
            // --- ЗМІНА: Запит виконується, якщо є цільовий користувач і в нього є лайки ---
            enabled: !!targetUser?.likedTracks && targetUser.likedTracks.length > 0,
        }
    );
    
    return (
        <TrackList 
            initialTracks={tracks} 
            isLoading={isLoading} 
            listTitle="Вподобана музика"
        />
    );
};

export default LikedTracks;