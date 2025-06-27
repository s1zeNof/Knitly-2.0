// src/EmojiPickerPlus.js
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useUserContext } from './UserContext';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import EmojiPicker from 'emoji-picker-react';
import Lottie from 'lottie-react';
import { cacheAnimatedPackId } from './emojiPackCache';
import './EmojiPickerPlus.css';

const fetchEmojiPacks = async (userId) => {
    if (!userId) return [];
    const packsQuery = query(collection(db, 'emoji_packs'), where('authorUid', '==', userId));
    const snapshot = await getDocs(packsQuery);
    const packs = [];
    for (const doc of snapshot.docs) {
        const packData = { id: doc.id, ...doc.data(), emojis: [] };
        const emojisSnapshot = await getDocs(collection(db, `emoji_packs/${doc.id}/emojis`));
        packData.emojis = emojisSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        packs.push(packData);
    }
    return packs;
};

// --- ВИПРАВЛЕННЯ ТУТ ---
const LottieEmoji = React.memo(({ url }) => {
    return <Lottie path={url} autoplay={true} loop={true} className="picker-lottie-preview" />;
});

const isLottieUrl = (url) => {
    if (!url) return false;
    try {
        const path = decodeURIComponent(new URL(url).pathname);
        return path.toLowerCase().endsWith('.json');
    } catch (e) { return false; }
};

const EmojiPickerPlus = ({ onEmojiSelect, onClose }) => {
    const { user } = useUserContext();
    const [activeTab, setActiveTab] = useState('unicode');

    const { data: packs } = useQuery(
        ['userEmojiPacksWithContent', user?.uid],
        () => fetchEmojiPacks(user?.uid),
        {
            enabled: !!user,
            onSuccess: (loadedPacks) => {
                loadedPacks?.forEach(pack => {
                    if (pack.isAnimated) {
                        cacheAnimatedPackId(pack.id);
                    }
                });
            }
        }
    );

    const handleUnicodeSelect = (emojiData) => onEmojiSelect(emojiData.emoji, false);
    const handleCustomSelect = (emoji, packId) => onEmojiSelect({ ...emoji, packId }, true);

    return (
        <div className="picker-overlay" onClick={onClose}>
            <div className="picker-container" onClick={e => e.stopPropagation()}>
                <header className="picker-header">
                    <nav className="picker-tabs">
                        <button className={`picker-tab ${activeTab === 'unicode' ? 'active' : ''}`} onClick={() => setActiveTab('unicode')}>😀</button>
                        {packs?.map(pack => (
                            <button key={pack.id} className={`picker-tab ${activeTab === pack.id ? 'active' : ''}`} onClick={() => setActiveTab(pack.id)}>
                                <img src={pack.coverEmojiUrl} alt={pack.name} />
                            </button>
                        ))}
                    </nav>
                </header>
                <main className="picker-content">
                    {activeTab === 'unicode' && ( <EmojiPicker onEmojiClick={handleUnicodeSelect} autoFocusSearch={false} theme="dark" width="100%" height="100%" searchDisabled previewConfig={{ showPreview: false }} lazyLoadEmojis categories={[{ category: 'suggested', name: 'Недавні' }, { category: 'smileys_people', name: 'Смайли' }, { category: 'animals_nature', name: 'Тварини' }, { category: 'food_drink', name: 'Їжа' }, { category: 'travel_places', name: 'Подорожі' }, { category: 'activities', name: 'Активності' }, { category: 'objects', name: 'Об\'єкти' }, { category: 'symbols', name: 'Символи' }, { category: 'flags', name: 'Прапори' }]} /> )}
                    {packs?.map(pack => {
                        if (activeTab !== pack.id) return null;
                        return (
                            <div key={pack.id} className="custom-emoji-grid">
                                {pack.emojis.map(emoji => {
                                    return (
                                        <button key={emoji.id} className="custom-emoji-btn" onClick={() => handleCustomSelect(emoji, pack.id)}>
                                            {pack.isAnimated || isLottieUrl(emoji.url) ? <LottieEmoji url={emoji.url} /> : <img src={emoji.url} alt={emoji.name} className="picker-image-preview" />}
                                        </button>
                                    )
                                })}
                            </div>
                        )
                    })}
                </main>
            </div>
        </div>
    );
};

export default EmojiPickerPlus;