// migrateUserRoles.js
const admin = require('firebase-admin');
// Переконайтесь, що шлях до вашого сервісного ключа правильний
const serviceAccount = require('./src/firebaseSDK/knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Скрипт для додавання дефолтної ролі 'user' всім користувачам,
 * у яких ще немає жодних ролей.
 */
async function assignDefaultRoleToUsers() {
  console.log('Починаємо пошук користувачів без ролей...');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('Не знайдено жодного користувача.');
    return;
  }

  // Створюємо пакетний запит для ефективного оновлення
  const batch = db.batch();
  let usersToUpdateCount = 0;

  snapshot.forEach(doc => {
    const userData = doc.data();
    const userId = doc.id;

    // Перевіряємо, чи у користувача ВЖЕ є поле 'roles' і чи воно не порожнє.
    // Це потрібно, щоб випадково не змінити роль адміністратора.
    if (!userData.roles || userData.roles.length === 0) {
      console.log(`- Користувач ${userId} (${userData.displayName}) не має ролі. Додаємо 'user'.`);
      batch.update(doc.ref, { roles: ['user'] });
      usersToUpdateCount++;
    } else {
      console.log(`- Користувач ${userId} (${userData.displayName}) вже має ролі: [${userData.roles.join(', ')}]. Пропускаємо.`);
    }
  });

  if (usersToUpdateCount > 0) {
    await batch.commit();
    console.log(`\n✅ Успішно оновлено ${usersToUpdateCount} користувачів.`);
  } else {
    console.log('\n✅ Всі користувачі вже мають ролі. Оновлення не потрібне.');
  }
}

assignDefaultRoleToUsers().catch(error => {
  console.error('Сталася помилка під час міграції:', error);
});