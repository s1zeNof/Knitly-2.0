import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePlayerContext } from '../../contexts/PlayerContext';

const DynamicWaveform = () => {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    
    const { audioElement, currentTrack, seek } = usePlayerContext();

    // Ефект для ініціалізації WaveSurfer
    useEffect(() => {
        if (!waveformRef.current || !audioElement) return;

        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            media: audioElement,
            waveColor: '#555',
            progressColor: '#a855f7',
            barWidth: 3,
            barRadius: 2,
            height: 80,
            cursorWidth: 0,
            interact: true,
        });

        wavesurferRef.current = wavesurfer;

        const handleInteraction = (newTime) => {
            seek(newTime);
        };
        wavesurfer.on('interaction', handleInteraction);
        
        return () => {
            wavesurfer.un('interaction', handleInteraction);
            wavesurfer.destroy();
        };
    }, [audioElement, seek]);

    // Ефект для завантаження візуалізації нового треку
    useEffect(() => {
        if (wavesurferRef.current && currentTrack?.trackUrl) {
            const wavesurfer = wavesurferRef.current;
            
            // <<< ОСНОВНЕ ВИПРАВЛЕННЯ ТУТ >>>
            // Метод load() повертає проміс, який може бути відхилено з помилкою AbortError.
            // Ми додаємо блок .catch(), щоб обробити цю конкретну помилку і не дати їй "впасти" в консоль.
            wavesurfer.load(currentTrack.trackUrl).catch(error => {
                if (error.name === 'AbortError') {
                    // Це очікувана помилка при швидкому перемиканні треків.
                    // Ми можемо її проігнорувати.
                    return; 
                }
                // Інші помилки все одно будемо показувати.
                console.error("Wavesurfer load error:", error);
            });
        }
    }, [currentTrack?.trackUrl, audioElement]);

    return <div ref={waveformRef} style={{ width: '100%' }} />;
};

export default React.memo(DynamicWaveform);