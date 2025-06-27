// updateReactions.js
const admin = require('firebase-admin');
const serviceAccount = require('./src/firebaseSDK/knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addAnimationFlagToReactions() {
  console.log('Запуск скрипту оновлення реакцій...');

  // 1. Знаходимо всі анімовані паки
  const animatedPacks = new Set();
  const packsSnapshot = await db.collection('emoji_packs').where('isAnimated', '==', true).get();
  packsSnapshot.forEach(doc => {
    animatedPacks.add(doc.id);
  });

  if (animatedPacks.size === 0) {
    console.log('Анімованих паків не знайдено. Завершення.');
    return;
  }
  console.log(`Знайдено ${animatedPacks.size} анімованих паків.`);

  // 2. Проходимо по всіх чатах та їхніх повідомленнях
  const chatsSnapshot = await db.collection('chats').get();
  console.log(`Знайдено ${chatsSnapshot.size} чатів для обробки.`);

  let messagesToUpdate = 0;
  const batch = db.batch(); // Будемо використовувати батчі для оновлення

  for (const chatDoc of chatsSnapshot.docs) {
    const messagesSnapshot = await chatDoc.ref.collection('messages').get();
    
    for (const messageDoc of messagesSnapshot.docs) {
      const messageData = messageDoc.data();
      const reactions = messageData.reactions;

      if (!reactions || typeof reactions !== 'object') {
        continue;
      }

      let needsUpdate = false;
      const newReactions = { ...reactions };

      for (const reactionId in newReactions) {
        const packId = reactionId.split('_')[0];

        // 3. Якщо реакція належить до анімованого паку і не має прапорця - додаємо його
        if (animatedPacks.has(packId) && newReactions[reactionId].isAnimated !== true) {
          newReactions[reactionId].isAnimated = true;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        batch.update(messageDoc.ref, { reactions: newReactions });
        messagesToUpdate++;
      }
    }
  }

  if (messagesToUpdate > 0) {
    console.log(`Оновлення ${messagesToUpdate} повідомлень...`);
    await batch.commit();
    console.log('Усі реакції успішно оновлено!');
  } else {
    console.log('Не знайдено реакцій, що потребують оновлення.');
  }
}

addAnimationFlagToReactions().catch(console.error);