/**
 * recountUserStats.js
 * Перераховує tracksCount та postsCount для всіх користувачів.
 * Запуск: node scripts/recountUserStats.js
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'src', 'firebaseSDK', 'knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function recountUserStats() {
  console.log('Починаємо перерахунок статистики користувачів...');

  const usersRef = db.collection('users');
  const usersSnapshot = await usersRef.get();

  if (usersSnapshot.empty) {
    console.log('Не знайдено жодного користувача.');
    return;
  }

  let usersUpdated = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    console.log(`\nОбробка користувача: ${userData.displayName || userId}`);

    const tracksSnapshot = await db.collection('tracks').where('authorId', '==', userId).get();
    const actualTracksCount = tracksSnapshot.size;

    const postsSnapshot = await db.collection('posts').where('authorUids', 'array-contains', userId).get();
    const actualPostsCount = postsSnapshot.size;

    if (userData.tracksCount !== actualTracksCount || userData.postsCount !== actualPostsCount) {
      console.log(` -> Знайдено розбіжність:`);
      console.log(`    Треки: збережено ${userData.tracksCount || 0}, знайдено ${actualTracksCount}`);
      console.log(`    Дописи: збережено ${userData.postsCount || 0}, знайдено ${actualPostsCount}`);

      await userDoc.ref.update({ tracksCount: actualTracksCount, postsCount: actualPostsCount });
      console.log(` -> Статистику оновлено.`);
      usersUpdated++;
    } else {
      console.log(' -> Статистика коректна, оновлення не потрібне.');
    }
  }

  console.log(`\nПерерахунок завершено! Оновлено ${usersUpdated} користувачів.`);
}

recountUserStats().catch(console.error);
