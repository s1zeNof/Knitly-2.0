import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

export const useUserTracks = (userId, options = {}) => {
    const { orderByField = 'createdAt', orderByDirection = 'desc', limit: queryLimit } = options;
    
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTracks = useCallback(() => {
        if (!userId) {
            setTracks([]);
            setLoading(false);
            return () => {};
        }
        setLoading(true);
        
        let tracksQuery = query(
            collection(db, "tracks"),
            where("authorId", "==", userId)
        );

        if(orderByField && orderByDirection) {
            tracksQuery = query(tracksQuery, orderBy(orderByField, orderByDirection));
        }

        if(queryLimit) {
            tracksQuery = query(tracksQuery, limit(queryLimit));
        }

        const unsubscribe = onSnapshot(tracksQuery, (snapshot) => {
            const userTracks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTracks(userTracks);
            setLoading(false);
        }, (error) => {
            console.error("Помилка завантаження треків:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, [userId, orderByField, orderByDirection, queryLimit]);

    useEffect(() => {
        const unsubscribe = fetchTracks();
        return () => unsubscribe();
    }, [fetchTracks]);

    return { tracks, loading };
};