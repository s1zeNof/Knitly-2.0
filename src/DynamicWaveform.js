import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePlayerContext } from './PlayerContext';

const DynamicWaveform = () => {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    
    // --- ОСНОВНА ЗМІНА: Отримуємо аудіо-елемент з контексту ---
    const { audioElement, currentTrack, seek } = usePlayerContext();

    // Ефект для ініціалізації WaveSurfer та прив'язки до аудіо-елемента
    useEffect(() => {
        // Перевіряємо, чи є контейнер для хвилі та аудіо-елемент
        if (!waveformRef.current || !audioElement) return;

        // Створюємо екземпляр WaveSurfer
        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            // --- КЛЮЧОВИЙ МОМЕНТ: Використовуємо існуючий аудіо-елемент ---
            media: audioElement,
            waveColor: '#555',
            progressColor: '#a855f7',
            barWidth: 3,
            barRadius: 2,
            height: 80,
            cursorWidth: 0, // Курсор не потрібен, бо прогрес буде показуватись кольором
            interact: true,
        });

        wavesurferRef.current = wavesurfer;

        // --- ВИПРАВЛЕННЯ ПРОКРУТКИ: Використовуємо подію 'interaction' ---
        // Вона спрацьовує на будь-який клік або перетягування
        const handleInteraction = (newTime) => {
            // WaveSurfer дає час напряму, коли прив'язаний до media
            seek(newTime);
        };
        wavesurfer.on('interaction', handleInteraction);
        
        // Функція очищення при демонтуванні компонента
        return () => {
            wavesurfer.un('interaction', handleInteraction);
            wavesurfer.destroy();
        };
    }, [audioElement, seek]); // Ефект залежить від аудіо-елемента та функції seek

    // Ефект для завантаження візуалізації нового треку
    useEffect(() => {
        if (wavesurferRef.current && currentTrack?.trackUrl) {
            // Ми не викликаємо .load(URL) знову. 
            // WaveSurfer сам "слухає" зміни в `audioElement.src`
            // і автоматично оновлює візуалізацію.
            // Це гарантує, що ми не створюємо другий плеєр.
        }
    }, [currentTrack?.trackUrl]); // Залежить тільки від URL треку

    // Компонент тепер не потребує відстеження isPlaying або currentTime,
    // оскільки WaveSurfer, прив'язаний до media, робить це автоматично.
    // Це вирішує проблему, що хвиля "не рухалась".

    return <div ref={waveformRef} style={{ width: '100%' }} />;
};

export default React.memo(DynamicWaveform);