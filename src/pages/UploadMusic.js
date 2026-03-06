import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { db } from '../services/firebase';
import { uploadFileWithProgress } from '../services/supabase';
import {
    collection, addDoc, serverTimestamp, doc, updateDoc,
    arrayUnion, increment, runTransaction
} from 'firebase/firestore';
import { useUserContext } from '../contexts/UserContext';
import { ChevronLeft, Music, Image, Tag, Info, Shield, CheckCircle } from 'lucide-react';
import UploadLimitBanner, {
    getEffectiveLimit,
    getCurrentMonthUsage
} from '../components/upload/UploadLimitBanner';
import './UploadMusic.css';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const GENRES = [
    'Pop', 'Rock', 'Hip-Hop / Rap', 'Electronic / EDM', 'R&B / Soul',
    'Jazz', 'Classical', 'Country', 'Folk / Acoustic', 'Indie',
    'Alternative', 'Metal', 'Punk', 'Reggae', 'Blues', 'Funk',
    'Ambient', 'Lo-Fi', 'Synthwave', 'Soundtrack', 'Ukrainian',
    'Experimental', 'Other'
];

const LANGUAGES = [
    'Українська', 'English', 'Español', 'Français', 'Deutsch',
    'Italiano', 'Polski', 'Português', '日本語', '한국어', 'Інша'
];

const CONTENT_TYPES = [
    { id: 'original', label: 'Оригінал' },
    { id: 'cover', label: 'Кавер' },
    { id: 'remix', label: 'Ремікс' },
    { id: 'mashup', label: 'Мешап' },
];

const PREDEFINED_HASHTAGS = [
    'rock', 'pop', 'hiphop', 'rap', 'electronic', 'indie', 'alternative',
    'ukrainian', 'ukrainian-music', 'українськамузика', 'українськийрок', 'новинки',
    'acoustic', 'instrumental', 'piano', 'guitar', 'violin', 'drums',
    'lofi', 'chill', 'sad', 'happy', 'energetic', 'mood', 'love', 'summer', 'winter',
    'synthwave', 'retrowave', '80s', '90s', 'jazz', 'blues', 'classical', 'folk',
    'metal', 'punk', 'reggae', 'funk', 'soul', 'rnb', 'country', 'ambient',
    'soundtrack', 'experimental', 'live', 'cover', 'remix'
];

/* ─── Helper: reset or increment monthly uploads in a transaction ─────────── */
const updateMonthlyUploads = async (userRef, user) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        const data = snap.data();
        const stored = data?.monthlyUploads;
        if (!stored || stored.month !== currentMonth) {
            tx.update(userRef, { monthlyUploads: { count: 1, month: currentMonth } });
        } else {
            tx.update(userRef, { 'monthlyUploads.count': increment(1) });
        }
    });
};

