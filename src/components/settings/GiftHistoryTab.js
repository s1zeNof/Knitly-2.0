import React from 'react';
import { useQuery } from 'react-query';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, getDocs, or } from 'firebase/firestore';
import { useUserContext } from '../../contexts/UserContext';
import Lottie from 'lottie-react'; // Імпортуємо Lottie
import { useLottieData } from '../../hooks/useLottieData'; // Імпортуємо хук
import './GiftHistoryTab.css';

const formatHistoryTime = (timestamp) => {
    if (!timestamp) return 'невідомо';
    return new Date(timestamp.seconds * 1000).toLocaleString('uk-UA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Створюємо маленький компонент для медіа, щоб уникнути виклику хука в циклі
const HistoryGiftMedia = ({ url, type }) => {
    const { animationData } = useLottieData(type === 'lottie' ? url : null);

    if (type === 'lottie' && animationData) {
        return <Lottie animationData={animationData} loop={true} />;
    }
    // Можна додати обробку для 'webp' якщо потрібно
    return <div className="gift-placeholder-icon">🎁</div>;
};


const GiftHistoryTab = () => {
    const { user: currentUser } = useUserContext();

    const { data: history, isLoading } = useQuery(
        ['giftHistory', currentUser?.uid],
        async () => {
            if (!currentUser) return [];
            const historyRef = collection(db, 'giftHistory');
            const q = query(
                historyRef,
                or(
                    where('fromUserId', '==', currentUser.uid),
                    where('toUserId', '==', currentUser.uid)
                ),
                orderBy('timestamp', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        { enabled: !!currentUser }
    );

    if (isLoading) return <p>Завантаження історії...</p>;

    return (
        <div className="gift-history-container">
            <h3>Історія подарунків</h3>
            <p className="settings-description">
                Тут відображаються всі подарунки, які ви відправили або отримали.
            </p>
            <div className="history-list">
                {history && history.length > 0 ? (
                    history.map(item => {
                        const isSent = item.fromUserId === currentUser.uid;
                        return (
                            <div key={item.id} className={`history-item ${isSent ? 'sent' : 'received'}`}>
                                <div className="history-item-icon">
                                    {/* Рендеримо компонент з анімацією */}
                                    <HistoryGiftMedia url={item.giftMediaUrl} type={item.giftMediaType} />
                                </div>
                                <div className="history-item-details">
                                    <p>
                                        {isSent 
                                            ? `Ви подарували "${item.giftName}" користувачу ${item.toUserName}`
                                            : `Ви отримали "${item.giftName}" від ${item.fromUserName}`
                                        }
                                    </p>
                                    <small>{formatHistoryTime(item.timestamp)}</small>
                                </div>
                                <div className={`history-item-price ${isSent ? 'sent' : 'received'}`}>
                                    {isSent ? '-' : '+'}{item.price} Нот
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p>Ваша історія подарунків порожня.</p>
                )}
            </div>
        </div>
    );
};

export default GiftHistoryTab;