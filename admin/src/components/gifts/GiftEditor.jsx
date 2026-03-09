import React, { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
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
    const [file, setFile] = useState(null);
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

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
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

    const uploadLottie = async () => {
        if (!file) return formData.lottieUrl;

        setUploading(true);
        try {
            // Зберігаємо файли в бакет "gifts" у Supabase/Firebase
            const storageRef = ref(storage, `gifts/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Upload error:", error);
            alert("Помилка при завантаженні файлу.");
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let finalLottieUrl = formData.lottieUrl;

            // Якщо вибрано новий файл, завантажуємо його
            if (file) {
                const uploadedUrl = await uploadLottie();
                if (!uploadedUrl) {
                    setSaving(false);
                    return;
                }
                finalLottieUrl = uploadedUrl;
            }

            const giftData = {
                ...formData,
                lottieUrl: finalLottieUrl,
                updatedAt: serverTimestamp()
            };

            if (isEditMode) {
                await updateDoc(doc(db, 'gifts', existingGift.id), giftData);
            } else {
                giftData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'gifts'), giftData);
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
                            <label>Назва (Українська) *</label>
                            <input
                                type="text"
                                required
                                value={formData.name.uk}
                                onChange={(e) => handleInputChange('name', e.target.value, true, 'uk')}
                                placeholder="Напр. Золота платівка"
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
                        <label>Анімація (Lottie JSON) *</label>
                        <div className="file-upload-box">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                required={!isEditMode && !formData.lottieUrl}
                            />
                            {formData.lottieUrl && !file && (
                                <div className="current-file">
                                    ✓ Файл вже завантажено <a href={formData.lottieUrl} target="_blank" rel="noreferrer">Переглянути</a>
                                </div>
                            )}
                        </div>
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
