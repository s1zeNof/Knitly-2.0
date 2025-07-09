const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'firebaseSDK', 'knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');
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

    // Рахуємо треки
    const tracksQuery = db.collection('tracks').where('authorId', '==', userId);
    const tracksSnapshot = await tracksQuery.get();
    const actualTracksCount = tracksSnapshot.size;
    
    // Рахуємо дописи
    const postsQuery = db.collection('posts').where('authorUids', 'array-contains', userId);
    const postsSnapshot = await postsQuery.get();
    const actualPostsCount = postsSnapshot.size;

    // Порівнюємо і оновлюємо, якщо потрібно
    if (userData.tracksCount !== actualTracksCount || userData.postsCount !== actualPostsCount) {
      console.log(` -> Знайдено розбіжність:`);
      console.log(`    Треки: збережено ${userData.tracksCount || 0}, знайдено ${actualTracksCount}`);
      console.log(`    Дописи: збережено ${userData.postsCount || 0}, знайдено ${actualPostsCount}`);
      
      await userDoc.ref.update({
        tracksCount: actualTracksCount,
        postsCount: actualPostsCount
      });
      
      console.log(` -> Статистику для ${userData.displayName} оновлено.`);
      usersUpdated++;
    } else {
      console.log(' -> Статистика коректна, оновлення не потрібне.');
    }
  }

  if (usersUpdated > 0) {
    console.log(`\n\nПерерахунок завершено! Оновлено статистику для ${usersUpdated} користувачів.`);
  } else {
    console.log('\n\nПерерахунок завершено. Усі лічильники були в актуальному стані.');
  }
}

recountUserStats().catch(console.error);