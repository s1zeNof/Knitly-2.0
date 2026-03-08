import React, { useState } from 'react'; // Додаємо useState
import { useQuery } from 'react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Lottie from 'lottie-react';
import { useLottieData } from '../../hooks/useLottieData';
import GiftViewerModal from './GiftViewerModal'; // Імпортуємо вьюер
import PageLoader from '../common/PageLoader'; // Додаємо PageLoader
import './ReceivedGiftsTab.css';

// Маленький компонент для одного подарунка в списку
const ReceivedGiftItem = ({ gift, onGiftClick }) => { // Додаємо пропс onGiftClick
    const { animationData } = useLottieData(gift.giftMediaType === 'lottie' ? gift.giftMediaUrl : null);

    return (
        // Тепер весь елемент є кнопкою
        <button className="received-gift-item" onClick={() => onGiftClick(gift)}>
            <div className="received-gift-media">
                {animationData && <Lottie animationData={animationData} loop={true} />}
            </div>
            <div className="received-gift-info">
                <p className="received-gift-name">{gift.giftName}</p>
                <small>від {gift.fromUserName}</small>
            </div>
        </button>
    );
};

// Основний компонент вкладки
const ReceivedGiftsTab = ({ userId, isOwnProfile, onSendGiftClick }) => {
    // Стан для керування модальним вікном перегляду
    const [viewingGift, setViewingGift] = useState(null);

    const { data: receivedGifts, isLoading } = useQuery(
        ['receivedGifts', userId],
        async () => {
            const giftsRef = collection(db, 'users', userId, 'receivedGifts');
            const q = query(giftsRef, orderBy('receivedAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        { enabled: !!userId }
    );

    if (isLoading) return <PageLoader text="Завантаження подарунків..." />;

    if (!receivedGifts || receivedGifts.length === 0) {
        return (
            <div className="received-gifts-empty">
                <div className="received-gifts-empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                </div>
                <h3>Подарунків ще немає</h3>
                <p>{isOwnProfile ? 'Вам ще не дарували подарунків.' : 'Користувачу ще не дарували подарунків.'}</p>
                <button className="received-gifts-empty-btn" onClick={onSendGiftClick}>
                    Зробити подарунок
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="received-gifts-grid">
                {receivedGifts.map(gift => (
                    // Передаємо функцію для відкриття модального вікна
                    <ReceivedGiftItem key={gift.id} gift={gift} onGiftClick={setViewingGift} />
                ))}
            </div>

            {/* Рендеримо модальне вікно, якщо подарунок обрано для перегляду */}
            {viewingGift && (
                <GiftViewerModal
                    gift={{
                        name: viewingGift.giftName,
                        description: `Подарунок від ${viewingGift.fromUserName}`,
                        mediaUrl: viewingGift.giftMediaUrl,
                        mediaType: viewingGift.giftMediaType
                    }}
                    onClose={() => setViewingGift(null)}
                />
            )}
        </>
    );
};

export default ReceivedGiftsTab;