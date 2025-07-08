const admin = require('firebase-admin');
const path = require('path');

// --- ФІНАЛЬНЕ ВИПРАВЛЕННЯ ШЛЯХУ ---
// __dirname вказує на поточну папку (scripts)
// '..' каже піднятися на один рівень вище (до папки src)
// 'firebaseSDK' вказує на папку з ключем
const serviceAccountPath = path.join(__dirname, '..', 'firebaseSDK', 'knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  async function addLowercaseDisplayName() {
    console.log('Пошук користувачів без поля displayName_lowercase...');
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
  
    if (snapshot.empty) {
      console.log('Користувачів не знайдено.');
      return;
    }
  
    const batch = db.batch();
    let updateCount = 0;
  
    snapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.displayName && typeof userData.displayName_lowercase === 'undefined') {
        console.log(`Оновлюємо користувача: ${doc.id} (${userData.displayName})`);
        batch.update(doc.ref, { displayName_lowercase: userData.displayName.toLowerCase() });
        updateCount++;
      }
    });
  
    if (updateCount > 0) {
      await batch.commit();
      console.log(`\nОновлення завершено! Додано поле для ${updateCount} користувачів.`);
    } else {
      console.log('\nВсі користувачі вже мають необхідне поле. Оновлення не потрібне.');
    }
  }
  
  addLowercaseDisplayName().catch(console.error);

} catch (error) {
    console.error('================================================================');
    console.error('ПОМИЛКА ЗАВАНТАЖЕННЯ КЛЮЧА СЕРВІСНОГО АКАУНТУ!');
    console.error(`Скрипт не зміг знайти файл за шляхом: ${serviceAccountPath}`);
    console.error('Будь ласка, перевірте, що папка "firebaseSDK" знаходиться точно тут: "src/firebaseSDK"');
    console.error('================================================================');
    console.error(error);
}