import React from 'react';
import Lottie from 'lottie-react';
import { useLottieData } from '../../shared/hooks/useLottieData';

const LottieRenderer = ({ url, className }) => {
    const { animationData, loading } = useLottieData(url);

    if (loading || !animationData) {
        // Можна повернути плейсхолдер завантаження, але для реакцій краще просто пусте місце
        return <div className={className} style={{ width: '100%', height: '100%' }} />;
    }

    return <Lottie animationData={animationData} loop={true} className={className} />;
};

export default LottieRenderer;