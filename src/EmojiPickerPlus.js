import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useUserContext } from './UserContext';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import EmojiPicker from 'emoji-picker-react';
import './EmojiPickerPlus.css';

const fetchEmojiPacks = async (userId) => {
    if (!userId) return [];
    const packsQuery = query(collection(db, 'emoji_packs'), where('authorUid', '==', userId));
    const packsSnapshot = await getDocs(packsQuery);
    
    const packs = [];
    for (const packDoc of packsSnapshot.docs) {
        const packData = { id: packDoc.id, ...packDoc.data(), emojis: [] };
        const emojisQuery = query(collection(db, `emoji_packs/${packDoc.id}/emojis`));
        const emojisSnapshot = await getDocs(emojisQuery);
        packData.emojis = emojisSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        packs.push(packData);
    }
    return packs;
};

const EmojiPickerPlus = ({ onEmojiSelect, onClose }) => {
    const { user } = useUserContext();
    const [activeTab, setActiveTab] = useState('unicode');

    const { data: packs, isLoading } = useQuery(
        ['userEmojiPacksWithContent', user?.uid],
        () => fetchEmojiPacks(user?.uid),
        { enabled: !!user }
    );

    const handleUnicodeSelect = (emojiData) => {
        onEmojiSelect(emojiData.emoji, false); // false - означає не кастомний
    };

    // <<< ЗМІНА: Тепер ця функція викликає onEmojiSelect >>>
    const handleCustomSelect = (emoji, packId) => {
        // Додаємо packId до об'єкта емоджі і передаємо його далі
        onEmojiSelect({ ...emoji, packId }, true); // true - означає кастомний
    };

    return (
        <div className="picker-overlay" onClick={onClose}>
            <div className="picker-container" onClick={e => e.stopPropagation()}>
                <header className="picker-header">
                    <nav className="picker-tabs">
                        <button 
                            className={`picker-tab ${activeTab === 'unicode' ? 'active' : ''}`}
                            onClick={() => setActiveTab('unicode')}
                        >
                           😀
                        </button>
                        {packs?.map(pack => (
                            <button 
                                key={pack.id} 
                                className={`picker-tab ${activeTab === pack.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(pack.id)}
                            >
                                <img src={pack.coverEmojiUrl} alt={pack.name} />
                            </button>
                        ))}
                    </nav>
                </header>
                <main className="picker-content">
                    {activeTab === 'unicode' && (
                        <EmojiPicker
                            onEmojiClick={handleUnicodeSelect}
                            autoFocusSearch={false}
                            theme="dark"
                            width="100%"
                            height="100%"
                            searchDisabled
                            previewConfig={{ showPreview: false }}
                            lazyLoadEmojis
                            categories={[
                                { category: 'suggested', name: 'Недавні' },
                                { category: 'smileys_people', name: 'Смайли' },
                                { category: 'animals_nature', name: 'Тварини' },
                                { category: 'food_drink', name: 'Їжа' },
                                { category: 'travel_places', name: 'Подорожі' },
                                { category: 'activities', name: 'Активності' },
                                { category: 'objects', name: 'Об\'єкти' },
                                { category: 'symbols', name: 'Символи' },
                                { category: 'flags', name: 'Прапори' },
                            ]}
                        />
                    )}
                    {packs?.map(pack => {
                        if (activeTab !== pack.id) return null;
                        return (
                            <div key={pack.id} className="custom-emoji-grid">
                                {pack.emojis.map(emoji => (
                                    <button 
                                        key={emoji.id} 
                                        className="custom-emoji-btn"
                                        onClick={() => handleCustomSelect(emoji, pack.id)}
                                    >
                                        <img src={emoji.url} alt={emoji.name} />
                                    </button>
                                ))}
                            </div>
                        )
                    })}
                </main>
            </div>
        </div>
    );
};

export default EmojiPickerPlus;