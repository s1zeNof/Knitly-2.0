import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../shared/services/firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useUserContext } from '../contexts/UserContext';
import './CreateAlbum.css';

const UploadIcon = () => (
    <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
);

const CreateAlbum = () => {
    const { user } = useUserContext();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [coverArt, setCoverArt] = useState(null);
    const [coverArtPreview, setCoverArtPreview] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const handleCoverArtChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverArt(file);
            setCoverArtPreview(URL.createObjectURL(file));
        }
    };

    const handleCreateAlbum = async (e) => {
        e.preventDefault();
        if (!user) {
            // Використовуємо кастомне сповіщення замість alert
            setStatusMessage("Будь ласка, увійдіть, щоб створити альбом.");
            return;
        }
        if (!title.trim() || !coverArt) {
            setStatusMessage("Будь ласка, вкажіть назву та завантажте обкладинку альбому.");
            return;
        }

        setIsCreating(true);
        setStatusMessage("Створення альбому...");

        try {
            const newAlbumRef = doc(collection(db, 'albums'));
            const albumId = newAlbumRef.id;

            setStatusMessage("Завантаження обкладинки...");
            const coverArtRef = ref(storage, `albums/${user.uid}/${albumId}/cover`);
            const uploadTask = uploadBytesResumable(coverArtRef, coverArt);

            await uploadTask;

            const coverArtUrl = await getDownloadURL(uploadTask.snapshot.ref);

            setStatusMessage("Збереження інформації...");
            await setDoc(newAlbumRef, {
                title: title,
                coverArtUrl: coverArtUrl,
                artistId: user.uid,
                artistName: user.displayName,
                artistNickname: user.nickname,
                releaseDate: serverTimestamp(),
                trackIds: [],
                isPublic: true,
            });

            setStatusMessage("Альбом успішно створено!");
            setTimeout(() => {
                navigate('/profile');
            }, 1500);

        } catch (error) {
            console.error("Помилка створення альбому:", error);
            setStatusMessage("Не вдалося створити альбом. Спробуйте ще раз.");
            setIsCreating(false);
        }
    };

    return (
        <div className="create-album-page">
            <div className="create-album-container">
                <h1 className="create-album-header">Створити новий альбом</h1>
                <form onSubmit={handleCreateAlbum} className="create-album-form">
                    <div className="form-group">
                        <label htmlFor="album-title" className="form-label">Назва альбому*</label>
                        <input
                            type="text"
                            id="album-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="form-input"
                            placeholder="Наприклад, 'Нічні Вогні'"
                            disabled={isCreating}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Обкладинка альбому*</label>
                        <div className="cover-art-dropzone">
                            {coverArtPreview ? (
                                <img src={coverArtPreview} alt="Album cover preview" className="cover-preview" />
                            ) : (
                                <div className="dropzone-placeholder">
                                    <UploadIcon />
                                    <p>Перетягніть файл сюди або натисніть, щоб обрати</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleCoverArtChange} disabled={isCreating} />
                        </div>
                    </div>

                    <div className="form-actions">
                        {statusMessage && <p className="status-message">{statusMessage}</p>}
                        <button type="submit" className="button-primary" disabled={isCreating}>
                            {isCreating ? 'Створення...' : 'Створити альбом'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAlbum;