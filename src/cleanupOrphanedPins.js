const admin = require('firebase-admin');

// Переконайтесь, що шлях до вашого serviceAccount ключа правильний
// Цей шлях має бути відносно кореня проєкту, де ви запускаєте скрипт
const serviceAccount = require('./src/firebaseSDK/knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function synchronizePinnedMessages() {
  console.log('Починаємо синхронізацію закріплених повідомлень...');
  
  const chatsRef = db.collection('chats');
  const chatsSnapshot = await chatsRef.get();

  if (chatsSnapshot.empty) {
    console.log('Не знайдено жодного чату.');
    return;
  }

  let updatesCount = 0;

  // Використовуємо Promise.all для паралельної обробки чатів
  const processingPromises = chatsSnapshot.docs.map(async (chatDoc) => {
    const chatData = chatDoc.data();
    
    // Переходимо до наступного, якщо немає закріплених повідомлень
    if (!chatData.pinnedMessages || chatData.pinnedMessages.length === 0) {
      return;
    }

    const messagesRef = chatDoc.ref.collection('messages');
    
    // Створюємо масив промісів для перевірки існування кожного закріпленого повідомлення
    const existenceChecks = chatData.pinnedMessages.map(pin => 
      messagesRef.doc(pin.messageId).get()
    );
    
    const messageSnapshots = await Promise.all(existenceChecks);
    
    // Фільтруємо масив закріплених, залишаючи тільки ті, що реально існують
    const validPins = chatData.pinnedMessages.filter((pin, index) => {
      return messageSnapshots[index].exists;
    });

    // Якщо кількість змінилася, оновлюємо документ чату
    if (validPins.length !== chatData.pinnedMessages.length) {
      const orphansCount = chatData.pinnedMessages.length - validPins.length;
      console.log(`В чаті ${chatDoc.id} знайдено ${orphansCount} "сирітських" закріплень. Оновлюємо...`);
      await chatDoc.ref.update({ pinnedMessages: validPins });
      updatesCount++;
    }
  });

  await Promise.all(processingPromises);

  if (updatesCount > 0) {
    console.log(`\nСинхронізацію завершено. Оновлено ${updatesCount} чатів.`);
  } else {
    console.log('\nСинхронізацію завершено. "Сирітських" закріплень не знайдено.');
  }
}

synchronizePinnedMessages().catch(error => {
  console.error("Під час виконання скрипту сталася помилка:", error);
});