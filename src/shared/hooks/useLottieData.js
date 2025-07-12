// src/hooks/useLottieData.js
import { useState, useEffect } from 'react';

// Простий кеш в пам'яті, щоб не завантажувати одну й ту ж анімацію двічі
const lottieCache = new Map();

export const useLottieData = (url) => {
    const [animationData, setAnimationData] = useState(lottieCache.get(url) || null);
    const [loading, setLoading] = useState(!animationData);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!url || lottieCache.has(url)) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (isMounted) {
                    lottieCache.set(url, data);
                    setAnimationData(data);
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error(`Failed to fetch Lottie animation from ${url}`, err);
                    setError(err);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [url]);

    return { animationData, loading, error };
};