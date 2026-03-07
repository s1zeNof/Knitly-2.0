/**
 * fixNegativeLikes.js
 * Виправляє негативні лічильники лайків у колекції tracks.
 * Запуск: node scripts/fixNegativeLikes.js
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'src', 'firebaseSDK', 'knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixNegativeLikeCounts() {
  console.log('Пошук треків з негативним лічильником лайків...');

  const tracksRef = db.collection('tracks');
  const snapshot = await tracksRef.where('likesCount', '<', 0).get();

  if (snapshot.empty) {
    console.log('Не знайдено треків з помилковими даними. Все чисто!');
    return;
  }

  const batch = db.batch();
  let fixCount = 0;

  snapshot.forEach(doc => {
    fixCount++;
    console.log(`Знайдено трек ID: ${doc.id} з лічильником ${doc.data().likesCount}. Виставляємо на 0.`);
    batch.update(doc.ref, { likesCount: 0 });
  });

  await batch.commit();
  console.log(`\nВиправлення завершено! Оновлено ${fixCount} треків.`);
}

fixNegativeLikeCounts().catch(console.error);
