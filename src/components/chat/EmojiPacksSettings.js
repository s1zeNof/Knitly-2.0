import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { Link, useNavigate } from 'react-router-dom'; // <-- Імпорт для навігації
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserContext } from '../../contexts/UserContext';
import ConfirmationModal from '../common/ConfirmationModal';
import './EmojiPacksSettings.css';

// Іконки для кращого UX
const AddIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const RightArrowIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 17l5-5-5-5v10z"/></svg>;

// Функція для видалення паку (без змін)
const deleteEmojiPack = async (packId) => {
    // ... ваш код для видалення
};

const EmojiPacksSettings = () => {
    const { user } = useUserContext();
    const navigate = useNavigate(); // <-- Хук для програмної навігації

    const [myPacks, setMyPacks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ isOpen: false, pack: null });

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        const fetchPacks = async () => {
            setIsLoading(true);
            try {
                const q = query(collection(db, 'emoji_packs'), where('authorUid', '==', user.uid));
                const querySnapshot = await getDocs(q);
                const packs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMyPacks(packs);
            } catch (error) {
                console.error("Помилка завантаження паків:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPacks();
    }, [user]);

    const deleteMutation = useMutation(deleteEmojiPack, {
        onSuccess: () => {
            setMyPacks(prevPacks => prevPacks.filter(p => p.id !== modalState.pack.id));
            setModalState({ isOpen: false, pack: null });
        },
        onError: (error) => {
            console.error("Помилка видалення паку:", error);
        }
    });

    // eslint-disable-next-line no-unused-vars
    const openDeleteModal = (pack) => {
        setModalState({ isOpen: true, pack });
    };

    const confirmDelete = () => {
        if (modalState.pack) {
            deleteMutation.mutate(modalState.pack.id);
        }
    };

    if (isLoading) {
        return <p>Завантаження ваших емоджі-паків...</p>;
    }

    return (
        <div className="emoji-packs-settings-container">
            <header className="settings-header">
                <h3>Керування емоджі-паками</h3>
                <button className="button-primary add-pack-button" onClick={() => navigate('/create-emoji-pack')}>
                    <AddIcon />
                    <span className="add-pack-button-text">Створити</span>
                </button>
            </header>

            <p className="settings-description">
                Тут ви можете переглядати, редагувати та видаляти створені вами емоджі-паки.
            </p>

            <div className="packs-list">
                {myPacks && myPacks.length > 0 ? (
                    myPacks.map(pack => (
                        <Link to={`/settings/emoji-packs/edit/${pack.id}`} key={pack.id} className="pack-item-link">
                            <div className="pack-item">
                                <img src={pack.coverEmojiUrl} alt={pack.name} className="pack-cover-preview" />
                                <span className="pack-name">{pack.name}</span>
                                <div className="pack-actions">
                                    <button className="button-edit">Редагувати</button>
                                    <RightArrowIcon className="arrow-icon" />
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="no-packs-placeholder">
                        <p>Ви ще не створили жодного емоджі-паку.</p>
                        <button className="button-primary" onClick={() => navigate('/create-emoji-pack')}>Створити перший пак</button>
                    </div>
                )}
            </div>
            
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, pack: null })}
                onConfirm={confirmDelete}
                title={`Видалити пак "${modalState.pack?.name}"?`}
                message="Ця дія є незворотною. Всі емоджі з цього паку та сам пак будуть видалені назавжди."
                confirmText={deleteMutation.isLoading ? 'Видалення...' : 'Видалити'}
            />
        </div>
    );
};

export default EmojiPacksSettings;