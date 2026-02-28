const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.generateAlgorithmicFeed = functions.https.onCall(async (data, context) => {
    const userId = context.auth.uid;
    if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    // 1. Збираємо пости від підписок, включаючи пости, де людина є співавтором
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const followingIds = userDoc.data().following || [];
    followingIds.push(userId); // Додаємо і свої пости

    const followingPostsSnap = await admin.firestore().collection('posts')
        .where('authorUids', 'array-contains-any', followingIds)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

    // 2. Збираємо рекомендовані пости
    const recommendedPostsSnap = await admin.firestore().collection('posts')
        .orderBy('likesCount', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

    let candidates = new Map();
    followingPostsSnap.forEach(doc => candidates.set(doc.id, { ...doc.data(), id: doc.id, source: 'following' }));
    recommendedPostsSnap.forEach(doc => {
        if (!candidates.has(doc.id) && !followingIds.includes(doc.data().authorId)) {
            candidates.set(doc.id, { ...doc.data(), id: doc.id, source: 'recommended' });
        }
    });

    // 3. Ранжуємо
    const scoredPosts = Array.from(candidates.values()).map(post => {
        let score = new Date(post.createdAt.seconds * 1000).getTime();
        score += (post.likesCount || 0) * 10000;
        score += (post.commentsCount || 0) * 50000;
        
        if (post.source === 'following') score *= 1.5;

        return { ...post, score };
    });

    const finalFeed = scoredPosts.sort((a, b) => b.score - a.score).slice(0, 20);
    return finalFeed;
});