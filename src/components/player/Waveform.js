import React from 'react';
import './Waveform.css';

const Waveform = () => {
    // Генеруємо масив випадкових висот для стовпчиків
    const bars = Array.from({ length: 60 }, () => Math.random() * 0.8 + 0.2);

    return (
        <div className="waveform-container">
            {bars.map((height, index) => (
                <div 
                    key={index} 
                    className="waveform-bar" 
                    style={{ height: `${height * 100}%` }}
                ></div>
            ))}
        </div>
    );
};

export default Waveform;