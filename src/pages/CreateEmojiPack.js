// src/CreateEmojiPack.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import { db, storage } from '../shared/services/firebase';
import { doc, collection, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserContext } from '../contexts/UserContext';
import { usePlayerContext } from '../shared/contexts/PlayerContext';
import './CreateEmojiPack.css';

const UploadIcon = () => <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>;
const RemoveIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>;

const CreateEmojiPack = () => {
    const { user, authLoading } = useUserContext();
    const { showNotification } = usePlayerContext();
    const navigate = useNavigate();
    const [packName, setPackName] = useState('');
    const [isAnimated, setIsAnimated] = useState(true);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [emojiPreviews, setEmojiPreviews] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    
    useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            if (coverPreview) URL.revokeObjectURL(coverPreview);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleEmojisChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const filePromises = files.map(file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    if (isAnimated) {
                        if (!file.name.toLowerCase().endsWith('.json')) return reject(new Error(`Файл "${file.name}" не є .json!`));
                        const data = JSON.parse(event.target.result);
                        resolve({ file, data });
                    } else {
                        const data = URL.createObjectURL(file);
                        resolve({ file, data });
                    }
                } catch (error) { reject(new Error(`Помилка читання файлу: ${file.name}`)); }
            };
            reader.onerror = () => reject(new Error(`Не вдалося прочитати файл: ${file.name}`));
            if (isAnimated) reader.readAsText(file); else reader.readAsDataURL(file);
        }));
        Promise.all(filePromises).then(newPreviews => setEmojiPreviews(current => [...current, ...newPreviews])).catch(err => showNotification(err.message, 'error'));
        e.target.value = null;
    };

    const removeEmojiFile = (index) => {
        const preview = emojiPreviews[index];
        if (!isAnimated && preview?.data.startsWith('blob:')) URL.revokeObjectURL(preview.data);
        setEmojiPreviews(p => p.filter((_, i) => i !== index));
    };

    const handleCreatePack = async (e) => {
        e.preventDefault();
        const emojiFiles = emojiPreviews.map(p => p.file);
        if (!user || !packName.trim() || !coverFile || emojiFiles.length === 0) {
            showNotification("Будь ласка, заповніть усі поля та додайте файли.", "error");
            return;
        }
        setIsCreating(true);
        try {
            const packId = doc(collection(db, 'dummy')).id;
            const coverArtRef = ref(storage, `emoji_packs/${packId}/cover_${coverFile.name}`);
            await uploadBytes(coverArtRef, coverFile);
            const coverEmojiUrl = await getDownloadURL(coverArtRef);

            const emojiUploadPromises = emojiFiles.map(file => {
                // ВИПРАВЛЕННЯ: Використовуємо оригінальне ім'я файлу для збереження розширення
                const emojiRef = ref(storage, `emoji_packs/${packId}/${file.name}`);
                const metadata = { contentType: isAnimated ? 'application/json' : file.type };
                return uploadBytes(emojiRef, file, metadata).then(() => getDownloadURL(emojiRef));
            });
            const emojiUrls = await Promise.all(emojiUploadPromises);

            const packDocRef = doc(db, 'emoji_packs', packId);
            await setDoc(packDocRef, { name: packName, authorUid: user.uid, isAnimated, isPublic: true, createdAt: serverTimestamp(), coverEmojiUrl });

            const emojisBatch = writeBatch(db);
            emojiUrls.forEach((url, index) => {
                const emojiDocRef = doc(collection(db, `emoji_packs/${packId}/emojis`));
                emojisBatch.set(emojiDocRef, { name: emojiFiles[index].name.split('.')[0], url });
            });
            await emojisBatch.commit();

            showNotification("Емоджі-пак створено!", "info");
            navigate('/settings');
        } catch (error) {
            console.error("Помилка створення паку:", error);
            showNotification("Не вдалося створити пак.", "error");
        } finally {
            setIsCreating(false);
        }
    };
    
    if (authLoading || !user) return <div className="create-pack-page"><div className="create-pack-container"><p>Завантаження...</p></div></div>;
    const acceptedEmojiMimeTypes = isAnimated ? ".json" : "image/png, image/webp";
    
    return (
        <div className="create-pack-page">
            <div className="create-pack-container">
                <h1 className="create-pack-header">Створити Емоджі-пак</h1>
                <form onSubmit={handleCreatePack} className="create-pack-form">
                    <div className="form-grid">
                        <div className="form-column form-column-cover">
                            <div className="form-group">
                                <label className="form-label">Обкладинка паку*</label>
                                <label className="file-dropzone cover">
                                    <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleCoverChange} disabled={isCreating} />
                                    {coverPreview ? <img src={coverPreview} alt="Обкладинка" className="preview-image" /> : <UploadIcon />}
                                </label>
                            </div>
                        </div>
                        <div className="form-column form-column-info">
                            <div className="form-group">
                                <label htmlFor="pack-name" className="form-label">Назва паку*</label>
                                <input type="text" id="pack-name" value={packName} onChange={e => setPackName(e.target.value)} className="form-input" disabled={isCreating} placeholder='Наприклад, "Рухливі котики"' />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Тип паку</label>
                                <div className="toggle-switch">
                                    <input type="checkbox" id="isAnimated" checked={isAnimated} onChange={() => setIsAnimated(!isAnimated)} disabled={isCreating || emojiPreviews.length > 0} />
                                    <label htmlFor="isAnimated" className="slider"></label>
                                    <label htmlFor="isAnimated" className="toggle-label">Анімований (Lottie)</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Файли емоджі (до 50 шт.)*</label>
                        {emojiPreviews.length > 0 ? (
                            <div className="file-preview-grid">
                                {emojiPreviews.map((preview, index) => (
                                    <div key={index} className="file-preview-item">
                                        <div className="preview-media-container">
                                            {isAnimated ? <Lottie animationData={preview.data} loop={true} /> : <img src={preview.data} alt={preview.file.name} />}
                                        </div>
                                        <span className="file-name" title={preview.file.name}>{preview.file.name}</span>
                                        <button type="button" className="remove-file-btn" onClick={() => removeEmojiFile(index)}><RemoveIcon /></button>
                                    </div>
                                ))}
                                <label htmlFor="emoji-files-upload" className="add-more-files-btn"><UploadIcon /></label>
                            </div>
                        ) : (
                            <label className="file-dropzone emojis">
                                <input type="file" id="emoji-files-upload" accept={acceptedEmojiMimeTypes} multiple onChange={handleEmojisChange} disabled={isCreating} />
                                <UploadIcon />
                                <span>Перетягніть файли сюди або натисніть</span>
                                <small>{isAnimated ? "Очікуваний формат: Lottie (.json)" : "Очікувані формати: PNG, WEBP"}</small>
                            </label>
                        )}
                    </div>
                    <div className="form-actions">
                        <Link to="/settings" className="button-secondary">Скасувати</Link>
                        <button type="submit" className="button-primary" disabled={isCreating}>
                            {isCreating ? 'Створення...' : 'Створити Пак'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEmojiPack;