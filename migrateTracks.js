// migrateTracks.js

const admin = require('firebase-admin');

// Переконайтесь, що шлях до вашого ключа правильний
const serviceAccount = require('./src/firebaseSDK/knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateTrackTags() {
  console.log('Починаємо міграцію тегів для треків...');
  
  const tracksRef = db.collection('tracks');
  // --- ЗМІНА: Забираємо .where() і завантажуємо всі документи ---
  const snapshot = await tracksRef.get();

  if (snapshot.empty) {
    console.log('У колекції "tracks" не знайдено жодного документу.');
    return;
  }

  const batchArray = [];
  batchArray.push(db.batch());
  let operationCounter = 0;
  let batchIndex = 0;
  let updatedCount = 0; // Лічильник для реально оновлених документів

  snapshot.forEach(doc => {
    const trackData = doc.data();

    // --- ЗМІНА: Перевіряємо, чи поле 'tags_search' відсутнє ---
    if (!trackData.hasOwnProperty('tags_search')) {
        const tagsForDisplay = trackData.tags;
        let tagsForSearch = [];

        // Перевіряємо, чи існує поле tags і чи це масив
        if (Array.isArray(tagsForDisplay) && tagsForDisplay.length > 0) {
            tagsForSearch = tagsForDisplay.map(tag => typeof tag === 'string' ? tag.toLowerCase() : '');
        }
        
        // Додаємо операцію оновлення в пакет
        batchArray[batchIndex].update(doc.ref, { tags_search: tagsForSearch });
        operationCounter++;
        updatedCount++;
        
        // Firestore дозволяє до 500 операцій в одному пакеті
        if (operationCounter >= 499) {
            batchArray.push(db.batch());
            batchIndex++;
            operationCounter = 0;
        }
    }
  });

  // --- ЗМІНА: Перевіряємо, чи були якісь оновлення ---
  if (updatedCount === 0) {
    console.log('Не знайдено треків для міграції. Можливо, всі дані вже оновлено.');
    return;
  }

  console.log(`Знайдено ${updatedCount} треків для оновлення. Запускаємо пакетні записи...`);

  // Виконуємо всі створені пакети записів
  await Promise.all(batchArray.map(batch => batch.commit()));

  console.log(`\nМіграцію успішно завершено! Оновлено ${updatedCount} треків.`);
}

migrateTrackTags().catch(error => {
  console.error("Під час міграції сталася помилка:", error);
});