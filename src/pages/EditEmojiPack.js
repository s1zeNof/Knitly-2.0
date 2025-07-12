import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../shared/services/firebase';
import { doc, getDoc, collection, getDocs, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useUserContext } from '../contexts/UserContext';
import { usePlayerContext } from '../shared/contexts/PlayerContext';


import Lottie from 'lottie-react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import './EditEmojiPack.css';

const UploadIcon = () => <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>;
const RemoveIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>;

const LottieEmoji = React.memo(({ animationData, path }) => {
    if (!animationData && !path) return <div className="emoji-preview-loader" />;
    return <Lottie animationData={animationData} path={path} autoplay={true} loop={true} style={{ width: '100%', height: '100%' }} />;
});

const EditEmojiPack = () => {
    const { packId } = useParams();
    const navigate = useNavigate();
    const { user } = useUserContext();
    const { showNotification } = usePlayerContext();

    const [pack, setPack] = useState(null);
    const [packName, setPackName] = useState('');
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState('');
    const [existingEmojis, setExistingEmojis] = useState([]);
    const [newEmojiPreviews, setNewEmojiPreviews] = useState([]);
    const [emojisToDelete, setEmojisToDelete] = useState([]);
    const [existingLottieData, setExistingLottieData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // --- ПОЧАТОК ЗМІН: Логіка для анімації хедера ---
    const [isHeaderShrunk, setIsHeaderShrunk] = useState(false);
    const scrollContainerRef = useRef(null);
    const headerTriggerRef = useRef(null);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        const trigger = headerTriggerRef.current;
        if (!scrollContainer || !trigger) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsHeaderShrunk(!entry.isIntersecting);
            },
            { root: scrollContainer, threshold: 0 }
        );

        observer.observe(trigger);
        return () => observer.disconnect();
    }, [isLoading]); // Перезапускаємо спостерігач після завантаження даних
    // --- КІНЕЦЬ ЗМІН ---

    useEffect(() => {
        if (!user || !packId) return;

        const fetchPackData = async () => {
            setIsLoading(true);
            try {
                const packRef = doc(db, 'emoji_packs', packId);
                const packSnap = await getDoc(packRef);

                if (packSnap.exists() && packSnap.data().authorUid === user.uid) {
                    const packData = { id: packSnap.id, ...packSnap.data() };
                    setPack(packData);
                    setPackName(packData.name);
                    setCoverPreview(packData.coverEmojiUrl);

                    const emojisRef = collection(db, 'emoji_packs', packId, 'emojis');
                    const emojisSnap = await getDocs(emojisRef);
                    const emojis = emojisSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setExistingEmojis(emojis);
                    
                    if (packData.isAnimated) {
                        const lottieFetches = emojis.map(emoji =>
                            fetch(emoji.url)
                                .then(res => res.json())
                                .then(data => ({ id: emoji.id, data }))
                                .catch(error => {
                                    console.error(`Не вдалося завантажити Lottie для ${emoji.name}:`, error);
                                    return null;
                                })
                        );
                        const fetchedLottieData = await Promise.all(lottieFetches);
                        const lottieDataMap = fetchedLottieData.reduce((acc, current) => {
                            if (current) acc[current.id] = current.data;
                            return acc;
                        }, {});
                        setExistingLottieData(lottieDataMap);
                    }
                } else {
                    showNotification("Пак не знайдено або у вас немає доступу.", "error");
                    navigate('/settings');
                }
            } catch (error) {
                console.error("Помилка завантаження даних паку:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPackData();
    }, [packId, user, navigate, showNotification]);

    // ...решта функцій-обробників без змін...
    const handleCoverChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            if (coverPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(coverPreview);
            }
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleNewEmojisChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0 || !pack) return;
        const filePromises = files.map(file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    if (pack.isAnimated) {
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
            if (pack.isAnimated) reader.readAsText(file); else reader.readAsDataURL(file);
        }));
        Promise.all(filePromises).then(previews => setNewEmojiPreviews(current => [...current, ...previews])).catch(err => showNotification(err.message, 'error'));
        if (e.target) e.target.value = null;
    };

    const removeNewEmojiPreview = (indexToRemove) => {
        const preview = newEmojiPreviews?.[indexToRemove];
        if (!pack?.isAnimated && preview?.data?.startsWith('blob:')) URL.revokeObjectURL(preview.data);
        setNewEmojiPreviews(p => p.filter((_, index) => index !== indexToRemove));
    };

    const markForDeletion = (emojiId) => setEmojisToDelete(prev => [...prev, emojiId]);
    const unmarkForDeletion = (emojiId) => setEmojisToDelete(prev => prev.filter(id => id !== emojiId));

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const packRef = doc(db, 'emoji_packs', packId);
            let newCoverUrl = pack?.coverEmojiUrl;
            if (coverFile) {
                const newCoverRef = ref(storage, `emoji_packs/${packId}/cover_${Date.now()}_${coverFile.name}`);
                await uploadBytes(newCoverRef, coverFile);
                newCoverUrl = await getDownloadURL(newCoverRef);
            }
            if (packName !== pack?.name || newCoverUrl !== pack?.coverEmojiUrl) await updateDoc(packRef, { name: packName, coverEmojiUrl: newCoverUrl });
            for (const emojiId of emojisToDelete) {
                const emojiToDelete = existingEmojis.find(e => e.id === emojiId);
                if (emojiToDelete) {
                    const emojiFileRef = ref(storage, emojiToDelete.url);
                    await deleteObject(emojiFileRef).catch(e => console.warn("File in storage not found, proceeding."));
                    batch.delete(doc(db, 'emoji_packs', packId, 'emojis', emojiId));
                }
            }
            const newFilesToUpload = newEmojiPreviews.map(p => p.file);
            for (const file of newFilesToUpload) {
                const emojiRef = ref(storage, `emoji_packs/${packId}/${file.name}`);
                await uploadBytes(emojiRef, file);
                const url = await getDownloadURL(emojiRef);
                const newEmojiDocRef = doc(collection(db, 'emoji_packs', packId, 'emojis'));
                batch.set(newEmojiDocRef, { name: file.name.split('.')[0], url });
            }
            await batch.commit();
            showNotification("Пак успішно оновлено!", "info");
            navigate('/settings/emoji-packs');
        } catch (error) {
            console.error("Error saving pack:", error);
            showNotification("Не вдалося зберегти зміни.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePack = async () => {
        setShowDeleteModal(false);
        setIsSaving(true);
        try {
            const emojisRef = collection(db, 'emoji_packs', packId, 'emojis');
            const emojisSnap = await getDocs(emojisRef);
            const batch = writeBatch(db);
            for (const emojiDoc of emojisSnap.docs) {
                const emojiFileRef = ref(storage, emojiDoc.data().url);
                try { await deleteObject(emojiFileRef); } catch (e) { console.warn("File not found, proceeding.") }
                batch.delete(emojiDoc.ref);
            }
            await batch.commit();
            const coverRef = ref(storage, pack?.coverEmojiUrl);
            try { await deleteObject(coverRef); } catch (e) { console.warn("Cover not found, proceeding.") }
            await deleteDoc(doc(db, 'emoji_packs', packId));
            showNotification("Емоджі-пак було видалено.", "info");
            navigate("/settings/emoji-packs");
        } catch (error) {
            console.error("Error deleting pack:", error);
            showNotification("Не вдалося видалити пак.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !pack) return <div className="edit-pack-page"><p className="loading-text">Завантаження редактора...</p></div>;

    return (
        <div ref={scrollContainerRef} className="edit-pack-page">
            <header className={`edit-pack-header ${isHeaderShrunk ? 'shrunk' : ''}`}>
                <Link to="/settings/emoji-packs" className="back-link">← Мої паки</Link>
                <h1>Редагувати пак</h1>
            </header>
            <div ref={headerTriggerRef} className="header-scroll-trigger"></div>

            <div className="edit-pack-container">
                <div className="edit-form-grid">
                    <div className="edit-form-column">
                        <div className="form-group">
                            <label className="form-label">Обкладинка паку</label>
                            <label className="file-dropzone cover">
                                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleCoverChange} disabled={isSaving} />
                                {coverPreview ? <img src={coverPreview} alt="Обкладинка" className="preview-image" /> : <UploadIcon/>}
                            </label>
                        </div>
                    </div>
                    <div className="edit-form-column">
                        <div className="form-group">
                            <label htmlFor="pack-name" className="form-label">Назва паку</label>
                            <input type="text" id="pack-name" value={packName} onChange={e => setPackName(e.target.value)} className="form-input" disabled={isSaving} />
                        </div>
                         <div className="form-group">
                            <label className="form-label">Тип паку</label>
                            <p className="pack-type-indicator">{pack.isAnimated ? "Анімований (Lottie)" : "Статичний (Зображення)"}</p>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Емоджі в паку</label>
                    <div className="emojis-grid">
                        {existingEmojis.map(emoji => (
                            <div key={emoji.id} className={`emoji-item ${emojisToDelete.includes(emoji.id) ? 'marked-for-deletion' : ''}`}>
                                <div className="emoji-preview">
                                    {pack.isAnimated ? <LottieEmoji animationData={existingLottieData[emoji.id]} /> : <img src={emoji.url} alt={emoji.name} />}
                                </div>
                                <span className="emoji-name" title={emoji.name}>{emoji.name}</span>
                                <button className="remove-btn" onClick={() => emojisToDelete.includes(emoji.id) ? unmarkForDeletion(emoji.id) : markForDeletion(emoji.id)}>
                                    <RemoveIcon />
                                </button>
                            </div>
                        ))}
                        {newEmojiPreviews.map((preview, index) => (
                             <div key={preview.file.name + index} className="emoji-item new">
                                <div className="emoji-preview">
                                    {pack.isAnimated ? <LottieEmoji animationData={preview.data} /> : <img src={preview.data} alt="new emoji" />}
                                </div>
                                <span className="emoji-name" title={preview.file.name}>{preview.file.name}</span>
                                <button className="remove-btn" onClick={() => removeNewEmojiPreview(index)}><RemoveIcon /></button>
                            </div>
                        ))}
                        <label className="add-emoji-btn">
                            <input type="file" multiple onChange={handleNewEmojisChange} disabled={isSaving} accept={pack.isAnimated ? ".json" : "image/png, image/webp"} />
                            <UploadIcon />
                            <span>Додати</span>
                        </label>
                    </div>
                </div>

                <footer className="edit-pack-footer">
                    <button onClick={() => setShowDeleteModal(true)} className="button-danger" disabled={isSaving}>Видалити пак</button>
                    <button onClick={handleSaveChanges} className="button-primary" disabled={isSaving}>
                        {isSaving ? "Збереження..." : "Зберегти зміни"}
                    </button>
                </footer>
            </div>
            
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeletePack}
                title={`Видалити пак "${pack?.name}"?`}
                message={`Ви впевнені, що хочете назавжди видалити пак "${pack?.name}"? Цю дію неможливо буде скасувати.`}
                confirmText="Так, видалити"
            />
        </div>
    );
};

export default EditEmojiPack;