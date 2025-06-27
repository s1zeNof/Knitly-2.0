import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useUserContext } from './UserContext';

import './UploadMusic.css';

const PREDEFINED_HASHTAGS = [
  'rock', 'pop', 'hiphop', 'rap', 'electronic', 'indie', 'alternative',
  'ukrainian', 'ukrainian-music', 'українськамузика', 'українськийрок', 'новинки',
  'acoustic', 'instrumental', 'piano', 'guitar', 'violin', 'drums',
  'lofi', 'chill', 'sad', 'happy', 'energetic', 'mood', 'love', 'summer', 'winter',
  'synthwave', 'retrowave', '80s', '90s', 'jazz', 'blues', 'classical', 'folk',
  'metal', 'punk', 'reggae', 'funk', 'soul', 'rnb', 'country', 'ambient',
  'soundtrack', 'experimental', 'live', 'cover', 'remix'
];

const UploadIcon = () => (
  <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h2a4 4 0 014 4v1m-4 8l-4-4m0 0l-4 4m4-4v12"></path></svg>
);

const UploadMusic = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [trackFile, setTrackFile] = useState(null);
  const [coverArt, setCoverArt] = useState(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const tagsInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (tagInput.trim() !== '') {
      const filteredSuggestions = PREDEFINED_HASHTAGS.filter(
        (tag) =>
          tag.toLowerCase().includes(tagInput.toLowerCase()) &&
          !tags.includes(`#${tag}`)
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [tagInput, tags]);

  const addTag = (tagToAdd) => {
    // --- ЗМІНА: Прибираємо .toLowerCase(), щоб зберегти оригінальний вигляд ---
    const newTag = `#${tagToAdd.replace(/#/g, '').trim()}`;
    if (newTag.length > 1 && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
    setSuggestions([]);
  };

  const handleTagInputChange = (e) => setTagInput(e.target.value);
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) addTag(suggestions[0]);
      else addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };
  const removeTag = (tagToRemove) => setTags(tags.filter((tag) => tag !== tagToRemove));
  const handleTrackFileChange = (e) => {
    if (e.target.files[0]) { setTrackFile(e.target.files[0]); }
  };
  const handleCoverArtChange = (e) => {
    if (e.target.files[0]) { setCoverArt(e.target.files[0]); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!trackFile || !trackTitle) {
      alert('Будь ласка, завантажте аудіофайл та вкажіть назву треку.');
      return;
    }
    if (!user) {
      alert('Будь ласка, увійдіть в акаунт, щоб завантажити трек.');
      return;
    }

    setIsUploading(true);
    setStatusMessage('Завантаження аудіо...');
    const trackId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const audioRef = ref(storage, `tracks/${user.uid}/${trackId}/${trackFile.name}`);
    const audioUploadTask = uploadBytesResumable(audioRef, trackFile);

    audioUploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Помилка завантаження аудіо:", error);
        setStatusMessage('Помилка завантаження аудіо.');
        setIsUploading(false);
      },
      async () => {
        const audioURL = await getDownloadURL(audioUploadTask.snapshot.ref);
        let coverURL = null;

        if (coverArt) {
          setStatusMessage('Завантаження обкладинки...');
          const coverRef = ref(storage, `covers/${user.uid}/${trackId}/${coverArt.name}`);
          const coverUploadTask = uploadBytesResumable(coverRef, coverArt);
          await new Promise((resolve, reject) => {
              coverUploadTask.on('state_changed', null, 
                (error) => reject(error),
                async () => {
                    coverURL = await getDownloadURL(coverUploadTask.snapshot.ref);
                    resolve();
                }
              );
          });
        }

        // --- ЗМІНА: Створюємо два масиви тегів ---
        const tagsForDisplay = tags; // напр. ["#Phonk", "#NightDrive"]
        const tagsForSearch = tags.map(tag => tag.toLowerCase()); // напр. ["#phonk", "#nightdrive"]

        setStatusMessage('Збереження інформації про трек...');
        try {
          await addDoc(collection(db, 'tracks'), {
            title: trackTitle,
            description,
            trackUrl: audioURL,
            coverArtUrl: coverURL,
            authorId: user.uid,
            authorName: user.displayName,
            authorNickname: user.nickname,
            createdAt: serverTimestamp(),
            playCount: 0,
            // --- ЗМІНА: Зберігаємо обидва масиви ---
            tags: tagsForDisplay,
            tags_search: tagsForSearch
          });
          setStatusMessage('Трек успішно опубліковано!');
          setTimeout(() => navigate(`/profile`), 2000);
        } catch (error) {
          console.error("Помилка створення запису в Firestore:", error);
          setStatusMessage('Помилка збереження треку.');
          setIsUploading(false);
        }
      }
    );
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-header-link">
            <span>Завантажуєте один трек?</span>
            <Link to="/create-album">Створити новий альбом</Link>
        </div>
        <h1 className="upload-header">Завантажити новий трек</h1>
        <form onSubmit={handleUpload} className="upload-form">
          <div className="form-group">
            <label className="form-label">Аудіофайл*</label>
            <div className="file-dropzone">
              <div className="file-dropzone-inner">
                <UploadIcon />
                <div className="file-dropzone-text">
                  <label htmlFor="track-upload" className="file-dropzone-button">
                    <span>{trackFile ? 'Змінити файл' : 'Вибрати файл'}</span>
                    <input id="track-upload" type="file" className="sr-only" accept="audio/*" onChange={handleTrackFileChange} disabled={isUploading} />
                  </label>
                </div>
                {trackFile ? <p className="file-name">{trackFile.name}</p> : <p className="file-hint">MP3, WAV, FLAC до 100MB</p>}
              </div>
            </div>
          </div>
          <div className="grid-layout">
            <div className="grid-item-cover">
              <label className="form-label">Обкладинка</label>
              <div className="cover-art-preview-group">
                  <div className="cover-art-preview">
                      {coverArt ? <img src={URL.createObjectURL(coverArt)} alt="Cover Art Preview" /> : <span>Прев'ю</span>}
                  </div>
                  <label htmlFor="cover-art-upload" className="button-secondary">
                    <span>{coverArt ? 'Змінити' : 'Завантажити'}</span>
                    <input id="cover-art-upload" type="file" className="sr-only" accept="image/*" onChange={handleCoverArtChange} disabled={isUploading} />
                  </label>
              </div>
            </div>
            <div className="grid-item-info">
              <div className="form-group">
                <label htmlFor="track-title" className="form-label">Назва треку*</label>
                <input type="text" id="track-title" value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)} className="form-input" disabled={isUploading} />
              </div>
              <div className="form-group">
                <label htmlFor="tags-input" className="form-label">Хештеги</label>
                <div className={`tags-input-container ${isUploading ? 'disabled' : ''}`}>
                  {tags.map((tag, index) => (
                    <div key={index} className="tag-item">
                      {tag}
                      <button type="button" className="tag-remove-btn" onClick={() => !isUploading && removeTag(tag)}>
                        &times;
                      </button>
                    </div>
                  ))}
                  <input ref={tagsInputRef} type="text" id="tags-input" value={tagInput} onChange={handleTagInputChange} onKeyDown={handleTagKeyDown} className="tags-input" placeholder={tags.length === 0 ? "Додайте хештеги..." : ""} disabled={isUploading} />
                </div>
                {suggestions.length > 0 && !isUploading && (
                  <ul className="suggestions-list">
                    {suggestions.slice(0, 7).map((suggestion, index) => (
                      <li key={index} className="suggestion-item" onClick={() => addTag(suggestion)}>
                        #{suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="description" className="form-label">Опис треку</label>
            <textarea id="description" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} className="form-textarea" placeholder="Розкажіть історію вашого треку..." disabled={isUploading}></textarea>
          </div>
          {isUploading && (
            <div className="progress-group">
              <p className="status-message">{statusMessage}</p>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
          <div className="form-actions">
            <button type="submit" disabled={isUploading} className="button-primary">
              {isUploading ? 'Завантаження...' : 'Опублікувати трек'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadMusic;