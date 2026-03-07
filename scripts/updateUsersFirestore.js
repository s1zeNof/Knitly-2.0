/**
 * updateUsersFirestore.js
 * Перераховує followingCount та followersCount для всіх користувачів.
 * Запуск: node scripts/updateUsersFirestore.js
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'src', 'firebaseSDK', 'knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateAllUsers() {
  const snapshot = await db.collection('users').get();

  const updates = snapshot.docs.map(async (docSnapshot) => {
    try {
      const userData = docSnapshot.data();
      const followingCount = userData.following ? userData.following.length : 0;
      const followersCount = userData.followers ? userData.followers.length : 0;

      await docSnapshot.ref.update({ followingCount, followersCount });
      console.log(`Оновлено: ${docSnapshot.id}`);
    } catch (error) {
      console.error(`Помилка при оновленні ${docSnapshot.id}:`, error);
    }
  });

  await Promise.all(updates);
  console.log('Всіх користувачів оновлено.');
}

updateAllUsers().catch(console.error);
