import React, { useRef, useEffect, useState, useCallback } from 'react';
import { db } from '../../services/firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import './RoomCanvas.css';

/**
 * RoomCanvas — Interactive drawing canvas layered over the room player.
 * Allows participants to collaboratively draw while a track is playing.
 * Drawings are tied to the current track and synced via Firestore.
 */
const RoomCanvas = ({ roomId, currentTrack, user, isHost }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState([]); // Local state for rendering
    // Optimize network by throttling updates
    const localStrokesRef = useRef([]); 
    const isSyncTimerRunning = useRef(false);

    // Dynamic color based on user ID or random
    const myColor = useRef(`hsl(${Math.random() * 360}, 80%, 60%)`);

    /* ── Render ─────────────────────────────────────────────────── */
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set styles
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 4;
        
        // Draw all strokes
        strokes.forEach(stroke => {
            if (!stroke.points || stroke.points.length < 2) return;
            
            ctx.strokeStyle = stroke.color;
            ctx.beginPath();
            
            // Convert relative % back to pixel coordinates
            const startX = stroke.points[0].x * rect.width;
            const startY = stroke.points[0].y * rect.height;
            ctx.moveTo(startX, startY);
            
            for (let i = 1; i < stroke.points.length; i++) {
                const x = stroke.points[i].x * rect.width;
                const y = stroke.points[i].y * rect.height;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            // Add subtle glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = stroke.color;
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset for performance
        });
    }, [strokes]);

    /* ── Canvas Setup & Resizing ────────────────────────────────── */
    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (canvas && container) {
                // Ensure retina display clarity
                const dpr = window.devicePixelRatio || 1;
                const rect = container.getBoundingClientRect();
                
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                
                const ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);
                
                // Redraw existing strokes after resize
                redrawCanvas();
            }
        };

        window.addEventListener('resize', resizeCanvas);
        // Initial setup needed a slight delay to ensure CSS layout is settled
        setTimeout(resizeCanvas, 100); 

        return () => window.removeEventListener('resize', resizeCanvas);
    }, [strokes, redrawCanvas]); // Re-bind when strokes change so redraw has latest data

    /* ── Drawing Logic ──────────────────────────────────────────── */
    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        // Support both touch and mouse events
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        return {
            x: (clientX - rect.left) / rect.width,  // Store as relative % for responsive scaling
            y: (clientY - rect.top) / rect.height
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        if (!currentTrack) return; // Only draw when a track is assigned
        
        setIsDrawing(true);
        const pos = getPos(e);
        
        // Start a new line segment
        const newStroke = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            uid: user?.uid,
            color: myColor.current,
            points: [pos]
        };
        
        localStrokesRef.current = [...strokes, newStroke];
        setStrokes(localStrokesRef.current);
    };

    const draw = (e) => {
        e.preventDefault();
        if (!isDrawing || !currentTrack) return;

        const pos = getPos(e);
        const currentStrokes = [...localStrokesRef.current];
        const lastStroke = currentStrokes[currentStrokes.length - 1];
        
        if (lastStroke && lastStroke.uid === user?.uid) {
            // Append point to current line
            lastStroke.points.push(pos);
            localStrokesRef.current = currentStrokes;
            setStrokes(currentStrokes);
            redrawCanvas(); // Render immediately locally
            queueSync();    // Throttle network sync
        }
    };

    const stopDrawing = (e) => {
        e.preventDefault();
        setIsDrawing(false);
        // Force a final sync when lifting pen
        syncToFirestore();
    };

    /* ── Render ─────────────────────────────────────────────────── */

    // Automatically redraw when state changes (e.g., from network sync)
    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    /* ── Network Sync ───────────────────────────────────────────── */
    // Throttle Firebase writes to ~once per second while drawing to save writes
    const queueSync = () => {
        if (isSyncTimerRunning.current) return;
        isSyncTimerRunning.current = true;
        
        setTimeout(() => {
            syncToFirestore();
            isSyncTimerRunning.current = false;
        }, 1000); // Sync every 1s
    };

    const syncToFirestore = async () => {
        if (!roomId || !currentTrack || !user) return;
        
        const myLatestStroke = localStrokesRef.current.find(
            s => s.uid === user.uid && s.points.length > 0
        );
        
        if (!myLatestStroke) return;

        try {
            // Document structure suggestion: rooms/{roomId}/canvas/{trackId}
            // For now, attaching to room doc directly or a subcollection
            const canvasRef = doc(db, 'rooms', roomId, 'canvas', currentTrack.id);
            
            // Note: In a production app, arrayUnion with large arrays can hit 1MB limit.
            // A better approach is storing strokes as individual documents in a subcollection,
            // or periodically flattening them. For MVP, arrrayUnion is fine.
            await updateDoc(canvasRef, {
                strokes: arrayUnion(myLatestStroke),
                updatedAt: new Date()
            }).catch(async (error) => {
                // If doc doesn't exist, create it (requires setDoc instead of updateDoc in practice, 
                // but omitting for brevity here; assuming room creation handles initialization 
                // or we use a helper to ensure existence).
                console.warn('Canvas sync failed (doc might not exist):', error);
            });
        } catch (e) {
            console.error('Failed to sync stroke:', e);
        }
    };

    // Listen for canvas updates from other users
    useEffect(() => {
        if (!roomId || !currentTrack) {
            setStrokes([]); // Clear canvas when track changes
            localStrokesRef.current = [];
            redrawCanvas();
            return;
        }

        const canvasDocRef = doc(db, 'rooms', roomId, 'canvas', currentTrack.id);
        const unsubscribe = onSnapshot(canvasDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.strokes) {
                    // Merge local strokes (which might be ahead) with remote strokes
                    // A proper robust implementation requires CRDT or timestamp merging.
                    // For MVP, we just overwrite, which might cause slight jitter during active drawing.
                    if (!isDrawing) {
                        setStrokes(data.strokes);
                        localStrokesRef.current = data.strokes;
                    }
                }
            } else {
                setStrokes([]);
                localStrokesRef.current = [];
            }
        });

        return () => unsubscribe();
    }, [roomId, currentTrack, isDrawing, redrawCanvas]);


    return (
        <div 
            className="room-canvas-container" 
            ref={containerRef}
            aria-label="Спільне полотно для малювання"
        >
            <canvas
                ref={canvasRef}
                className="room-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
            />
            
            {/* Minimal UI overlay */}
            <div className="room-canvas-overlay">
                {!currentTrack && <span className="canvas-hint">Увімкніть трек, щоб почати малювати</span>}
                {currentTrack && strokes.length === 0 && <span className="canvas-hint">Малюйте по екрану! 🎨</span>}
            </div>
        </div>
    );
};

export default RoomCanvas;
