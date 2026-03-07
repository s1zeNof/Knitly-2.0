/**
 * addLowercaseField.js
 * Додає поле displayName_lowercase для пошуку без урахування регістру.
 * Запуск: node scripts/addLowercaseField.js
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'src', 'firebaseSDK', 'knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  async function addLowercaseDisplayName() {
    console.log('Пошук користувачів без поля displayName_lowercase...');

    const snapshot = await db.collection('users').get();

    if (snapshot.empty) {
      console.log('Користувачів не знайдено.');
      return;
    }

    const batch = db.batch();
    let updateCount = 0;

    snapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.displayName && typeof userData.displayName_lowercase === 'undefined') {
        console.log(`Оновлюємо: ${doc.id} (${userData.displayName})`);
        batch.update(doc.ref, { displayName_lowercase: userData.displayName.toLowerCase() });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`\nОновлення завершено! Додано поле для ${updateCount} користувачів.`);
    } else {
      console.log('\nВсі користувачі вже мають необхідне поле.');
    }
  }

  addLowercaseDisplayName().catch(console.error);

} catch (error) {
  console.error('================================================================');
  console.error('ПОМИЛКА: Не вдалось завантажити ключ сервісного акаунту!');
  console.error(`Очікуваний шлях: ${serviceAccountPath}`);
  console.error('Переконайтесь, що src/firebaseSDK/ містить JSON ключ.');
  console.error('================================================================');
  console.error(error);
}
