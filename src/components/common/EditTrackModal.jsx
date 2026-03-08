import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Tag, Music, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './EditTrackModal.css';

const PREDEFINED_HASHTAGS = [
    'rock', 'pop', 'hiphop', 'rap', 'electronic', 'indie', 'alternative',
    'ukrainian', 'ukrainian-music', 'українськамузика', 'українськийрок', 'новинки',
    'acoustic', 'instrumental', 'piano', 'guitar', 'violin', 'drums',
    'lofi', 'chill', 'sad', 'happy', 'energetic', 'mood', 'love', 'summer', 'winter',
    'synthwave', 'retrowave', '80s', '90s', 'jazz', 'blues', 'classical', 'folk',
    'metal', 'punk', 'reggae', 'funk', 'soul', 'rnb', 'country', 'ambient',
    'soundtrack', 'experimental', 'live', 'cover', 'remix'
];

const EditTrackModal = ({ track, onClose, onSave }) => {
    const [title, setTitle] = useState(track.title || '');
    const [tags, setTags] = useState(track.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Optional genre if available
    const [genre, setGenre] = useState(track.genre || '');
    const tagsInputRef = useRef(null);

    /* ── Tags Logic ── */
    useEffect(() => {
        if (tagInput.trim()) {
            const filtered = PREDEFINED_HASHTAGS.filter(
                t => t.toLowerCase().includes(tagInput.replace(/#/g, '').toLowerCase()) && !tags.includes(`#${t}`)
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

    /* ── Save Logic ── */
    const handleSave = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Назва треку не може бути порожньою');
            return;
        }

        setIsSaving(true);
        try {
            const trackRef = doc(db, 'tracks', track.id);
            const updatedData = {
                title: title.trim(),
                title_lowercase: title.trim().toLowerCase(),
                tags: tags,
                tags_search: tags.map(t => t.toLowerCase()),
                ...(genre ? { genre } : {})
            };

            await updateDoc(trackRef, updatedData);

            toast.success('Трек успішно оновлено!');
            onSave(track.id, updatedData);
            onClose();
        } catch (error) {
            console.error('Помилка оновлення треку:', error);
            toast.error('Не вдалося зберегти зміни');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-track-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose} disabled={isSaving}>&times;</button>
                <div className="edit-track-header">
                    <Music size={20} className="edit-track-icon" />
                    <h4>Редагувати трек</h4>
                </div>

                <form onSubmit={handleSave} className="edit-track-form">
                    <div className="up-form-group">
                        <label className="up-label" htmlFor="edit-title">Назва треку <span className="up-required">*</span></label>
                        <input
                            id="edit-title"
                            type="text"
                            className="up-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Назва вашого треку"
                            disabled={isSaving}
                            maxLength={120}
                            autoFocus
                        />
                    </div>

                    <div className="up-form-group">
                        <label className="up-label">
                            <Tag size={13} style={{ marginRight: 5 }} />
                            Хештеги
                        </label>
                        <div className={`up-tags-box ${isSaving ? 'up-tags-box--disabled' : ''}`}>
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
                                disabled={isSaving || tags.length >= 10}
                            />
                        </div>
                        {suggestions.length > 0 && !isSaving && (
                            <ul className="up-suggestions">
                                {suggestions.slice(0, 7).map((s, i) => (
                                    <li key={i} className="up-suggestion" onClick={() => addTag(s)}>#{s}</li>
                                ))}
                            </ul>
                        )}
                        <p className="up-hint">{tags.length}/10 хештегів</p>
                    </div>

                    <div className="modal-actions edit-track-actions">
                        <button type="button" className="modal-button-cancel" onClick={onClose} disabled={isSaving}>
                            Скасувати
                        </button>
                        <button type="submit" className="modal-button-confirm edit-track-save-btn" disabled={isSaving || !title.trim()}>
                            {isSaving ? 'Збереження...' : (
                                <>
                                    <CheckCircle size={16} /> Зберегти
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTrackModal;
