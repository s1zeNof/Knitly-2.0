import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePlayerContext } from './PlayerContext';

const DynamicWaveform = () => {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    
    const { audioElement, currentTrack, seek } = usePlayerContext();

    useEffect(() => {
        // Ensure the waveform container div and the audio element are available.
        // Also, ensure there's a track URL to load. If not, WaveSurfer has nothing to display.
        if (!waveformRef.current || !audioElement || !currentTrack?.trackUrl) {
            // If there's an existing wavesurfer instance, destroy it as there's no track to display
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
            return;
        }

        // If an instance already exists (e.g. from a previous track), destroy it first.
        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
        }

        // Create a new WaveSurfer instance
        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            media: audioElement, // Use the existing audio element from PlayerContext
            waveColor: '#555',
            progressColor: '#a855f7',
            barWidth: 3,
            barRadius: 2,
            height: 80,
            cursorWidth: 0, // Cursor not needed as progress is shown by color
            interact: true, // Allow user interaction (seeking)
        });

        wavesurferRef.current = wavesurfer;

        // Handle interaction (click/drag on waveform) for seeking
        const handleInteraction = (newTime) => {
            seek(newTime); // Call seek function from PlayerContext
        };
        wavesurfer.on('interaction', handleInteraction);
        
        // Cleanup function when the component unmounts or dependencies change
        return () => {
            wavesurfer.un('interaction', handleInteraction);
            wavesurfer.destroy();
            wavesurferRef.current = null; // Ensure ref is cleared
        };
    }, [audioElement, seek, currentTrack?.trackUrl]); // Dependencies: re-run if these change

    // The WaveSurfer instance, when created with an active `media` element that has a `src`,
    // should automatically load and display the waveform.
    // Playback state (play/pause/time updates) should also be automatically synced
    // because WaveSurfer's MediaElement backend listens to the media element's events.

    return <div ref={waveformRef} style={{ width: '100%' }} />;
};

export default React.memo(DynamicWaveform);