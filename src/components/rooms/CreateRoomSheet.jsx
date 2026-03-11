/**
 * CreateRoomSheet.jsx
 * Desktop: centered modal dialog
 * Mobile: full-viewport-height bottom sheet (no popup)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../contexts/UserContext';
import { createRoom } from '../../services/roomService';
import './CreateRoomSheet.css';

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const LockIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
);

const GlobeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
);

const SUGGESTED_TAGS = ['поп', 'рок', 'джаз', 'електронна', 'хіп-хоп', 'класика', 'lo-fi', 'indie'];

const CreateRoomSheet = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { user } = useUserContext();
    const sheetRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: true,
        maxParticipants: 50,
        tags: [],
    });
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /* Reset on open */
    useEffect(() => {
        if (isOpen) {
            setFormData({ name: '', description: '', isPublic: true, maxParticipants: 50, tags: [] });
            setTagInput('');
            setError('');
        }
    }, [isOpen]);

    /* Trap focus / escape */
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const addTag = (tag) => {
        const t = tag.trim().toLowerCase().replace(/\s+/g, '-');
        if (!t || formData.tags.includes(t) || formData.tags.length >= 5) return;
        setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }));
        setTagInput('');
    };

    const removeTag = (tag) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        if (!formData.name.trim()) { setError('Введіть назву кімнати'); return; }

        setLoading(true);
        setError('');
        try {
            const roomId = await createRoom(user, formData);
            onClose();
            navigate(`/rooms/${roomId}`);
        } catch (err) {
            console.error('[CreateRoomSheet] error:', err);
            setError('Не вдалося створити кімнату. Спробуй ще раз.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="crs-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="crs-sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-label="Створити кімнату">
                {/* Handle (mobile) */}
                <div className="crs-handle" aria-hidden="true" />

                {/* Header */}
                <div className="crs-header">
                    <h2 className="crs-title">Створити кімнату 🎧</h2>
                    <button className="crs-close-btn" onClick={onClose} aria-label="Закрити">
                        <CloseIcon />
                    </button>
                </div>

                {/* Form */}
                <form className="crs-form" onSubmit={handleSubmit} noValidate>
                    <div className="crs-scroll-area">

                        {/* Name */}
                        <div className="crs-field">
                            <label className="crs-label" htmlFor="room-name">Назва кімнати *</label>
                            <input
                                id="room-name"
                                type="text"
                                className="crs-input"
                                placeholder="Наприклад: Ранковий lo-fi ☕"
                                maxLength={60}
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                autoFocus
                            />
                            <span className="crs-char-count">{formData.name.length}/60</span>
                        </div>

                        {/* Description */}
                        <div className="crs-field">
                            <label className="crs-label" htmlFor="room-desc">Опис</label>
                            <textarea
                                id="room-desc"
                                className="crs-textarea"
                                placeholder="Про що ця кімната? Який настрій?"
                                rows={3}
                                maxLength={200}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                            <span className="crs-char-count">{formData.description.length}/200</span>
                        </div>

                        {/* Visibility toggle */}
                        <div className="crs-field">
                            <label className="crs-label">Видимість</label>
                            <div className="crs-visibility-row">
                                <button
                                    type="button"
                                    className={`crs-vis-btn${formData.isPublic ? ' crs-vis-btn--active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                                >
                                    <GlobeIcon /> Публічна
                                </button>
                                <button
                                    type="button"
                                    className={`crs-vis-btn${!formData.isPublic ? ' crs-vis-btn--active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                                >
                                    <LockIcon /> Приватна
                                </button>
                            </div>
                            <p className="crs-hint">
                                {formData.isPublic
                                    ? 'Кімната буде видна всім та з\'явиться у пошуку.'
                                    : 'Доступ тільки за прямим посиланням.'}
                            </p>
                        </div>

                        {/* Max participants */}
                        <div className="crs-field">
                            <label className="crs-label" htmlFor="room-max">
                                Макс. учасників: <strong>{formData.maxParticipants}</strong>
                            </label>
                            <input
                                id="room-max"
                                type="range"
                                className="crs-range"
                                min={2}
                                max={200}
                                step={1}
                                value={formData.maxParticipants}
                                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                            />
                            <div className="crs-range-labels">
                                <span>2</span><span>200</span>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="crs-field">
                            <label className="crs-label" htmlFor="room-tags">Теги (до 5)</label>
                            <div className="crs-tags-container">
                                {formData.tags.map(tag => (
                                    <span key={tag} className="crs-tag">
                                        #{tag}
                                        <button
                                            type="button"
                                            className="crs-tag-remove"
                                            onClick={() => removeTag(tag)}
                                            aria-label={`Видалити тег ${tag}`}
                                        >×</button>
                                    </span>
                                ))}
                                {formData.tags.length < 5 && (
                                    <input
                                        id="room-tags"
                                        type="text"
                                        className="crs-tag-input"
                                        placeholder="Додати тег…"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        onBlur={() => addTag(tagInput)}
                                    />
                                )}
                            </div>
                            <div className="crs-suggested-tags">
                                {SUGGESTED_TAGS.filter(t => !formData.tags.includes(t)).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        className="crs-suggested-tag"
                                        onClick={() => addTag(t)}
                                    >
                                        +{t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && <p className="crs-error" role="alert">{error}</p>}
                    </div>

                    {/* Footer actions */}
                    <div className="crs-footer">
                        <button type="button" className="crs-cancel-btn" onClick={onClose}>
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            className="crs-submit-btn"
                            disabled={loading || !formData.name.trim()}
                        >
                            {loading ? (
                                <span className="crs-spinner" />
                            ) : (
                                '🎧 Створити кімнату'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoomSheet;
