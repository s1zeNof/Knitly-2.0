import React, { useState, useRef, useCallback } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import { createStory, uploadStoryMedia } from '../../services/storiesService';
import PhotoEditor from './PhotoEditor';
import VideoRecorder from './VideoRecorder';
import './CreateStoryModal.css';

/**
 * CreateStoryModal — two-tab modal for creating a Story.
 *
 * Tab 1 — Photo: pick image → edit position/zoom/rotation → caption → publish
 * Tab 2 — Video: record via camera → preview → caption → publish
 *
 * Props:
 *   onClose  () => void
 */
const CreateStoryModal = ({ onClose }) => {
    const { user: currentUser } = useUserContext();

    const [tab, setTab] = useState('photo'); // 'photo' | 'video'

    // ─── Photo state ─────────────────────────────────────────────────────────
    const [photoFile, setPhotoFile] = useState(null);
    const [photoSrc, setPhotoSrc] = useState(null); // object URL
    // photoTransform stored for future server-side composite rendering
    const [photoTransform, setPhotoTransform] = useState(null); // eslint-disable-line no-unused-vars
    const fileInputRef = useRef(null);

    // ─── Video state ─────────────────────────────────────────────────────────
    const [videoBlob, setVideoBlob] = useState(null);

    // ─── Shared state ─────────────────────────────────────────────────────────
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    // ─── Photo: pick file ─────────────────────────────────────────────────────
    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Будь ласка, виберіть зображення.');
            return;
        }
        setError(null);
        setPhotoFile(file);
        const url = URL.createObjectURL(file);
        setPhotoSrc(url);
    };

    const handleDropZoneClick = () => fileInputRef.current?.click();

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Підтримуються лише зображення.');
            return;
        }
        setError(null);
        setPhotoFile(file);
        setPhotoSrc(URL.createObjectURL(file));
    }, []);

    const handleDragOver = (e) => e.preventDefault();

    const clearPhoto = () => {
        if (photoSrc) URL.revokeObjectURL(photoSrc);
        setPhotoFile(null);
        setPhotoSrc(null);
        setPhotoTransform(null);
    };

    // ─── Video: recorder ready ────────────────────────────────────────────────
    const handleVideoReady = (blob) => {
        setVideoBlob(blob);
    };

    const clearVideo = () => setVideoBlob(null);

    // ─── Publish ──────────────────────────────────────────────────────────────
    const canPublish = tab === 'photo' ? !!photoFile : !!videoBlob;

    const handlePublish = async () => {
        if (!currentUser) return;
        if (!canPublish) return;

        setError(null);
        setUploading(true);
        setUploadProgress(0);

        try {
            const mediaType = tab;
            let fileToUpload;

            if (mediaType === 'photo') {
                fileToUpload = photoFile;
            } else {
                // Convert blob to File
                fileToUpload = new File([videoBlob], `story_video_${Date.now()}.webm`, { type: videoBlob.type || 'video/webm' });
            }

            const mediaUrl = await uploadStoryMedia(fileToUpload, (pct) => {
                setUploadProgress(pct);
            });

            const author = {
                uid: currentUser.uid,
                userNickname: currentUser.nickname,
                userDisplayName: currentUser.displayName,
                userPhotoURL: currentUser.photoURL || null,
            };

            await createStory(author, mediaType, mediaUrl, caption.trim());

            // Cleanup
            if (photoSrc) URL.revokeObjectURL(photoSrc);
            onClose();
        } catch (err) {
            console.error('[CreateStoryModal] upload error:', err);
            setError(err.message || 'Помилка завантаження. Спробуйте ще раз.');
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

    // ─── Backdrop click ───────────────────────────────────────────────────────
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
    };

    return (
        <div className="csm-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Створити сторіс">
            <div className="csm-modal">
                {/* Header */}
                <div className="csm-header">
                    <h2 className="csm-title">Нова сторіс</h2>
                    <button className="csm-close-btn" onClick={onClose} disabled={uploading} aria-label="Закрити">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="csm-tabs" role="tablist">
                    <button
                        role="tab"
                        aria-selected={tab === 'photo'}
                        className={`csm-tab ${tab === 'photo' ? 'csm-tab--active' : ''}`}
                        onClick={() => switchTab('photo')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                        Фото
                    </button>
                    <button
                        role="tab"
                        aria-selected={tab === 'video'}
                        className={`csm-tab ${tab === 'video' ? 'csm-tab--active' : ''}`}
                        onClick={() => switchTab('video')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 7l-7 5 7 5V7z" />
                            <rect x="1" y="5" width="15" height="14" rx="2" />
                        </svg>
                        Відео
                    </button>
                </div>

                {/* Body */}
                <div className="csm-body">
                    {/* ── PHOTO TAB ─────────────────────────────────────── */}
                    {tab === 'photo' && (
                        <>
                            {!photoSrc ? (
                                <div
                                    className="csm-dropzone"
                                    onClick={handleDropZoneClick}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleDropZoneClick()}
                                    aria-label="Завантажити фото"
                                >
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                        <rect x="3" y="3" width="18" height="18" rx="3" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                    <p className="csm-dropzone-label">Натисни або перетягни фото</p>
                                    <p className="csm-dropzone-hint">JPG, PNG, WEBP · рекомендовано 9:16</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="csm-file-input"
                                        onChange={handlePhotoSelect}
                                        aria-hidden="true"
                                    />
                                </div>
                            ) : (
                                <>
                                    <PhotoEditor
                                        src={photoSrc}
                                        onChange={setPhotoTransform}
                                    />
                                    <button className="csm-change-btn" onClick={clearPhoto} type="button">
                                        Змінити фото
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {/* ── VIDEO TAB ─────────────────────────────────────── */}
                    {tab === 'video' && (
                        <>
                            {!videoBlob ? (
                                <VideoRecorder
                                    onVideoReady={handleVideoReady}
                                    onCancel={onClose}
                                />
                            ) : (
                                <div className="csm-video-ready">
                                    <div className="csm-video-ready-icon">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <p>Відео готове до публікації</p>
                                    <button className="csm-change-btn" onClick={clearVideo} type="button">
                                        Перезняти
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Caption ───────────────────────────────────────── */}
                    {canPublish && (
                        <div className="csm-caption-row">
                            <label className="csm-caption-label" htmlFor="story-caption">Підпис (необов'язково)</label>
                            <input
                                id="story-caption"
                                type="text"
                                className="csm-caption-input"
                                placeholder="Додай підпис до сторіс..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                maxLength={150}
                                disabled={uploading}
                            />
                        </div>
                    )}

                    {/* ── Error ─────────────────────────────────────────── */}
                    {error && <p className="csm-error">{error}</p>}

                    {/* ── Upload progress ───────────────────────────────── */}
                    {uploading && (
                        <div className="csm-upload-progress">
                            <div className="csm-upload-bar" style={{ width: `${uploadProgress}%` }} />
                            <span>{uploadProgress}%</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {canPublish && (
                    <div className="csm-footer">
                        <button className="csm-btn csm-btn--ghost" onClick={onClose} disabled={uploading}>
                            Скасувати
                        </button>
                        <button
                            className="csm-btn csm-btn--publish"
                            onClick={handlePublish}
                            disabled={uploading}
                        >
                            {uploading ? 'Публікація...' : 'Опублікувати сторіс'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateStoryModal;
