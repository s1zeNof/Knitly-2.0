import React, { useRef, useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { useLottieData } from '../../hooks/useLottieData';

const LottieRenderer = ({ url, className }) => {
    const { animationData, loading } = useLottieData(url);
    const containerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { rootMargin: '300px' }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    if (loading || !animationData) {
        return <span className={className} style={{ width: '100%', height: '100%', display: 'inline-block' }} />;
    }

    return (
        <span ref={containerRef} className={className} style={{ display: 'inline-block', minWidth: '24px', minHeight: '24px' }}>
            {isVisible && (
                <Lottie
                    animationData={animationData}
                    loop={true}
                    style={{ display: 'inherit', width: '100%', height: '100%' }}
                />
            )}
        </span>
    );
};

export default LottieRenderer;