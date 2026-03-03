import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import { createStory, uploadStoryMedia } from '../../services/storiesService';
import PhotoEditor from './PhotoEditor';
import VideoRecorder from './VideoRecorder';
import './CreateStoryModal.css';

/**
 * CreateStoryModal — Instagram-style fullscreen story creator.
 *
 * Layout:
 *  - Fullscreen overlay (position fixed, inset 0)
 *  - Top overlay bar: × close  |  mode title  |  "Поділитись →" (when ready)
 *  - Main area: Photo preview (PhotoEditor) OR gallery picker
 *  - Caption bar (appears when media selected)
 *  - Thumbnail strip (selected files)
 *  - Bottom tabs: Фото | Відео
 */
const CreateStoryModal = ({ onClose }) => {
    const { user: currentUser } = useUserContext();

    const [tab, setTab] = useState('photo'); // 'photo' | 'video'

    // ─── Photo state ─────────────────────────────────────────────────────────
    const [selectedFiles, setSelectedFiles] = useState([]); // File[]
    const [activeFile, setActiveFile] = useState(null);     // File (active for preview)
    const [activeSrc, setActiveSrc] = useState(null);       // object URL
    const [photoTransform, setPhotoTransform] = useState(null); // eslint-disable-line no-unused-vars
    const fileInputRef = useRef(null);

    // ─── Video state ─────────────────────────────────────────────────────────
    const [videoBlob, setVideoBlob] = useState(null);

    // ─── Shared ──────────────────────────────────────────────────────────────
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    // Thumbnail object URLs cache { File → string }
    const thumbUrlsRef = useRef(new Map());

    // Build thumbnail URL for a File (memoised)
    const getThumbUrl = useCallback((file) => {
        if (!thumbUrlsRef.current.has(file)) {
            thumbUrlsRef.current.set(file, URL.createObjectURL(file));
        }
        return thumbUrlsRef.current.get(file);
    }, []);

    // Cleanup object URLs on unmount
    useEffect(() => {
        // Capture ref value at effect creation time (lint rule)
        const thumbMap = thumbUrlsRef.current;
        return () => {
            if (activeSrc) URL.revokeObjectURL(activeSrc);
            for (const url of thumbMap.values()) URL.revokeObjectURL(url);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Photo: file picker ───────────────────────────────────────────────────
    const handleFilesSelected = (files) => {
        if (!files || files.length === 0) return;
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (arr.length === 0) { setError('Оберіть зображення (JPG, PNG, WEBP).'); return; }
        setError(null);
        setSelectedFiles(arr);
        const first = arr[0];
        setActiveFile(first);
        if (activeSrc) URL.revokeObjectURL(activeSrc);
        setActiveSrc(URL.createObjectURL(first));
    };

    const openFilePicker = () => fileInputRef.current?.click();

    const switchActiveFile = (file) => {
        if (activeSrc) URL.revokeObjectURL(activeSrc);
        setActiveFile(file);
        setActiveSrc(URL.createObjectURL(file));
        setPhotoTransform(null);
    };

    const clearPhoto = () => {
        if (activeSrc) URL.revokeObjectURL(activeSrc);
        for (const url of thumbUrlsRef.current.values()) URL.revokeObjectURL(url);
        thumbUrlsRef.current.clear();
        setSelectedFiles([]);
        setActiveFile(null);
        setActiveSrc(null);
        setPhotoTransform(null);
    };

    // ─── Video: recorder ready ────────────────────────────────────────────────
    const handleVideoReady = (blob) => setVideoBlob(blob);
    const clearVideo = () => setVideoBlob(null);

    // ─── Publish ──────────────────────────────────────────────────────────────
    const canPublish = tab === 'photo' ? !!activeFile : !!videoBlob;

    const handlePublish = async () => {
        if (!currentUser || !canPublish) return;
        setError(null);
        setUploading(true);
        setUploadProgress(0);
        try {
            const mediaType = tab;
            let fileToUpload;
            if (mediaType === 'photo') {
                fileToUpload = activeFile;
            } else {
                fileToUpload = new File([videoBlob], `story_${Date.now()}.webm`, { type: videoBlob.type || 'video/webm' });
            }
            const mediaUrl = await uploadStoryMedia(fileToUpload, setUploadProgress);
            await createStory(
                { uid: currentUser.uid, userNickname: currentUser.nickname, userDisplayName: currentUser.displayName, userPhotoURL: currentUser.photoURL || null },
                mediaType, mediaUrl, caption.trim()
            );
            onClose();
        } catch (err) {
            setError(err.message || 'Помилка завантаження. Спробуй ще раз.');
        } finally {
            setUploading(false);
        }
    };

    // ─── Tab switch ───────────────────────────────────────────────────────────
    const switchTab = (t) => {
        if (t === tab) return;
        clearPhoto();
        clearVideo();
        setCaption('');
        setError(null);
        setTab(t);
    };

    // ─── Keyboard close ───────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && !uploading) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [uploading, onClose]);

    const isPhotoReady = tab === 'photo' && !!activeSrc;
    const isVideoReady = tab === 'video' && !!videoBlob;
    const isReady = isPhotoReady || isVideoReady;

    return (
        <div className="csm-screen" role="dialog" aria-modal="true" aria-label="Створити сторіс">

            {/* ── Top overlay bar ─────────────────────────────────────────── */}
            <div className="csm-topbar">
                <button className="csm-topbar-btn csm-topbar-btn--close" onClick={onClose} disabled={uploading} aria-label="Закрити">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <span className="csm-topbar-title">
                    {tab === 'photo' ? 'Фото' : 'Відео'}
                </span>

                <div className="csm-topbar-right">
                    {canPublish && !uploading && (
                        <button className="csm-share-btn" onClick={handlePublish}>
                            Поділитись
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    )}
                    {uploading && <span className="csm-uploading-pct">{uploadProgress}%</span>}
                </div>
            </div>

            {/* ── Main content area ────────────────────────────────────────── */}
            <div className="csm-main">

                {/* PHOTO tab */}
                {tab === 'photo' && (
                    <>
                        {isPhotoReady ? (
                            <PhotoEditor src={activeSrc} onChange={setPhotoTransform} aspectRatio={9 / 16} />
                        ) : (
                            <div className="csm-picker" onClick={openFilePicker} role="button" tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && openFilePicker()}>
                                <div className="csm-picker-icon">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                </div>
                                <p className="csm-picker-label">Вибрати фото</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="csm-file-input-hidden"
                            onChange={(e) => handleFilesSelected(e.target.files)}
                        />
                    </>
                )}

                {/* VIDEO tab */}
                {tab === 'video' && !isVideoReady && (
                    <VideoRecorder onVideoReady={handleVideoReady} onCancel={onClose} />
                )}
                {tab === 'video' && isVideoReady && (
                    <div className="csm-video-done">
                        <div className="csm-video-done-check">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <p>Відео готове</p>
                        <button className="csm-retake-btn" onClick={clearVideo}>Перезняти</button>
                    </div>
                )}
            </div>

            {/* ── Bottom panel ─────────────────────────────────────────────── */}
            <div className="csm-bottom-panel">

                {/* Caption (when ready) */}
                {isReady && (
                    <div className="csm-caption-row">
                        <input
                            type="text"
                            className="csm-caption-input"
                            placeholder="Додай підпис..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            maxLength={150}
                            disabled={uploading}
                        />
                    </div>
                )}

                {/* Error */}
                {error && <p className="csm-error-bar">{error}</p>}

                {/* Upload progress */}
                {uploading && (
                    <div className="csm-progress-track">
                        <div className="csm-progress-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                )}

                {/* Photo thumbnail strip + pick buttons */}
                {tab === 'photo' && (
                    <div className="csm-gallery-strip">
                        {selectedFiles.length > 0 && (
                            <div className="csm-thumb-row">
                                {selectedFiles.map((file, i) => (
                                    <button
                                        key={i}
                                        className={`csm-thumb ${file === activeFile ? 'csm-thumb--active' : ''}`}
                                        onClick={() => switchActiveFile(file)}
                                        type="button"
                                    >
                                        <img src={getThumbUrl(file)} alt="" />
                                    </button>
                                ))}
                                <button className="csm-thumb csm-thumb--add" onClick={openFilePicker} type="button" aria-label="Ще">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {selectedFiles.length === 0 && (
                            <div className="csm-pick-row">
                                <button className="csm-pick-btn" onClick={openFilePicker} type="button">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="3" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                    Галерея
                                </button>
                                <button className="csm-pick-btn" onClick={() => {
                                    if (fileInputRef.current) {
                                        fileInputRef.current.setAttribute('capture', 'environment');
                                        fileInputRef.current.click();
                                        setTimeout(() => fileInputRef.current?.removeAttribute('capture'), 500);
                                    }
                                }} type="button">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                    Камера
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Mode tabs */}
                <div className="csm-mode-tabs">
                    <button className={`csm-mode-tab ${tab === 'photo' ? 'csm-mode-tab--active' : ''}`}
                        onClick={() => switchTab('photo')} disabled={uploading}>
                        ФОТО
                    </button>
                    <button className={`csm-mode-tab ${tab === 'video' ? 'csm-mode-tab--active' : ''}`}
                        onClick={() => switchTab('video')} disabled={uploading}>
                        ВІДЕО
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateStoryModal;
