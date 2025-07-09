import React, { useState } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import { db } from '../../services/firebase';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';
import Lottie from 'lottie-react';
import { useLottieData } from '../../hooks/useLottieData';
import SendGiftModal from './SendGiftModal';
import GiftViewerModal from './GiftViewerModal';
import toast from 'react-hot-toast';
import './GiftCard.css';

const GiftCard = ({ gift }) => {
    const { user: currentUser, refreshUser } = useUserContext();
    const { animationData, loading } = useLottieData(gift.mediaType === 'lottie' ? gift.mediaUrl : null);
    
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSendGift = async (recipientUser) => {
        if (!currentUser) {
            toast.error("Будь ласка, увійдіть, щоб дарувати подарунки.");
            return;
        }
        if (currentUser.uid === recipientUser.id) {
            toast.error("Ви не можете дарувати подарунки самому собі.");
            return;
        }

        setIsProcessing(true);

        const senderRef = doc(db, 'users', currentUser.uid);
        const recipientRef = doc(db, 'users', recipientUser.id); // <-- Додаємо посилання на одержувача

        try {
            await runTransaction(db, async (transaction) => {
                const senderDoc = await transaction.get(senderRef);
                if (!senderDoc.exists()) throw new Error("Ваш профіль не знайдено.");

                const senderBalance = senderDoc.data().notesBalance || 0;
                if (senderBalance < gift.price) throw new Error("Недостатньо Нот на балансі.");

                // 1. Знімаємо "Ноти"
                const newBalance = senderBalance - gift.price;
                transaction.update(senderRef, { notesBalance: newBalance });

                // 2. Створюємо запис в загальній історії
                const historyRef = doc(collection(db, 'giftHistory'));
                transaction.set(historyRef, {
                    fromUserId: currentUser.uid,
                    fromUserName: currentUser.displayName,
                    toUserId: recipientUser.id,
                    toUserName: recipientUser.displayName,
                    giftId: gift.id,
                    giftName: gift.name,
                    price: gift.price,
                    timestamp: serverTimestamp()
                });

                // 3. 👇 ДОДАЄМО ПОДАРУНОК В "ІНВЕНТАР" ОТРИМУВАЧА 👇
                const recipientGiftRef = doc(collection(recipientRef, 'receivedGifts'));
                transaction.set(recipientGiftRef, {
                    giftId: gift.id,
                    giftName: gift.name,
                    giftMediaUrl: gift.mediaUrl,
                    giftMediaType: gift.mediaType,
                    fromUserId: currentUser.uid,
                    fromUserName: currentUser.displayName,
                    receivedAt: serverTimestamp()
                });
            });

            toast.success(`Подарунок "${gift.name}" успішно відправлено до ${recipientUser.displayName}!`);
            await refreshUser();
            
        } catch (error) {
            console.error("Помилка відправки подарунка:", error);
            toast.error(error.message || "Не вдалося відправити подарунок.");
        } finally {
            setIsProcessing(false);
            setIsSendModalOpen(false);
        }
    };

    return (
        <>
            <div className="gift-card">
                <div className="gift-card-media" onClick={() => setIsViewerModalOpen(true)}>
                    {gift.mediaType === 'lottie' && !loading && animationData ? (
                        <Lottie animationData={animationData} loop={true} />
                    ) : (
                        <div className="gift-placeholder">🎁</div>
                    )}
                </div>
                <h4 className="gift-card-name">{gift.name}</h4>
                <div className="gift-card-price">
                    <span>{gift.price}</span>
                    <small>Нот</small>
                </div>
                <button 
                    className="gift-card-button" 
                    onClick={() => setIsSendModalOpen(true)}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Обробка...' : 'Подарувати'}
                </button>
            </div>

            {isSendModalOpen && (
                <SendGiftModal 
                    gift={gift} 
                    onClose={() => setIsSendModalOpen(false)} 
                    onConfirm={handleSendGift} 
                    isProcessing={isProcessing}
                />
            )}
            
            {isViewerModalOpen && (
                <GiftViewerModal
                    gift={gift}
                    onClose={() => setIsViewerModalOpen(false)}
                />
            )}
        </>
    );
};

export default GiftCard;