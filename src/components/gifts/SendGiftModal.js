import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserContext } from '../../contexts/UserContext';
import Lottie from 'lottie-react';
import { useLottieData } from '../../hooks/useLottieData';
import default_picture from '../../img/Default-Images/default-picture.svg';
import './SendGiftModal.css';

// Додаємо isProcessing до пропсів
const SendGiftModal = ({ gift, onClose, onConfirm, isProcessing }) => {
    const { user: currentUser } = useUserContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const { animationData } = useLottieData(gift.mediaType === 'lottie' ? gift.mediaUrl : null);

    const { data: friends, isLoading: isLoadingFriends } = useQuery(
        ['friendsForGifting', currentUser?.uid],
        async () => {
            if (!currentUser?.following || currentUser.following.length === 0) return [];
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('__name__', 'in', currentUser.following.slice(0, 10)));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        { enabled: !!currentUser }
    );

    const filteredFriends = useMemo(() => {
        if (!friends) return [];
        return friends.filter(friend =>
            friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            friend.nickname.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [friends, searchTerm]);

    const handleConfirm = () => {
        if (selectedUser) {
            onConfirm(selectedUser);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content send-gift-modal" onClick={e => e.stopPropagation()}>
                <header className="send-gift-header">
                    <h4>Відправити подарунок</h4>
                    <button onClick={onClose} className="modal-close-button" disabled={isProcessing}>&times;</button>
                </header>
                <div className="send-gift-body">
                    <div className="gift-preview">
                        <div className="gift-preview-media">
                            {animationData && <Lottie animationData={animationData} loop={true} />}
                        </div>
                        <div className="gift-preview-info">
                            <p>{gift.name}</p>
                            <span>Вартість: {gift.price} Нот</span>
                        </div>
                    </div>

                    <div className="recipient-selection">
                        <label>Кому:</label>
                        {selectedUser ? (
                            <div className="selected-recipient">
                                <img src={selectedUser.photoURL || default_picture} alt={selectedUser.displayName} />
                                <span>{selectedUser.displayName}</span>
                                <button onClick={() => setSelectedUser(null)} disabled={isProcessing}>&times;</button>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Пошук серед друзів..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <div className="friends-list">
                                    {isLoadingFriends ? <p>Завантаження...</p> : (
                                        filteredFriends.map(friend => (
                                            <div key={friend.id} className="friend-item" onClick={() => setSelectedUser(friend)}>
                                                <img src={friend.photoURL || default_picture} alt={friend.displayName} />
                                                <span>{friend.displayName}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="modal-button-cancel" onClick={onClose} disabled={isProcessing}>Скасувати</button>
                    <button className="modal-button-confirm" onClick={handleConfirm} disabled={!selectedUser || isProcessing}>
                        {isProcessing ? 'Відправка...' : 'Подарувати'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendGiftModal;