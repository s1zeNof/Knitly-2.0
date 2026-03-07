/**
 * addSearchKeywords.js
 * Генерує масив searchKeywords для кожного юзера (nickname + displayName слова).
 * Запуск: node scripts/addSearchKeywords.js
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'src', 'firebaseSDK', 'knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addSearchKeywords() {
  const snapshot = await db.collection('users').get();

  if (snapshot.empty) {
    console.log('Користувачів не знайдено.');
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const userData = doc.data();
    const keywords = new Set();

    if (userData.nickname) {
      keywords.add(userData.nickname.toLowerCase());
    }
    if (userData.displayName) {
      userData.displayName.toLowerCase().split(' ').forEach(word => {
        if (word) keywords.add(word);
      });
    }

    batch.update(doc.ref, { searchKeywords: Array.from(keywords) });
    count++;
  });

  await batch.commit();
  console.log(`Оновлено ${count} користувачів з searchKeywords.`);
}

addSearchKeywords().catch(console.error);
