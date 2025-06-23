import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { db, storage } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { useUserContext } from './UserContext';
import ConfirmationModal from './ConfirmationModal';
import './EmojiPacksSettings.css';

// Функція для видалення паку (залишається без змін)
const deleteEmojiPack = async (packId) => {
    const packFolderRef = ref(storage, `emoji_packs/${packId}`);
    const filesList = await listAll(packFolderRef);
    const deleteFilePromises = filesList.items.map(fileRef => deleteObject(fileRef));
    await Promise.all(deleteFilePromises);

    const emojisCollectionRef = collection(db, `emoji_packs/${packId}/emojis`);
    const emojisSnapshot = await getDocs(emojisCollectionRef);
    const batch = writeBatch(db);
    emojisSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    const packDocRef = doc(db, 'emoji_packs', packId);
    batch.delete(packDocRef);

    await batch.commit();
};

const EmojiPacksSettings = () => {
    const { user } = useUserContext();
    const queryClient = useQueryClient();
    
    // --- ОСНОВНА ЗМІНА: Переходимо з useQuery на useState/useEffect для завантаження ---
    const [myPacks, setMyPacks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ isOpen: false, pack: null });

    useEffect(() => {
        // Якщо користувача немає, нічого не завантажуємо
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
    }, [user]); // Перезавантажуємо дані, якщо змінився користувач

    // --- Логіка видалення через useMutation залишається, бо вона зручна ---
    const deleteMutation = useMutation(deleteEmojiPack, {
        onSuccess: () => {
            // Замість invalidateQueries, просто оновлюємо стан вручну для миттєвого відгуку
            setMyPacks(prevPacks => prevPacks.filter(p => p.id !== modalState.pack.id));
            setModalState({ isOpen: false, pack: null });
        },
        onError: (error) => {
            console.error("Помилка видалення паку:", error);
            // Тут можна додати сповіщення для користувача
        }
    });

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
            <h3>Керування емоджі-паками</h3>
            <p className="settings-description">
                Тут ви можете переглядати, редагувати та видаляти створені вами емоджі-паки.
            </p>

            <div className="packs-list">
                {myPacks && myPacks.length > 0 ? (
                    myPacks.map(pack => (
                        <div key={pack.id} className="pack-item">
                            <img src={pack.coverEmojiUrl} alt={pack.name} className="pack-cover-preview" />
                            <span className="pack-name">{pack.name}</span>
                            <div className="pack-actions">
                                <button className="button-edit" disabled>Редагувати</button>
                                <button className="button-delete" onClick={() => openDeleteModal(pack)} disabled={deleteMutation.isLoading}>
                                    Видалити
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Ви ще не створили жодного емоджі-паку.</p>
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