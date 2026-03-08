import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { uploadFile } from '../services/supabase';
import { useUserContext } from '../contexts/UserContext';
import { usePlayerContext } from '../contexts/PlayerContext';
import { db, auth } from '../services/firebase';
import { Country, City } from 'country-state-city';
import Select from 'react-select';
import EmojiPicker from 'emoji-picker-react';
import FolderEditModal from '../components/common/FolderEditModal';
import EmojiPacksSettings from '../components/chat/EmojiPacksSettings';
import WalletTab from '../components/settings/WalletTab';
import GiftHistoryTab from '../components/settings/GiftHistoryTab'; // <-- ІМПОРТ
import './Settings.css';

const UserIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const PrivacyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const FolderIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
const ChatIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const EmojiIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>;
const WalletIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"></path><path d="M16 12h4a2 2 0 1 1 0 4h-4v-4z"></path><path d="M18 10V8"></path><path d="M18 16v2"></path></svg>;
const HistoryIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>;
const AppearanceIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>;

// Clean SVG icons replacing emoji/text
const SmileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 13s1.5 2 4 2 4-2 4-2" />
        <circle cx="9" cy="9" r="0.6" fill="currentColor" stroke="none" />
        <circle cx="15" cy="9" r="0.6" fill="currentColor" stroke="none" />
    </svg>
);

const EyeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const Settings = () => {
    const { user, refreshUser } = useUserContext();
    const { showNotification } = usePlayerContext();
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [nickname, setNickname] = useState('');
    const [description, setDescription] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [isNamePublic, setIsNamePublic] = useState(true);
    const [nicknameError, setNicknameError] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const emojiPickerRef = useRef(null);
    const [chatFolders, setChatFolders] = useState([]);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [sidebarMode, setSidebarMode] = useState('full');
    const [deleteAnimation, setDeleteAnimation] = useState('animation-vortex-out');
    const [messagePrivacy, setMessagePrivacy] = useState('everyone');
    const [groupInvitePrivacy, setGroupInvitePrivacy] = useState('everyone');
    const [allowMessageRequests, setAllowMessageRequests] = useState(true);
    const [allowGroupRequests, setAllowGroupRequests] = useState(true);
    const [showNowPlaying, setShowNowPlaying] = useState(false);
    const previewRefs = useRef({});

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

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
            { root: null, threshold: 0 }
        );

        observer.observe(trigger);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const countryOptions = Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }));
        setCountries(countryOptions);

        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setBirthDate(user.birthDate || '');
            setNickname(user.nickname || '');
            setDescription(user.description || '');
            setProfileImageUrl(user.photoURL || '');
            setBackgroundImageUrl(user.backgroundImage || '');
            setIsNamePublic(user.isNamePublic !== false);
            setSidebarMode(user.settings?.sidebar?.mode || 'full');
            setDeleteAnimation(user.settings?.chat?.deleteAnimation || 'animation-vortex-out');
            setMessagePrivacy(user.settings?.privacy?.messagePrivacy || 'everyone');
            setGroupInvitePrivacy(user.settings?.privacy?.groupInvitePrivacy || 'everyone');
            setAllowMessageRequests(user.settings?.privacy?.allowMessageRequests !== false);
            setAllowGroupRequests(user.settings?.privacy?.allowGroupRequests !== false);
            setShowNowPlaying(user.settings?.privacy?.showNowPlaying || false);

            const userCountry = countryOptions.find(c => c.value === user.country);
            if (userCountry) {
                setSelectedCountry(userCountry);
                const cityOptions = City.getCitiesOfCountry(userCountry.value).map(c => ({ value: c.name, label: c.name }));
                setCities(cityOptions);
                const userCity = cityOptions.find(c => c.value === user.city);
                if (userCity) setSelectedCity(userCity);
            }
        }
    }, [user]);

    useEffect(() => {
        if (user && user.chatFolders) {
            const sortedFolders = [...user.chatFolders].sort((a, b) => a.order - b.order);
            setChatFolders(sortedFolders);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCountryChange = (countryOption) => {
        setSelectedCountry(countryOption);
        const cityOptions = City.getCitiesOfCountry(countryOption.value)?.map(c => ({ value: c.name, label: c.name })) || [];
        setCities(cityOptions);
        setSelectedCity(null);
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
        // Шлях у Supabase bucket 'images': avatars/{uid} або backgrounds/{uid}
        const path = imageType === 'profile'
            ? `avatars/${user.uid}`
            : `backgrounds/${user.uid}`;
        try {
            const newImageUrl = await uploadFile(file, 'images', path);
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
            // Check nickname uniqueness only if it was changed
            if (nickname && nickname !== user.nickname) {
                const nicknameQuery = query(collection(db, 'users'), where('nickname', '==', nickname));
                const nicknameSnapshot = await getDocs(nicknameQuery);
                const isDuplicate = nicknameSnapshot.docs.some(d => d.id !== user.uid);
                if (isDuplicate) {
                    showNotification('Цей нікнейм вже зайнятий. Оберіть інший.', 'error');
                    setIsSaving(false);
                    return;
                }
            }

            const userRef = doc(db, 'users', user.uid);
            const combinedDisplayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
            const updatedData = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                birthDate: birthDate || '',
                displayName: combinedDisplayName,
                displayName_lowercase: combinedDisplayName.toLowerCase(),
                nickname,
                description,
                country: selectedCountry ? selectedCountry.value : '',
                city: selectedCity ? selectedCity.value : '',
                photoURL: profileImageUrl,
                backgroundImage: backgroundImageUrl,
                isNamePublic,
                'settings.sidebar.mode': sidebarMode,
                'settings.chat.deleteAnimation': deleteAnimation,
                'settings.privacy.messagePrivacy': messagePrivacy,
                'settings.privacy.groupInvitePrivacy': groupInvitePrivacy,
                'settings.privacy.allowMessageRequests': allowMessageRequests,
                'settings.privacy.allowGroupRequests': allowGroupRequests,
                'settings.privacy.allowGroupRequests': allowGroupRequests,
                'settings.privacy.showNowPlaying': showNowPlaying,
            };

            // Виконуємо пакетне оновлення ЗАВЖДИ, щоб підтягнути старі треки
            const batch = writeBatch(db);

            // 1. Оновлюємо сам профіль
            batch.update(userRef, updatedData);

            // 2. Оновлюємо треки автора
            const tracksQuery = query(collection(db, 'tracks'), where('authorId', '==', user.uid));
            const tracksSnapshot = await getDocs(tracksQuery);

            tracksSnapshot.forEach((trackDoc) => {
                batch.update(trackDoc.ref, {
                    authorName: combinedDisplayName,
                    authorNickname: nickname || ''
                });
            });

            // Виконуємо батч
            await batch.commit();

            await refreshUser();
            showNotification('Зміни успішно збережено!', 'info');
        } catch (error) {
            console.error("ПОМИЛКА ЗБЕРЕЖЕННЯ НАЛАШТУВАНЬ:", error);
            showNotification(`Не вдалося зберегти: ${error.code}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingFolder(null);
        setIsFolderModalOpen(true);
    };

    const handleOpenEditModal = (folder) => {
        setEditingFolder(folder);
        setIsFolderModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsFolderModalOpen(false);
        setEditingFolder(null);
    };

    const handleSaveFolder = async (folderData) => {
        if (!user) return;
        let updatedFolders = [...chatFolders];
        const isEditing = updatedFolders.some(f => f.id === folderData.id);
        if (isEditing) {
            updatedFolders = updatedFolders.map(f => f.id === folderData.id ? { ...f, ...folderData } : f);
        } else {
            const maxOrder = updatedFolders.length > 0 ? Math.max(...updatedFolders.map(f => f.order || 0)) : -1;
            folderData.order = maxOrder + 1;
            updatedFolders.push(folderData);
        }
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { chatFolders: updatedFolders });
            await refreshUser();
            showNotification('Папку успішно збережено!', 'info');
            handleCloseModal();
        } catch (error) {
            console.error("Помилка збереження папки:", error);
            showNotification('Не вдалося зберегти папку.', 'error');
        }
    };

    const handleAnimationSelect = (animationId) => {
        setDeleteAnimation(animationId);
        const element = previewRefs.current[animationId];
        if (element) {
            element.classList.remove(animationId);
            void element.offsetWidth;
            element.classList.add(animationId);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || deleteConfirmText !== 'ВИДАЛИТИ' || isDeleting) return;
        setIsDeleting(true);
        try {
            const currentUser = auth.currentUser;
            // Re-authenticate before deletion (Firebase requirement for sensitive ops)
            if (deletePassword && currentUser.providerData?.[0]?.providerId === 'password') {
                const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
                await reauthenticateWithCredential(currentUser, credential);
            }
            // Delete Firestore user document
            await deleteDoc(doc(db, 'users', user.uid));
            // Delete Firebase Auth account
            await deleteUser(currentUser);
            // Auth state change will redirect to login automatically via UserContext
        } catch (error) {
            console.error('Error deleting account:', error);
            if (error.code === 'auth/wrong-password') {
                showNotification('Невірний пароль. Спробуйте знову.', 'error');
            } else if (error.code === 'auth/requires-recent-login') {
                showNotification('Будь ласка, введіть ваш пароль для підтвердження.', 'error');
            } else {
                showNotification('Помилка видалення акаунту. Спробуйте знову.', 'error');
            }
            setIsDeleting(false);
        }
    };

    const renderProfileTab = () => (
        <div className="settings-tab-content">
            <div className="form-section">
                <div className="form-section-header-row">
                    <label>Фото та фон профілю</label>
                    <button type="button" className="preview-trigger-btn" onClick={() => setShowPreview(true)}>
                        <EyeIcon /> Прев&#x2019;ю
                    </button>
                </div>
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
                    <label htmlFor="settings-first-name">Ім&apos;я</label>
                    <input id="settings-first-name" type="text" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ім'я" />
                </div>
                <div className="form-group">
                    <label htmlFor="settings-last-name">Прізвище</label>
                    <input id="settings-last-name" type="text" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Прізвище" />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="settings-birth-date">Дата народження <small style={{ fontWeight: 400, opacity: 0.5 }}>необов&apos;язково</small></label>
                    <input id="settings-birth-date" type="date" className="form-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                </div>
            </div>
            <div className="form-row">
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
                        <button type="button" className="emoji-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Додати емодзі">
                            <SmileIcon />
                        </button>
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
            <h3>Приватність</h3>

            {/* Name visibility */}
            <div className="privacy-toggle">
                <div>
                    <p>Показувати моє ім'я та прізвище</p>
                    <span>Дозволити іншим бачити ваше справжнє ім'я поруч з нікнеймом.</span>
                </div>
                <label className="switch">
                    <input type="checkbox" checked={isNamePublic} onChange={() => setIsNamePublic(!isNamePublic)} />
                    <span className="slider round"></span>
                </label>
            </div>

            {/* Now Playing visibility */}
            <div className="privacy-toggle">
                <div>
                    <p>Показувати що я слухаю на профілі</p>
                    <span>Відвідувачі вашого профілю бачитимуть трек, який ви зараз слухаєте.</span>
                </div>
                <label className="switch">
                    <input type="checkbox" checked={showNowPlaying} onChange={() => setShowNowPlaying(!showNowPlaying)} />
                    <span className="slider round"></span>
                </label>
            </div>

            {/* Message privacy */}
            <div className="privacy-section">
                <div className="privacy-section-header">
                    <p className="privacy-section-title">Хто може надсилати мені повідомлення</p>
                    <span className="privacy-section-desc">Решта користувачів не зможуть написати вам у приват.</span>
                </div>
                <div className="privacy-select-group">
                    <label className={`privacy-option ${messagePrivacy === 'everyone' ? 'selected' : ''}`} onClick={() => setMessagePrivacy('everyone')}>
                        <span className="privacy-radio" />
                        <div>
                            <strong>Усі</strong>
                            <span>Будь-хто може написати вам</span>
                        </div>
                    </label>
                    <label className={`privacy-option ${messagePrivacy === 'following' ? 'selected' : ''}`} onClick={() => setMessagePrivacy('following')}>
                        <span className="privacy-radio" />
                        <div>
                            <strong>Ті, на кого я підписаний</strong>
                            <span>Лише ті, кого ви фоловите, зможуть написати</span>
                        </div>
                    </label>
                    <label className={`privacy-option ${messagePrivacy === 'requests' ? 'selected' : ''}`} onClick={() => setMessagePrivacy('requests')}>
                        <span className="privacy-radio" />
                        <div>
                            <strong>Запити повідомлень</strong>
                            <span>Незнайомці потраплять до вкладки «Запити» — ви вирішуєте, прийняти чи відхилити</span>
                        </div>
                    </label>
                    <label className={`privacy-option ${messagePrivacy === 'nobody' ? 'selected' : ''}`} onClick={() => setMessagePrivacy('nobody')}>
                        <span className="privacy-radio" />
                        <div>
                            <strong>Ніхто</strong>
                            <span>Ніхто не може написати вам першим</span>
                        </div>
                    </label>
                </div>
                {messagePrivacy === 'nobody' && (
                    <div className="privacy-sub-option">
                        <label className="switch">
                            <input type="checkbox" checked={allowMessageRequests} onChange={() => setAllowMessageRequests(!allowMessageRequests)} />
                            <span className="slider round"></span>
                        </label>
                        <div>
                            <p>Дозволяти залишати запити на повідомлення</p>
                            <span>Як в Instagram — людина може надіслати запит, і ви вирішуєте, прийняти чи ні.</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Group invite privacy */}
            <div className="privacy-section">
                <div className="privacy-section-header">
                    <p className="privacy-section-title">Хто може запрошувати мене в групи</p>
                    <span className="privacy-section-desc">Контролюйте, хто може додавати вас до групових чатів.</span>
                </div>
                <div className="privacy-select-group">
                    <label className={`privacy-option ${groupInvitePrivacy === 'everyone' ? 'selected' : ''}`} onClick={() => setGroupInvitePrivacy('everyone')}>
                        <span className="privacy-radio" />
                        <div>
                            <strong>Усі</strong>
                            <span>Будь-хто може додати вас до групи</span>
                        </div>
                    </label>
                    <label className={`privacy-option ${groupInvitePrivacy === 'following' ? 'selected' : ''}`} onClick={() => setGroupInvitePrivacy('following')}>
                        <span className="privacy-radio" />
                        <div>
                            <strong>Ті, на кого я підписаний</strong>
                            <span>Лише ті, кого ви фоловите, можуть додати вас</span>
                        </div>
                    </label>
                    <label className={`privacy-option ${groupInvitePrivacy === 'nobody' ? 'selected' : ''}`} onClick={() => setGroupInvitePrivacy('nobody')}>
                        <span className="privacy-radio" />
                        <div>
                            <strong>Ніхто</strong>
                            <span>Ніхто не може додати вас до груп</span>
                        </div>
                    </label>
                </div>
                {groupInvitePrivacy === 'nobody' && (
                    <div className="privacy-sub-option">
                        <label className="switch">
                            <input type="checkbox" checked={allowGroupRequests} onChange={() => setAllowGroupRequests(!allowGroupRequests)} />
                            <span className="slider round"></span>
                        </label>
                        <div>
                            <p>Дозволяти надсилати запити на вступ до групи</p>
                            <span>Як в Instagram — ви самі вирішуєте, прийняти запит чи відхилити.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderFoldersTab = () => (
        <div className="settings-tab-content folders-tab-container">
            <h3>Папки чатів</h3>
            <div className="folders-tab-description">
                <p>Створюйте папки, щоб організувати ваші чати. Ви можете додати будь-які чати в одну папку та швидко перемикатися між ними.</p>
            </div>
            <button className="button-primary" onClick={handleOpenCreateModal}>Створити нову папку</button>
            <div className="folder-list">
                {chatFolders.length > 0 ? (
                    chatFolders.map(folder => (
                        <div key={folder.id} className="folder-item">
                            <span className="folder-item-name">{folder.name}</span>
                            <div className="folder-item-actions">
                                <button onClick={() => handleOpenEditModal(folder)}>Редагувати</button>
                                <button>Видалити</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="folder-list-placeholder">У вас ще немає створених папок.</p>
                )}
            </div>
        </div>
    );

    const renderChatTab = () => {
        const animations = [
            { id: 'animation-vortex-out', name: 'Вихор' },
            { id: 'animation-fall-out', name: 'Падіння' },
            { id: 'animation-pixelate-out', name: 'Пікселізація' },
            { id: 'animation-blur-out', name: 'Розмиття' },
        ];

        return (
            <div className="settings-tab-content">
                <h3>Кастомізація чатів</h3>
                <div className="form-section">
                    <label>Анімація зникання повідомлення</label>
                    <p className="form-section-description">Оберіть, як виглядатиме видалення повідомлення у ваших чатах.</p>
                    <div className="animation-picker">
                        {animations.map(anim => (
                            <div key={anim.id} className="animation-option" onClick={() => handleAnimationSelect(anim.id)}>
                                <div className="animation-preview-wrapper">
                                    <div
                                        ref={el => (previewRefs.current[anim.id] = el)}
                                        className={`animation-preview ${anim.id} ${deleteAnimation === anim.id ? 'active' : ''}`}
                                    >
                                        <span>Knitly</span>
                                    </div>
                                </div>
                                <label>
                                    <input
                                        type="radio"
                                        name="delete-animation"
                                        value={anim.id}
                                        checked={deleteAnimation === anim.id}
                                        readOnly
                                    />
                                    {anim.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderAppearanceTab = () => (
        <div className="settings-tab-content">
            <div className="form-section">
                <label>Вигляд бокової панелі <small style={{ fontWeight: 400, opacity: 0.5 }}>лише на ПК</small></label>
                <p className="form-section-description">Оберіть, як відображається бокова панель навігації на великих екранах.</p>
                <div className="sidebar-mode-selector">
                    {[
                        { value: 'full', title: 'Завжди повністю', desc: 'Іконки та підписи сторінок завжди видимі' },
                        { value: 'hover', title: 'Іконки + розгортання', desc: 'При наведенні панель розгортається і показує підписи' },
                        { value: 'icons', title: 'Лише іконки', desc: 'Лише іконки, підказка при наведенні курсора' },
                    ].map(opt => (
                        <label
                            key={opt.value}
                            className={`sidebar-mode-option ${sidebarMode === opt.value ? 'selected' : ''}`}
                            onClick={() => setSidebarMode(opt.value)}
                        >
                            <span className="sidebar-mode-radio">
                                {sidebarMode === opt.value && <span className="sidebar-mode-radio-dot" />}
                            </span>
                            <div>
                                <strong>{opt.title}</strong>
                                <span>{opt.desc}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAccountTab = () => (
        <div className="settings-tab-content">
            <h3>Акаунт</h3>
            <div className="account-danger-zone">
                <h4 className="danger-zone-title">Небезпечна зона</h4>
                <p className="danger-zone-desc">
                    Видалення акаунту є незворотнім. Всі ваші дані, пости, треки та повідомлення будуть видалені назавжди.
                    Відповідно до вимог GDPR, ви маєте право на повне видалення ваших персональних даних.
                </p>
                <button className="danger-zone-btn" onClick={() => setShowDeleteModal(true)}>
                    Видалити мій акаунт
                </button>
            </div>
        </div>
    );

    return (
        <div ref={scrollContainerRef} className="settings-page-container">
            {showDeleteModal && (
                <div className="delete-account-overlay" onClick={() => { if (!isDeleting) { setShowDeleteModal(false); setDeleteConfirmText(''); setDeletePassword(''); } }}>
                    <div className="delete-account-modal" onClick={e => e.stopPropagation()}>
                        <h3>Видалити акаунт</h3>
                        <p>Ця дія є <strong>незворотньою</strong>. Введіть <strong>ВИДАЛИТИ</strong>, щоб підтвердити.</p>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Введіть ВИДАЛИТИ"
                            value={deleteConfirmText}
                            onChange={e => setDeleteConfirmText(e.target.value)}
                            disabled={isDeleting}
                        />
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Ваш пароль (для підтвердження)"
                            value={deletePassword}
                            onChange={e => setDeletePassword(e.target.value)}
                            disabled={isDeleting}
                            style={{ marginTop: '0.75rem' }}
                        />
                        <div className="delete-account-modal-actions">
                            <button className="button-secondary" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); setDeletePassword(''); }} disabled={isDeleting}>
                                Скасувати
                            </button>
                            <button
                                className="danger-zone-btn"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'ВИДАЛИТИ' || !deletePassword || isDeleting}
                            >
                                {isDeleting ? 'Видалення...' : 'Видалити назавжди'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className={`settings-page-header ${isHeaderShrunk ? 'shrunk' : ''}`}>
                <h1>Налаштування</h1>
            </div>
            <div ref={headerTriggerRef} className="header-scroll-trigger"></div>

            <div className="settings-layout">
                <aside className="settings-sidebar">
                    <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><UserIcon /> Профіль</button>
                    <button className={activeTab === 'wallet' ? 'active' : ''} onClick={() => setActiveTab('wallet')}><WalletIcon /> Гаманець</button>
                    <button className={activeTab === 'giftHistory' ? 'active' : ''} onClick={() => setActiveTab('giftHistory')}><HistoryIcon /> Історія подарунків</button>
                    <button className={activeTab === 'appearance' ? 'active' : ''} onClick={() => setActiveTab('appearance')}><AppearanceIcon /> Вигляд</button>
                    <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}><ChatIcon /> Чати</button>
                    <button className={activeTab === 'emoji' ? 'active' : ''} onClick={() => setActiveTab('emoji')}><EmojiIcon /> Емоджі-паки</button>
                    <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => setActiveTab('privacy')}><PrivacyIcon /> Приватність</button>
                    <button className={activeTab === 'folders' ? 'active' : ''} onClick={() => setActiveTab('folders')}><FolderIcon /> Папки чатів</button>
                    <button className={`${activeTab === 'account' ? 'active' : ''} settings-account-tab-btn`} onClick={() => setActiveTab('account')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>
                        Акаунт
                    </button>
                </aside>
                <main className="settings-main-content">
                    {activeTab === 'profile' && renderProfileTab()}
                    {activeTab === 'appearance' && renderAppearanceTab()}
                    {activeTab === 'wallet' && <WalletTab />}
                    {activeTab === 'giftHistory' && <GiftHistoryTab />}
                    {activeTab === 'chat' && renderChatTab()}
                    {activeTab === 'emoji' && <EmojiPacksSettings />}
                    {activeTab === 'privacy' && renderPrivacyTab()}
                    {activeTab === 'folders' && renderFoldersTab()}
                    {activeTab === 'account' && renderAccountTab()}

                    {activeTab !== 'folders' && activeTab !== 'emoji' && activeTab !== 'wallet' && activeTab !== 'giftHistory' && activeTab !== 'account' && (
                        <div className="settings-actions">
                            <button className="button-primary" onClick={handleSaveChanges} disabled={isSaving || !!nicknameError}>
                                {isSaving ? "Збереження..." : "Зберегти зміни"}
                            </button>
                        </div>
                    )}
                </main>
            </div>
            <FolderEditModal
                isOpen={isFolderModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveFolder}
                folderToEdit={editingFolder}
            />

            {showPreview && (
                <div className="preview-modal-backdrop" onClick={() => setShowPreview(false)}>
                    <div className="preview-modal" onClick={e => e.stopPropagation()}>
                        <div className="preview-modal-topbar">
                            <span>Прев&#x2019;ю профілю</span>
                            <button className="preview-modal-close-btn" onClick={() => setShowPreview(false)}>✕</button>
                        </div>
                        <img
                            className="preview-profile-banner"
                            src={backgroundImageUrl || 'https://placehold.co/600x130/181818/333?text='}
                            alt="Банер профілю"
                        />
                        <div className="preview-profile-body">
                            <div className="preview-avatar-wrap">
                                <img
                                    className="preview-profile-avatar"
                                    src={profileImageUrl || 'https://placehold.co/80x80/282828/555?text=K'}
                                    alt="Аватар"
                                />
                            </div>
                            <p className="preview-profile-name">{[firstName, lastName].filter(Boolean).join(' ') || 'Ваше ім\'я'}</p>
                            <p className="preview-profile-nickname">@{nickname || 'nickname'}</p>
                            {description && <p className="preview-profile-desc">{description}</p>}
                        </div>
                        <div className="preview-modal-note">
                            Це приблизний вигляд вашого профілю після збереження
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const customSelectStyles = {
    control: (provided) => ({ ...provided, backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.35rem', boxShadow: 'none', '&:hover': { borderColor: 'var(--color-accent)' } }),
    singleValue: (provided) => ({ ...provided, color: 'var(--color-text-primary)' }),
    menu: (provided) => ({ ...provided, backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)', }),
    option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? 'var(--color-accent)' : state.isFocused ? 'var(--color-border)' : 'transparent', '&:active': { backgroundColor: 'var(--color-accent)' }, cursor: 'pointer', }),
    input: (provided) => ({ ...provided, color: 'var(--color-text-primary)' }),
    placeholder: (provided) => ({ ...provided, color: 'var(--color-text-placeholder)' }),
};

export default Settings;