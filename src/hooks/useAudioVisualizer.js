import { useEffect, useRef, useState } from 'react';

// Shared state to prevent multiple connections/nodes per element
const audioMap = new Map(); // Map<HTMLAudioElement, { source, analyzer }>
let sharedAudioContext = null;

export const useAudioVisualizer = (audioElement) => {
    const [audioData, setAudioData] = useState({ bass: 0, mid: 0, treble: 0 });
    const requestRef = useRef(null);

    useEffect(() => {
        if (!audioElement) return;

        const initContext = () => {
            try {
                if (!sharedAudioContext) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (!AudioContext) return;
                    sharedAudioContext = new AudioContext();
                }

                if (sharedAudioContext.state === 'suspended') {
                    sharedAudioContext.resume();
                }

                let nodes = audioMap.get(audioElement);

                if (!nodes) {
                    const source = sharedAudioContext.createMediaElementSource(audioElement);
                    const analyzer = sharedAudioContext.createAnalyser();
                    analyzer.fftSize = 256;

                    // Chain: source -> analyzer -> destination
                    source.connect(analyzer);
                    analyzer.connect(sharedAudioContext.destination);

                    nodes = { source, analyzer, refCount: 0 };
                    audioMap.set(audioElement, nodes);
                }

                nodes.refCount++;
                startVisualization(nodes.analyzer);
            } catch (err) {
                console.warn('[useAudioVisualizer] init failed:', err);
            }
        };

        const startVisualization = (analyzer) => {
            const bufferLength = analyzer.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const update = () => {
                analyzer.getByteFrequencyData(dataArray);

                let bassSum = 0;
                for (let i = 0; i < 10; i++) bassSum += dataArray[i];
                const bass = bassSum / 10 / 255;

                let midSum = 0;
                for (let i = 10; i < 80; i++) midSum += dataArray[i];
                const mid = midSum / 70 / 255;

                let trebleSum = 0;
                for (let i = 80; i < bufferLength; i++) trebleSum += dataArray[i];
                const treble = trebleSum / (bufferLength - 80) / 255;

                setAudioData({ bass, mid, treble });
                requestRef.current = requestAnimationFrame(update);
            };

            update();
        };

        const handlePlay = () => initContext();
        audioElement.addEventListener('play', handlePlay);
        audioElement.addEventListener('playing', handlePlay);

        if (!audioElement.paused) {
            initContext();
        }

        return () => {
            audioElement.removeEventListener('play', handlePlay);
            audioElement.removeEventListener('playing', handlePlay);
            
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }

            const nodes = audioMap.get(audioElement);
            if (nodes) {
                nodes.refCount--;
                // We DON'T disconnect from destination here because other components 
                // might still be listening or the audio would stop abruptly.
                // We keep the chain alive for the lifetime of the audioElement.
            }
        };
    }, [audioElement]);

    return audioData;
};
