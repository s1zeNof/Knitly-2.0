const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;

// Replace with the path to your service account key file
const serviceAccount = require('./knitly-92828-firebase-adminsdk-7cl04-e52aa456b2.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'da5tg6rif',
    api_key: '314865691526819',
    api_secret: 'u1xDYaXQnq7_-O2T4vX6RSih0Wo'
});

const uploadToCloudinary = async (url) => {
    try {
        const result = await cloudinary.uploader.upload(url, {
            resource_type: "auto"
        });
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        return null;
    }
};

const needsMigration = (url) => {
    return url && (url.includes('firebasestorage') || url.includes('supabase.co')) && !url.includes('res.cloudinary.com');
};

const migrateUsers = async () => {
    console.log('Fetching users...');
    const snapshot = await db.collection('users').get();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        let updates = {};

        if (needsMigration(data.photoURL)) {
            console.log(`Migrating avatar for ${data.nickname}...`);
            const newUrl = await uploadToCloudinary(data.photoURL);
            if (newUrl) updates.photoURL = newUrl;
        }
        if (needsMigration(data.bannerURL)) {
            console.log(`Migrating banner for ${data.nickname}...`);
            const newUrl = await uploadToCloudinary(data.bannerURL);
            if (newUrl) updates.bannerURL = newUrl;
        }

        if (Object.keys(updates).length > 0) {
            await doc.ref.update(updates);
            count++;
        }
    }
    console.log(`Users migrated: ${count}`);
};

const migrateTracks = async () => {
    console.log('Fetching tracks...');
    const snapshot = await db.collection('tracks').get();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        let updates = {};

        if (needsMigration(data.coverArtUrl)) {
            console.log(`Migrating cover for track ${data.title}...`);
            const newUrl = await uploadToCloudinary(data.coverArtUrl);
            if (newUrl) updates.coverArtUrl = newUrl;
        }
        if (needsMigration(data.trackUrl)) {
            console.log(`Migrating audio for track ${data.title}...`);
            const newUrl = await uploadToCloudinary(data.trackUrl);
            if (newUrl) updates.trackUrl = newUrl;
        }

        if (Object.keys(updates).length > 0) {
            await doc.ref.update(updates);
            count++;
        }
    }
    console.log(`Tracks migrated: ${count}`);
};

const migrateEmojiPacks = async () => {
    console.log('Fetching emoji packs...');
    const snapshot = await db.collection('emoji_packs').get();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        let updates = {};

        if (needsMigration(data.coverUrl)) {
            console.log(`Migrating cover for pack ${data.name}...`);
            const newUrl = await uploadToCloudinary(data.coverUrl);
            if (newUrl) updates.coverUrl = newUrl;
        }

        if (data.emojis) {
            let emojisUpdated = false;
            const newEmojis = [];
            for (const emoji of data.emojis) {
                if (needsMigration(emoji.url)) {
                    console.log(`Migrating emoji ${emoji.name} in pack ${data.name}...`);
                    const newUrl = await uploadToCloudinary(emoji.url);
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
            await doc.ref.update(updates);
            count++;
        }
    }
    console.log(`Emoji packs migrated: ${count}`);
};

const runMigration = async () => {
    console.log("Starting Migration...");
    await migrateUsers();
    await migrateTracks();
    await migrateEmojiPacks();
    console.log("Migration Completed!");
    process.exit(0);
};

runMigration().catch(console.error);
