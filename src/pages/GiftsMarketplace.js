import React from 'react';
import { useQuery } from 'react-query';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../shared/services/firebase';
import GiftCard from '../components/gifts/GiftCard';
import './GiftsMarketplace.css';

const GiftsMarketplace = () => {
    const { data: gifts, isLoading } = useQuery('gifts', () => 
        getDocs(collection(db, 'gifts')).then(snap => 
            snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        )
    );

    if (isLoading) {
        return <div className="gifts-marketplace-loader">Завантаження подарунків...</div>;
    }

    return (
        <div className="gifts-marketplace-container">
            <header className="gifts-marketplace-header">
                <h1>Магазин подарунків</h1>
                <p>Даруйте емоції друзям та улюбленим артистам.</p>
            </header>
            <div className="gifts-grid">
                {gifts && gifts.length > 0 ? (
                    gifts.map(gift => (
                        <GiftCard key={gift.id} gift={gift} />
                    ))
                ) : (
                    <p>Наразі немає доступних подарунків.</p>
                )}
            </div>
        </div>
    );
};

export default GiftsMarketplace;