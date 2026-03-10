import React, { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import Lottie from 'lottie-react';
import './GiftEditor.css';

const DEFAULT_GIFT = {
    name: { uk: '', en: '' },
    type: 'regular',
    price: 100,
    lottieUrl: '',
    isLimited: false,
    maxSupply: 0,
    mintedCount: 0,
    status: 'draft',
    collectionId: 'none',
    rarity: 'common'
};

export default function GiftEditor({ existingGift, onClose }) {
    const [formData, setFormData] = useState(DEFAULT_GIFT);
    const [files, setFiles] = useState([]); // Тепер це масив файлів
    const [previews, setPreviews] = useState([]); // Дані Lottie для відображення карток
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const isEditMode = !!existingGift;

    useEffect(() => {
        if (existingGift) {
            setFormData({
                ...DEFAULT_GIFT,
                ...existingGift
            });
        }
    }, [existingGift]);

    const handleFileChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        // В режимі редагування (якщо вже є existingGift) дозволяємо лише 1 файл
        const filesToProcess = isEditMode ? [selectedFiles[0]] : selectedFiles;
        setFiles(filesToProcess);

        // Генеруємо прев'ю для кожного вибраного файлу
        const previewsData = [];
        for (const file of filesToProcess) {
            try {
                const text = await file.text();
                const json = JSON.parse(text);
                previewsData.push({ file, animationData: json, name: file.name.replace('.json', '') });
            } catch (err) {
                console.error("Помилка читання Lottie JSON:", err);
            }
        }
        setPreviews(previewsData);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleInputChange = (field, value, isNested = false, nestedKey = null) => {
        if (isNested) {
            setFormData(prev => ({
                ...prev,
                [field]: {
                    ...prev[field],
                    [nestedKey]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const uploadLottie = async (fileObj) => {
        try {
            const storageRef = ref(storage, `gifts/${Date.now()}_${fileObj.name}`);
            const snapshot = await uploadBytes(storageRef, fileObj);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Upload error:", error);
            throw new Error(`Помилка при завантаженні файлу ${fileObj.name}.`);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // В режимі створення вимагаємо хоча б один файл
        if (!isEditMode && files.length === 0) {
            alert("Оберіть хоча б один Lottie файл!");
            return;
        }

        setSaving(true);
        setUploading(true);

        try {
            if (isEditMode) {
                // Одиночне збереження для існуючого подарунка
                let finalLottieUrl = formData.lottieUrl;
                if (files.length > 0) {
                    finalLottieUrl = await uploadLottie(files[0]);
                }

                const giftData = {
                    ...formData,
                    lottieUrl: finalLottieUrl,
                    updatedAt: serverTimestamp()
                };
                await updateDoc(doc(db, 'gifts', existingGift.id), giftData);
            } else {
                // Масове завантаження та створення багатьох подарунків
                const uploadPromises = previews.map(async (preview, index) => {
                    const downloadUrl = await uploadLottie(preview.file);

                    // Якщо базове ім'я пусте, беремо назву з файлу. Інакше додаємо індекс (якщо файлів більше одного).
                    const baseNameUk = formData.name.uk || preview.name;
                    const finalNameUk = previews.length > 1 && formData.name.uk ? `${baseNameUk} ${index + 1}` : baseNameUk;

                    const giftData = {
                        ...formData,
                        name: {
                            uk: finalNameUk,
                            en: formData.name.en ? (previews.length > 1 ? `${formData.name.en} ${index + 1}` : formData.name.en) : ''
                        },
                        lottieUrl: downloadUrl,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    };
                    return addDoc(collection(db, 'gifts'), giftData);
                });

                await Promise.all(uploadPromises);
            }

            onClose();
        } catch (error) {
            console.error("Save error:", error);
            alert("Помилка при збереженні подарунка.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="gift-editor-overlay">
            <div className="gift-editor-modal">
                <div className="editor-header">
                    <h3>{isEditMode ? 'Редагувати Подарунок' : 'Новий Подарунок'}</h3>
                    <button className="close-btn" onClick={onClose} disabled={saving || uploading}>&times;</button>
                </div>

                <form className="editor-form" onSubmit={handleSave}>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Базова Назва (Українська) {isEditMode ? '*' : '(залиште пустим, щоб взяти з файлів)'}</label>
                            <input
                                type="text"
                                required={isEditMode}
                                value={formData.name.uk}
                                onChange={(e) => handleInputChange('name', e.target.value, true, 'uk')}
                                placeholder={isEditMode ? "Напр. Золота платівка" : "Назва для всіх подарунків "}
                            />
                        </div>
                        <div className="form-group">
                            <label>Назва (English)</label>
                            <input
                                type="text"
                                value={formData.name.en}
                                onChange={(e) => handleInputChange('name', e.target.value, true, 'en')}
                                placeholder="e.g. Gold Record"
                            />
                        </div>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Тип подарунка</label>
                            <select
                                value={formData.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                            >
                                <option value="regular">Regular (Звичайний)</option>
                                <option value="nft">NFT (Колекційний)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ціна (Нот) *</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Анімація (Lottie JSON) {isEditMode ? '' : '*'}</label>
                        <div className="file-upload-box">
                            <input
                                type="file"
                                accept=".json"
                                multiple={!isEditMode}
                                onChange={handleFileChange}
                            />
                            {formData.lottieUrl && previews.length === 0 && (
                                <div className="current-file">
                                    ✓ Файл завантажено <a href={formData.lottieUrl} target="_blank" rel="noreferrer">Переглянути поточний</a>
                                </div>
                            )}
                        </div>

                        {/* ПРЕВ'Ю СІТКА */}
                        {previews.length > 0 && (
                            <div className="gift-preview-grid">
                                {previews.map((item, idx) => (
                                    <div key={idx} className="preview-card">
                                        <button
                                            type="button"
                                            className="remove-preview-btn"
                                            onClick={() => removeFile(idx)}
                                            title="Видалити"
                                        >&times;</button>
                                        <div className="preview-animation">
                                            <Lottie animationData={item.animationData} loop={true} />
                                        </div>
                                        <div className="preview-name">{item.name}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {formData.type === 'nft' && (
                        <div className="nft-settings-box">
                            <h4>Налаштування NFT</h4>

                            <div className="form-group-row">
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.isLimited}
                                            onChange={(e) => handleInputChange('isLimited', e.target.checked)}
                                        />
                                        Обмежений тираж
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label>Рідкісність</label>
                                    <select
                                        value={formData.rarity}
                                        onChange={(e) => handleInputChange('rarity', e.target.value)}
                                    >
                                        <option value="common">Common</option>
                                        <option value="rare">Rare</option>
                                        <option value="epic">Epic</option>
                                        <option value="legendary">Legendary</option>
                                    </select>
                                </div>
                            </div>

                            {formData.isLimited && (
                                <div className="form-group">
                                    <label>Кількість мінтів (Max Supply) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.maxSupply}
                                        onChange={(e) => handleInputChange('maxSupply', Number(e.target.value))}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Статус</label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                        >
                            <option value="draft">Чернетка</option>
                            <option value="active">Активний</option>
                            <option value="archived">Архівний</option>
                        </select>
                    </div>

                    <div className="editor-footer">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={saving || uploading}>
                            Скасувати
                        </button>
                        <button type="submit" className="btn-save" disabled={saving || uploading}>
                            {saving ? 'Збереження...' : uploading ? 'Завантаження...' : 'Зберегти'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
