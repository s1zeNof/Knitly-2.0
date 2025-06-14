import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserContext } from './UserContext';
import { usePlayerContext } from './PlayerContext';
import { auth, db } from './firebase';
import { Country, City } from 'country-state-city';
import Select from 'react-select';
import EmojiPicker from 'emoji-picker-react';
import './Settings.css';

// Іконки
const UserIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const PrivacyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;

const Settings = () => {
    const { user, refreshUser } = useUserContext();
    const { showNotification } = usePlayerContext();
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Стани для даних профілю
    const [displayName, setDisplayName] = useState('');
    const [nickname, setNickname] = useState('');
    const [description, setDescription] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
    
    // Стани для геолокації
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    // Стан для приватності
    const [isNamePublic, setIsNamePublic] = useState(true);

    // Стан для валідації та UI
    const [nicknameError, setNicknameError] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);

    // --- ЗМІНЕНО: Цей useEffect тепер відповідає за повне початкове завантаження даних ---
    useEffect(() => {
        const countryOptions = Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }));
        setCountries(countryOptions);
        
        if (user) {
            setDisplayName(user.displayName || '');
            setNickname(user.nickname || '');
            setDescription(user.description || '');
            setProfileImageUrl(user.photoURL || '');
            setBackgroundImageUrl(user.backgroundImage || '');
            setIsNamePublic(user.isNamePublic !== false);

            const userCountry = countryOptions.find(c => c.value === user.country);
            if (userCountry) {
                setSelectedCountry(userCountry);
                const cityOptions = City.getCitiesOfCountry(userCountry.value).map(c => ({ value: c.name, label: c.name }));
                setCities(cityOptions);

                const userCity = cityOptions.find(c => c.value === user.city);
                if (userCity) {
                    setSelectedCity(userCity);
                }
            }
        }
    }, [user]);

    // --- ВИДАЛЕНО: Проблемний useEffect, що залежав від [selectedCountry], видалено ---

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- ДОДАНО: Нова функція для обробки ручної зміни країни ---
    const handleCountryChange = (countryOption) => {
        setSelectedCountry(countryOption);
        const cityOptions = City.getCitiesOfCountry(countryOption.value)?.map(c => ({ value: c.name, label: c.name })) || [];
        setCities(cityOptions);
        setSelectedCity(null); // Очищуємо місто, бо змінилася країна
    };

    const handleNicknameChange = (e) => {
        const value = e.target.value.toLowerCase();
        setNickname(value);

        if (value && !/^[a-z0-9_.]+$/.test(value)) {
            setNicknameError('Нікнейм може містити лише латинські літери, цифри, "_" та "."');
        } else if (value.length > 0 && (value.length < 3 || value.length > 20)) {
            setNicknameError('Нікнейм має містити від 3 до 20 символів.');
        } else {
            setNicknameError('');
        }
    };

    const handleImageUpload = async (e, imageType) => {
        const file = e.target.files[0];
        if (!file || !user) return;
        const path = imageType === 'profile' ? `profileImages/${user.uid}` : `backgroundImages/${user.uid}`;
        const storage = getStorage();
        const storageReference = storageRef(storage, path);
        try {
            await uploadBytes(storageReference, file);
            const newImageUrl = await getDownloadURL(storageReference);
            if (imageType === 'profile') setProfileImageUrl(newImageUrl);
            else setBackgroundImageUrl(newImageUrl);
            showNotification('Зображення оновлено!', 'info');
        } catch (error) {
            console.error("Помилка завантаження зображення:", error);
            showNotification(`Помилка завантаження: ${error.message}`, 'error');
        }
    };
    
    const onEmojiClick = (emojiObject) => {
        setDescription(prevDescription => prevDescription + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const handleSaveChanges = async () => {
        if (!user || nicknameError) return;
        setIsSaving(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            const updatedData = {
                displayName, nickname, description,
                country: selectedCountry ? selectedCountry.value : '',
                city: selectedCity ? selectedCity.value : '',
                photoURL: profileImageUrl,
                backgroundImage: backgroundImageUrl,
                isNamePublic,
            };
            await updateDoc(userRef, updatedData);
            await refreshUser();
            showNotification('Зміни успішно збережено!', 'info');
        } catch (error) {
            console.error("ПОМИЛКА ЗБЕРЕЖЕННЯ НАЛАШТУВАНЬ:", error);
            showNotification(`Не вдалося зберегти: ${error.code}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const renderProfileTab = () => (
        <div className="settings-tab-content">
            {/* ... (код для фото, імені, опису без змін) ... */}
            <div className="form-section">
                <label>Фото та фон профілю</label>
                <div className="image-uploaders-container">
                    <div className="image-uploader profile">
                        <img className="image-preview profile" src={profileImageUrl || 'https://placehold.co/128x128/181818/333?text=K'} alt="Profile" />
                        <label htmlFor="profile-image-input" className="button-secondary">Змінити фото</label>
                        <input id="profile-image-input" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
                    </div>
                    <div className="image-uploader background">
                        <img className="image-preview background" src={backgroundImageUrl || 'https://placehold.co/600x200/181818/333?text=Knitly'} alt="Background" />
                        <label htmlFor="background-image-input" className="button-secondary">Змінити фон</label>
                        <input id="background-image-input" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'background')} />
                    </div>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="displayName">Ім'я та Прізвище</label>
                    <input id="displayName" type="text" className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="nickname">Нікнейм (URL профілю)</label>
                    <div className="input-group">
                        <span>knitly.com/</span>
                        <input id="nickname" type="text" value={nickname} onChange={handleNicknameChange} />
                    </div>
                    {nicknameError && <small className="form-error-text">{nicknameError}</small>}
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="description">Опис</label>
                <div className="textarea-wrapper">
                    <textarea id="description" className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" maxLength="250"></textarea>
                    <div className="textarea-footer">
                        <span className="char-counter">{description.length} / 250</span>
                        <button type="button" className="emoji-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😀</button>
                    </div>
                    {showEmojiPicker && 
                        <div ref={emojiPickerRef} className="emoji-picker-wrapper">
                            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                        </div>
                    }
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="country">Країна</label>
                    {/* --- ЗМІНЕНО: Використовуємо нову функцію onChange --- */}
                    <Select options={countries} value={selectedCountry} onChange={handleCountryChange} placeholder="Оберіть країну" styles={customSelectStyles} />
                </div>
                <div className="form-group">
                    <label htmlFor="city">Місто</label>
                    <Select options={cities} value={selectedCity} onChange={setSelectedCity} placeholder="Оберіть місто" styles={customSelectStyles} isDisabled={!selectedCountry} />
                </div>
            </div>
        </div>
    );

    const renderPrivacyTab = () => (
        <div className="settings-tab-content">
            <div className="privacy-toggle">
                <div>
                    <p>Показувати моє ім'я та прізвище</p>
                    <span>Дозволити іншим користувачам бачити ваше справжнє ім'я поруч з нікнеймом.</span>
                </div>
                <label className="switch">
                    <input type="checkbox" checked={isNamePublic} onChange={() => setIsNamePublic(!isNamePublic)} />
                    <span className="slider round"></span>
                </label>
            </div>
        </div>
    );
    
    return (
        <div className="settings-page-container">
            <header className="settings-page-header">
                <h1>Налаштування</h1>
            </header>
            <div className="settings-layout">
                <aside className="settings-sidebar">
                    <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><UserIcon /> Профіль</button>
                    <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => setActiveTab('privacy')}><PrivacyIcon /> Приватність</button>
                </aside>
                <main className="settings-main-content">
                    {activeTab === 'profile' && renderProfileTab()}
                    {activeTab === 'privacy' && renderPrivacyTab()}
                    <div className="settings-actions">
                        <button className="button-primary" onClick={handleSaveChanges} disabled={isSaving || !!nicknameError}>
                            {isSaving ? "Збереження..." : "Зберегти зміни"}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

const customSelectStyles = {
    control: (provided) => ({
        ...provided, backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)',
        borderRadius: '0.5rem', padding: '0.35rem', boxShadow: 'none', '&:hover': { borderColor: 'var(--color-accent)' }
    }),
    singleValue: (provided) => ({ ...provided, color: 'var(--color-text-primary)' }),
    menu: (provided) => ({
        ...provided, backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)',
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? 'var(--color-accent)' : state.isFocused ? 'var(--color-border)' : 'transparent',
        '&:active': { backgroundColor: 'var(--color-accent)' }, cursor: 'pointer',
    }),
    input: (provided) => ({ ...provided, color: 'var(--color-text-primary)' }),
    placeholder: (provided) => ({ ...provided, color: 'var(--color-text-placeholder)' }),
};

export default Settings;