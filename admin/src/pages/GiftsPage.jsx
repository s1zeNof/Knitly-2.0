import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import GiftEditor from '../components/gifts/GiftEditor';
import './GiftsPage.css';

export default function GiftsPage() {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingGift, setEditingGift] = useState(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'gifts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const giftsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGifts(giftsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching gifts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCreateNew = () => {
        setEditingGift(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (gift) => {
        setEditingGift(gift);
        setIsEditorOpen(true);
    };

    const handleDelete = async (giftId) => {
        if (!window.confirm("Ви впевнені, що хочете видалити цей подарунок?")) return;
        try {
            await deleteDoc(doc(db, 'gifts', giftId));
        } catch (error) {
            console.error("Error deleting gift:", error);
            alert("Помилка при видаленні подарунка.");
        }
    };

    const toggleStatus = async (giftId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        try {
            await updateDoc(doc(db, 'gifts', giftId), { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDeleteAllPlaceholders = async () => {
        if (!window.confirm("ДІЙСНО ВИДАЛИТИ УСІ ОТРИМАНІ ПОДАРУНКИ У ВСІХ КОРИСТУВАЧІВ? (Допоки не запустились)")) return;

        setIsDeletingAll(true);
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            let deletedCount = 0;

            for (const userDoc of usersSnap.docs) {
                const receivedGiftsRef = collection(db, 'users', userDoc.id, 'receivedGifts');
                const giftsSnap = await getDocs(receivedGiftsRef);

                for (const gDoc of giftsSnap.docs) {
                    await deleteDoc(doc(db, 'users', userDoc.id, 'receivedGifts', gDoc.id));
                    deletedCount++;
                }
            }
            alert(`Успішно видалено ${deletedCount} подарунків у всіх користувачів!`);
        } catch (error) {
            console.error("Error clearing all gifts:", error);
            alert("Помилка під час масового видалення.");
        } finally {
            setIsDeletingAll(false);
        }
    };

    if (loading) {
        return <div className="p-loading">Завантаження подарунків...</div>;
    }

    return (
        <div className="gifts-page">
            <div className="gifts-header">
                <h2>Управління Подарунками</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-create"
                        onClick={handleDeleteAllPlaceholders}
                        disabled={isDeletingAll}
                        style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
                    >
                        {isDeletingAll ? 'Видалення...' : '⚠️ Очистити всі отримані подарунки'}
                    </button>
                    <button className="btn-create" onClick={handleCreateNew}>
                        + Створити подарунок
                    </button>
                </div>
            </div>

            <div className="gifts-table-container">
                <table className="gifts-table">
                    <thead>
                        <tr>
                            <th>Прев'ю</th>
                            <th>Назва</th>
                            <th>Тип</th>
                            <th>Ціна (Нот)</th>
                            <th>Статус</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gifts.map(gift => (
                            <tr key={gift.id}>
                                <td>
                                    {gift.lottieUrl ? (
                                        <div className="gift-preview-cell">
                                            {/* Тут можна додати маленький Player для Lottie, 
                                                але для таблиці достатньо іконки або заглушки */}
                                            <span className="lottie-indicator">🎁 Lottie</span>
                                        </div>
                                    ) : (
                                        <span className="no-media">-</span>
                                    )}
                                </td>
                                <td>
                                    <strong>{gift.name?.uk || 'Без назви'}</strong>
                                    <div className="gift-name-en">{gift.name?.en || ''}</div>
                                </td>
                                <td>
                                    <span className={`gift-type-badge ${gift.type}`}>
                                        {gift.type === 'nft' ? 'NFT' : 'Regular'}
                                    </span>
                                </td>
                                <td>{gift.price || 0}</td>
                                <td>
                                    <button
                                        className={`status-btn ${gift.status}`}
                                        onClick={() => toggleStatus(gift.id, gift.status)}
                                    >
                                        {gift.status === 'active' ? 'Активний' : gift.status || 'Чернетка'}
                                    </button>
                                </td>
                                <td className="actions-cell">
                                    <button className="action-btn edit" onClick={() => handleEdit(gift)}>✎</button>
                                    <button className="action-btn delete" onClick={() => handleDelete(gift.id)}>🗑</button>
                                </td>
                            </tr>
                        ))}
                        {gifts.length === 0 && (
                            <tr>
                                <td colSpan="6" className="empty-table">Подарунків ще немає.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isEditorOpen && (
                <GiftEditor
                    existingGift={editingGift}
                    onClose={() => setIsEditorOpen(false)}
                />
            )}
        </div>
    );
}
