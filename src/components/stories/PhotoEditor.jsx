import React, { useState, useRef, useEffect, useCallback } from 'react';
import './PhotoEditor.css';

/**
 * PhotoEditor — Instagram-like photo positioning editor.
 * Supports: pinch-to-zoom, drag to pan, rotation via slider.
 *
 * Props:
 *   src         string   — image object URL
 *   onChange    ({ scale, translateX, translateY, rotation }) => void
 *   aspectRatio number   — default 9/16 (portrait story)
 */
const PhotoEditor = ({ src, onChange, aspectRatio = 9 / 16 }) => {
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Transform state
    const [scale, setScale] = useState(1);
    const [translateX, setTranslateX] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const [rotation, setRotation] = useState(0);

    // Drag state (refs to avoid re-renders)
    const dragging = useRef(false);
    const lastPointer = useRef({ x: 0, y: 0 });

    // Pinch state
    const lastPinchDist = useRef(null);

    // Notify parent on every transform change
    useEffect(() => {
        onChange?.({ scale, translateX, translateY, rotation });
    }, [scale, translateX, translateY, rotation]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Fit image to container on load ────────────────────────────────────
    const handleImageLoad = useCallback(() => {
        const container = containerRef.current;
        const img = imageRef.current;
        if (!container || !img) return;

        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        // Cover: scale so the image fills the container
        const scaleX = cw / iw;
        const scaleY = ch / ih;
        const fitScale = Math.max(scaleX, scaleY);

        setScale(fitScale);
        setTranslateX(0);
        setTranslateY(0);
        setRotation(0);
    }, []);

    // ─── Mouse / touch drag ─────────────────────────────────────────────────
    const getClient = (e) => {
        if (e.touches && e.touches.length === 1) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const onPointerDown = (e) => {
        if (e.touches?.length === 2) return; // handled by pinch
        dragging.current = true;
        const pt = getClient(e);
        lastPointer.current = pt;
        e.preventDefault();
    };

    const onPointerMove = (e) => {
        // Pinch
        if (e.touches?.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            if (lastPinchDist.current !== null) {
                const delta = dist / lastPinchDist.current;
                setScale(prev => Math.min(Math.max(prev * delta, 0.5), 6));
            }
            lastPinchDist.current = dist;
            dragging.current = false;
            return;
        }
        lastPinchDist.current = null;

        if (!dragging.current) return;
        const pt = getClient(e);
        const dx = pt.x - lastPointer.current.x;
        const dy = pt.y - lastPointer.current.y;
        lastPointer.current = pt;
        setTranslateX(prev => prev + dx);
        setTranslateY(prev => prev + dy);
    };

    const onPointerUp = () => {
        dragging.current = false;
        lastPinchDist.current = null;
    };

    // ─── Mouse wheel zoom ───────────────────────────────────────────────────
    const onWheel = (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.07 : 0.93;
        setScale(prev => Math.min(Math.max(prev * factor, 0.5), 6));
    };

    // Attach wheel listener with { passive: false } to allow preventDefault
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Reset ──────────────────────────────────────────────────────────────
    const handleReset = () => {
        handleImageLoad();
    };

    const transform = `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`;

    return (
        <div className="photo-editor">
            {/* Canvas area */}
            <div
                className="photo-editor-canvas"
                ref={containerRef}
                style={{ aspectRatio: `${aspectRatio}` }}
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchMove={onPointerMove}
                onTouchEnd={onPointerUp}
            >
                {src && (
                    <img
                        ref={imageRef}
                        src={src}
                        alt="Story preview"
                        className="photo-editor-image"
                        style={{ transform }}
                        onLoad={handleImageLoad}
                        draggable={false}
                    />
                )}
                <div className="photo-editor-grid-overlay" aria-hidden="true">
                    {/* Rule-of-thirds grid */}
                    <div className="grid-line grid-line--v" style={{ left: '33.33%' }} />
                    <div className="grid-line grid-line--v" style={{ left: '66.66%' }} />
                    <div className="grid-line grid-line--h" style={{ top: '33.33%' }} />
                    <div className="grid-line grid-line--h" style={{ top: '66.66%' }} />
                </div>
            </div>

            {/* Controls */}
            <div className="photo-editor-controls">
                {/* Rotation slider */}
                <div className="photo-editor-control-row">
                    <span className="photo-editor-control-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        Поворот
                    </span>
                    <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="photo-editor-slider"
                        aria-label="Поворот зображення"
                    />
                    <span className="photo-editor-value">{rotation}°</span>
                </div>

                {/* Scale slider */}
                <div className="photo-editor-control-row">
                    <span className="photo-editor-control-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            <path d="M11 8v6M8 11h6" />
                        </svg>
                        Масштаб
                    </span>
                    <input
                        type="range"
                        min="0.5"
                        max="6"
                        step="0.05"
                        value={scale}
                        onChange={(e) => setScale(Number(e.target.value))}
                        className="photo-editor-slider"
                        aria-label="Масштаб зображення"
                    />
                    <span className="photo-editor-value">{Math.round(scale * 100)}%</span>
                </div>

                {/* Reset */}
                <button className="photo-editor-reset-btn" onClick={handleReset} type="button">
                    Скинути позицію
                </button>
            </div>

            <p className="photo-editor-hint">
                Перетягуй для переміщення · Прокручуй або розводь пальці для масштабування
            </p>
        </div>
    );
};

export default PhotoEditor;
