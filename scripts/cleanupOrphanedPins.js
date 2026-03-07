/**
 * cleanupOrphanedPins.js
 * Видаляє "сирітські" закріплені повідомлення (pinnedMessages) що вже не існують.
 * Запуск: node scripts/cleanupOrphanedPins.js
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'src', 'firebaseSDK', 'knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function synchronizePinnedMessages() {
  console.log('Починаємо синхронізацію закріплених повідомлень...');

  const chatsSnapshot = await db.collection('chats').get();

  if (chatsSnapshot.empty) {
    console.log('Не знайдено жодного чату.');
    return;
  }

  let updatesCount = 0;

  const processingPromises = chatsSnapshot.docs.map(async (chatDoc) => {
    const chatData = chatDoc.data();

    if (!chatData.pinnedMessages || chatData.pinnedMessages.length === 0) return;

    const messagesRef = chatDoc.ref.collection('messages');
    const existenceChecks = chatData.pinnedMessages.map(pin =>
      messagesRef.doc(pin.messageId).get()
    );
    const messageSnapshots = await Promise.all(existenceChecks);

    const validPins = chatData.pinnedMessages.filter((_, index) =>
      messageSnapshots[index].exists
    );

    if (validPins.length !== chatData.pinnedMessages.length) {
      const orphansCount = chatData.pinnedMessages.length - validPins.length;
      console.log(`Чат ${chatDoc.id}: знайдено ${orphansCount} сирітських закріплень. Оновлюємо...`);
      await chatDoc.ref.update({ pinnedMessages: validPins });
      updatesCount++;
    }
  });

  await Promise.all(processingPromises);
  console.log(`\nСинхронізацію завершено. Оновлено ${updatesCount} чатів.`);
}

synchronizePinnedMessages().catch(console.error);
