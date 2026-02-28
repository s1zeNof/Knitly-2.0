// src/scripts/addSearchKeywords.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addSearchKeywords() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('No users found.');
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const userData = doc.data();
    const keywords = new Set();

    // Додаємо нікнейм
    if (userData.nickname) {
      keywords.add(userData.nickname.toLowerCase());
    }

    // Додаємо ім'я та прізвище з displayName
    if (userData.displayName) {
      userData.displayName.toLowerCase().split(' ').forEach(word => {
        if (word) keywords.add(word);
      });
    }

    const searchKeywords = Array.from(keywords);
    
    // Оновлюємо документ
    batch.update(doc.ref, { searchKeywords });
    count++;
  });

  await batch.commit();
  console.log(`Successfully updated ${count} users with searchKeywords.`);
}

addSearchKeywords().catch(console.error);