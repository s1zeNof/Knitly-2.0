import React, { useState, useEffect } from 'react'; // <<< ОСЬ ВИПРАВЛЕННЯ
import { useNavigate } from 'react-router-dom';
import { db, storage } from './firebase';
import { doc, collection, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext';
import './CreateEmojiPack.css';

const UploadIcon = () => <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>;

const CreateEmojiPack = () => {
    const { user, authLoading } = useUserContext();
    const { showNotification } = usePlayerContext();
    const navigate = useNavigate();

    const [packName, setPackName] = useState('');
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [emojiFiles, setEmojiFiles] = useState([]);
    const [emojiPreviews, setEmojiPreviews] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    
    useEffect(() => {
        if (authLoading) {
            return;
        }
        if (!user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleEmojisChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setEmojiFiles(files);
            const previews = files.map(file => URL.createObjectURL(file));
            setEmojiPreviews(previews);
        }
    };

    const handleCreatePack = async (e) => {
        e.preventDefault();
        if (!user) {
            showNotification("Будь ласка, увійдіть, щоб створити пак.", "error");
            return;
        }
        if (!packName.trim() || !coverFile || emojiFiles.length === 0) {
            showNotification("Заповніть назву, обкладинку та хоча б один емоджі.", "error");
            return;
        }
        if (emojiFiles.length > 50) {
            showNotification("Максимальна кількість емоджі в паку - 50.", "error");
            return;
        }

        setIsCreating(true);

        try {
            const newPackRef = doc(collection(db, 'emoji_packs'));
            const packId = newPackRef.id;

            const coverArtRef = ref(storage, `emoji_packs/${packId}/cover`);
            await uploadBytes(coverArtRef, coverFile);
            const coverEmojiUrl = await getDownloadURL(coverArtRef);

            const emojiUploadPromises = emojiFiles.map(file => {
                const emojiId = doc(collection(db, 'dummy')).id;
                const emojiRef = ref(storage, `emoji_packs/${packId}/${emojiId}`);
                return uploadBytes(emojiRef, file).then(snapshot => getDownloadURL(snapshot.ref));
            });
            const emojiUrls = await Promise.all(emojiUploadPromises);

            const mainPackData = {
                name: packName,
                authorUid: user.uid,
                isAnimated: false,
                isPublic: true,
                createdAt: serverTimestamp(),
                coverEmojiUrl: coverEmojiUrl,
            };
            await setDoc(newPackRef, mainPackData);

            const emojisBatch = writeBatch(db);
            emojiUrls.forEach((url, index) => {
                const emojiDocRef = doc(collection(db, `emoji_packs/${packId}/emojis`));
                const fileName = emojiFiles[index].name.split('.')[0];
                emojisBatch.set(emojiDocRef, {
                    name: fileName,
                    url: url,
                });
            });
            await emojisBatch.commit();

            showNotification("Емоджі-пак успішно створено!", "info");
            navigate('/profile');

        } catch (error) {
            console.error("Помилка створення емоджі-паку:", error);
            showNotification("Не вдалося створити пак.", "error");
        } finally {
            setIsCreating(false);
        }
    };
    
    if (authLoading || !user) {
        return (
            <div className="create-pack-page">
                <div className="create-pack-container">
                    <p>Завантаження...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="create-pack-page">
            <div className="create-pack-container">
                <h1 className="create-pack-header">Створити Емоджі-пак</h1>
                <form onSubmit={handleCreatePack} className="create-pack-form">
                    <div className="form-group">
                        <label htmlFor="pack-name">Назва паку*</label>
                        <input type="text" id="pack-name" value={packName} onChange={e => setPackName(e.target.value)} className="form-input" disabled={isCreating} />
                    </div>

                    <div className="form-group">
                        <label>Обкладинка паку (1 файл)*</label>
                        <label className="file-dropzone cover">
                            <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleCoverChange} disabled={isCreating} />
                            {coverPreview ? <img src={coverPreview} alt="Обкладинка" className="preview-image" /> : <UploadIcon />}
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Емоджі (до 50 файлів)*</label>
                        <label className="file-dropzone emojis">
                            <input type="file" accept="image/png, image/webp" multiple onChange={handleEmojisChange} disabled={isCreating} />
                            {emojiPreviews.length > 0 ? (
                                <div className="emoji-grid-preview">
                                    {emojiPreviews.map((src, index) => <img key={index} src={src} alt={`Емоджі ${index + 1}`} className="preview-image small" />)}
                                </div>
                            ) : (
                                <UploadIcon />
                            )}
                        </label>
                    </div>

                    <div className="form-actions">
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