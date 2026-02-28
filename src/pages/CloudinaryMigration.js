import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/cloudinary';

const CloudinaryMigration = () => {
    const [progress, setProgress] = useState([]);
    const [isMigrating, setIsMigrating] = useState(false);

    const log = (msg) => {
        setProgress((prev) => [...prev, msg]);
    };

    const fetchProxyAndUpload = async (url) => {
        try {
            // Fetch file as blob
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            // Create a File object
            const file = new File([blob], "migrated_file", { type: blob.type });
            // Upload to Cloudinary
            const cloudUrl = await uploadToCloudinary(file);
            return cloudUrl;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    const needsMigration = (url) => {
        return url && (url.includes('firebasestorage') || url.includes('supabase.co')) && !url.includes('cloudinary');
    };

    const migrateUsers = async () => {
        log('Fetching users...');
        const snap = await getDocs(collection(db, 'users'));
        let count = 0;
        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            let updates = {};
            if (needsMigration(data.photoURL)) {
                log(`Migrating avatar for ${data.nickname}...`);
                const newUrl = await fetchProxyAndUpload(data.photoURL);
                if (newUrl) updates.photoURL = newUrl;
            }
            if (needsMigration(data.bannerURL)) {
                log(`Migrating banner for ${data.nickname}...`);
                const newUrl = await fetchProxyAndUpload(data.bannerURL);
                if (newUrl) updates.bannerURL = newUrl;
            }
            if (Object.keys(updates).length > 0) {
                await updateDoc(doc(db, 'users', docSnap.id), updates);
                count++;
            }
        }
        log(`Users migrated: ${count}`);
    };

    const migrateTracks = async () => {
        log('Fetching tracks...');
        const snap = await getDocs(collection(db, 'tracks'));
        let count = 0;
        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            let updates = {};
            if (needsMigration(data.coverArtUrl)) {
                log(`Migrating cover for ${data.title}...`);
                const newUrl = await fetchProxyAndUpload(data.coverArtUrl);
                if (newUrl) updates.coverArtUrl = newUrl;
            }
            if (needsMigration(data.trackUrl)) {
                log(`Migrating audio for ${data.title}...`);
                const newUrl = await fetchProxyAndUpload(data.trackUrl);
                if (newUrl) updates.trackUrl = newUrl;
            }
            if (Object.keys(updates).length > 0) {
                await updateDoc(doc(db, 'tracks', docSnap.id), updates);
                count++;
            }
        }
        log(`Tracks migrated: ${count}`);
    };

    const migrateEmojiPacks = async () => {
        log('Fetching emoji packs...');
        const snap = await getDocs(collection(db, 'emoji_packs'));
        let count = 0;
        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            let updates = {};
            if (needsMigration(data.coverUrl)) {
                log(`Migrating cover for pack ${data.name}...`);
                const newUrl = await fetchProxyAndUpload(data.coverUrl);
                if (newUrl) updates.coverUrl = newUrl;
            }
            if (data.emojis) {
                let emojisUpdated = false;
                const newEmojis = [];
                for (const emoji of data.emojis) {
                    if (needsMigration(emoji.url)) {
                        log(`Migrating emoji ${emoji.name} in pack ${data.name}...`);
                        const newUrl = await fetchProxyAndUpload(emoji.url);
                        if (newUrl) {
                            newEmojis.push({ ...emoji, url: newUrl });
                            emojisUpdated = true;
                        } else {
                            newEmojis.push(emoji);
                        }
                    } else {
                        newEmojis.push(emoji);
                    }
                }
                if (emojisUpdated) updates.emojis = newEmojis;
            }
            if (Object.keys(updates).length > 0) {
                await updateDoc(doc(db, 'emoji_packs', docSnap.id), updates);
                count++;
            }
        }
        log(`Emoji packs migrated: ${count}`);
    };

    const migrateAll = async () => {
        setIsMigrating(true);
        setProgress([]);
        try {
            await migrateUsers();
            await migrateTracks();
            await migrateEmojiPacks();
            log('Migration Complete');
        } catch (error) {
            log(`Error: ${error.message}`);
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div style={{ padding: '40px', color: 'white' }}>
            <h2>Cloudinary DB Migration Tool</h2>
            <p>Ця сторінка завантажить зображення та аудіо зі старих хостингів (Firebase/Supabase) та перезаллє їх у Cloudinary.</p>
            <button
                onClick={migrateAll}
                disabled={isMigrating}
                style={{ padding: '10px 20px', fontSize: '16px', background: 'white', color: 'black', borderRadius: '5px' }}
            >
                {isMigrating ? 'Migrating...' : 'Start Migration'}
            </button>

            <div style={{ marginTop: '20px', background: '#222', padding: '20px', borderRadius: '8px', minHeight: '300px', maxHeight: '500px', overflowY: 'auto' }}>
                {progress.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: '8px', fontSize: '14px', fontFamily: 'monospace' }}>
                        {msg}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CloudinaryMigration;
