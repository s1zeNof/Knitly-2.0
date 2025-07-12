import React, { useState } from 'react'; // Додаємо useState
import { useQuery } from 'react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../shared/services/firebase';
import Lottie from 'lottie-react';
import { useLottieData } from '../../shared/hooks/useLottieData';
import GiftViewerModal from './GiftViewerModal'; // Імпортуємо вьюер
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
const ReceivedGiftsTab = ({ userId }) => {
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

    if (isLoading) return <p>Завантаження подарунків...</p>;

    if (!receivedGifts || receivedGifts.length === 0) {
        return <div className="page-profile-tab-placeholder">Користувачу ще не дарували подарунків.</div>;
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