/* ─── Component ──────────────────────────────────────────────────────────── */
const UploadMusic = () => {
    const { user } = useUserContext();
    const navigate = useNavigate();

    /* --- Media --- */
    const [trackFile, setTrackFile] = useState(null);
    const [coverArt, setCoverArt] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    /* --- Basic info --- */
    const [trackTitle, setTrackTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const tagsInputRef = useRef(null);

    /* --- Classification --- */
    const [genre, setGenre] = useState('');
    const [language, setLanguage] = useState('');
    const [contentType, setContentType] = useState('original');
    const [originalArtist, setOriginalArtist] = useState('');
    const [originalTitle, setOriginalTitle] = useState('');
    const [isExplicit, setIsExplicit] = useState(false);

    /* --- Rights --- */
    const [copyrightOwnership, setCopyrightOwnership] = useState(false);
    const [copyrightDistribution, setCopyrightDistribution] = useState(false);

    /* --- Upload state --- */
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [uploadDone, setUploadDone] = useState(false);

    /* ── Guards ── */
    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    const effectiveLimit = user ? getEffectiveLimit(user) : 10;
    const usedThisMonth = user ? getCurrentMonthUsage(user) : 0;
    const canUpload = usedThisMonth < effectiveLimit;

    /* ── Cover preview ── */
    useEffect(() => {
        if (coverArt) {
            const url = URL.createObjectURL(coverArt);
            setCoverPreview(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setCoverPreview(null);
        }
    }, [coverArt]);

    /* ── Dropzone: audio ── */
    const onDropTrack = useCallback((accepted) => {
        if (accepted.length > 0) setTrackFile(accepted[0]);
    }, []);
    const { getRootProps: getTrackRootProps, getInputProps: getTrackInputProps, isDragActive: isTrackDragActive } = useDropzone({
        onDrop: onDropTrack,
        accept: { 'audio/*': ['.mp3', '.wav', '.flac'] },
        multiple: false,
        disabled: isUploading || !canUpload,
    });

    /* ── Tags ── */
    useEffect(() => {
        if (tagInput.trim()) {
            const filtered = PREDEFINED_HASHTAGS.filter(
                t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(`#${t}`)
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    }, [tagInput, tags]);

    const addTag = (t) => {
        const newTag = `#${t.replace(/#/g, '').trim()}`;
        if (newTag.length > 1 && !tags.includes(newTag) && tags.length < 10) {
            setTags(prev => [...prev, newTag]);
        }
        setTagInput('');
        setSuggestions([]);
    };
    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (suggestions.length > 0) addTag(suggestions[0]);
            else if (tagInput.trim()) addTag(tagInput);
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(prev => prev.slice(0, -1));
        }
    };
    const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

    /* ── Cover art ── */
    const handleCoverChange = (e) => {
        if (e.target.files[0]) setCoverArt(e.target.files[0]);
    };
    const handleCoverDrop = useCallback((accepted) => {
        if (accepted.length > 0) setCoverArt(accepted[0]);
    }, []);
    const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDragActive } = useDropzone({
        onDrop: handleCoverDrop,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
        multiple: false,
        disabled: isUploading,
        noClick: true,
    });

    /* ── Validation ── */
    const needsOriginalInfo = contentType !== 'original';
    const isFormValid =
        trackFile &&
        trackTitle.trim() &&
        genre &&
        language &&
        copyrightOwnership &&
        copyrightDistribution &&
        (!needsOriginalInfo || (originalArtist.trim() && originalTitle.trim()));

    /* ── Upload handler ── */
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!isFormValid || !user || isUploading || !canUpload) return;

        setIsUploading(true);
        setUploadProgress(0);

        const trackId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const safeName = (n) => n.replace(/[^a-zA-Z0-9._-]/g, '_');

        try {
            setStatusMessage('Завантаження аудіо...');
            const audioPath = `${user.uid}/${trackId}/${safeName(trackFile.name)}`;
            const audioURL = await uploadFileWithProgress(trackFile, 'tracks', audioPath, setUploadProgress);

            let coverURL = null;
            if (coverArt) {
                setStatusMessage('Завантаження обкладинки...');
                const coverPath = `covers/${user.uid}/${trackId}/${safeName(coverArt.name)}`;
                coverURL = await uploadFileWithProgress(coverArt, 'images', coverPath, setUploadProgress);
            }

            setStatusMessage('Збереження треку...');
            const userRef = doc(db, 'users', user.uid);

            await addDoc(collection(db, 'tracks'), {
                title: trackTitle.trim(),
                description: description.trim(),
                trackUrl: audioURL,
                coverArtUrl: coverURL,
                authorId: user.uid,
                authorName: user.displayName,
                authorNickname: user.nickname,
                createdAt: serverTimestamp(),
                playCount: 0,
                likesCount: 0,
                tags: tags,
                tags_search: tags.map(t => t.toLowerCase()),
                title_lowercase: trackTitle.trim().toLowerCase(),
                /* New metadata fields */
                contentType,
                originalArtist: needsOriginalInfo ? originalArtist.trim() : null,
                originalTitle: needsOriginalInfo ? originalTitle.trim() : null,
                genre,
                language,
                isExplicit,
            });

            await updateDoc(userRef, { tracksCount: increment(1) });
            if (!user.roles?.includes('creator')) {
                await updateDoc(userRef, { roles: arrayUnion('creator') });
            }
            await updateMonthlyUploads(userRef, user);

            setUploadDone(true);
            setStatusMessage('Трек успішно опубліковано!');
            setTimeout(() => navigate(`/${user.nickname}`), 2200);

        } catch (err) {
            console.error('Upload error:', err);
            setStatusMessage(`Помилка: ${err.message}`);
            setIsUploading(false);
        }
    };

    /* ── Render ── */
    return (
        <div className="up-page">
            <div className="up-container">

                {/* ─── Page header ─── */}
                <div className="up-topbar">
                    <Link to={user ? `/${user.nickname}` : '/'} className="up-back-btn">
                        <ChevronLeft size={18} />
                        Назад
                    </Link>
                    <h1 className="up-title">Завантажити трек</h1>
                    <Link to="/create-album" className="up-album-link">Створити альбом</Link>
                </div>

                {/* ─── Limit Banner ─── */}
                {user && <UploadLimitBanner user={user} />}

                {/* ─── FORM ─── */}
                <form onSubmit={handleUpload} className="up-form" noValidate>

                    {/* ══ SECTION 1: Media files ══ */}
                    <section className="up-section">
                        <div className="up-section-header">
                            <Music size={16} className="up-section-icon" />
                            <h2 className="up-section-title">Медіафайли</h2>
                        </div>

                        <div className="up-media-grid">
                            {/* Audio dropzone */}
                            <div className="up-audio-wrap">
                                <div
                                    {...getTrackRootProps({
                                        className: `up-dropzone up-dropzone--audio ${isTrackDragActive ? 'up-dropzone--active' : ''} ${trackFile ? 'up-dropzone--filled' : ''} ${(!canUpload || isUploading) ? 'up-dropzone--disabled' : ''}`
                                    })}
                                >
                                    <input {...getTrackInputProps()} />
                                    {trackFile ? (
                                        <div className="up-file-info">
                                            <div className="up-file-icon-wrap">
                                                <Music size={22} />
                                            </div>
                                            <div className="up-file-meta">
                                                <span className="up-file-name">{trackFile.name}</span>
                                                <span className="up-file-size">{(trackFile.size / 1024 / 1024).toFixed(1)} MB</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="up-file-remove"
                                                onClick={(e) => { e.stopPropagation(); setTrackFile(null); }}
                                            >×</button>
                                        </div>
                                    ) : (
                                        <div className="up-dropzone-inner">
                                            <div className="up-dz-icon">
                                                <Music size={28} />
                                            </div>
                                            <p className="up-dz-label">
                                                {isTrackDragActive ? 'Відпустіть файл' : 'Перетягніть або виберіть аудіо'}
                                            </p>
                                            <span className="up-dz-hint">MP3, WAV, FLAC · до 100 МБ</span>
                                            <span className="up-dz-btn">Вибрати файл</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cover art */}
                            <div className="up-cover-wrap" {...getCoverRootProps()}>
                                <input {...getCoverInputProps()} />
                                <div className={`up-cover-preview ${isCoverDragActive ? 'up-cover-preview--drag' : ''}`}>
                                    {coverPreview ? (
                                        <>
                                            <img src={coverPreview} alt="Обкладинка" />
                                            <div className="up-cover-overlay">
                                                <label htmlFor="cover-input-btn" className="up-cover-change">
                                                    <Image size={14} />
                                                    Змінити
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <label htmlFor="cover-input-btn" className="up-cover-empty">
                                            <Image size={26} />
                                            <span>Обкладинка</span>
                                            <span className="up-dz-hint">JPG, PNG, WebP</span>
                                        </label>
                                    )}
                                    <input
                                        id="cover-input-btn"
                                        type="file"
                                        accept="image/*"
                                        className="up-sr-only"
                                        onChange={handleCoverChange}
                                        disabled={isUploading}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══ SECTION 2: Basic info ══ */}
                    <section className="up-section">
                        <div className="up-section-header">
                            <Info size={16} className="up-section-icon" />
                            <h2 className="up-section-title">Основна інформація</h2>
                        </div>

                        <div className="up-form-group">
                            <label className="up-label" htmlFor="up-title">Назва треку <span className="up-required">*</span></label>
                            <input
                                id="up-title"
                                type="text"
                                className="up-input"
                                value={trackTitle}
                                onChange={e => setTrackTitle(e.target.value)}
                                placeholder="Назва вашого треку"
                                disabled={isUploading}
                                maxLength={120}
                            />
                        </div>

                        <div className="up-form-group">
                            <label className="up-label">Виконавець</label>
                            <input
                                type="text"
                                className="up-input up-input--readonly"
                                value={user?.displayName ?? ''}
                                readOnly
                                tabIndex={-1}
                            />
                            <p className="up-hint">Ваше ім'я відображається автоматично</p>
                        </div>

                        <div className="up-form-group">
                            <label className="up-label" htmlFor="up-desc">Опис</label>
                            <textarea
                                id="up-desc"
                                className="up-textarea"
                                rows={4}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Розкажіть про ваш трек — натхнення, процес, посилання..."
                                disabled={isUploading}
                                maxLength={1000}
                            />
                            <p className="up-char-count">{description.length}/1000</p>
                        </div>

                        <div className="up-form-group">
                            <label className="up-label">
                                <Tag size={13} style={{ marginRight: 5 }} />
                                Хештеги
                            </label>
                            <div className={`up-tags-box ${isUploading ? 'up-tags-box--disabled' : ''}`}>
                                {tags.map((t, i) => (
                                    <span key={i} className="up-tag">
                                        {t}
                                        <button type="button" className="up-tag-remove" onClick={() => removeTag(t)}>×</button>
                                    </span>
                                ))}
                                <input
                                    ref={tagsInputRef}
                                    type="text"
                                    className="up-tags-input"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder={tags.length === 0 ? 'Додайте хештеги...' : ''}
                                    disabled={isUploading || tags.length >= 10}
                                />
                            </div>
                            {suggestions.length > 0 && !isUploading && (
                                <ul className="up-suggestions">
                                    {suggestions.slice(0, 7).map((s, i) => (
                                        <li key={i} className="up-suggestion" onClick={() => addTag(s)}>#{s}</li>
                                    ))}
                                </ul>
                            )}
                            <p className="up-hint">{tags.length}/10 хештегів</p>
                        </div>
                    </section>

                    {/* ══ SECTION 3: Classification ══ */}
                    <section className="up-section">
                        <div className="up-section-header">
                            <Tag size={16} className="up-section-icon" />
                            <h2 className="up-section-title">Класифікація</h2>
                        </div>

                        <div className="up-two-col">
                            <div className="up-form-group">
                                <label className="up-label" htmlFor="up-genre">Жанр <span className="up-required">*</span></label>
                                <div className="up-select-wrap">
                                    <select
                                        id="up-genre"
                                        className="up-select"
                                        value={genre}
                                        onChange={e => setGenre(e.target.value)}
                                        disabled={isUploading}
                                    >
                                        <option value="">Оберіть жанр...</option>
                                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="up-form-group">
                                <label className="up-label" htmlFor="up-lang">Мова треку <span className="up-required">*</span></label>
                                <div className="up-select-wrap">
                                    <select
                                        id="up-lang"
                                        className="up-select"
                                        value={language}
                                        onChange={e => setLanguage(e.target.value)}
                                        disabled={isUploading}
                                    >
                                        <option value="">Оберіть мову...</option>
                                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Content type pills */}
                        <div className="up-form-group">
                            <label className="up-label">Тип контенту <span className="up-required">*</span></label>
                            <div className="up-type-pills">
                                {CONTENT_TYPES.map(ct => (
                                    <button
                                        key={ct.id}
                                        type="button"
                                        className={`up-type-pill ${contentType === ct.id ? 'up-type-pill--active' : ''}`}
                                        onClick={() => setContentType(ct.id)}
                                        disabled={isUploading}
                                    >
                                        {contentType === ct.id && <CheckCircle size={13} />}
                                        {ct.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Original info — shown for cover/remix/mashup */}
                        {needsOriginalInfo && (
                            <div className="up-original-info">
                                <div className="up-two-col">
                                    <div className="up-form-group">
                                        <label className="up-label" htmlFor="up-orig-artist">
                                            Оригінальний виконавець <span className="up-required">*</span>
                                        </label>
                                        <input
                                            id="up-orig-artist"
                                            type="text"
                                            className="up-input"
                                            value={originalArtist}
                                            onChange={e => setOriginalArtist(e.target.value)}
                                            placeholder="Наприклад: The Beatles"
                                            disabled={isUploading}
                                        />
                                    </div>
                                    <div className="up-form-group">
                                        <label className="up-label" htmlFor="up-orig-title">
                                            Назва оригіналу <span className="up-required">*</span>
                                        </label>
                                        <input
                                            id="up-orig-title"
                                            type="text"
                                            className="up-input"
                                            value={originalTitle}
                                            onChange={e => setOriginalTitle(e.target.value)}
                                            placeholder="Наприклад: Let It Be"
                                            disabled={isUploading}
                                        />
                                    </div>
                                </div>
                                <p className="up-hint">
                                    Вказуйте точні дані оригінального твору — це обов'язково для DMCA-відповідності.
                                </p>
                            </div>
                        )}

                        {/* Explicit toggle */}
                        <div className="up-form-group">
                            <div className="up-toggle-row">
                                <div className="up-toggle-info">
                                    <span className="up-label">Explicit Content</span>
                                    <span className="up-hint">Трек містить ненормативну лексику або контент 18+</span>
                                </div>
                                <button
                                    type="button"
                                    className={`up-toggle ${isExplicit ? 'up-toggle--on' : ''}`}
                                    onClick={() => setIsExplicit(v => !v)}
                                    disabled={isUploading}
                                    aria-pressed={isExplicit}
                                >
                                    <span className="up-toggle-thumb" />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ══ SECTION 4: Rights ══ */}
                    <section className="up-section up-section--rights">
                        <div className="up-section-header">
                            <Shield size={16} className="up-section-icon" />
                            <h2 className="up-section-title">Авторські права</h2>
                        </div>

                        <div className="up-rights-checks">
                            <label className="up-check-row">
                                <input
                                    type="checkbox"
                                    className="up-checkbox"
                                    checked={copyrightOwnership}
                                    onChange={e => setCopyrightOwnership(e.target.checked)}
                                    disabled={isUploading}
                                />
                                <span className="up-check-text">
                                    Я підтверджую, що є автором або правовласником цього треку, або маю дозвіл правовласника на його публікацію.
                                </span>
                            </label>
                            <label className="up-check-row">
                                <input
                                    type="checkbox"
                                    className="up-checkbox"
                                    checked={copyrightDistribution}
                                    onChange={e => setCopyrightDistribution(e.target.checked)}
                                    disabled={isUploading}
                                />
                                <span className="up-check-text">
                                    Я підтверджую, що маю право на розповсюдження цього контенту та несу відповідальність за порушення авторських прав згідно з{' '}
                                    <a href="/copyright" target="_blank" rel="noopener noreferrer" className="up-link">
                                        Політикою авторських прав Knitly
                                    </a>.
                                </span>
                            </label>
                        </div>

                        {/* Progress */}
                        {isUploading && (
                            <div className="up-progress-block">
                                <div className="up-progress-header">
                                    <span className="up-status">{statusMessage}</span>
                                    <span className="up-progress-pct">{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="up-progress-track">
                                    <div
                                        className={`up-progress-fill ${uploadDone ? 'up-progress-fill--done' : ''}`}
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {uploadDone && (
                            <div className="up-success-msg">
                                <CheckCircle size={16} />
                                {statusMessage}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="up-actions">
                            <Link to={user ? `/${user.nickname}` : '/'} className="up-btn up-btn--secondary">
                                Скасувати
                            </Link>
                            <button
                                type="submit"
                                className="up-btn up-btn--primary"
                                disabled={isUploading || !isFormValid || !canUpload}
                            >
                                {isUploading ? (
                                    <><span className="up-spinner" /> Завантаження...</>
                                ) : !canUpload ? (
                                    'Ліміт вичерпано'
                                ) : (
                                    'Опублікувати трек'
                                )}
                            </button>
                        </div>
                    </section>
                </form>
            </div>
        </div>
    );
};

export default UploadMusic;
