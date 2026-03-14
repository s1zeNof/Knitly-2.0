import React, { useRef, useEffect } from 'react';
import { usePlayerContext } from '../../contexts/PlayerContext';
import './AudioVisualizer.css';

/* ── Web Audio singletons — survive component unmount/remount ── */
let _audioCtx    = null;
let _sourceNode  = null;

/* ══════════════════════════════════════════════════════════════ */
const AudioVisualizer = () => {
    const { audioElement, isPlaying } = usePlayerContext();

    const canvasRef      = useRef(null);
    const analyserRef    = useRef(null);
    const rafRef         = useRef(null);
    const isPlayingRef   = useRef(isPlaying);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    /* ── Init Web Audio graph (once per app lifecycle) ────────── */
    useEffect(() => {
        if (!audioElement) return;

        try {
            if (!_audioCtx) {
                _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (_audioCtx.state === 'suspended') {
                _audioCtx.resume();
            }
            if (!_sourceNode) {
                _sourceNode = _audioCtx.createMediaElementSource(audioElement);
                _sourceNode.connect(_audioCtx.destination);
            }
        } catch (err) {
            console.warn('[AudioVisualizer] Web Audio setup failed:', err);
            return;
        }

        const analyser = _audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.85;
        _sourceNode.connect(analyser);
        analyserRef.current = analyser;

        return () => {
            try { analyser.disconnect(); } catch (_) {}
            analyserRef.current = null;
        };
    }, [audioElement]);

    /* ── ResizeObserver — keeps canvas sharp on HiDPI ─────────── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width  = Math.round(width  * dpr);
            canvas.height = Math.round(height * dpr);
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        return () => ro.disconnect();
    }, []);

    /* ── Animation loop ────────────────────────────────────────── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx        = canvas.getContext('2d');
        const dpr        = window.devicePixelRatio || 1;
        const BAR_COUNT  = 72;
        let   idlePhase  = 0;

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);

            const W      = canvas.width  / dpr;
            const H      = canvas.height / dpr;
            const barW   = (W / BAR_COUNT) * 0.55;
            const gap    = (W / BAR_COUNT) * 0.45;
            const centerY  = H / 2;
            const maxBarH  = (H / 2) * 0.88;

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, W, H);

            /* Fetch frequency data */
            const analyser = analyserRef.current;
            let freqData   = null;
            if (analyser) {
                freqData = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(freqData);
            }

            idlePhase += 0.012;

            for (let i = 0; i < BAR_COUNT; i++) {
                let value;

                if (freqData && isPlayingRef.current) {
                    /* Logarithmic bin mapping — bass gets more bars, highs are compressed */
                    const logIdx = Math.floor(Math.pow(freqData.length, i / BAR_COUNT));
                    const idx    = Math.min(logIdx, freqData.length - 1);
                    value = freqData[idx] / 255;
                } else {
                    /* Idle: slow breathing sine wave */
                    value = 0.03 + Math.sin(idlePhase + i * 0.22) * 0.025;
                }

                const barH  = value * maxBarH;
                const x     = i * (barW + gap) + gap / 2;
                const alpha = Math.max(0.18, 0.25 + value * 0.75);

                /* Symmetric gradient top → center → bottom */
                const grad = ctx.createLinearGradient(0, centerY - barH, 0, centerY + barH);
                grad.addColorStop(0,    `rgba(216, 180, 254, ${alpha * 0.85})`); /* violet-300 */
                grad.addColorStop(0.35, `rgba(168,  85, 247, ${alpha})`);        /* purple-500 */
                grad.addColorStop(0.5,  `rgba(139,  92, 246, ${alpha})`);        /* indigo center */
                grad.addColorStop(0.65, `rgba(168,  85, 247, ${alpha})`);        /* purple-500 */
                grad.addColorStop(1,    `rgba(216, 180, 254, ${alpha * 0.85})`); /* violet-300 */

                ctx.shadowColor = `rgba(168, 85, 247, ${value * 0.55})`;
                ctx.shadowBlur  = value > 0.08 ? 4 + value * 14 : 0;

                ctx.fillStyle = grad;
                ctx.beginPath();
                const r = Math.min(barW / 2, 2.5);
                if (ctx.roundRect) {
                    ctx.roundRect(x, centerY - barH, barW, barH * 2, r);
                } else {
                    ctx.rect(x, centerY - barH, barW, barH * 2);
                }
                ctx.fill();
            }

            ctx.shadowBlur = 0;
            ctx.restore();
        };

        draw();
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return <canvas ref={canvasRef} className="audio-visualizer" />;
};

export default AudioVisualizer;
