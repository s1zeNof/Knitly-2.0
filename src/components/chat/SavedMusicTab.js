import React, { useState } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useQuery } from 'react-query';
import TrackList from '../common/TrackList'; // Ми будемо повторно використовувати цей компонент
import LikedTracks from '../common/LikedTracks';
import './SavedMusicTab.css'; // Нові стилі

const SavedMusicTab = () => {
    const { user: currentUser } = useUserContext();
    const [activeSubTab, setActiveSubTab] = useState('saved');

    // Завантажуємо треки, збережені в чаті "Збережене"
    const { data: savedTracks, isLoading: isLoadingSaved } = useQuery(
        ['savedTracks', currentUser?.uid],
        async () => {
            if (!currentUser) return [];
            const q = query(
                collection(db, 'users', currentUser.uid, 'savedMessages'),
                where('type', '==', 'track'),
                orderBy('savedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            // Витягуємо дані з `content` кожного повідомлення
            return snapshot.docs.map(doc => ({ ...doc.data().content, id: doc.data().content.id || doc.id }));
        },
        { enabled: !!currentUser }
    );
    
    const renderContent = () => {
        switch (activeSubTab) {
            case 'saved':
                return <TrackList initialTracks={savedTracks} isLoading={isLoadingSaved} />;
            case 'liked':
                return <LikedTracks />;
            case 'my_tracks':
                return <TrackList userId={currentUser.uid} />;
            default:
                return null;
        }
    };

    return (
        <div className="saved-music-tab">
            <header className="saved-music-header">
                <h3>Музика</h3>
                <div className="sub-tabs">
                    <button className={activeSubTab === 'saved' ? 'active' : ''} onClick={() => setActiveSubTab('saved')}>Збережені</button>
                    <button className={activeSubTab === 'liked' ? 'active' : ''} onClick={() => setActiveSubTab('liked')}>Вподобані</button>
                    <button className={activeSubTab === 'my_tracks' ? 'active' : ''} onClick={() => setActiveSubTab('my_tracks')}>Мої треки</button>
                </div>
            </header>
            <div className="saved-music-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default SavedMusicTab;