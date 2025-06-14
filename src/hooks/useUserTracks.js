import { useState, useEffect, useCallback } from 'react'; // Додаємо useCallback
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export const useUserTracks = (userId) => {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    // useCallback, щоб уникнути зайвих перезавантажень
    const fetchTracks = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const tracksQuery = query(
                collection(db, "tracks"),
                where("authorId", "==", userId),
                orderBy("createdAt", "desc")
            );
            const tracksSnapshot = await getDocs(tracksQuery);
            const userTracks = tracksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTracks(userTracks);
        } catch (error) {
            console.error("Error fetching tracks:", error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchTracks();
    }, [fetchTracks]);

    // Повертаємо не тільки дані, але й функцію для їх оновлення
    return { tracks, loading, setTracks };
};