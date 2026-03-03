import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VideoRecorder.css';

/**
 * VideoRecorder — basic camera recorder for Stories.
 *
 * Flow:
 *   idle → recording (tap) → stopped (tap again) → preview → onVideoReady(blob)
 *
 * Props:
 *   onVideoReady  (blob: Blob) => void   — called when user accepts preview
 *   onCancel      () => void
 */
const VideoRecorder = ({ onVideoReady, onCancel }) => {
    const videoRef = useRef(null);     // live camera preview
    const previewRef = useRef(null);   // recorded video preview
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);

    const [phase, setPhase] = useState('idle'); // 'idle' | 'recording' | 'preview'
    const [duration, setDuration] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [cameraError, setCameraError] = useState(null);

    const MAX_SECONDS = 60;
    const timerRef = useRef(null);

    // ─── Camera init ─────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        // getUserMedia requires a secure context (HTTPS or localhost)
        if (!navigator.mediaDevices?.getUserMedia) {
            const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
            setCameraError(
                isLocalhost
                    ? 'Камера недоступна — перевірте дозволи браузера.'
                    : 'Запис відео вимагає HTTPS-з\'єднання. Відкрийте сайт через https://'
            );
            return;
        }

        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true,
                });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                if (!cancelled) {
                    const msg = err.name === 'NotAllowedError'
                        ? 'Доступ до камери заборонено. Дозвольте доступ у налаштуваннях браузера.'
                        : err.name === 'NotFoundError'
                            ? 'Камеру не знайдено на цьому пристрої.'
                            : err.message || 'Камера недоступна';
                    setCameraError(msg);
                }
            }
        })();
        return () => {
            cancelled = true;
            stopStream();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const stopStream = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    };

    // ─── Timer ───────────────────────────────────────────────────────────────
    const startTimer = useCallback(() => {
        setDuration(0);
        timerRef.current = setInterval(() => {
            setDuration(prev => {
                if (prev + 1 >= MAX_SECONDS) {
                    stopRecording();
                    return MAX_SECONDS;
                }
                return prev + 1;
            });
        }, 1000);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // ─── Start recording ─────────────────────────────────────────────────────
    const startRecording = useCallback(() => {
        if (!streamRef.current) return;
        chunksRef.current = [];

        // Pick supported MIME type
        const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
            .find(t => MediaRecorder.isTypeSupported(t)) || '';

        const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
        mediaRecorderRef.current = mr;

        mr.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        mr.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedBlob(blob);
            setPreviewUrl(url);
            setPhase('preview');
        };

        mr.start(100); // collect data every 100ms
        setPhase('recording');
        startTimer();
    }, [startTimer]);

    // ─── Stop recording ───────────────────────────────────────────────────────
    const stopRecording = useCallback(() => {
        clearTimer();
        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current?.stop();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Toggle record button ─────────────────────────────────────────────────
    const handleRecordToggle = () => {
        if (phase === 'idle') startRecording();
        else if (phase === 'recording') stopRecording();
    };

    // ─── Accept preview ───────────────────────────────────────────────────────
    const handleAccept = () => {
        stopStream();
        onVideoReady?.(recordedBlob);
    };

    // ─── Retake ───────────────────────────────────────────────────────────────
    const handleRetake = async () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setRecordedBlob(null);
        setDuration(0);
        setPhase('idle');

        // Re-acquire camera
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: true,
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            setCameraError(err.message);
        }
    };

    // ─── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            clearTimer();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Format duration ──────────────────────────────────────────────────────
    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ─── Error state ──────────────────────────────────────────────────────────
    if (cameraError) {
        return (
            <div className="video-recorder video-recorder--error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16 16 L2 16 A2 2 0 0 1 0 14 L0 6 A2 2 0 0 1 2 4 L13 4" />
                    <path d="M16 8 L22 5 L22 19 L16 16" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
                <p>Помилка камери: {cameraError}</p>
                <p className="video-recorder-hint">Перевірте дозволи браузера для доступу до камери.</p>
                <button className="vr-btn vr-btn--secondary" onClick={onCancel}>Скасувати</button>
            </div>
        );
    }

    return (
        <div className="video-recorder">
            {/* ─── Camera / preview viewport ─────────────────────────────── */}
            <div className="video-recorder-viewport">
                {/* Live camera — hidden in preview phase */}
                <video
                    ref={videoRef}
                    className={`video-recorder-live ${phase === 'preview' ? 'video-recorder-live--hidden' : ''}`}
                    autoPlay
                    muted
                    playsInline
                />

                {/* Recorded preview */}
                {phase === 'preview' && previewUrl && (
                    <video
                        ref={previewRef}
                        className="video-recorder-preview"
                        src={previewUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                    />
                )}

                {/* Recording indicator */}
                {phase === 'recording' && (
                    <div className="video-recorder-badge">
                        <span className="vr-rec-dot" />
                        REC {formatTime(duration)}
                    </div>
                )}

                {/* Progress bar */}
                {phase === 'recording' && (
                    <div className="video-recorder-progress-bar">
                        <div
                            className="video-recorder-progress-fill"
                            style={{ width: `${(duration / MAX_SECONDS) * 100}%` }}
                        />
                    </div>
                )}
            </div>

            {/* ─── Controls ─────────────────────────────────────────────── */}
            <div className="video-recorder-controls">
                {phase !== 'preview' ? (
                    <>
                        <button className="vr-btn vr-btn--ghost" onClick={onCancel} type="button">
                            Скасувати
                        </button>

                        <button
                            className={`vr-record-btn ${phase === 'recording' ? 'vr-record-btn--stop' : ''}`}
                            onClick={handleRecordToggle}
                            type="button"
                            aria-label={phase === 'recording' ? 'Зупинити запис' : 'Почати запис'}
                        >
                            {phase === 'recording' ? (
                                /* Stop icon */
                                <span className="vr-stop-icon" />
                            ) : (
                                /* Record icon */
                                <span className="vr-start-icon" />
                            )}
                        </button>

                        <span className="vr-duration-hint">
                            {phase === 'idle' ? `до ${MAX_SECONDS}с` : formatTime(duration)}
                        </span>
                    </>
                ) : (
                    <>
                        <button className="vr-btn vr-btn--secondary" onClick={handleRetake} type="button">
                            Перезняти
                        </button>
                        <button className="vr-btn vr-btn--primary" onClick={handleAccept} type="button">
                            Використати відео
                        </button>
                    </>
                )}
            </div>

            {phase === 'idle' && (
                <p className="video-recorder-hint">Натисни кнопку, щоб почати запис</p>
            )}
        </div>
    );
};

export default VideoRecorder;
